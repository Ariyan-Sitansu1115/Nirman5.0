import { useState, useEffect, useRef } from 'react';
import { Camera as CameraIcon, Play, Square, Eye, Settings, Wifi, AlertTriangle, Lock, Video, Plus, Save, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Camera } from '../context/AppContext';

export function VirtualCCTVLab() {
  const { cameras, setCameras } = useAppContext();
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  const [showAddCamera, setShowAddCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start camera stream when component mounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Could not access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const addNewCamera = () => {
    const newCamera = {
      id: `cam-${Date.now()}`,
      name: `Camera ${cameras.length + 1}`,
      ip: `192.168.1.${100 + cameras.length}`,
      status: 'secure' as const,
      risk: 'low' as const,
      securityChecks: {
        strongPassword: true,
        encryption: true,
        authentication: true,
        firewall: true,
        firmware: true
      }
    };
    
    setCameras([...cameras, newCamera]);
    setShowAddCamera(false);
    stopCamera();
  };

  const deleteCamera = (cameraId: string) => {
    if (window.confirm('Are you sure you want to delete this camera?')) {
      setCameras(cameras.filter(cam => cam.id !== cameraId));
      if (selectedCamera === cameraId) {
        setSelectedCamera(null);
      }
    }
  };

  // Add 3D animation effect
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="min-h-screen bg-linear-to-b from-[#1A120B] to-[#3C2A21] px-6 py-8"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl mb-2 text-[#E5E5CB]">Virtual CCTV Lab</h1>
          <p className="text-[#D5CEA3]">Simulated vulnerable camera systems for safe security testing</p>
        </div>

        {/* Add Camera Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddCamera(!showAddCamera)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D5CEA3] text-[#1A120B] rounded-lg hover:bg-[#E5E5CB] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Camera Feed</span>
          </button>
        </div>

        {/* Add Camera Panel */}
        {showAddCamera && (
          <div className="mb-8 p-6 bg-[#3C2A21]/40 backdrop-blur-sm border border-[#D5CEA3]/20 rounded-lg">
            <h3 className="text-xl text-[#E5E5CB] mb-4">Add Camera Feed</h3>
            
            {cameraError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-100 rounded">
                {cameraError}
              </div>
            )}

            {!cameraStream ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={startCamera}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Video className="w-5 h-5" />
                  <span>Start Camera</span>
                </button>
                <button
                  onClick={() => setShowAddCamera(false)}
                  className="px-4 py-2 text-[#E5E5CB] hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-2xl h-auto rounded-lg border border-[#D5CEA3]/30"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={addNewCamera}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>Add This Camera</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    <span>Stop Camera</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Camera Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {cameras.map((camera, index) => (
            <div key={camera.id} className="relative group">
              <div className="camera-feed">
                <VirtualCameraFeed 
                  key={camera.id} 
                  camera={camera}
                  isSelected={selectedCamera === camera.id}
                  onSelect={() => setSelectedCamera(camera.id)}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCamera(camera.id);
                }}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                title="Delete Camera"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Camera Details */}
        {selectedCamera && (
          <div className="bg-[#3C2A21]/40 backdrop-blur-sm border border-[#D5CEA3]/20 rounded-lg p-6">
            <h3 className="text-2xl text-[#E5E5CB] mb-4">Camera Details - {selectedCamera}</h3>
            <CameraDetails cameraId={selectedCamera} />
          </div>
        )}
      </div>
    </div>
  );
}

interface VirtualCameraFeedProps {
  camera: {
    id: string;
    name: string;
    ip: string;
    status: string;
    risk: string;
    securityChecks: {
      strongPassword: boolean;
      encryption: boolean;
      authentication: boolean;
      firewall: boolean;
      firmware: boolean;
    };
  };
  isSelected: boolean;
  onSelect: () => void;
}

function VirtualCameraFeed({ camera, isSelected, onSelect }: VirtualCameraFeedProps) {
  // Ensure camera object has all required properties
  // Create a safe camera object with default values
  const safeCamera: Camera = {
    id: camera.id || `cam-${Date.now()}`,
    name: camera.name || 'Unknown Camera',
    ip: camera.ip || '0.0.0.0',
    status: (camera.status as 'secure' | 'vulnerable') || 'secure',
    risk: (camera.risk as 'critical' | 'high' | 'medium' | 'low') || 'low',
    securityChecks: {
      strongPassword: camera.securityChecks?.strongPassword ?? false,
      encryption: camera.securityChecks?.encryption ?? false,
      authentication: camera.securityChecks?.authentication ?? false,
      firewall: camera.securityChecks?.firewall ?? false,
      firmware: camera.securityChecks?.firmware ?? false,
    }
  };
  const [isStreaming, setIsStreaming] = useState(true);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [motionDetected, setMotionDetected] = useState(false);

  // Animate scan line
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLinePosition(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Random motion detection
  useEffect(() => {
    const interval = setInterval(() => {
      setMotionDetected(Math.random() > 0.7);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      onClick={onSelect}
      className={`bg-[#3C2A21]/40 backdrop-blur-sm border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
        isSelected ? 'border-[#D5CEA3]' : 'border-[#D5CEA3]/20'
      }`}
    >
      {/* Camera Feed Display */}
      <div className="aspect-video bg-[#1A120B] relative overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(213, 206, 163, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(213, 206, 163, 0.3) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>

        {/* Animated scan line */}
        <div 
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D5CEA3] to-transparent"
          style={{ top: `${scanLinePosition}%` }}
        ></div>

        {/* Simulated camera view - parking lot scene */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Background scene simulation */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 opacity-60"></div>
            
            {/* Simulated objects */}
            <div className="absolute bottom-1/4 left-1/4 w-16 h-24 bg-gray-700 rounded-t-lg opacity-40"></div>
            <div className="absolute bottom-1/4 right-1/3 w-20 h-28 bg-gray-600 rounded-t-lg opacity-40"></div>
            
            {/* Motion indicator */}
            {motionDetected && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/30 border border-red-500/50 px-3 py-1 rounded animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-red-400">MOTION</span>
              </div>
            )}

            {/* Camera info overlay */}
            <div className="absolute top-4 right-4 bg-[#1A120B]/80 backdrop-blur-sm px-3 py-1.5 rounded text-xs text-[#E5E5CB] space-y-0.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span>{isStreaming ? 'LIVE' : 'OFFLINE'}</span>
              </div>
              <div className="text-[#D5CEA3]">{camera.ip}</div>
            </div>

            {/* Timestamp */}
            <div className="absolute bottom-4 left-4 bg-[#1A120B]/80 backdrop-blur-sm px-3 py-1.5 rounded text-xs text-[#E5E5CB]">
              {new Date().toLocaleTimeString()}
            </div>

            {/* Security status */}
            <div className="absolute bottom-4 right-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
                camera.status === 'vulnerable' 
                  ? 'bg-red-500/30 border border-red-500/50 text-red-400' 
                  : 'bg-green-500/30 border border-green-500/50 text-green-400'
              }`}>
                {camera.status === 'vulnerable' ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>VULNERABLE</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>SECURED</span>
                  </>
                )}
              </div>
            </div>

            {/* Center camera icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <CameraIcon className="w-24 h-24 text-[#D5CEA3]" />
            </div>
          </div>
        </div>
      </div>

      {/* Camera Info Panel */}
      <div className="p-4 bg-[#1A120B]/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-[#D5CEA3]/10">
            <Video className="w-5 h-5 text-[#D5CEA3]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-[#E5E5CB] truncate">{safeCamera.name}</h3>
            <p className="text-xs text-gray-400 truncate">{safeCamera.ip}</p>
          </div>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className="ml-auto p-2 rounded-full bg-[#D5CEA3]/10 hover:bg-[#D5CEA3]/20 transition-colors"
            aria-label={isStreaming ? 'Stop stream' : 'Start stream'}
          >
            {isStreaming ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#E5E5CB]/70">
            <Wifi className="w-4 h-4" />
            <span>RTSP Port: 554</span>
          </div>
          <div className="flex items-center gap-2 text-[#E5E5CB]/70">
            <Eye className="w-4 h-4" />
            <span>FPS: 30</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraDetails({ cameraId }: { cameraId: string }) {
  const { cameras } = useAppContext();
  const camera = cameras.find(c => c.id === cameraId);

  if (!camera) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-lg text-[#D5CEA3] mb-3">Connection Details</h4>
        <div className="space-y-2 text-sm">
          <DetailRow label="RTSP URL" value={`rtsp://${camera.ip}:554/stream1`} />
          <DetailRow label="IP Address" value={camera.ip} />
          <DetailRow label="Port" value="554 (RTSP)" />
          <DetailRow label="Protocol" value="RTSP/TCP" />
          <DetailRow label="Encoding" value="H.264" />
          <DetailRow label="Resolution" value="1920x1080" />
        </div>
      </div>

      <div>
        <h4 className="text-lg text-[#D5CEA3] mb-3">Vulnerability Status</h4>
        <div className="space-y-2">
          <VulnStatus label="Default Credentials" vulnerable={!camera.securityChecks.strongPassword} />
          <VulnStatus label="Unencrypted Stream" vulnerable={!camera.securityChecks.encryption} />
          <VulnStatus label="No Authentication" vulnerable={!camera.securityChecks.authentication} />
          <VulnStatus label="Open Ports" vulnerable={!camera.securityChecks.firewall} />
          <VulnStatus label="Outdated Firmware" vulnerable={!camera.securityChecks.firmware} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-2 bg-[#1A120B]/40 rounded">
      <span className="text-[#E5E5CB]/60">{label}:</span>
      <code className="text-[#D5CEA3]">{value}</code>
    </div>
  );
}

function VulnStatus({ label, vulnerable }: { label: string; vulnerable: boolean }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded ${
      vulnerable ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'
    }`}>
      <span className="text-sm text-[#E5E5CB]">{label}</span>
      <div className="flex items-center gap-2">
        {vulnerable ? (
          <>
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400">Vulnerable</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">Secured</span>
          </>
        )}
      </div>
    </div>
  );
}
