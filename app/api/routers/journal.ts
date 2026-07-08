import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import {
  createJournalEntry,
  getJournalEntriesByUser,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
} from "../services/journal-service";

export const journalRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return getJournalEntriesByUser(ctx.user.uid);
  }),

  byId: authedQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const entry = await getJournalEntryById(input.id);
      if (!entry || entry.uid !== ctx.user.uid) return null;
      return entry;
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(10000),
        mood: z.enum(["bullish", "bearish", "neutral", "uncertain"]),
        tags: z.array(z.string().max(50)).max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createJournalEntry(ctx.user.uid, input);
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).max(10000).optional(),
        mood: z.enum(["bullish", "bearish", "neutral", "uncertain"]).optional(),
        tags: z.array(z.string().max(50)).max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateJournalEntry(id, ctx.user.uid, data);
    }),

  delete: authedQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return deleteJournalEntry(input.id, ctx.user.uid);
    }),
});
