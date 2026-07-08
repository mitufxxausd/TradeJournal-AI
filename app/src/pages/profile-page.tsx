import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ProfilePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Navbar sidebarCollapsed={sidebarCollapsed} />
      <main
        className="pt-16 pb-8 px-6 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "4rem" : "16rem" }}
      >
        <div className="max-w-[800px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your profile information</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-semibold">{user?.displayName || "Trader"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Last Sign In</p>
                  <p className="font-medium">{user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
