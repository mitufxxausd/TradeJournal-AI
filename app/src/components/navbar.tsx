import { Link } from "react-router"
import { Bell, Moon, Sun, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useThemeContext } from "@/components/theme-provider"
import { useAuth } from "@/hooks/use-auth"

interface NavbarProps {
  sidebarCollapsed: boolean
}

export function Navbar({ sidebarCollapsed }: NavbarProps) {
  const { toggleTheme, theme } = useThemeContext()
  const { user, logout } = useAuth()

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-md px-6 transition-all duration-300"
      style={{
        left: sidebarCollapsed ? "4rem" : "16rem",
      }}
    >
      {/* Search or Breadcrumb could go here */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="text-sm font-medium">New AI Review Available</span>
                <span className="text-xs text-muted-foreground">
                  Your last trade has been analyzed by AI Coach
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="text-sm font-medium">Daily Goal Reached</span>
                <span className="text-xs text-muted-foreground">
                  You have reached 80% of your daily trading goal
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="text-sm font-medium">Market Alert</span>
                <span className="text-xs text-muted-foreground">
                  High volatility expected during London session
                </span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.displayName || "Trader"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
