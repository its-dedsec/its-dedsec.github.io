
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Download, 
  Moon, 
  Sun, 
  Shield, 
  Settings as SettingsIcon, 
  LogIn, 
  LogOut,
  Globe,
  Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/QRScanner';
import { SecurityAnalyzer } from '@/components/SecurityAnalyzer';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SecurityCheck {
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  description: string;
  details?: string;
  engines?: any;
}

const Index = () => {
  const [qrData, setQrData] = useState<string | null>(null);
  const [scanSource, setScanSource] = useState<'camera' | 'upload' | 'manual' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [reportReady, setReportReady] = useState(false);
  const [showAllEngines, setShowAllEngines] = useState(false);
  const [scanningStep, setScanningStep] = useState('');
  const { theme, setTheme, isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleScanResult = (data: string, source: 'camera' | 'upload' | 'manual') => {
    console.log('Scan result received:', { data, source });
    setQrData(data);
    setScanSource(source);
    setSecurityChecks([]);
    setReportReady(false);
    setShowAllEngines(false);
    performSecurityScan(data);
  };

  const performSecurityScan = async (url: string) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanningStep('Initializing comprehensive security analysis...');
    
    try {
      // Check if API keys are configured
      const savedKeys = localStorage.getItem('qr-shield-api-keys');
      if (!savedKeys) {
        toast({
          title: "API Keys Not Configured",
          description: "Please configure your API keys in Settings first",
          variant: "destructive"
        });
        setIsScanning(false);
        return;
      }

      setScanProgress(15);
      setScanningStep('Connecting to threat intelligence networks...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setScanProgress(35);
      setScanningStep('Analyzing URL with VirusTotal engines...');
      
      // Call our security scan edge function
      const { data, error } = await supabase.functions.invoke('security-scan', {
        body: { url, apiKeys: JSON.parse(savedKeys) }
      });

      if (error) {
        console.error('Security scan error:', error);
        throw error;
      }

      setScanProgress(70);
      setScanningStep('Cross-referencing with global threat databases...');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setScanProgress(90);
      setScanningStep('Finalizing security assessment...');
      
      const { results, overallRisk } = data;
      setSecurityChecks(results);
      
      // Save scan result to database if user is authenticated
      if (user) {
        const { error: dbError } = await supabase
          .from('qr_scan_results')
          .insert({
            qr_data: url,
            security_checks: results,
            overall_risk: overallRisk,
            user_id: user.id
          });

        if (dbError) {
          console.error('Failed to save scan result:', dbError);
        }
      }
      
      setScanProgress(100);
      setScanningStep('Security analysis complete!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setReportReady(true);
      
      toast({
        title: "Security Analysis Complete",
        description: "Comprehensive threat assessment finished. Review the detailed results below."
      });
      
    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to complete security analysis. Please check your API keys in Settings.",
        variant: "destructive"
      });
    }
    
    setIsScanning(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out"
    });
  };

  const downloadReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      qrCodeUrl: qrData,
      scanSource: scanSource,
      securityChecks: securityChecks,
      overallRisk: securityChecks.some(c => c.status === 'failed') ? 'HIGH' : 
                   securityChecks.some(c => c.status === 'warning') ? 'MEDIUM' : 'LOW'
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-security-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Security Report Downloaded",
      description: "Comprehensive analysis report saved to your device"
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-black transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-700/50"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-700/50"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Hello, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-700/50"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/25">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            QR Shield
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Advanced QR code security scanner with real-time threat detection
          </p>
          
          {!user && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 max-w-md mx-auto">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Sign in to save your scan results and configure API keys for enhanced security analysis
              </p>
            </div>
          )}
        </div>

        {/* QR Scanner Component */}
        <QRScanner onScanResult={handleScanResult} />

        {/* QR Data Display */}
        {qrData && (
          <Card className="mb-8 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                {scanSource === 'manual' ? 'Entered URL' : 'Extracted QR Code Data'}
              </CardTitle>
              <CardDescription>
                Source: {scanSource === 'camera' ? 'Camera scan' : scanSource === 'upload' ? 'Image upload' : 'Manual entry'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{qrData}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Security Analysis */}
        <SecurityAnalyzer
          isScanning={isScanning}
          scanProgress={scanProgress}
          scanningStep={scanningStep}
          securityChecks={securityChecks}
          showAllEngines={showAllEngines}
          onToggleEngines={() => setShowAllEngines(!showAllEngines)}
        />

        {/* Enhanced Download Report */}
        {reportReady && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-600 rounded-3xl shadow-lg shadow-green-500/25 animate-pulse">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Security Analysis Complete</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                    Your comprehensive security assessment is ready for download
                  </p>
                </div>
                <Button
                  onClick={downloadReport}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Download className="w-5 h-5 mr-3" />
                  Download Security Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
