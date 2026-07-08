import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, sendPasswordResetEmail } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, TrendingUp } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TradeJournal AI</h1>
            <p className="text-sm text-muted-foreground">Professional Trading Analytics</p>
          </div>
        </div>

        <Card className="border shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Reset Password</CardTitle>
            <CardDescription>
              {sent
                ? "Check your email for reset instructions"
                : "Enter your email to receive reset instructions"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Reset Link
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  If an account exists with this email, you will receive password reset instructions.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                  Try Again
                </Button>
              </div>
            )}
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
