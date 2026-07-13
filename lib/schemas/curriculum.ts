import { z } from 'zod';

export const answerSchema = z.object({
  slideIndex: z.coerce.number().int().min(0),
  answer: z.string().min(1).trim(),
});

export type AnswerSchema = z.infer<typeof answerSchema>;
