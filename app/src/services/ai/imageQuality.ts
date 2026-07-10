/**
 * Image Quality Analysis Service
 * Phase 7C: Smart Screenshot Quality Analysis
 *
 * Analyzes screenshot quality BEFORE OCR to predict OCR accuracy.
 * Measures: resolution, blur, compression, brightness, contrast, text visibility.
 */

import type { ImageQualityMetrics } from "./types/screenshot-analysis";

const MIN_RECOMMENDED_WIDTH = 800;
const MIN_RECOMMENDED_HEIGHT = 600;
const OPTIMAL_WIDTH = 1920;
const OPTIMAL_HEIGHT = 1080;

export async function analyzeImageQuality(source: File | HTMLImageElement): Promise<ImageQualityMetrics> {
  const img = source instanceof HTMLImageElement ? source : await loadImage(source);
  const { width, height } = img;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return createFallbackMetrics(width, height);

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const resolution = analyzeResolution(width, height);
  const blur = analyzeBlur(data, width, height);
  const compression = analyzeCompressionArtifacts(data, width, height);
  const brightness = analyzeBrightness(data);
  const contrast = analyzeContrast(data);
  const textVisibility = analyzeTextVisibility(data, width, height, brightness.score, contrast.score);
  const expectedOCRAccuracy = calculateExpectedOCRAccuracy(resolution.score, blur.score, compression.score, brightness.score, contrast.score, textVisibility.score);
  const overall = Math.round(resolution.score * 0.15 + blur.score * 0.25 + compression.score * 0.15 + brightness.score * 0.1 + contrast.score * 0.15 + textVisibility.score * 0.2);

  const { explanation, recommendations } = generateExplanationAndRecommendations(overall, resolution, blur, compression, brightness, contrast, textVisibility);

  return { overall, resolution, blur, compression, brightness, contrast, textVisibility, expectedOCRAccuracy, explanation, recommendations };
}

function analyzeResolution(width: number, height: number): ImageQualityMetrics["resolution"] {
  const pixelCount = width * height;
  const optimalPixels = OPTIMAL_WIDTH * OPTIMAL_HEIGHT;
  const minPixels = MIN_RECOMMENDED_WIDTH * MIN_RECOMMENDED_HEIGHT;

  let score: number;
  let label: ImageQualityMetrics["resolution"]["label"];

  if (pixelCount >= optimalPixels) { score = 100; label = "Excellent"; }
  else if (pixelCount >= minPixels * 2) { score = 80; label = "Good"; }
  else if (pixelCount >= minPixels) { score = 60; label = "Acceptable"; }
  else { score = Math.max(20, Math.round((pixelCount / minPixels) * 60)); label = "Poor"; }

  return { width, height, score, label };
}

function analyzeBlur(data: Uint8ClampedArray, width: number, height: number): ImageQualityMetrics["blur"] {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  let sum = 0, sumSq = 0, count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const laplacian = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width];
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  if (count === 0) return { score: 50, label: "Medium" };
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  let score: number;
  if (variance > 800) score = 100;
  else if (variance > 400) score = 80;
  else if (variance > 150) score = 60;
  else if (variance > 50) score = 40;
  else score = 20;

  let label: ImageQualityMetrics["blur"]["label"];
  if (score >= 90) label = "None";
  else if (score >= 70) label = "Low";
  else if (score >= 40) label = "Medium";
  else label = "High";

  return { score, label };
}

