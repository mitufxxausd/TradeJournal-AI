import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTrades } from "@/hooks/use-trades";
import { useAuth } from "@/contexts/AuthContext";
import {
  toggleFavorite,
  toggleArchive,
  duplicateTrade,
  deleteTrade,
} from "@/lib/firestore";
import type { Trade, TradeSort, Market, Direction } from "@/types/trade";
import { toast } from "sonner";
import {
  Search, Plus, ArrowUpDown, Star, Archive, Copy, Trash2, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, TrendingUp, Filter, X,
} from "lucide-react";

type StatusFilter = "all" | "open" | "closed" | "breakeven" | "win" | "loss";

export default function Trades() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TradeSort>({ field: "tradeDate", direction: "desc" });
  const [marketFilter, setMarketFilter] = useState<Market | "all">("all");
  const [directionFilter, setDirectionFilter] = useState<Direction | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Build filters object for the hook
  const filters = useMemo(
    () => ({
      search: search || undefined,
      market: marketFilter !== "all" ? marketFilter : undefined,
      direction: directionFilter !== "all" ? directionFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
    [search, marketFilter, directionFilter, statusFilter]
  );

  const { trades, loading, refresh } = useTrades({
    userId: user?.uid,
    filters,
    sort,
  });

  const handleDelete = async (trade: Trade) => {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    if (!user?.uid) return;
    try {
      await deleteTrade(user.uid, trade.id);
      toast.success("Trade deleted");
      refresh();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleFavorite = async (trade: Trade) => {
    if (!user?.uid) return;
    try {
      await toggleFavorite(user.uid, trade.id, trade.isFavorite);
      toast.success(trade.isFavorite ? "Removed from favorites" : "Added to favorites");
      refresh();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleArchive = async (trade: Trade) => {
    if (!user?.uid) return;
    try {
      await toggleArchive(user.uid, trade.id, trade.isArchived);
      toast.success(trade.isArchived ? "Unarchived" : "Archived");
      refresh();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDuplicate = async (trade: Trade) => {
    if (!user?.uid) return;
    try {
      await duplicateTrade(user.uid, trade.id);
      toast.success("Trade duplicated");
      refresh();
    } catch {
      toast.error("Failed to duplicate");
    }
  };

  const toggleSort = (field: "tradeDate" | "profit" | "rr") => {
    setSort((prev: TradeSort) => ({
      field: field as TradeSort["field"],
      direction: prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const activeFiltersCount = [marketFilter !== "all", directionFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trades</h1>
            <p className="text-muted-foreground">{trades.length} trades</p>
          </div>
          <Button onClick={() => navigate("/trades/new")}>
            <Plus className="mr-2 h-4 w-4" />Add Trade
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by pair, strategy, broker, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">{activeFiltersCount}</Badge>
            )}
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Market</label>
                  <Select value={marketFilter} onValueChange={(v) => setMarketFilter(v as Market | "all")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Markets</SelectItem>
                      {["Forex", "Crypto", "Stocks", "Futures", "Options"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Direction</label>
                  <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as Direction | "all")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Directions</SelectItem>
                      <SelectItem value="Buy">Buy</SelectItem>
                      <SelectItem value="Sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="breakeven">Breakeven</SelectItem>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={() => { setMarketFilter("all"); setDirectionFilter("all"); setStatusFilter("all"); }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sort bar */}
        <div className="flex flex-wrap gap-2">
          {([
            { field: "tradeDate" as const, label: "Date" },
            { field: "profit" as const, label: "P&L" },
            { field: "rr" as const, label: "R:R" },
          ]).map((s) => (
            <Button key={s.field} variant={sort.field === s.field ? "secondary" : "ghost"} size="sm" onClick={() => toggleSort(s.field)}>
              {s.label} <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          ))}
        </div>

        {/* Trades List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12" /></CardContent></Card>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No trades found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {search || activeFiltersCount > 0 ? "Try adjusting your search or filters" : "Start by adding your first trade"}
              </p>
              <Button onClick={() => navigate("/trades/new")}><Plus className="mr-2 h-4 w-4" />Add Trade</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {trades.map((trade) => (
              <Card key={trade.id} className={`hover:shadow-md transition-all cursor-pointer ${trade.isPinned ? "border-primary" : ""} ${trade.isArchived ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* P&L indicator */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      (trade.profitLoss || 0) > 0 ? "bg-green-100 text-green-600" : (trade.profitLoss || 0) < 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                    }`}>
                      {(trade.profitLoss || 0) > 0 ? <ArrowUpRight className="h-5 w-5" /> : (trade.profitLoss || 0) < 0 ? <ArrowDownRight className="h-5 w-5" /> : <span className="text-sm">=</span>}
                    </div>

                    {/* Trade info */}
                    <div className="flex-1 min-w-0" onClick={() => navigate(`/trades/${trade.id}`)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{trade.pair}</span>
                        <Badge variant={trade.direction === "Buy" ? "default" : "secondary"} className="text-xs">{trade.direction}</Badge>
                        <Badge variant="outline" className="text-xs">{trade.market}</Badge>
                        {trade.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                        {trade.isPinned && <Badge variant="default" className="text-xs bg-primary">Pinned</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                        <span>{trade.strategy}</span>
                        <span>•</span>
                        <span>{trade.timeframe}</span>
                        <span>•</span>
                        <span>{trade.tradeDate}</span>
                        {trade.broker && <><span>•</span><span>{trade.broker}</span></>}
                      </div>
                      {trade.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {trade.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                          {trade.tags.length > 3 && <Badge variant="secondary" className="text-[10px]">+{trade.tags.length - 3}</Badge>}
                        </div>
                      )}
                    </div>

                    {/* P&L amount */}
                    <div className="text-right shrink-0" onClick={() => navigate(`/trades/${trade.id}`)}>
                      <p className={`font-semibold ${(trade.profitLoss || 0) > 0 ? "text-green-600" : (trade.profitLoss || 0) < 0 ? "text-red-600" : ""}`}>
                        {trade.profitLoss && trade.profitLoss > 0 ? "+" : ""}${(trade.profitLoss || 0).toFixed(2)}
                      </p>
                      {trade.rrRatio && <p className="text-xs text-muted-foreground">R:R {trade.rrRatio.toFixed(1)}</p>}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleFavorite(trade)}>
                          <Star className={`mr-2 h-4 w-4 ${trade.isFavorite ? "fill-amber-400" : ""}`} /> {trade.isFavorite ? "Unfavorite" : "Favorite"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/trades/${trade.id}/edit`)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(trade)}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(trade)}><Archive className="mr-2 h-4 w-4" /> {trade.isArchived ? "Unarchive" : "Archive"}</DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem onClick={() => handleDelete(trade)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
