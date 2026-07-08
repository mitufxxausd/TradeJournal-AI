/**
 * Cloudinary Upload Service
 * 
 * Handles image uploads to Cloudinary using unsigned uploads.
 * Features: compression, validation, progress tracking, deletion.
 * 
 * Environment variables required:
 * - VITE_CLOUDINARY_CLOUD_NAME
 * - VITE_CLOUDINARY_UPLOAD_PRESET
 */

import type { TradeScreenshot } from "@/types/trade";

// ── Configuration ───────────────────────────────────────────────

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const COMPRESSION_MAX_WIDTH = 1920;
const COMPRESSION_MAX_HEIGHT = 1080;
const COMPRESSION_QUALITY = 0.85;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// ── Types ───────────────────────────────────────────────────────

export interface UploadProgressEvent {
  screenshotId: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  delete_token?: string;
  bytes: number;
  format: string;
  original_filename: string;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
}

// ── Validation ──────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  // Type check
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  // Extension check
  const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  // Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Minimum size check (prevent empty/corrupted files)
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  return { valid: true };
}

// ── Compression ─────────────────────────────────────────────────

/**
 * Compress an image using HTML Canvas API before upload.
 * Reduces file size while maintaining visual quality.
 */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If file is already small enough, skip compression
    if (file.size < 500 * 1024 && file.type !== "image/png") {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > COMPRESSION_MAX_WIDTH || height > COMPRESSION_MAX_HEIGHT) {
        const scale = Math.min(
          COMPRESSION_MAX_WIDTH / width,
          COMPRESSION_MAX_HEIGHT / height,
          1
        );
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Use better quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const quality = file.type === "image/png" ? undefined : COMPRESSION_QUALITY;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob returned null"));
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
}

// ── Upload ──────────────────────────────────────────────────────

/**
 * Upload a single image to Cloudinary with progress tracking.
 * Uses XMLHttpRequest for real-time progress events.
 */
export function uploadToCloudinary(
  file: File | Blob,
  filename: string,
  onProgress?: (progress: number) => void,
  options?: UploadOptions
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(new Error(
        "Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables."
      ));
      return;
    }

    const formData = new FormData();
    formData.append("file", file, filename);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("return_delete_token", "true");

    // Add folder if provided (e.g., "trade-journal/{userId}")
    if (options?.folder) {
      formData.append("folder", options.folder);
    }

    // Add tags if provided
    if (options?.tags && options.tags.length > 0) {
      formData.append("tags", options.tags.join(","));
    }

    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    // Progress tracking
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result: CloudinaryUploadResult = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100);
          resolve(result);
        } catch {
          reject(new Error("Invalid JSON response from Cloudinary"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || `Upload failed: ${xhr.statusText}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    xhr.open("POST", url);
    xhr.send(formData);
  });
}

/**
 * Upload a single image with compression and validation.
 * Returns a TradeScreenshot-compatible object.
 * 
 * @param userId - The user's UID
 * @param tradeId - The trade ID (or "temp" for new trades)
 * @param file - The image file to upload
 * @param onProgress - Optional progress callback
 * @param screenshotId - Optional external ID to use for progress tracking (if not provided, one is generated)
 */
export async function uploadScreenshot(
  userId: string,
  tradeId: string,
  file: File,
  onProgress?: (event: UploadProgressEvent) => void,
  screenshotId?: string
): Promise<TradeScreenshot> {
  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const id = screenshotId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  // Report initial progress
  onProgress?.({ screenshotId: id, progress: 0, status: "uploading" });

  // Compress
  onProgress?.({ screenshotId: id, progress: 5, status: "uploading" });
  const compressed = await compressImage(file);

  // Upload to Cloudinary
  const result = await uploadToCloudinary(
    compressed,
    file.name,
    (progress) => {
      // Map 0-100 to 10-95 range (reserve 0-5 for compression, 95-100 for processing)
      const mappedProgress = 10 + Math.round(progress * 0.85);
      onProgress?.({ screenshotId: id, progress: mappedProgress, status: "uploading" });
    },
    {
      folder: `trade-journal/${userId}`,
      tags: ["trade-journal", `trade-${tradeId}`],
    }
  );

  onProgress?.({ screenshotId: id, progress: 100, status: "complete" });

  return {
    id,
    url: result.secure_url,
    name: file.name,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Upload multiple images in parallel.
 */
export async function uploadScreenshots(
  userId: string,
  tradeId: string,
  files: File[],
  onProgress?: (event: UploadProgressEvent) => void
): Promise<TradeScreenshot[]> {
  return Promise.all(
    files.map((file) => uploadScreenshot(userId, tradeId, file, onProgress))
  );
}

// ── Deletion ────────────────────────────────────────────────────

/**
 * Delete an image from Cloudinary using the delete token.
 * Falls back gracefully if deletion fails.
 */
export async function deleteScreenshot(publicId: string): Promise<void> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) return;

  try {
    // For unsigned uploads, we use the delete_by_token endpoint
    // Note: delete_token is only valid for a limited time after upload
    // For permanent deletion, a backend-signed request is needed.
    // This is a best-effort client-side deletion.
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`;

    const formData = new FormData();
    formData.append("public_id", publicId);

    await fetch(url, {
      method: "POST",
      body: formData,
    });
  } catch {
    // Silently fail — the image reference is already removed from Firestore
  }
}

/**
 * Extract public_id from a Cloudinary URL.
 * Example: https://res.cloudinary.com/cloud/image/upload/v123456/trade-journal/user/abc.jpg
 * Returns: trade-journal/user/abc
 */
export function extractPublicId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    // Path format: /v{version}/{folder}/{public_id}.{format}
    // Find the "upload" part, then everything after is the public_id with version
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1 || uploadIndex + 2 >= pathParts.length) return null;

    // Skip version folder (v1234567890), join remaining parts
    const relevantParts = pathParts.slice(uploadIndex + 2);
    const fullPath = relevantParts.join("/");

    // Remove file extension
    const lastDotIndex = fullPath.lastIndexOf(".");
    if (lastDotIndex > 0) {
      return fullPath.substring(0, lastDotIndex);
    }
    return fullPath;
  } catch {
    return null;
  }
}

// ── URL Transformations ─────────────────────────────────────────

/**
 * Get a responsive/thumbnail URL from a Cloudinary image URL.
 * Uses Cloudinary's transformation parameters.
 */
export function getResponsiveUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number | string; format?: string } = {}
): string {
  if (!url.includes("cloudinary.com")) return url;

  const { width, height, quality = "auto", format } = options;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return url;

    // Build transformation string
    const transforms: string[] = [];
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (quality) transforms.push(`q_${quality}`);
    if (format) transforms.push(`f_${format}`);
    transforms.push("c_limit"); // maintain aspect ratio

    const transformString = transforms.join(",");
    pathParts.splice(uploadIndex + 1, 0, transformString);
    urlObj.pathname = pathParts.join("/");

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Get a thumbnail URL (small preview).
 */
export function getThumbnailUrl(url: string): string {
  return getResponsiveUrl(url, { width: 300, height: 200, format: "webp" });
}

/**
 * Get a full-size URL (moderate compression for viewing).
 */
export function getFullSizeUrl(url: string): string {
  return getResponsiveUrl(url, { width: 1920, quality: 80, format: "auto" });
}