function analyzeCompressionArtifacts(data: Uint8ClampedArray, width: number, height: number): ImageQualityMetrics["compression"] {
  let blockBoundaryDiff = 0, normalDiff = 0, blockCount = 0, normalCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 8; x < width - 1; x += 8) {
      const idx = (y * width + x) * 4;
      const idxPrev = (y * width + x - 1) * 4;
      blockBoundaryDiff += Math.abs(data[idx] - data[idxPrev]) + Math.abs(data[idx + 1] - data[idxPrev + 1]) + Math.abs(data[idx + 2] - data[idxPrev + 2]);
      blockCount++;
    }
    for (let x = 1; x < width - 1; x++) {
      if (x % 8 === 0) continue;
      const idx = (y * width + x) * 4;
      const idxPrev = (y * width + x - 1) * 4;
      normalDiff += Math.abs(data[idx] - data[idxPrev]) + Math.abs(data[idx + 1] - data[idxPrev + 1]) + Math.abs(data[idx + 2] - data[idxPrev + 2]);
      normalCount++;
    }
  }

  if (blockCount === 0 || normalCount === 0) return { score: 80, label: "Low" };

  const avgBlockDiff = blockBoundaryDiff / blockCount;
  const avgNormalDiff = normalDiff / normalCount;
  const ratio = avgBlockDiff / (avgNormalDiff + 1);

  let score: number;
  if (ratio < 1.2) score = 95;
  else if (ratio < 1.8) score = 75;
  else if (ratio < 3.0) score = 50;
  else score = 25;

  let label: ImageQualityMetrics["compression"]["label"];
  if (score >= 85) label = "None";
  else if (score >= 60) label = "Low";
  else if (score >= 35) label = "Medium";
  else label = "High";

  return { score, label };
}

function analyzeBrightness(data: Uint8ClampedArray): ImageQualityMetrics["brightness"] {
  let totalBrightness = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const avgBrightness = totalBrightness / pixelCount;
  let score: number;
  let label: ImageQualityMetrics["brightness"]["label"];

  if (avgBrightness >= 80 && avgBrightness <= 180) {
    score = 100 - Math.abs(avgBrightness - 130) / 50 * 20;
    label = "Optimal";
  } else if (avgBrightness >= 50 && avgBrightness < 80) {
    score = 60 + (avgBrightness - 50) / 30 * 20;
    label = "Dark";
  } else if (avgBrightness > 180 && avgBrightness <= 220) {
    score = 60 + (220 - avgBrightness) / 40 * 20;
    label = "Bright";
  } else if (avgBrightness < 50) {
    score = Math.max(10, avgBrightness);
    label = "Too Dark";
  } else {
    score = Math.max(10, 255 - avgBrightness);
    label = "Too Bright";
  }

  return { score: Math.round(score), label };
}

function analyzeContrast(data: Uint8ClampedArray): ImageQualityMetrics["contrast"] {
  const pixelCount = data.length / 4;
  const luminances = new Float64Array(pixelCount);

  for (let i = 0; i < data.length; i += 4) {
    luminances[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  let sum = 0;
  for (let i = 0; i < pixelCount; i++) sum += luminances[i];
  const mean = sum / pixelCount;

  let sumSqDiff = 0;
  for (let i = 0; i < pixelCount; i++) sumSqDiff += (luminances[i] - mean) * (luminances[i] - mean);
  const stdDev = Math.sqrt(sumSqDiff / pixelCount);

  let score: number;
  let label: ImageQualityMetrics["contrast"]["label"];

  if (stdDev >= 60) { score = 90; label = "High"; }
  else if (stdDev >= 35) { score = 70; label = "Medium"; }
  else if (stdDev >= 20) { score = 50; label = "Low"; }
  else { score = 30; label = "Low"; }

  return { score, label };
}

function analyzeTextVisibility(data: Uint8ClampedArray, width: number, height: number, brightnessScore: number, contrastScore: number): ImageQualityMetrics["textVisibility"] {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
  }

  let edgePixels = 0, totalComparisons = 0;
  const step = 2;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const i = y * width + x;
      const localDiff = Math.abs(gray[i] - gray[i - 1]) + Math.abs(gray[i] - gray[i + 1]) +
        Math.abs(gray[i] - gray[i - width]) + Math.abs(gray[i] - gray[i + width]);
      if (localDiff > 80) edgePixels++;
      totalComparisons++;
    }
  }

  if (totalComparisons === 0) return { score: 50, label: "Fair" };

  const edgeDensity = edgePixels / totalComparisons;
  let edgeScore: number;
  if (edgeDensity >= 0.05 && edgeDensity <= 0.25) edgeScore = 100;
  else if (edgeDensity >= 0.02 && edgeDensity < 0.05) edgeScore = 70;
  else if (edgeDensity > 0.25 && edgeDensity <= 0.4) edgeScore = 70;
  else if (edgeDensity >= 0.01) edgeScore = 40;
  else edgeScore = 20;

  const combined = edgeScore * 0.5 + brightnessScore * 0.2 + contrastScore * 0.3;
  const score = Math.round(combined);
  let label: ImageQualityMetrics["textVisibility"]["label"];
  if (score >= 85) label = "Excellent";
  else if (score >= 65) label = "Good";
  else if (score >= 40) label = "Fair";
  else label = "Poor";

  return { score, label };
}

