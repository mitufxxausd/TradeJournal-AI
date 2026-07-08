import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Quote,
  Image as ImageIcon,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  onAutoSave?: (html: string) => void
  placeholder?: string
  className?: string
}

function exec(command: string, value: string | undefined = undefined) {
  document.execCommand(command, false, value)
}

export function RichTextEditor({
  value,
  onChange,
  onAutoSave,
  placeholder = "Write your journal notes here...",
  className,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const autoSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUpdatingRef = React.useRef(false)

  // Sync external value to editor without resetting cursor while typing
  React.useEffect(() => {
    const el = editorRef.current
    if (!el || document.activeElement === el) return
    if (el.innerHTML !== value) {
      isUpdatingRef.current = true
      el.innerHTML = value || ""
      isUpdatingRef.current = false
    }
  }, [value])

  const handleInput = () => {
    const el = editorRef.current
    if (!el) return
    if (isUpdatingRef.current) return
    const html = el.innerHTML
    onChange(html)
    if (onAutoSave) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        onAutoSave(html)
      }, 1500)
    }
  }

  const handleAction = (action: () => void) => {
    editorRef.current?.focus()
    action()
    handleInput()
  }

  const insertLink = () => {
    const url = prompt("Enter URL")
    if (url) exec("createLink", url)
  }

  const insertImage = () => {
    const url = prompt("Enter image URL")
    if (url) exec("insertImage", url)
  }

  const toolbar = [
    { icon: Bold, action: () => exec("bold"), label: "Bold" },
    { icon: Italic, action: () => exec("italic"), label: "Italic" },
    { icon: Underline, action: () => exec("underline"), label: "Underline" },
    { icon: Heading1, action: () => exec("formatBlock", "H1"), label: "Heading 1" },
    { icon: Heading2, action: () => exec("formatBlock", "H2"), label: "Heading 2" },
    { icon: List, action: () => exec("insertUnorderedList"), label: "Bullet List" },
    { icon: ListOrdered, action: () => exec("insertOrderedList"), label: "Numbered List" },
    { icon: LinkIcon, action: insertLink, label: "Link" },
    { icon: Code, action: () => exec("formatBlock", "PRE"), label: "Code Block" },
    { icon: Quote, action: () => exec("formatBlock", "BLOCKQUOTE"), label: "Quote" },
    { icon: ImageIcon, action: insertImage, label: "Image" },
  ]

  return (
    <div className={cn("rounded-md border border-input bg-transparent overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
        {toolbar.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleAction(item.action)}
            title={item.label}
          >
            <item.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        className="min-h-[180px] w-full px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        data-placeholder={placeholder}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  )
}

export function RichTextViewer({ html, className }: { html?: string; className?: string }) {
  if (!html) return null
  return (
    <div
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
