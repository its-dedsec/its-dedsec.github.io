
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Activity, 
  Globe, 
  Lock, 
  Zap, 
  AlertTriangle,
  Check,
  FileX,
  Eye,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Gauge,
  Camera,
  ExternalLink
} from 'lucide-react';

interface SecurityCheck {
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  description: string;
  details?: string;
  engines?: any;
  screenshot?: string;
}

interface SecurityAnalyzerProps {
  isScanning: boolean;
  scanProgress: number;
  scanningStep: string;
  securityChecks: SecurityCheck[];
  showAllEngines: boolean;
  onToggleEngines: () => void;
}

export const SecurityAnalyzer: React.FC<SecurityAnalyzerProps> = ({
  isScanning,
  scanProgress,
  scanningStep,
  securityChecks,
  showAllEngines,
  onToggleEngines,
}) => {
  const getOverallRisk = () => {
    if (securityChecks.some(c => c.status === 'failed')) return 'HIGH';
    if (securityChecks.some(c => c.status === 'warning')) return 'MEDIUM';
    return 'LOW';
  };

  const getRiskScore = () => {
    const total = securityChecks.length;
    if (total === 0) return 0;
    
    const failed = securityChecks.filter(c => c.status === 'failed').length;
    const warnings = securityChecks.filter(c => c.status === 'warning').length;
    
    return Math.max(0, 100 - (failed * 40) - (warnings * 20));
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

  if (isScanning) {
    return (
      <Card className="mb-8 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse"></div>
        <CardContent className="pt-6 relative z-10">
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/25">
                    <Zap className="w-8 h-8 text-white animate-bounce" />
                  </div>
                  <div className="absolute -inset-2 rounded-full border-2 border-blue-500/30 animate-ping"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Deep Security Analysis
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">{scanningStep}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Analysis Progress</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500 animate-pulse" />
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{Math.round(scanProgress)}%</span>
                </div>
              </div>
              <div className="relative">
                <Progress value={scanProgress} className="h-4 bg-gray-200 dark:bg-gray-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { icon: Globe, label: 'URL Analysis', color: 'blue', delay: '0s' },
                { icon: Shield, label: 'Threat Detection', color: 'purple', delay: '0.2s' },
                { icon: Lock, label: 'Safe Browsing', color: 'green', delay: '0.4s' },
                { icon: Camera, label: 'Sandbox Screenshot', color: 'amber', delay: '0.6s' }
              ].map((item, index) => (
                <div 
                  key={index}
                  className={`flex items-center space-x-3 p-4 bg-${item.color}-50 dark:bg-${item.color}-950/20 rounded-2xl border border-${item.color}-200 dark:border-${item.color}-800 transform transition-all duration-500 hover:scale-105`}
                  style={{ animationDelay: item.delay }}
                >
                  <div className={`p-2 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-xl`}>
                    <item.icon className={`w-6 h-6 text-${item.color}-500 animate-pulse`} />
                  </div>
                  <div>
                    <span className={`text-sm font-bold text-${item.color}-700 dark:text-${item.color}-300 block`}>
                      {item.label}
                    </span>
                    <div className={`w-8 h-1 bg-${item.color}-300 dark:bg-${item.color}-600 rounded-full mt-1 animate-pulse`}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex items-center justify-center space-x-3">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    ></div>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Analyzing with multiple security engines and capturing sandbox screenshot...
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (securityChecks.length === 0) return null;

  const overallRisk = getOverallRisk();
  const riskScore = getRiskScore();

  return (
    <Card className="mb-8 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-800 dark:text-gray-100 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          Advanced Security Analysis
        </CardTitle>
        <CardDescription className="dark:text-gray-400 text-lg">
          Comprehensive threat assessment using {securityChecks.length} security validation layers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Risk Meter Dashboard */}
          <div className="p-6 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Gauge className="w-6 h-6 text-blue-500" />
                  Security Risk Assessment
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Score</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{riskScore}/100</span>
                  </div>
                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                        riskScore >= 70 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                        riskScore >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                        'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                      style={{ width: `${riskScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className={`px-6 py-4 rounded-2xl font-bold text-xl ${getRiskColor(overallRisk)} border-2 ${
                  overallRisk === 'HIGH' ? 'border-red-300 dark:border-red-700 shadow-lg shadow-red-500/20' :
                  overallRisk === 'MEDIUM' ? 'border-amber-300 dark:border-amber-700 shadow-lg shadow-amber-500/20' :
                  'border-green-300 dark:border-green-700 shadow-lg shadow-green-500/20'
                } animate-pulse`}>
                  {overallRisk} RISK
                </div>
              </div>
            </div>
          </div>

          {/* Security Checks */}
          {securityChecks.map((check, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{check.name}</p>
                    <p className="text-gray-600 dark:text-gray-400">{check.description}</p>
                    {check.details && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{check.details}</p>
                    )}
                  </div>
                </div>
                <Badge className={`${getStatusBadge(check.status)} border font-bold text-sm px-4 py-2`}>
                  {check.status.toUpperCase()}
                </Badge>
              </div>

              {/* Sandbox Screenshot */}
              {check.screenshot && (
                <div className="border-t border-gray-200 dark:border-gray-700/50 p-6 bg-white/50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Camera className="w-5 h-5 text-blue-500" />
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Sandbox Screenshot</h4>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                      SECURE ENVIRONMENT
                    </Badge>
                  </div>
                  <div className="relative group">
                    <img 
                      src={check.screenshot} 
                      alt="Sandbox screenshot of the website" 
                      className="w-full max-w-2xl mx-auto rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-lg transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error('Screenshot failed to load');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(check.screenshot, '_blank')}
                      className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <div className="mt-3 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Website captured in isolated sandbox environment (1280x720)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Engine Results */}
              {check.engines && (
                <div className="border-t border-gray-200 dark:border-gray-700/50 p-6 bg-white/50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Security Engine Analysis ({Object.keys(check.engines.scans || {}).length} engines)
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggleEngines}
                      className="text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {showAllEngines ? (
                        <>Hide Details <ChevronUp className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>Show All <ChevronDown className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {Object.entries(check.engines.scans || {})
                      .slice(0, showAllEngines ? undefined : 8)
                      .map(([engine, result]: [string, any]) => (
                      <div
                        key={engine}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:scale-105 ${
                          result.detected 
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-sm' 
                            : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {getEngineIcon(result.result)}
                          <span className="font-medium text-gray-700 dark:text-gray-300">{engine}</span>
                        </div>
                        <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                          result.detected 
                            ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' 
                            : 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                        }`}>
                          {result.result}
                        </span>
                      </div>
                    ))}
                  </div>

                  {check.engines.positives > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Threat Detected: {check.engines.positives} out of {check.engines.total} engines flagged this URL
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
  );
};
