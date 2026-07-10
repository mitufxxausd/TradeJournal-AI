/**
 * AI Trade Advice Service
 * Phase 7C: Smart Journal Integration
 *
 * Provides trading advice based ONLY on extracted trade data and
 * journal history. Does NOT analyze chart patterns.
 */

import type { TradeAdvice, JournalInsight, ExtractedTradeData } from "./types/screenshot-analysis";
import type { Trade } from "@/types";

const MIN_RR_RATIO = 1.0;
const GOOD_RR_RATIO = 1.5;
const EXCELLENT_RR_RATIO = 2.0;

export function generateTradeAdvice(trade: ExtractedTradeData, journalTrades: Trade[] = []): TradeAdvice {
  const points: string[] = [];
  const riskReward = calculateRiskReward(trade);
  const slDistance = calculateSLDistance(trade);
  const rewardExceedsRisk = riskReward !== null && riskReward >= 1.0;
  const tradeStructureHealthy = isTradeStructureHealthy(trade, riskReward);
  const riskLevel = assessRiskLevel(trade, riskReward);

  if (riskReward !== null) {
    if (riskReward >= EXCELLENT_RR_RATIO) points.push(`Excellent risk:reward ratio of 1:${riskReward.toFixed(1)}. The potential reward significantly exceeds the risk.`);
    else if (riskReward >= GOOD_RR_RATIO) points.push(`Good risk:reward ratio of 1:${riskReward.toFixed(1)}. Reward exceeds risk, which is favorable.`);
    else if (riskReward >= MIN_RR_RATIO) points.push(`Acceptable risk:reward ratio of 1:${riskReward.toFixed(1)}. Consider if the potential reward justifies the risk.`);
    else points.push(`Risk:reward ratio of 1:${riskReward.toFixed(1)} is below 1:1. The risk exceeds the potential reward. Consider adjusting your SL or TP.`);
  }

  if (slDistance !== null) {
    if (slDistance < 0.5) points.push("Stop loss is very tight. Be aware of normal market noise potentially stopping you out early.");
    else if (slDistance > 5) points.push("Stop loss distance is wide. Ensure your position size accounts for the larger risk.");
    else points.push("Stop loss distance is within a reasonable range.");
  }

  if (!trade.stopLoss) points.push("No stop loss detected. Always use a stop loss to protect your capital.");
  if (!trade.takeProfit) points.push("No take profit detected. Set a clear target to lock in profits.");

  if (trade.entryPrice && trade.stopLoss && trade.direction) {
    const isValidSL = trade.direction === "buy" ? trade.stopLoss < trade.entryPrice : trade.stopLoss > trade.entryPrice;
    if (!isValidSL) points.push(`Stop loss appears to be on the wrong side of the entry. For a ${trade.direction} trade, SL should be ${trade.direction === "buy" ? "below" : "above"} entry.`);
  }

  if (trade.lotSize !== null && trade.lotSize > 1.0) points.push(`Position size of ${trade.lotSize} lots is relatively large. Ensure this aligns with your risk management rules.`);
  if (points.length === 0) points.push("Basic trade parameters detected. Review all fields before executing.");

  const summary = generateSummary(trade, riskReward, riskLevel, tradeStructureHealthy);
  const journalInsights = generateJournalInsights(trade, journalTrades);

  return { riskReward, summary, points, riskAssessment: { level: riskLevel, slDistance, rewardExceedsRisk, tradeStructureHealthy }, journalInsights };
}

function calculateRiskReward(trade: ExtractedTradeData): number | null {
  if (trade.entryPrice === null || trade.stopLoss === null || trade.takeProfit === null) return null;
  const risk = Math.abs(trade.entryPrice - trade.stopLoss);
  const reward = Math.abs(trade.takeProfit - trade.entryPrice);
  if (risk === 0) return null;
  return Math.round((reward / risk) * 10) / 10;
}