function calculateExpectedOCRAccuracy(resolution: number, blur: number, compression: number, brightness: number, contrast: number, textVisibility: number): number {
  const accuracy = Math.round(resolution * 0.1 + blur * 0.3 + compression * 0.15 + brightness * 0.1 + contrast * 0.15 + textVisibility * 0.2);
  return Math.min(100, Math.max(0, accuracy));
}

function generateExplanationAndRecommendations(overall: number, resolution: ImageQualityMetrics["resolution"], blur: ImageQualityMetrics["blur"], compression: ImageQualityMetrics["compression"], brightness: ImageQualityMetrics["brightness"], contrast: ImageQualityMetrics["contrast"], textVisibility: ImageQualityMetrics["textVisibility"]): { explanation: string; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (resolution.score < 60) { issues.push(`low resolution (${resolution.width}x${resolution.height})`); recommendations.push("Use a higher resolution screenshot (at least 1280x720)"); }
  if (blur.score < 50) { issues.push("significant blur detected"); recommendations.push("Ensure the screenshot is in focus - avoid motion blur", "Do not resize screenshots after capturing"); }
  if (compression.score < 50) { issues.push("heavy compression artifacts"); recommendations.push("Save screenshots as PNG instead of JPG", "Avoid repeatedly saving the same screenshot"); }
  if (brightness.label === "Too Dark" || brightness.label === "Too Bright") { issues.push(`${brightness.label.toLowerCase()} image`); recommendations.push("Adjust your screen brightness before taking screenshots"); }
  if (contrast.label === "Low") { issues.push("low contrast"); recommendations.push("Use a light theme in your trading platform for better text visibility"); }
  if (textVisibility.score < 50) { issues.push("poor text visibility"); recommendations.push("Ensure text is clearly visible and not obscured by overlays", "Close unnecessary panels before taking screenshots"); }

  let explanation: string;
  if (overall >= 85) explanation = "Image quality is excellent. OCR should perform well with high accuracy.";
  else if (overall >= 70) explanation = `Image quality is good. ${issues.length > 0 ? `Minor issues: ${issues.join(", ")}.` : ""} OCR accuracy should be acceptable.`;
  else if (overall >= 50) explanation = `Image quality is moderate. Issues detected: ${issues.join(", ")}. OCR may miss some fields. Review carefully.`;
  else explanation = `Image quality is poor. Issues detected: ${issues.join(", ")}. OCR accuracy will be significantly reduced. Consider retaking the screenshot.`;

  if (recommendations.length === 0 && overall < 90) recommendations.push("Ensure the trade panel is clearly visible in the screenshot");

  return { explanation, recommendations };
}

function loadImage(source: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

function createFallbackMetrics(width: number, height: number): ImageQualityMetrics {
  return {
    overall: 50,
    resolution: { width, height, score: 50, label: "Acceptable" },
    blur: { score: 50, label: "Medium" },
    compression: { score: 50, label: "Medium" },
    brightness: { score: 50, label: "Optimal" },
    contrast: { score: 50, label: "Medium" },
    textVisibility: { score: 50, label: "Fair" },
    expectedOCRAccuracy: 50,
    explanation: "Could not fully analyze image quality. Basic metrics estimated.",
    recommendations: ["Try re-uploading the screenshot for better quality analysis"],
  };
}
