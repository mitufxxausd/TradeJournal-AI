import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getUserByUid, updateUserProfile } from "../services/user-service";

export const userRouter = createRouter({
  me: authedQuery.query(async ({ ctx }) => {
    const user = await getUserByUid(ctx.user.uid);
    return user;
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        displayName: z.string().min(1).max(100).optional(),
        photoURL: z.string().url().optional(),
        subscription: z.string().optional(),
        plan: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.uid, input);
      return { success: true };
    }),
});
