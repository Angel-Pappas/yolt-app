import { z } from "zod";

export const walletSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  starting_balance: z.coerce.number(),
});

export type WalletInput = z.infer<typeof walletSchema>;
