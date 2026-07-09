/**
 * AI Screenshot Upload Component
 * Handles drag-and-drop and click-to-upload for trading screenshots.
 * Improved for mobile UX with touch-friendly targets.
 */

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AITradeImage } from "@/services/ai";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  CheckCircle2,
  Lock,
  ExternalLink,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───

export interface AIScreenshotUploadProps {
  screenshots: AITradeImage[];
  uploadProgress: number;
  onUploadFiles: (files: File[]) => void;
  onDeleteScreenshot: (id: string) => void;
  onFileDrop: (files: File[]) => void;
  onAutoFill: () => void;
  disabled?: boolean;
}

// ─── Feature Gate ───

interface LockedFeatureProps {
  title: string;
  description: string;
  requiredPlan: string;
  children: React.ReactNode;
  hasAccess: boolean;
}

export function LockedFeature({ title, description, requiredPlan, children, hasAccess }: LockedFeatureProps) {
  if (hasAccess) return <>{children}</>;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            This feature requires a <span className="font-semibold text-primary">{requiredPlan}</span> subscription.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="#/ai/subscription" className="gap-2">
              <ExternalLink className="h-3 w-3" />
              Upgrade Plan
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Upload Progress ───

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Uploading...
        </span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Screenshot Card ───

function ScreenshotCard({
  screenshot,
  onDelete,
}: {
  screenshot: AITradeImage;
  onDelete: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video relative bg-muted">
        {screenshot.status === "uploading" ? (
          <Skeleton className="absolute inset-0" />
        ) : (
          <>
            <img
              src={screenshot.url}
              alt={screenshot.fileName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Hover overlay with actions */}
            <div className={cn(
              "absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity",
              isHovered ? "opacity-100" : "opacity-0"
            )}>
              <Button
                variant="destructive"
                size="icon"
                className="h-9 w-9"
                onClick={() => onDelete(screenshot.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <p className="text-xs font-medium truncate">{screenshot.fileName}</p>
        <div className="flex items-center gap-1.5">
          {screenshot.status === "uploaded" && (
            <Badge variant="outline" className="text-[10px] h-5 gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Ready
            </Badge>
          )}
          {screenshot.status === "uploading" && (
            <Badge variant="secondary" className="text-[10px] h-5 gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Uploading
            </Badge>
          )}
          {screenshot.status === "analyzing" && (
            <Badge className="text-[10px] h-5 gap-1 bg-primary text-white">
              <Sparkles className="h-2.5 w-2.5" />
              Analyzing
            </Badge>
          )}
          {screenshot.status === "analyzed" && (
            <Badge className="text-[10px] h-5 gap-1 bg-green-500 text-white">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Analyzed
            </Badge>
          )}
          {screenshot.status === "error" && (
            <Badge variant="destructive" className="text-[10px] h-5">
              Error
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function AIScreenshotUpload({
  screenshots,
  uploadProgress,
  onUploadFiles,
  onDeleteScreenshot,
  onFileDrop,
  onAutoFill,
}: AIScreenshotUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      onFileDrop(files);
    } else {
      toast.error("Please drop image files only");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      onUploadFiles(files);
    }
    e.target.value = "";
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 mb-3",
          isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
        )}>
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">
          {isDragging ? "Drop images here" : "Drag & drop screenshots here"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse · PNG, JPG, WEBP
        </p>
      </div>

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <UploadProgress progress={uploadProgress} />
      )}

      {/* Screenshot Grid */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {screenshots.map((screenshot) => (
            <ScreenshotCard
              key={screenshot.id}
              screenshot={screenshot}
              onDelete={onDeleteScreenshot}
            />
          ))}
        </div>
      )}

      {/* Auto-fill Button */}
      {screenshots.some((s) => s.status === "uploaded") && (
        <div className="flex justify-end">
          <Button onClick={onAutoFill} className="gap-2" size="sm">
            <Wand2 className="h-4 w-4" />
            Auto-fill from Screenshots
          </Button>
        </div>
      )}

      {/* Empty State */}
      {screenshots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No screenshots uploaded yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload trading screenshots to extract trade data
          </p>
        </div>
      )}
    </div>
  );
}
