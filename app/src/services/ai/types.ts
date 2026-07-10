/**
 * AI Analysis Types for TradeJournal AI
 * Core type definitions for all AI-powered features
 */

// ─── AI Provider Types (for mockProvider compatibility) ───

export interface AIProviderCapabilities {
  vision: boolean;
  ocr: boolean;
  chartAnalysis: boolean;
  tradeSummary: boolean;
  coaching: boolean;
  transcription: boolean;
}

export interface AIProvider {
  readonly name: string;
  readonly requiredTier: SubscriptionTier;
  readonly capabilities: AIProviderCapabilities;
  analyzeScreenshot(request: VisionAnalyzeRequest): Promise<ScreenshotAnalysis | null>;
  analyzeScreenshotsBatch(requests: VisionAnalyzeRequest[]): Promise<ScreenshotAnalysis[]>;
  generateTradeSummary(input: TradeSummaryInput): Promise<TradeSummary | null>;
  generateCoaching(input: CoachingInput): Promise<AICoaching | null>;
  transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResult | null>;
}

export interface VisionAnalyzeRequest {
  imageUrl: string;
  imageBase64?: string;
  mimeType?: string;
  prompt?: string;
}

export interface TradeSummaryInput {
  pair: string;
  direction: string;
  entryPrice: number;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  positionSize: number;
  riskPercent?: number | null;
  profitLoss?: number | null;
  rrRatio?: number | null;
  timeframe?: string;
  strategy?: string;
  session?: string;
  psychologyNotes?: string;
  checklistItems?: { label: string; checked: boolean }[];
  notes?: string;
  screenshots?: { url: string }[];
}

export interface CoachingInput extends TradeSummaryInput {
  tradeQualityScore?: number;
  recentTrades?: {
    profitLoss: number;
    riskPercent?: number;
    tradeDate: string;
    pair: string;
  }[];
}

// ─── OCR / Structured Data Extraction ───

export interface ExtractedTradeData {
  pair: string;
  direction: string;
  entryPrice: number | null;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSize: number | null;
  confidence: number;
  confidenceLevel: "high" | "medium" | "low";
  source: string;
  method: string;
  rawOCRText?: string;
  ocrConfidence?: number;
  detectedPrices?: DetectedPrice[];
  fieldStatuses?: ExtractedFieldStatus[];
  screenshotUrl?: string;
}

// ─── AI Analysis Results ───

export interface ScreenshotAnalysis {
  id: string;
  screenshotId: string;
  tradeData: ExtractedTradeData;
  detectedSetup: string | null;
  marketContext: string | null;
  keyLevels: KeyLevel[];
  riskAssessment: RiskAssessment;
  confidence: number;
  confidenceLevel: "high" | "medium" | "low";
  processingTimeMs: number;
  provider: string;
  model: string;
  analyzedAt: string;
  status: AnalysisStatus;
  errorMessage?: string;
}

export interface KeyLevel {
  type: "support" | "resistance" | "entry" | "stopLoss" | "takeProfit" | "pivot";
  price: number;
  confidence: number;
  description: string;
}

export interface RiskAssessment {
  riskRewardRatio: number | null;
  riskPercent: number | null;
  potentialProfit: number | null;
  potentialLoss: number | null;
  assessment: string;
  recommendation: string;
}

export interface TradeSummary {
  id: string;
  tradeId: string;
  title: string;
  overview: string;
  keyObservations: string[];
  whatWentWell: string[];
  whatToImprove: string[];
  psychologicalFactors: string[];
  technicalAnalysis: string;
  riskManagementAssessment: string;
  actionableRecommendations: string[];
  marketContext: string;
  confidence: number;
  provider: string;
  model: string;
  generatedAt: string;
  processingTimeMs: number;
}

export interface AICoaching {
  id: string;
  userId: string;
  tradeId: string;
  plan: CoachingPlan;
  insights: CoachingInsight[];
  goals: CoachingGoal[];
  feedback: CoachingFeedback;
  confidence: number;
  provider: string;
  model: string;
  generatedAt: string;
  processingTimeMs: number;
}

export interface CoachingPlan {
  focus: string;
  summary: string;
  items: CoachingItem[];
  priority: "high" | "medium" | "low";
  timeframe: string;
  expectedOutcome: string;
}

export interface CoachingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  relatedTradeIds?: string[];
}

export interface CoachingInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "info" | "warning" | "critical" | "positive";
  relatedMetric?: string;
  recommendation?: string;
}

export interface CoachingGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: string;
  isAchieved: boolean;
  progress: number;
}

export interface CoachingFeedback {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  overallRating: number;
  overallComment: string;
}

export interface AITradeImage {
  id: string;
  url: string;
  fileName: string;
  status: "uploading" | "uploaded" | "analyzing" | "analyzed" | "error";
  analysis?: ScreenshotAnalysis;
  createdAt: string;
}

// ─── Transcription ───

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  provider: string;
}

export interface TranscriptionRequest {
  audioUrl: string;
  audioBase64?: string;
  mimeType?: string;
}

// ─── Voice Note ───

export interface VoiceNote {
  id: string;
  userId: string;
  tradeId?: string;
  audioUrl: string;
  duration: number;
  transcription?: TranscriptionResult;
  summary?: string;
  sentiment?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Shared ───

export type SubscriptionTier = "free" | "pro" | "elite";

export type AnalysisStatus = "pending" | "processing" | "completed" | "error";

export interface AIError {
  code: string;
  message: string;
  details?: string;
  retryable: boolean;
}

export interface AIProcessingState {
  status: AnalysisStatus;
  progress: number;
  message: string;
  startTime?: string;
  endTime?: string;
  error?: AIError;
}

// ─── Detected Price ───

export interface DetectedPrice {
  value: number;
  text: string;
  position: number;
  confidence: number;
}

// ─── Extracted Field Status ───

export interface ExtractedFieldStatus {
  field: string;
  detected: boolean;
  confidence: number;
  source: string;
}

// ─── Subscription Feature Gate ───

export interface FeatureAccess {
  feature: string;
  enabled: boolean;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  hasAccess: boolean;
}

export interface SubscriptionFeatures {
  aiScreenshotAnalysis: boolean;
  aiTradeSummary: boolean;
  aiCoaching: boolean;
  aiVoiceNotes: boolean;
  aiSettings: boolean;
  batchUpload: boolean;
  advancedOCR: boolean;
  exportReports: boolean;
  customStrategies: boolean;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  features: SubscriptionFeatures;
  limits: {
    screenshotsPerMonth: number;
    tradeSummariesPerMonth: number;
    coachingSessionsPerMonth: number;
    voiceNotesPerMonth: number;
    maxScreenshotsPerUpload: number;
  };
  usage: {
    screenshotsUsed: number;
    tradeSummariesUsed: number;
    coachingSessionsUsed: number;
    voiceNotesUsed: number;
  };
}
