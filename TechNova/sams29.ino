#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <math.h>
#include <time.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135_PIN 34
#define MQ7_PIN 35
#define DSM501A_PIN 32

const char* ssid = "Ariyan";
const char* password = "12345679";

const char* FIREBASE_PROJECT_ID = "smart-air-quality-monito-15bdb";
const char* API_KEY = "AIzaSyAApLXXYd4snh426cTduHFWIP62yGXZTK0";

DHT dht(DHTPIN, DHTTYPE);

unsigned long samplingTime = 30000;
unsigned long startTime;
unsigned long lowPulseOccupancy = 0;

// ==================== MQ-135 + NO2 CONFIG ====================
const float RLOAD = 10.0;       // kOhm load resistor
const float VCC_SENSOR = 5.0;   // MQ135 module powered with 5V
const float VREF_ADC = 3.3;     // ESP32 ADC input range
const float ADC_MAX = 4095.0;   // 12-bit ADC
const float RZERO = 10.8;       // Calibrated R0 in clean air

// NO2 curve fit: ppm = A * (Rs/R0)^B
#define NO2_A 0.01
#define NO2_B -1.30

const int CALIBRATION_READINGS = 50;

float ratio_rs_r0 = 0.0;
float no2_ppm = 0.0;

// ---------- AQI FUNCTIONS (Sub-Indices for info only) ----------
int calculateAQI_PM25(float pm25) {
  if (pm25 <= 12.0) return 50;
  if (pm25 <= 35.4) return 100;
  if (pm25 <= 55.4) return 150;
  if (pm25 <= 150.4) return 200;
  if (pm25 <= 250.4) return 300;
  return 500;
}

int calculateAQI_CO(float co_ppm) {
  if (co_ppm <= 4.4) return 50;
  if (co_ppm <= 9.4) return 100;
  if (co_ppm <= 12.4) return 150;
  if (co_ppm <= 15.4) return 200;
  if (co_ppm <= 30.4) return 300;
  return 500;
}

int calculateAQI_NO2(float no2_ppm) {
  float no2_ppb = no2_ppm * 1000.0; // ppm → ppb
  if (no2_ppb <= 53.0)  return 50;
  if (no2_ppb <= 100.0) return 100;
  if (no2_ppb <= 360.0) return 150;
  if (no2_ppb <= 649.0) return 200;
  if (no2_ppb <= 1249.0) return 300;
  return 500;
}

// ---------- MQ135 Helpers ----------
float getCorrectionFactor(float t, float h) {
  if (t < 25.0) t = 25.0;
  if (h < 50.0) h = 50.0;
  return 1.0 + 0.012 * (t - 20.0) + 0.0003 * (h - 60.0);
}

float readRatio(float temp, float hum) {
  float sensor_volt_sum = 0.0;
  for (int i = 0; i < CALIBRATION_READINGS; i++) {
    int analog_value = analogRead(MQ135_PIN);
    sensor_volt_sum += analog_value * (VREF_ADC / ADC_MAX);
    delay(20);
  }
  float sensor_volt = sensor_volt_sum / CALIBRATION_READINGS;
  float rs_value = RLOAD * (VCC_SENSOR / sensor_volt - 1.0);
  float ratio = rs_value / RZERO;
  ratio = ratio / getCorrectionFactor(temp, hum);
  return ratio;
}

float getPPM(float ratio, float A, float B) {
  return A * pow(ratio, B);
}

// ============================================================================

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(DSM501A_PIN, INPUT);

  Serial.println();
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // ✅ Use UTC from NTP (no offset here)
  configTime(0, 0, "pool.ntp.org");

  Serial.println("🔥 Preheating MQ7 sensor...");
  delay(60000);
  Serial.println("✅ MQ7 ready.");
}

float readPM10() {
  lowPulseOccupancy = 0;
  startTime = millis();
  while (millis() - startTime < samplingTime) {
    lowPulseOccupancy += pulseIn(DSM501A_PIN, LOW);
  }
  float ratio = lowPulseOccupancy / (samplingTime * 10.0);
  float pm10 = 0.17 * ratio - 0.1;
  return fmax(0.0, pm10);
}

