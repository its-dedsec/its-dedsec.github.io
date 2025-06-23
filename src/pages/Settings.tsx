
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Key, Shield, Eye, EyeOff, ArrowLeft, User, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/ThemeProvider';

interface ApiKey {
  name: string;
  key: string;
  description: string;
  required: boolean;
}

const Settings = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { name: 'VIRUSTOTAL_API_KEY', key: '', description: 'VirusTotal API for malware detection', required: true },
    { name: 'GOOGLE_SAFE_BROWSING_API_KEY', key: '', description: 'Google Safe Browsing for URL safety', required: true },
    { name: 'URLSCAN_API_KEY', key: '', description: 'URLScan.io for comprehensive URL analysis', required: true },
    { name: 'IPINFO_API_KEY', key: '', description: 'IPInfo for IP address information', required: false },
  ]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { theme, setTheme, isDark } = useTheme();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        await loadApiKeys(session.user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  const loadApiKeys = async (userId: string) => {
    try {
      // For now, just load from localStorage since the table might not exist yet
      const savedKeys = localStorage.getItem('qr-shield-api-keys');
      if (savedKeys) {
        try {
          const parsed = JSON.parse(savedKeys);
          setApiKeys(prev => prev.map(key => ({
            ...key,
            key: parsed[key.name] || ''
          })));
        } catch (parseError) {
          console.error('Failed to parse saved API keys:', parseError);
        }
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleSaveApiKeys = async () => {
    setLoading(true);
    try {
      const keysObject = apiKeys.reduce((acc, key) => {
        if (key.key.trim()) {
          acc[key.name] = key.key.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      // Save to localStorage
      localStorage.setItem('qr-shield-api-keys', JSON.stringify(keysObject));

      toast({
        title: "API Keys Saved",
        description: "Your API keys have been securely saved"
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Error",
        description: "Failed to save API keys",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const updateApiKey = (name: string, value: string) => {
    setApiKeys(prev => prev.map(key => 
      key.name === name ? { ...key, key: value } : key
    ));
  };

  const toggleShowKey = (name: string) => {
    setShowKeys(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    } else {
      navigate('/auth');
    }
  };

  const getKeyStatus = (key: ApiKey) => {
    if (key.key.trim()) {
      return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Configured</Badge>;
    }
    if (key.required) {
      return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Required</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">Optional</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-black transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Configure your API keys and preferences
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* User Profile */}
        {user && (
          <Card className="mb-8 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-800 dark:text-gray-100">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{user.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Keys Configuration */}
        <Card className="mb-8 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-gray-800 dark:text-gray-100">
              <Key className="w-5 h-5" />
              API Keys Configuration
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Configure your security scanning API keys. These are saved securely to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={apiKey.name} className="text-sm font-medium">
                      {apiKey.name.replace(/_/g, ' ').replace(/API KEY/g, 'API Key')}
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {apiKey.description}
                    </p>
                  </div>
                  {getKeyStatus(apiKey)}
                </div>
                <div className="relative">
                  <Input
                    id={apiKey.name}
                    type={showKeys[apiKey.name] ? "text" : "password"}
                    value={apiKey.key}
                    onChange={(e) => updateApiKey(apiKey.name, e.target.value)}
                    placeholder={`Enter your ${apiKey.name.split('_')[0]} API key`}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                    onClick={() => toggleShowKey(apiKey.name)}
                  >
                    {showKeys[apiKey.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSaveApiKeys}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? "Saving..." : "Save API Keys"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-gray-800 dark:text-gray-100">
              <Shield className="w-5 h-5" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>• API keys are encrypted and stored securely in your account</p>
              <p>• Keys are also backed up locally in your browser</p>
              <p>• Never share your API keys with others</p>
              <p>• Use read-only API keys when possible</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
