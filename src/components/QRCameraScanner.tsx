
import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, X, ScanLine, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: string) => void;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  isOpen,
  onClose,
  onScanResult,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  const requestCameraPermission = async () => {
    try {
      setIsRetrying(true);
      setPermissionError('');
      
      // First check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Check for existing permissions
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Camera permission status:', permission.state);
        
        if (permission.state === 'denied') {
          throw new Error('Camera access denied. Please enable in browser settings.');
        }
      }

      // Request camera access explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 640 }
        } 
      });
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      // Now start the QR scanner
      if (videoRef.current) {
        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result.data);
            onScanResult(result.data);
            onClose();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment',
            maxScansPerSecond: 5,
          }
        );

        await scanner.start();
        setHasPermission(true);
        setQrScanner(scanner);
      }
    } catch (error: any) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
      
      if (error.name === 'NotAllowedError' || error.message.includes('denied')) {
        setPermissionError('Camera access denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No camera found. Please ensure your device has a camera.');
      } else if (error.name === 'NotSupportedError') {
        setPermissionError('Camera not supported on this browser. Try Chrome, Firefox, or Safari.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Camera is busy. Please close other apps using the camera and try again.');
      } else {
        setPermissionError(error.message || 'Failed to access camera. Please check your browser settings.');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      requestCameraPermission();
    }

    return () => {
      if (qrScanner) {
        qrScanner.stop();
        qrScanner.destroy();
      }
    };
  }, [isOpen]);

  const handleRetry = () => {
    setHasPermission(null);
    setPermissionError('');
    requestCameraPermission();
  };

  const handleOpenSettings = () => {
    // Provide instructions for different browsers
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('chrome')) {
      instructions = 'Click the camera icon in the address bar, or go to Settings > Privacy and Security > Site Settings > Camera';
    } else if (userAgent.includes('firefox')) {
      instructions = 'Click the camera icon in the address bar, or go to Settings > Privacy & Security > Permissions > Camera';
    } else if (userAgent.includes('safari')) {
      instructions = 'Go to Safari > Settings for This Website > Camera > Allow';
    } else {
      instructions = 'Check your browser settings to allow camera access for this website';
    }
    
    alert(`To enable camera access:\n\n${instructions}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/95 border-gray-700 backdrop-blur-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan QR Code
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {hasPermission === null && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-300 mb-2">
                {isRetrying ? 'Retrying camera access...' : 'Requesting camera permission...'}
              </p>
              <p className="text-sm text-gray-500">
                Please allow camera access when prompted
              </p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-6 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              
              <Alert className="bg-red-950/20 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">
                  {permissionError}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="text-sm text-gray-400 space-y-2">
                  <p className="font-medium">To enable camera access:</p>
                  <ul className="text-left space-y-1 pl-4">
                    <li>• Look for camera icon in address bar</li>
                    <li>• Click "Allow" when prompted</li>
                    <li>• Check browser settings if needed</li>
                    <li>• Refresh page if permissions changed</li>
                  </ul>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleRetry}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isRetrying}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={handleOpenSettings}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </div>
              </div>
            </div>
          )}

          {hasPermission === true && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-xl bg-black"
                style={{ aspectRatio: '1/1' }}
                playsInline
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-xl"></div>
                  <ScanLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400 mb-2">
                  Position the QR code within the frame
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Camera Active
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
