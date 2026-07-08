/**
 * Cloudinary unsigned upload service.
 * Uses unsigned upload preset — no signed parameters allowed.
 */

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/";

function getCloudName(): string {
  const name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!name) throw new Error("VITE_CLOUDINARY_CLOUD_NAME is not set");
  return name;
}

function getUploadPreset(): string {
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!preset) throw new Error("VITE_CLOUDINARY_UPLOAD_PRESET is not set");
  return preset;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  original_filename: string;
  created_at: string;
}

export interface UploadProgressEvent {
  screenshotId: string;
  progress: number;
}

/**
 * Upload a single file to Cloudinary using unsigned upload.
 * No signed parameters (return_delete_token, etc.) are included.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (event: UploadProgressEvent) => void,
  screenshotId?: string
): Promise<CloudinaryUploadResult> {
  const cloudName = getCloudName();
  const uploadPreset = getUploadPreset();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  // DO NOT add return_delete_token or any signed-upload parameters

  const id = screenshotId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress({ screenshotId: id, progress });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          resolve(result);
        } catch {
          reject(new Error("Invalid JSON response from Cloudinary"));
        }
      } else {
        let message = `Upload failed with status ${xhr.status}`;
        try {
          const errorData = JSON.parse(xhr.responseText);
          message = errorData.error?.message || message;
        } catch {
          // use default message
        }
        reject(new Error(message));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    xhr.open(
      "POST",
      `${CLOUDINARY_UPLOAD_URL}${cloudName}/image/upload`
    );
    xhr.send(formData);
  });
}

/**
 * Upload multiple files to Cloudinary.
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  onProgress?: (event: UploadProgressEvent) => void
): Promise<CloudinaryUploadResult[]> {
  return Promise.all(
    files.map((file, index) =>
      uploadToCloudinary(
        file,
        onProgress,
        `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`
      )
    )
  );
}

/**
 * Extract the public ID from a Cloudinary URL for deletion purposes.
 * Note: Unsigned uploads cannot be deleted via API without authentication.
 * This is for reference only.
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;
    const afterUpload = pathParts.slice(uploadIndex + 1);
    // Remove version number if present (starts with v)
    const startIndex = afterUpload[0]?.startsWith("v") ? 1 : 0;
    const publicId = afterUpload.slice(startIndex).join("/").replace(/\.[^.]+$/, "");
    return publicId || null;
  } catch {
    return null;
  }
}
