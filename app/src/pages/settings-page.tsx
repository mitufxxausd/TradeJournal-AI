import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router"

export function SettingsPage() {
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
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account preferences</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">Coming Soon</p>
                <p className="text-sm mt-1">Full settings panel will be available in Phase 3</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
