import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth.jsx";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { User } from "@shared/schema";
import { Shield, BellRing, Globe, Database, Moon, Sun, Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";

export default function Settings() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form states
  const [showApiKey, setShowApiKey] = useState(false);
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  
  // Mock API key for display
  const apiKey = "fb_1a2b3c4d5e6f7g8h9i0j";
  
  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };
  
  const regenerateApiKey = () => {
    toast({
      title: "API Key regenerated",
      description: "A new API key has been generated. Please save it securely.",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
            
            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="mb-4">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
              </TabsList>
              
              {/* Account Settings */}
              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-full md:w-1/2">
                          <Label htmlFor="display-name">Display Name</Label>
                          <Input
                            id="display-name"
                            defaultValue={user?.displayName || ""}
                            className="mt-1"
                          />
                        </div>
                        <div className="w-full md:w-1/2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            defaultValue={user?.email || ""}
                            disabled
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-full md:w-1/2">
                          <Label htmlFor="role">Role</Label>
                          <Input
                            id="role"
                            defaultValue={user?.role || "User"}
                            disabled
                            className="mt-1"
                          />
                        </div>
                        <div className="w-full md:w-1/2">
                          <Label htmlFor="language">Language</Label>
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="zh">Chinese</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-full md:w-1/2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                              <SelectItem value="CST">Central Time (CST)</SelectItem>
                              <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                              <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full md:w-1/2">
                          <Label htmlFor="currency">Default Currency</Label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="JPY">JPY (¥)</SelectItem>
                              <SelectItem value="CAD">CAD (C$)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>
                      Manage your authentication and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 text-primary mr-2" />
                          <Label className="text-base">Firebase Authentication</Label>
                        </div>
                        <p className="text-sm text-neutral-500">
                          Your account is secured with Google Firebase authentication
                        </p>
                      </div>
                      <div>
                        <div className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          Active
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-end">
                      <Button variant="outline">
                        Manage Authentication
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Email Notifications</Label>
                          <p className="text-sm text-neutral-500">
                            Receive email notifications about important updates
                          </p>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Push Notifications</Label>
                          <p className="text-sm text-neutral-500">
                            Receive push notifications in your browser
                          </p>
                        </div>
                        <Switch
                          checked={pushNotifications}
                          onCheckedChange={setPushNotifications}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="text-base">Notification Types</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="new-customers" defaultChecked />
                            <Label htmlFor="new-customers">New customers</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="new-deals" defaultChecked />
                            <Label htmlFor="new-deals">New deals</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="meeting-reminders" defaultChecked />
                            <Label htmlFor="meeting-reminders">Meeting reminders</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="task-deadlines" defaultChecked />
                            <Label htmlFor="task-deadlines">Task deadlines</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="deal-status-changes" defaultChecked />
                            <Label htmlFor="deal-status-changes">Deal status changes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="system-updates" defaultChecked />
                            <Label htmlFor="system-updates">System updates</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize the look and feel of your CRM
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base">Theme</Label>
                        <div className="flex items-center space-x-4 mt-2">
                          <div
                            className={`flex items-center justify-center rounded-md border-2 p-3 cursor-pointer ${
                              theme === "light" ? "border-primary" : "border-neutral-200"
                            }`}
                            onClick={() => setTheme("light")}
                          >
                            <Sun className="h-5 w-5 mr-2" />
                            <span>Light</span>
                          </div>
                          <div
                            className={`flex items-center justify-center rounded-md border-2 p-3 cursor-pointer ${
                              theme === "dark" ? "border-primary" : "border-neutral-200"
                            }`}
                            onClick={() => setTheme("dark")}
                          >
                            <Moon className="h-5 w-5 mr-2" />
                            <span>Dark</span>
                          </div>
                          <div
                            className={`flex items-center justify-center rounded-md border-2 p-3 cursor-pointer ${
                              theme === "system" ? "border-primary" : "border-neutral-200"
                            }`}
                            onClick={() => setTheme("system")}
                          >
                            <Globe className="h-5 w-5 mr-2" />
                            <span>System</span>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="text-base">Density</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="compact-mode" />
                            <Label htmlFor="compact-mode">Compact mode</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="show-avatars" defaultChecked />
                            <Label htmlFor="show-avatars">Show avatars</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="animations" defaultChecked />
                            <Label htmlFor="animations">Animations</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* API Settings */}
              <TabsContent value="api" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Settings</CardTitle>
                    <CardDescription>
                      Manage your API keys and access tokens
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base">Firebase API Key</Label>
                        <div className="flex mt-2">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            disabled
                            className="rounded-r-none"
                          />
                          <Button
                            variant="outline"
                            className="rounded-l-none border-l-0"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          This key is used to authenticate your application with Firebase
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="text-base">API Access</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="enable-api" defaultChecked />
                            <Label htmlFor="enable-api">Enable API access</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="rate-limiting" defaultChecked />
                            <Label htmlFor="rate-limiting">Enable rate limiting</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-base">Webhook URL</Label>
                        <Input
                          placeholder="https://your-webhook-url.com/callback"
                          className="mt-1"
                        />
                        <p className="text-sm text-neutral-500 mt-1">
                          Enter a URL to receive webhook notifications for CRM events
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button variant="outline" onClick={regenerateApiKey}>
                        Regenerate API Key
                      </Button>
                      <Button onClick={saveSettings}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Database Configuration</CardTitle>
                    <CardDescription>
                      PostgreSQL database settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Database className="h-5 w-5 text-primary mr-2" />
                          <Label className="text-base">PostgreSQL Connection</Label>
                        </div>
                        <p className="text-sm text-neutral-500">
                          Your CRM is connected to a PostgreSQL database
                        </p>
                      </div>
                      <div>
                        <div className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          Connected
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-neutral-50 rounded-md border border-neutral-200">
                      <p className="text-sm font-medium text-neutral-800">Connection Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-neutral-500">Host</p>
                          <p className="text-sm font-mono truncate">***********</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Database</p>
                          <p className="text-sm font-mono truncate">***********</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">User</p>
                          <p className="text-sm font-mono truncate">***********</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Port</p>
                          <p className="text-sm font-mono truncate">2139</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline">
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
