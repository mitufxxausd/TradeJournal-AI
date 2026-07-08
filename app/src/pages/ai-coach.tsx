import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, MessageSquare, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router"

export function AICoachPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Navbar sidebarCollapsed={sidebarCollapsed} />
      <main
        className="pt-16 pb-8 px-6 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "4rem" : "16rem" }}
      >
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">AI Coach</h1>
                <p className="text-sm text-muted-foreground">Get AI-powered trading insights</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Trade Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get detailed AI analysis of your recent trades with personalized feedback.
                </p>
                <Button className="w-full" onClick={() => toast.info("AI Analysis - Coming soon!")}>
                  Analyze Recent Trades
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Chat with AI Coach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask questions and get personalized trading advice from your AI coach.
                </p>
                <Button className="w-full" onClick={() => toast.info("AI Chat - Coming soon!")}>
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
