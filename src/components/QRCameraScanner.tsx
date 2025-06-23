
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
  const [cameraStarted, setCameraStarted] = useState(false);

  const startCamera = async () => {
    try {
      setIsRetrying(true);
      setPermissionError('');
      setCameraStarted(false);
      setHasPermission(null);
      
      console.log('Starting camera initialization...');
      
      // Clean up any existing scanner first
      if (qrScanner) {
        console.log('Cleaning up existing scanner...');
        await qrScanner.stop();
        qrScanner.destroy();
        setQrScanner(null);
      }

      // Ensure video element exists
      if (!videoRef.current) {
        console.error('Video element not available');
        throw new Error('Video element not found. Please try again.');
      }

      console.log('Creating new QR scanner...');
      
      // Create new scanner instance with updated configuration
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
          returnDetailedScanResult: true,
        }
      );

      console.log('Starting scanner...');
      await scanner.start();
      
      console.log('Scanner started successfully');
      setHasPermission(true);
      setQrScanner(scanner);
      setCameraStarted(true);
      
    } catch (error: any) {
      console.error('Camera startup error:', error);
      setHasPermission(false);
      setCameraStarted(false);
      
      let errorMessage = 'Failed to access camera. ';
      
      if (error.name === 'NotAllowedError' || error.message.includes('denied') || error.message.includes('Permission denied')) {
        errorMessage = 'Camera access denied. Please allow camera access when prompted by your browser.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure your device has a camera.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this browser. Try Chrome, Firefox, or Safari.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is busy. Please close other apps using the camera and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Camera access was interrupted. Please try again.';
      } else {
        errorMessage = error.message || 'Unable to start camera. Please check your browser settings and try again.';
      }
      
      setPermissionError(errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('QR Camera Scanner opened, initializing...');
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }

    // Cleanup when closing
    return () => {
      if (qrScanner) {
        console.log('Cleaning up scanner on close...');
        qrScanner.stop();
        qrScanner.destroy();
        setQrScanner(null);
      }
      setHasPermission(null);
      setPermissionError('');
      setCameraStarted(false);
    };
  }, [isOpen]);

  const handleRetry = () => {
    console.log('Retrying camera access...');
    startCamera();
  };

  const handleOpenSettings = () => {
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan QR Code
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {hasPermission === null && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">Starting camera...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please allow camera access when prompted
              </p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-6 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              
              <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {permissionError}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p className="font-medium">To enable camera access:</p>
                  <ul className="text-left space-y-1 pl-4">
                    <li>• Look for camera icon in address bar</li>
                    <li>• Click "Allow" when prompted</li>
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
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </div>
              </div>
            </div>
          )}

          {hasPermission === true && cameraStarted && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: '1/1' }}
                playsInline
                muted
                autoPlay
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                  <ScanLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Position the QR code within the frame
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Camera Active
                </div>
              </div>
            </div>
          )}

          {hasPermission === true && !cameraStarted && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">Initializing camera...</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
