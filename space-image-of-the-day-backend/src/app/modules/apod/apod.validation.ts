import { z } from "zod";

const getApodSchema = z.object({
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
  }),
});

export const ApodValidation = {
  getApodSchema,
};
