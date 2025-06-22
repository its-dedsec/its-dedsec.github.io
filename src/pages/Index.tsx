
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Download, 
  FileSearch, 
  FileX, 
  Check, 
  Moon, 
  Sun, 
  Shield, 
  Settings as SettingsIcon, 
  LogIn, 
  LogOut, 
  User,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  Activity,
  Globe,
  Lock,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/QRScanner';
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
    setScanningStep('Initializing security scan...');
    
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

      setScanProgress(20);
      setScanningStep('Checking with VirusTotal...');
      
      // Call our security scan edge function
      const { data, error } = await supabase.functions.invoke('security-scan', {
        body: { url, apiKeys: JSON.parse(savedKeys) }
      });

      if (error) {
        console.error('Security scan error:', error);
        throw error;
      }

      setScanProgress(80);
      setScanningStep('Analyzing results...');
      
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
      setScanningStep('Complete!');
      setReportReady(true);
      
      toast({
        title: "Security Scan Complete",
        description: "QR code analysis finished. Review the results below."
      });
      
    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Scan Failed",
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
      title: "Report Downloaded",
      description: "Security analysis report saved to your device"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <Check className="w-5 h-5 text-green-500" />;
      case 'failed': return <FileX className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Activity className="w-5 h-5 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      failed: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      warning: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
      pending: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    };
    
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-950/20';
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
      case 'low': return 'text-green-500 bg-green-50 dark:bg-green-950/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getEngineIcon = (result: string) => {
    if (result.includes('malicious') || result.includes('phishing') || result.includes('malware')) {
      return <FileX className="w-4 h-4 text-red-500" />;
    }
    if (result.includes('suspicious')) {
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
    if (result.includes('clean')) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    return <Eye className="w-4 h-4 text-gray-400" />;
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

        {/* Enhanced Progress Section */}
        {isScanning && (
          <Card className="mb-8 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Security Analysis in Progress</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{scanningStep}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-3 bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">URL Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Threat Detection</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl">
                    <Lock className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Safe Browsing</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                    <Activity className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Deep Scan</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Enhanced Security Checks */}
        {securityChecks.length > 0 && (
          <Card className="mb-8 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Security Analysis Results
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Comprehensive security validation using multiple threat intelligence sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Risk Summary */}
                {reportReady && (
                  <div className="mb-6 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Overall Risk Assessment</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Based on {securityChecks.length} security checks</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full font-semibold ${getRiskColor(
                        securityChecks.some(c => c.status === 'failed') ? 'HIGH' : 
                        securityChecks.some(c => c.status === 'warning') ? 'MEDIUM' : 'LOW'
                      )}`}>
                        {securityChecks.some(c => c.status === 'failed') ? 'HIGH RISK' : 
                         securityChecks.some(c => c.status === 'warning') ? 'MEDIUM RISK' : 'LOW RISK'}
                      </div>
                    </div>
                  </div>
                )}

                {securityChecks.map((check, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 dark:text-gray-200">{check.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{check.description}</p>
                          {check.details && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{check.details}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={`${getStatusBadge(check.status)} border font-medium`}>
                        {check.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* VirusTotal Engine Details */}
                    {check.engines && (
                      <div className="border-t border-gray-200 dark:border-gray-700/50 p-4 bg-white/50 dark:bg-gray-900/50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Security Engine Results
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllEngines(!showAllEngines)}
                            className="text-xs"
                          >
                            {showAllEngines ? (
                              <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                            ) : (
                              <>Show All <ChevronDown className="w-3 h-3 ml-1" /></>
                            )}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {Object.entries(check.engines.scans || {})
                            .slice(0, showAllEngines ? undefined : 6)
                            .map(([engine, result]: [string, any]) => (
                            <div
                              key={engine}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                                result.detected 
                                  ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800' 
                                  : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {getEngineIcon(result.result)}
                                <span className="font-medium text-gray-700 dark:text-gray-300">{engine}</span>
                              </div>
                              <span className={`text-xs font-medium ${
                                result.detected ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                              }`}>
                                {result.result}
                              </span>
                            </div>
                          ))}
                        </div>

                        {check.engines.scans && Object.keys(check.engines.scans).length > 6 && !showAllEngines && (
                          <div className="mt-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAllEngines(true)}
                              className="text-xs"
                            >
                              View {Object.keys(check.engines.scans).length - 6} More Engines
                            </Button>
                          </div>
                        )}

                        {check.engines.positives > 0 && (
                          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {check.engines.positives} out of {check.engines.total} engines detected threats
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Download Report */}
        {reportReady && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Analysis Complete</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your comprehensive security report is ready for download
                  </p>
                </div>
                <Button
                  onClick={downloadReport}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
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