function calculateSLDistance(trade: ExtractedTradeData): number | null {
  if (trade.entryPrice === null || trade.stopLoss === null) return null;
  const distance = Math.abs(trade.entryPrice - trade.stopLoss);
  if (trade.symbol) {
    const sym = trade.symbol.toUpperCase();
    if (sym.includes("JPY")) return Math.round(distance * 100 * 10) / 10;
    if (sym.includes("XAU") || sym.includes("GOLD")) return Math.round(distance * 10 * 10) / 10;
    if (sym.includes("BTC") || sym.includes("ETH")) return Math.round(distance * 100 * 10) / 10;
  }
  return Math.round(distance * 10000 * 10) / 10;
}

function isTradeStructureHealthy(trade: ExtractedTradeData, riskReward: number | null): boolean {
  if (!trade.symbol || !trade.direction || trade.entryPrice === null) return false;
  if (trade.stopLoss === null || trade.takeProfit === null) return false;
  const slCorrect = trade.direction === "buy" ? trade.stopLoss < trade.entryPrice : trade.stopLoss > trade.entryPrice;
  const tpCorrect = trade.direction === "buy" ? trade.takeProfit > trade.entryPrice : trade.takeProfit < trade.entryPrice;
  return slCorrect && tpCorrect && riskReward !== null && riskReward >= MIN_RR_RATIO;
}

function assessRiskLevel(trade: ExtractedTradeData, riskReward: number | null): "low" | "medium" | "high" {
  let riskPoints = 0;
  if (!trade.stopLoss) riskPoints += 3;
  if (!trade.takeProfit) riskPoints += 1;
  if (riskReward !== null && riskReward < 1.0) riskPoints += 2;
  if (riskReward !== null && riskReward < 0.5) riskPoints += 2;
  if (trade.lotSize !== null && trade.lotSize > 1.0) riskPoints += 1;
  if (riskPoints >= 4) return "high";
  if (riskPoints >= 2) return "medium";
  return "low";
}

function generateSummary(trade: ExtractedTradeData, riskReward: number | null, riskLevel: "low" | "medium" | "high", structureHealthy: boolean): string {
  const parts: string[] = [];
  if (structureHealthy && riskReward && riskReward >= GOOD_RR_RATIO) parts.push("Trade structure looks healthy.");
  else if (structureHealthy) parts.push("Trade structure is acceptable.");
  else parts.push("Trade structure needs attention.");
  if (riskReward !== null) parts.push(`Risk:Reward is 1:${riskReward.toFixed(1)}.`);
  if (riskLevel === "low") parts.push("Risk level is low.");
  else if (riskLevel === "medium") parts.push("Risk level is moderate - review carefully.");
  else parts.push("Risk level is high - significant issues detected.");
  return parts.join(" ");
}

