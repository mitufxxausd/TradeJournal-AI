import { Routes, Route } from "react-router";
import { lazy, Suspense } from "react";
import { ProtectedRoute, PublicRoute } from "@/components/RouteGuard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Trades from "@/pages/trades";
import AddTrade from "@/pages/AddTrade";
import TradeDetail from "@/pages/TradeDetail";
import Journal from "@/pages/journal";
import Analytics from "@/pages/analytics";
import { SettingsPage as Settings } from "@/pages/settings-page";

// AI Workspace Pages - lazy loaded
const AIDashboard = lazy(() => import("@/pages/ai/ai-dashboard"));
const AIScreenshotAnalysis = lazy(() => import("@/pages/ai/ai-screenshot-analysis"));
const AIVoiceNotes = lazy(() => import("@/pages/ai/ai-voice-notes"));
const AICoach = lazy(() => import("@/pages/ai/ai-coach"));
const AITradeSummary = lazy(() => import("@/pages/ai/ai-trade-summary"));
const AISettings = lazy(() => import("@/pages/ai/ai-settings"));
const AISubscription = lazy(() => import("@/pages/ai/ai-subscription"));

function AILayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/trades" element={<ProtectedRoute><Trades /></ProtectedRoute>} />
      <Route path="/trades/new" element={<ProtectedRoute><AddTrade /></ProtectedRoute>} />
      <Route path="/trades/:id" element={<ProtectedRoute><TradeDetail /></ProtectedRoute>} />
      <Route path="/trades/:id/edit" element={<ProtectedRoute><AddTrade /></ProtectedRoute>} />
      <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* AI Workspace Routes */}
      <Route path="/ai/dashboard" element={<ProtectedRoute><AILayout><AIDashboard /></AILayout></ProtectedRoute>} />
      <Route path="/ai/screenshot" element={<ProtectedRoute><AILayout><AIScreenshotAnalysis /></AILayout></ProtectedRoute>} />
      <Route path="/ai/voice" element={<ProtectedRoute><AILayout><AIVoiceNotes /></AILayout></ProtectedRoute>} />
      <Route path="/ai/coach" element={<ProtectedRoute><AILayout><AICoach /></AILayout></ProtectedRoute>} />
      <Route path="/ai/summary" element={<ProtectedRoute><AILayout><AITradeSummary /></AILayout></ProtectedRoute>} />
      <Route path="/ai/settings" element={<ProtectedRoute><AILayout><AISettings /></AILayout></ProtectedRoute>} />
      <Route path="/ai/subscription" element={<ProtectedRoute><AILayout><AISubscription /></AILayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}
