import z from "zod";

export const productSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).max(10),
  instruction: z.string().default(""),
});
