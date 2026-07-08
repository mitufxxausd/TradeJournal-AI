import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Settings as SettingsIcon, Moon, Sun, Monitor } from "lucide-react";

export default function Settings() {
  const { userProfile, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [defaultBroker, setDefaultBroker] = useState(userProfile?.settings?.defaultBroker || "");
  const [defaultCurrency, setDefaultCurrency] = useState(userProfile?.settings?.defaultCurrency || "USD");
  const [riskPerTrade, setRiskPerTrade] = useState(userProfile?.settings?.riskPerTrade?.toString() || "1");

  const handleSave = () => {
    // In a real app, this would save to Firestore
    toast.success("Settings saved");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={userProfile?.displayName || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize your viewing experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-2 h-4 w-4" /> Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="mr-2 h-4 w-4" /> System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Preferences</CardTitle>
            <CardDescription>Your default trading settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultBroker">Default Broker</Label>
              <Input
                id="defaultBroker"
                value={defaultBroker}
                onChange={(e) => setDefaultBroker(e.target.value)}
                placeholder="OANDA, IG, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
              <Input
                id="riskPerTrade"
                type="number"
                step="0.1"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(e.target.value)}
              />
            </div>
            <Button onClick={handleSave}>Save Preferences</Button>
          </CardContent>
        </Card>

        {/* Cloudinary */}
        <Card>
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
            <CardDescription>Screenshot upload configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Screenshots are uploaded using Cloudinary unsigned uploads.
            </p>
            <div className="space-y-2">
              <Label>Cloud Name</Label>
              <Input value={import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "Not set"} disabled />
            </div>
            <div className="space-y-2">
              <Label>Upload Preset</Label>
              <Input value={import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "Not set"} disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
