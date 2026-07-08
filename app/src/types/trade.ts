export type Market = "Forex" | "Crypto" | "Stocks" | "Futures" | "Options";
export type Direction = "Buy" | "Sell";
export type Session = "London" | "New York" | "Tokyo" | "Sydney" | "Asian" | "European" | "American" | "Other";
export type TradeStatus = "open" | "closed" | "breakeven" | "win" | "loss";

export interface TradePsychology {
  before: {
    confidence: number;
    stressLevel: number;
    emotion: string;
    focusLevel: number;
    sleepQuality: number;
  };
  during: {
    fear: number;
    greed: number;
    patience: number;
    discipline: number;
  };
  after: {
    emotion: string;
    mistakes: string;
    lessonsLearned: string;
  };
}

export interface TradeChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface TradeScreenshot {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
}

export interface Trade {
  id: string;
  userId: string;
  pair: string;
  market: Market;
  direction: Direction;
  broker: string;
  account: string;
  strategy: string;
  setupName: string;
  timeframe: string;
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  exitPrice: number | null;
  positionSize: number;
  riskPercent: number | null;
  rrRatio: number | null;
  commission: number;
  swap: number;
  profitLoss: number | null;
  currency: string;
  tradeDate: string;
  entryTime: string;
  exitTime: string | null;
  session: Session;
  status: TradeStatus;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  psychology: TradePsychology | null;
  checklist: TradeChecklistItem[];
  screenshots: TradeScreenshot[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeInput {
  pair?: string;
  market?: Market;
  direction?: Direction;
  broker?: string;
  account?: string;
  strategy?: string;
  setupName?: string;
  timeframe?: string;
  entryPrice?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  exitPrice?: number | null;
  positionSize?: number;
  riskPercent?: number | null;
  rrRatio?: number | null;
  commission?: number;
  swap?: number;
  profitLoss?: number | null;
  currency?: string;
  tradeDate?: string;
  entryTime?: string;
  exitTime?: string | null;
  session?: Session;
  status?: TradeStatus;
  isFavorite?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[];
  psychology?: TradePsychology;
  checklist?: TradeChecklistItem[];
  screenshots?: TradeScreenshot[];
  notes?: string;
}

export interface TradeFilters {
  search: string;
  dateRange: { from: string | null; to: string | null };
  market: Market | "all";
  direction: Direction | "all";
  status: TradeStatus | "all";
  strategy: string;
  session: Session | "all";
  broker: string;
  tags: string[];
  minProfit: number | null;
  maxProfit: number | null;
  minRisk: number | null;
  maxRisk: number | null;
  archived: boolean | null;
}

export type SortField = "tradeDate" | "profit" | "rr" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface TradeSort {
  field: SortField;
  direction: SortDirection;
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netPnl: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  avgRr: number;
  bestTrade: number;
  worstTrade: number;
  avgTradeDuration: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  maxDrawdown: number;
}

export interface MonthlyPerformance {
  month: string;
  profit: number;
  trades: number;
  wins: number;
}

export interface StrategyPerformance {
  strategy: string;
  trades: number;
  wins: number;
  winRate: number;
  profit: number;
  avgRr: number;
}

export interface UserSettings {
  defaultCurrency?: string;
  defaultMarket?: Market;
  defaultSession?: Session;
  defaultTags?: string[];
  defaultChecklist?: TradeChecklistItem[];
  defaultBroker?: string;
  defaultAccount?: string;
  riskPerTrade?: number;
  theme?: "light" | "dark" | "system";
}
