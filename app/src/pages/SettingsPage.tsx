import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChronoSequenceDataBand from "@/components/effects/ChronoSequenceDataBand";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  User,
  Shield,
  Bell,
  LogOut,
  Mail,
  Save,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function SettingsPage() {
  const { user, logout, firebaseUser } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "Trader";

  const { data: userData, isLoading: userLoading } = trpc.user.me.useQuery(undefined, {
    enabled: !!user,
  });
  const updateMutation = trpc.user.updateProfile.useMutation();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    tradeAlerts: true,
    priceAlerts: false,
    weeklyReport: true,
    aiInsights: true,
  });

  const handleSaveProfile = () => {
    if (displayName.trim()) {
      updateMutation.mutate({ displayName: displayName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const initials = (user?.displayName || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayout>
      <ChronoSequenceDataBand userName={firstName} />
      <div className="p-6 overflow-y-auto scrollbar-thin max-w-4xl">
        {/* Header */}
        <motion.div className="mb-8" variants={fadeUp} initial="hidden" animate="show">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-md bg-[#52525b]/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-[#a1a1aa]" />
            </div>
            <h1 className="text-white text-xl font-semibold">Settings</h1>
          </div>
          <p className="text-[#a1a1aa] text-xs ml-11">
            Manage your account preferences and application settings
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            className="bg-[#18181b] border border-[#27272a] rounded-lg p-5"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-[#3b82f6]" />
              <h2 className="text-white text-sm font-semibold">Profile</h2>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-[#27272a] flex items-center justify-center shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-[#a1a1aa]">{initials}</span>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[#a1a1aa] text-xs">Display Name</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-[#27272a] border-[#3f3f46] text-white text-sm h-9 focus-visible:ring-[#3b82f6]/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#a1a1aa] text-xs">Email</Label>
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-[#27272a]/50 border border-[#27272a] text-[#a1a1aa] text-sm">
                      <Mail className="w-3.5 h-3.5 text-[#52525b]" />
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-xs h-8"
                    onClick={handleSaveProfile}
                    disabled={updateMutation.isPending}
                  >
                    {saved ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  {userLoading ? (
                    <Skeleton className="h-4 w-24 bg-[#27272a]" />
                  ) : (
                    <span className="text-[#52525b] text-xs">
                      Plan: <span className="text-[#a1a1aa]">{userData?.plan || "Basic"}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            className="bg-[#18181b] border border-[#27272a] rounded-lg p-5"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4 text-[#22c55e]" />
              <h2 className="text-white text-sm font-semibold">Security</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Email Verification</p>
                  <p className="text-[#52525b] text-xs">
                    {user?.emailVerified
                      ? "Your email is verified"
                      : "Verify your email for added security"}
                  </p>
                </div>
                {user?.emailVerified ? (
                  <div className="flex items-center gap-1.5 text-[#22c55e] text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs h-8 border-[#3f3f46] text-[#a1a1aa]">
                    Verify
                  </Button>
                )}
              </div>

              <Separator className="bg-[#27272a]" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Authentication</p>
                  <p className="text-[#52525b] text-xs">
                    {firebaseUser?.providerData?.[0]?.providerId === "password"
                      ? "Email & Password"
                      : firebaseUser?.providerData?.[0]?.providerId === "google.com"
                        ? "Google Sign-In"
                        : "OAuth"}
                  </p>
                </div>
                <span className="text-[#a1a1aa] text-xs bg-[#27272a] px-2 py-1 rounded">
                  {firebaseUser?.providerData?.[0]?.providerId === "password"
                    ? "Email"
                    : "Google"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            className="bg-[#18181b] border border-[#27272a] rounded-lg p-5"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-4 h-4 text-[#f59e0b]" />
              <h2 className="text-white text-sm font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => {
                const labels: Record<string, string> = {
                  tradeAlerts: "Trade Execution Alerts",
                  priceAlerts: "Price Movement Alerts",
                  weeklyReport: "Weekly Performance Report",
                  aiInsights: "AI Insight Notifications",
                };
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[#a1a1aa] text-sm">{labels[key]}</span>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, [key]: checked }))
                      }
                      className="data-[state=checked]:bg-[#3b82f6]"
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            className="bg-[#18181b] border border-[#ef4444]/20 rounded-lg p-5"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              <h2 className="text-white text-sm font-semibold">Account</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Sign Out</p>
                <p className="text-[#52525b] text-xs">End your current session</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444]"
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
