import * as z from 'zod'

export const createUserSchema = z.object({
    email:z.string(),
    name:z.string()
})

export const createTicketSchema = z.object({
    userId:z.number(),
    title:z.string(),
    description:z.string(),
    status:z.string()
})

export const TicketAnalysisSchema = z.object({
  category: z.enum([
    "PAYMENT",
    "ACCOUNT",
    "TECHNICAL",
    "SHIPPING",
    "OTHER"
  ]),
  priority: z.enum([
    "LOW",
    "MEDIUM",
    "HIGH"
  ])
});