function generateJournalInsights(trade: ExtractedTradeData, journalTrades: Trade[]): JournalInsight | null {
  if (!trade.symbol || journalTrades.length === 0) return null;
  const symbol = trade.symbol.toUpperCase();
  const symbolTrades = journalTrades.filter((t) => {
    const tSym = (t.pair || t.symbol || "").toUpperCase();
    return tSym === symbol || (symbol.includes(tSym) && tSym.length >= 3) || (tSym.includes(symbol) && symbol.length >= 3);
  });
  const symbolTradeCount = symbolTrades.length;
  if (symbolTradeCount === 0) {
    return { symbolTradeCount: 0, symbolWinRate: null, mostProfitableSession: null, averageRR: null, matchesSuccessfulBehavior: false, message: `This is your first ${symbol} trade in your journal. Good luck!` };
  }

  const completedTrades = symbolTrades.filter((t) => t.result === "win" || t.result === "loss");
  const wins = completedTrades.filter((t) => t.result === "win").length;
  const symbolWinRate = completedTrades.length > 0 ? Math.round((wins / completedTrades.length) * 100) : null;

  const sessionProfits: Record<string, number> = {};
  for (const t of symbolTrades) {
    if (t.session) sessionProfits[t.session] = (sessionProfits[t.session] || 0) + (typeof t.pnl === "number" ? t.pnl : 0);
  }
  let mostProfitableSession: string | null = null;
  let maxProfit = -Infinity;
  for (const [session, profit] of Object.entries(sessionProfits)) {
    if (profit > maxProfit) { maxProfit = profit; mostProfitableSession = session; }
  }

  const tradesWithRR = symbolTrades.filter((t) => typeof t.riskReward === "number" && t.riskReward > 0);
  const averageRR = tradesWithRR.length > 0 ? Math.round((tradesWithRR.reduce((sum, t) => sum + (t.riskReward || 0), 0) / tradesWithRR.length) * 10) / 10 : null;
  const currentRR = calculateRiskReward(trade);
  const matchesSuccessfulBehavior = (symbolWinRate !== null && symbolWinRate >= 50) || (averageRR !== null && currentRR !== null && currentRR >= averageRR * 0.8);

  const messages: string[] = [];
  messages.push(`This is your ${formatCount(symbolTradeCount)} ${symbol} trade.`);
  if (symbolWinRate !== null) messages.push(`Win rate: ${symbolWinRate}%.`);
  if (mostProfitableSession) messages.push(`Most profitable session: ${mostProfitableSession}.`);
  if (averageRR !== null) messages.push(`Average R:R: ${averageRR.toFixed(1)}.`);
  if (matchesSuccessfulBehavior) messages.push("This trade matches your successful trading behavior.");
  else if (symbolWinRate !== null && symbolWinRate < 40) messages.push("Consider reviewing your strategy for this symbol.");

  return { symbolTradeCount, symbolWinRate, mostProfitableSession, averageRR, matchesSuccessfulBehavior, message: messages.join(" ") };
}

function formatCount(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  switch (n % 10) { case 1: return `${n}st`; case 2: return `${n}nd`; case 3: return `${n}rd`; default: return `${n}th`; }
}

export function ocrResultToExtractedTrade(ocrResult: import("@/services/ocr/types").OCRResult): ExtractedTradeData {
  const trade = ocrResult.trades[0];
  return {
    symbol: trade?.symbol || "",
    direction: trade?.direction || "",
    entryPrice: trade?.entryPrice ?? null,
    stopLoss: trade?.stopLoss ?? null,
    takeProfit: trade?.takeProfit ?? null,
    lotSize: trade?.positionSize ?? null,
    riskPercent: null,
    timeframe: null,
    broker: null,
    date: null,
    time: null,
    orderType: null,
    fieldConfidences: [
      { field: "symbol", value: trade?.symbol || null, confidence: trade?.fieldConfidences?.symbol || 0, status: trade?.symbol ? "detected" : "missing", source: trade?.symbol ? "ocr" : "none" },
      { field: "direction", value: trade?.direction || null, confidence: trade?.fieldConfidences?.direction || 0, status: trade?.direction && trade.direction !== "unknown" ? "detected" : "missing", source: trade?.direction ? "ocr" : "none" },
      { field: "entryPrice", value: trade?.entryPrice ?? null, confidence: trade?.fieldConfidences?.entryPrice || 0, status: trade?.entryPrice !== null ? "detected" : "missing", source: trade?.entryPrice !== null ? "ocr" : "none" },
      { field: "stopLoss", value: trade?.stopLoss ?? null, confidence: trade?.fieldConfidences?.stopLoss || 0, status: trade?.stopLoss !== null ? "detected" : "missing", source: trade?.stopLoss !== null ? "ocr" : "none" },
      { field: "takeProfit", value: trade?.takeProfit ?? null, confidence: trade?.fieldConfidences?.takeProfit || 0, status: trade?.takeProfit !== null ? "detected" : "missing", source: trade?.takeProfit !== null ? "ocr" : "none" },
      { field: "lotSize", value: trade?.positionSize ?? null, confidence: trade?.fieldConfidences?.positionSize || 0, status: trade?.positionSize !== null ? "detected" : "missing", source: trade?.positionSize !== null ? "ocr" : "none" },
    ],
    overallConfidence: ocrResult.overallConfidence,
  };
}
