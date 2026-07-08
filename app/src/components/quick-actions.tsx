import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  BookOpen,
  Camera,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface QuickActionsProps {
  loading?: boolean
}

const actions = [
  { label: "Add Trade", icon: Plus, color: "bg-blue-500 hover:bg-blue-600", description: "Log a new trade" },
  { label: "New Journal", icon: BookOpen, color: "bg-emerald-500 hover:bg-emerald-600", description: "Write journal entry" },
  { label: "Screenshot", icon: Camera, color: "bg-purple-500 hover:bg-purple-600", description: "Upload screenshot" },
  { label: "Import MT4", icon: Download, color: "bg-amber-500 hover:bg-amber-600", description: "Import MT4 data" },
  { label: "Import MT5", icon: Download, color: "bg-orange-500 hover:bg-orange-600", description: "Import MT5 data" },
  { label: "Export CSV", icon: FileSpreadsheet, color: "bg-cyan-500 hover:bg-cyan-600", description: "Export as CSV" },
  { label: "Export PDF", icon: FileText, color: "bg-rose-500 hover:bg-rose-600", description: "Export as PDF" },
  { label: "Upload", icon: Upload, color: "bg-indigo-500 hover:bg-indigo-600", description: "Upload files" },
]

export function QuickActions({ loading }: QuickActionsProps) {
  const handleAction = (label: string) => {
    toast.info(`${label} - Coming soon!`)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="flex flex-col items-center justify-center h-20 gap-1.5 p-2 hover:bg-accent transition-colors"
              onClick={() => handleAction(action.label)}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
