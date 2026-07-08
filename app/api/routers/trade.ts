import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import {
  createTrade,
  getTradesByUser,
  getTradeById,
  updateTrade,
  deleteTrade,
  getTradeStats,
} from "../services/trade-service";

export const tradeRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return getTradesByUser(ctx.user.uid);
  }),

  byId: authedQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const trade = await getTradeById(input.id);
      if (!trade || trade.uid !== ctx.user.uid) return null;
      return trade;
    }),

  create: authedQuery
    .input(
      z.object({
        asset: z.string().min(1).max(50),
        type: z.enum(["BUY", "SELL"]),
        entryPrice: z.number().positive(),
        quantity: z.number().positive(),
        stopLoss: z.number().positive().optional(),
        takeProfit: z.number().positive().optional(),
        strategy: z.string().max(200).optional(),
        notes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createTrade(ctx.user.uid, input);
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.string(),
        exitPrice: z.number().positive().optional(),
        status: z.enum(["open", "closed"]).optional(),
        notes: z.string().max(2000).optional(),
        strategy: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateTrade(id, ctx.user.uid, data);
    }),

  delete: authedQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return deleteTrade(input.id, ctx.user.uid);
    }),

  stats: authedQuery.query(async ({ ctx }) => {
    return getTradeStats(ctx.user.uid);
  }),
});
