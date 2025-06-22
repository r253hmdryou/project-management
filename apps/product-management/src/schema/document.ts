import z from "zod";

export const documentSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  content: z.string(),
  instruction: z.string().default(""),
});
