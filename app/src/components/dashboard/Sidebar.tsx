import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  BarChart3,
  Settings,
  Hexagon,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Insight Engine", icon: BrainCircuit, path: "/insights" },
  { label: "Journal", icon: BookOpen, path: "/journal" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const initials = (user?.displayName || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-[260px] min-w-[260px] h-screen bg-[#18181b] border-r border-[#27272a] flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-[#27272a]">
        <div className="w-7 h-7 rounded-md bg-[#3b82f6] flex items-center justify-center">
          <Hexagon className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-white font-semibold text-sm tracking-tight">
          TradeJournal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150 group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#3b82f6] rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={`absolute inset-0 rounded-md transition-colors duration-150 ${
                  isActive ? "bg-[#3f3f46]/60" : "group-hover:bg-[#27272a]"
                }`}
              />
              <item.icon
                className={`relative z-10 w-4 h-4 ${
                  isActive ? "text-[#3b82f6]" : "text-[#a1a1aa] group-hover:text-white"
                }`}
              />
              <span
                className={`relative z-10 font-medium ${
                  isActive ? "text-white" : "text-[#a1a1aa] group-hover:text-white"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-md border border-[#27272a] bg-[#09090b]/50">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="text-xs bg-[#27272a] text-[#a1a1aa] font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">
              {user?.displayName || "User"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[#a1a1aa] text-xs">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
