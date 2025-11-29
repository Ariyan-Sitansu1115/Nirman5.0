# 🛡️ Cyber Sentinel - CCTV Cybersecurity Platform

A comprehensive CCTV security testing and protection platform built for hackathons. Features virtual camera feeds, vulnerability scanning, real-time threat detection, and automated security hardening.

## 🚀 Features

### 1. **Authentication System**
- **Admin Login/Signup** with secure access codes
- Demo credentials: `admin` / `admin123`
- Admin signup code: `ADMIN2024`
- Persistent sessions using localStorage

### 2. **Virtual CCTV Lab**
- **Live virtual camera feeds** with animated overlays
- Simulated surveillance cameras with:
  - Real-time streaming indicators
  - Motion detection alerts
  - Timestamp overlays
  - Security status badges
- Click cameras to view detailed vulnerability information
- Start/stop streaming controls

### 3. **Security Scanner**
- **Scan RTSP URLs** for vulnerabilities
- Real-time scanning animation with progress steps
- Detects:
  - Weak passwords
  - Default credentials
  - Unencrypted streams
  - Open ports
  - Outdated firmware
- **Risk scoring** (0-100) with severity classification
- Security recommendations for each vulnerability
- Scan history saved to localStorage

### 4. **Threat Detection & Monitoring**
- **Real-time threat monitoring** with live feed
- Auto-generated threats every 30 seconds
- **Interactive threat management**:
  - Investigate threats
  - Block threats
  - Ignore/resolve threats
- **Advanced filtering**:
  - By severity (Critical, High, Medium, Low)
  - By status (Active, Investigating, Resolved)
- **Bulk actions**: Block all threats at once
- **Export reports** as JSON
- **Alert settings**: Toggle email, SMS, push, webhook notifications
- 24-hour threat activity chart

### 5. **Security Hardening Platform**
- **Auto-hardening** for individual cameras
- **Bulk hardening** for all cameras simultaneously
- Visual progress tracking for each security check:
  - Strong password enforcement
  - Stream encryption
  - Authentication setup
  - Firewall configuration
  - Firmware updates
- **Export configurations** and generate reports
- **Compliance tracking**:
  - NIST Cybersecurity Framework
  - ISO 27001
  - GDPR Requirements
  - SOC 2 Type II

### 6. **Admin Dashboard**
- **Real-time statistics**:
  - Total cameras monitored
  - Vulnerable cameras count
  - Active threats count
  - Secured cameras count
- **Live activity charts** with trend indicators
- **Vulnerability distribution** pie chart
- **Live camera previews** with status indicators
- **Recent alerts** with timestamps

## 🎨 Design Features

- **Custom color theme**: `#1A120B`, `#3C2A21`, `#D5CEA3`, `#E5E5CB`
- **Animated 3D particle network** background
- **Glassmorphism** UI with backdrop blur
- **Smooth animations** and transitions
- **Responsive layout** for all screen sizes
- **Live scanning animations** with progress indicators
- **Color-coded risk levels** throughout the app

## 🔧 Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context API
- **Storage**: LocalStorage (ready for MongoDB/Firebase migration)
- **Animations**: CSS animations + Tailwind transitions

## 💾 Data Persistence

All data is stored in **localStorage**:
- User accounts
- Camera configurations
- Scan results
- Threat logs
- Security settings

Ready to migrate to:
- MongoDB with Mongoose
- Firebase Realtime Database
- Any other backend of your choice

## 🎯 How to Use

### 1. **Login/Signup**
- Use demo credentials: `admin` / `admin123`
- Or create new admin account with code: `ADMIN2024`

### 2. **Explore Virtual Lab**
- Click "Virtual Lab" in navigation
- View live simulated camera feeds
- Click any camera to see detailed vulnerability info
- Start/stop streams using control buttons

### 3. **Run Security Scans**
- Go to "Scanner" section
- Enter an RTSP URL or use quick scan templates
- Watch real-time scanning progress
- Review detailed vulnerability reports
- Get security recommendations

### 4. **Monitor Threats**
- Navigate to "Threats" section
- View real-time threat feed
- Filter by severity and status
- Take action: Investigate, Block, or Ignore
- Export reports for documentation

### 5. **Harden Security**
- Visit "Hardening" section
- Select cameras to auto-harden
- Watch progress as security checks complete
- Use bulk actions to secure all cameras
- Export configurations

## 🚀 Quick Start

1. Open the app
2. Login with `admin` / `admin123`
3. Click "Enter Surveillance Guardian"
4. Explore all features from the navigation bar

## 📊 Demo Data

The app comes pre-loaded with:
- 4 virtual cameras (mix of vulnerable and secured)
- 3-4 active threats
- Real-time threat generation
- Sample scan results

## 🔐 Security Note

This is a **simulation platform** for educational and demonstration purposes. No real CCTV infrastructure is accessed. All camera feeds are simulated.

## 🏆 Perfect for Hackathons

- ✅ Fully functional with no backend required
- ✅ Beautiful, professional UI
- ✅ Real-time animations and updates
- ✅ Interactive features throughout
- ✅ Data persistence
- ✅ Export capabilities
- ✅ Ready to present and demo

## 🎓 Educational Value

Demonstrates:
- Common CCTV vulnerabilities
- Security scanning techniques
- Threat detection methods
- Security hardening best practices
- Real-time monitoring systems
- Compliance frameworks

---

Built with ❤️ for cybersecurity education and awareness
