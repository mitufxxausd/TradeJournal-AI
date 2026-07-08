/**
 * Storage Layer - Cloudinary-backed
 * 
 * Re-exports Cloudinary upload functions with the legacy interface
 * for backward compatibility. New code should import from
 * @/services/cloudinaryService directly.
 */

import {
  uploadScreenshot as cloudinaryUploadScreenshot,
  uploadScreenshots as cloudinaryUploadScreenshots,
  deleteScreenshot as cloudinaryDeleteScreenshot,
  validateImageFile,
  compressImage,
  getThumbnailUrl,
  getFullSizeUrl,
  extractPublicId,
  type UploadProgressEvent as CloudinaryUploadProgressEvent,
  type UploadOptions,
  type CloudinaryUploadResult,
  type ValidationResult,
} from "@/services/cloudinaryService"

import type { Screenshot } from "@/types"

// ── Re-export types and utilities ───────────────────────────────

export type {
  CloudinaryUploadResult,
  UploadOptions,
  ValidationResult,
}

export {
  validateImageFile,
  compressImage,
  getThumbnailUrl,
  getFullSizeUrl,
  extractPublicId,
}

// ── Legacy-compatible progress event ────────────────────────────

export interface UploadProgressEvent {
  screenshotId: string
  progress: number
  status: "uploading" | "processing" | "complete" | "error"
}

// ── Screenshot operations ───────────────────────────────────────

/**
 * Upload a single screenshot to Cloudinary.
 * Backward-compatible signature with the original Firebase Storage version.
 */
export async function uploadScreenshot(
  userId: string,
  tradeIdOrTemp: string,
  file: File,
  onProgress?: (event: UploadProgressEvent) => void
): Promise<Screenshot> {
  const result = await cloudinaryUploadScreenshot(
    userId,
    tradeIdOrTemp,
    file,
    onProgress
      ? (event: CloudinaryUploadProgressEvent) => {
          onProgress({
            screenshotId: event.screenshotId,
            progress: event.progress,
            status: event.status,
          })
        }
      : undefined
  )

  // Map TradeScreenshot to legacy Screenshot format
  return {
    id: result.id,
    url: result.url,
    name: result.name,
    createdAt: result.uploadedAt,
  }
}

/**
 * Upload multiple screenshots to Cloudinary in parallel.
 */
export async function uploadScreenshots(
  userId: string,
  tradeIdOrTemp: string,
  files: File[],
  onProgress?: (event: UploadProgressEvent) => void
): Promise<Screenshot[]> {
  return Promise.all(
    files.map((file) => uploadScreenshot(userId, tradeIdOrTemp, file, onProgress))
  )
}

/**
 * Delete a screenshot from Cloudinary.
 * Uses best-effort deletion; silently fails if the image cannot be deleted.
 */
export async function deleteScreenshot(url: string): Promise<void> {
  const publicId = extractPublicId(url)
  if (publicId) {
    await cloudinaryDeleteScreenshot(publicId)
  }
}