String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "2025-11-06T00:00:00Z";
  char buf[30];
  // This is now real UTC, "Z" is correct
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {

    // ---------- SENSOR READINGS ----------
    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();

    float co2_voltage = analogRead(MQ135_PIN) * (5.0 / 4095.0);
    float co2_ppm     = fmax(0.0, fmin(co2_voltage * 100.0, 1000.0));

    float co_voltage  = analogRead(MQ7_PIN) * (5.0 / 4095.0);
    float co_ppm      = fmin(fmax(0.0, (co_voltage - 0.1) * 20.0), 50.0);

    float pm10        = readPM10();
    float pm25        = fmin(fmax(pm10 * 0.5, 0.0), 500.0);

    // ---------- NO2 ESTIMATION ----------
    ratio_rs_r0 = readRatio(temperature, humidity);
    no2_ppm     = getPPM(ratio_rs_r0, NO2_A, NO2_B);
    if (no2_ppm < 0.0) no2_ppm = 0.0;

    // ---------- AQI SUB-INDICES (info) ----------
    int aqi_pm25 = calculateAQI_PM25(pm25);
    int aqi_co   = calculateAQI_CO(co_ppm);
    int aqi_no2  = calculateAQI_NO2(no2_ppm);

    // ---------- OVERALL AQI USING YOUR FORMULA ----------
    // aqi = 0.4*CO2 + 0.3*CO + 0.3*PM2.5
    int aqi = (int)(0.4 * co2_ppm + 0.3 * co_ppm + 0.3 * pm25);

    // ---------- PRINT VALUES (DEBUG) ----------
    Serial.println("------ Sensor Readings ------");
    Serial.print("Temperature: "); Serial.println(temperature);
    Serial.print("Humidity: ");    Serial.println(humidity);
    Serial.print("CO2 PPM: ");     Serial.println(co2_ppm);
    Serial.print("CO PPM: ");      Serial.println(co_ppm);
    Serial.print("PM10: ");        Serial.println(pm10);
    Serial.print("PM2.5: ");       Serial.println(pm25);
    Serial.print("NO2 PPM: ");     Serial.println(no2_ppm, 4);
    Serial.print("AQI_PM25: ");    Serial.println(aqi_pm25);
    Serial.print("AQI_CO: ");      Serial.println(aqi_co);
    Serial.print("AQI_NO2: ");     Serial.println(aqi_no2);
    Serial.print("Final AQI: ");   Serial.println(aqi);
    String ts = getTimestamp();
    Serial.print("Timestamp (UTC): "); Serial.println(ts);
    Serial.println("-----------------------------");

    // ---------- FIRESTORE URL ----------
    String url = "https://firestore.googleapis.com/v1/projects/" +
                 String(FIREBASE_PROJECT_ID) +
                 "/databases/(default)/documents/sensorData?key=" +
                 API_KEY;

    // ---------- FIRESTORE PAYLOAD ----------
    String payload = "{";
    payload += "\"fields\": {";

    payload += "\"temperature\": {\"doubleValue\": " + String(temperature, 1) + "},";
    payload += "\"humidity\": {\"doubleValue\": "    + String(humidity, 1)    + "},";
    payload += "\"co2_ppm\": {\"doubleValue\": "     + String(co2_ppm, 1)     + "},";
    payload += "\"co_ppm\": {\"doubleValue\": "      + String(co_ppm, 1)      + "},";
    payload += "\"pm25\": {\"doubleValue\": "        + String(pm25, 1)        + "},";
    payload += "\"no2_ppm\": {\"doubleValue\": "     + String(no2_ppm, 4)     + "},";

    // Sub AQIs
    payload += "\"aqi_pm25\": {\"integerValue\": "   + String(aqi_pm25)       + "},";
    payload += "\"aqi_co\": {\"integerValue\": "     + String(aqi_co)         + "},";
    payload += "\"aqi_no2\": {\"integerValue\": "    + String(aqi_no2)        + "},";

    // Final weighted AQI
    payload += "\"aqi\": {\"integerValue\": "        + String(aqi)            + "},";

    // Firestore timestamp
    payload += "\"timestamp\": {\"timestampValue\": \"" + ts + "\"}";

    payload += "}}";

    // ---------- SEND TO FIRESTORE ----------
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    Serial.println("📤 Sending to Firestore...");
    Serial.println(payload);

    int httpResponseCode = http.POST(payload);

    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("📥 Firestore response:");
      Serial.println(response);
    } else {
      Serial.print("❌ Error in POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("❌ WiFi disconnected");
  }

  delay(15000);  // 15 seconds
}
