import { type Request, type Response } from "express"
import { prisma } from "../lib/prisma.js"
import { createUserSchema, createTicketSchema, TicketAnalysisSchema } from "./zod_schemas.js"
import { analyzeTicket } from "./services.js"

const registerUser = async (req: Request, res: Response) => {
    try {

        const validatedData = createUserSchema.parse(req.body)
        // check if this user already exist or not 
        const existedUser = await prisma.user.findUnique({
            where: {
                email: validatedData.email
            }
        })

        if (existedUser) {
            throw new Error("user already exist with this email")
        }

        const user = await prisma.user.create({
            data: {
                // ensure password field exists for Prisma create input
                ...validatedData as any,
                password: (validatedData as any).password ?? ""
            }
        })

        return res.status(201).json({
            message: "user created successfully",
            data: user
        })


    } catch (error) {
        return res.status(400).json({
            message: "user does not created successfully"
        })
    }

}

const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        //check if user exist or not
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if (!user) {
            throw new Error("user not found")
        }

        return res.status(200).json({
            message: "login successful",
            data: user
        })
    } catch (error) {
        return res.status(400).json({
            message: "login failed"
        })
    }
}

const createTicket = async (req: Request, res: Response) => {
    try {
        const ticketValidationData = createTicketSchema.parse(req.body)

        const aiResult = await analyzeTicket(ticketValidationData.description, ticketValidationData.userId)
        const parsedAiResult = JSON.parse(aiResult!)

        console.log(parsedAiResult);
        // now validate ai response from zod
        const validateAiResult = TicketAnalysisSchema.parse(parsedAiResult!)
        console.log(validateAiResult);

        const ticket = await prisma.ticket.create({
            data: {
                userId: ticketValidationData.userId,
                title: ticketValidationData.title,
                description: ticketValidationData.description,

                category: validateAiResult.category,
                priority: validateAiResult.priority,
                suggestedReply: validateAiResult.suggestedReply
            }
        })


        return res.status(201).json({
            message: "ticket created successfully",
            ticket: ticket
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "ticket does not created successfully"
        })
    }
}

const getUserTickets = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.id)

        const tickets = await prisma.ticket.findMany({
            where: {
                userId: userId
            }
        })
        console.log(tickets);

        if (tickets.length === 0) {
            return res.status(404).json({
                message: "No tickets found"
            });
        }

        return res.status(200).json({
            message: "tickets fetched successfully!",
            tickets: tickets
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred"
        return res.status(401).json({
            message
        })
    }
}

// fetch single ticket
const getTicketById = async (req: Request, res: Response) => {
    try {
        const ticketId = String(req.params.ticketId)
        console.log(ticketId);

        const ticket = await prisma.ticket.findUnique({
            where: {
                id: ticketId
            }
        })
        console.log(ticket);

        return res.status(200).json({
            message: "ticket fetched successfully!",
            ticket: ticket
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred"
        return res.status(401).json({
            message
        })
    }
}

const updateTicketById = async (req: Request, res: Response) => {
    try {
        const ticketId = String(req.params.ticketId)
        const { status } = req.body
        // console.log(status);
        // console.log(ticketId);
        const updatedTicket = await prisma.ticket.update({
            where: {
                id: ticketId
            },
            data: {
                status
            }
        })

        return res.status(201).json({
            message: "ticket updated successfully",
            updateTicket: updatedTicket
        })
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            message: "something went wrong while updating ticket"
        })
    }
}

// for dashboard
const getAnalytics = async (req: Request, res: Response) => {
    try {

        const [totalTickets, byCategory, byPriority, byStatus] = await Promise.all([

            // total tickets
            prisma.ticket.count(),

            prisma.ticket.groupBy({
                by: ["category"],
                _count: true
            }),

            prisma.ticket.groupBy({
                by: ["priority"],
                _count: true
            }),

            prisma.ticket.groupBy({
                by: ["status"],
                _count: true
            })
        ])

        return res.status(200).json({
            totalTickets,
            byCategory: Object.fromEntries(byCategory.map(c => [c.category ?? "UNKNOWN", c._count])),
            byPriority: Object.fromEntries(byPriority.map(p => [p.priority ?? "UNKNOWN", p._count])),
            byStatus: Object.fromEntries(byStatus.map(s => [s.status ?? "UNKNOWN", s._count]))
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        return res.status(500).json({ message })
    }
}

const addMessage = async (req: Request, res: Response) => {
    try {
        const ticketId = String(req.params.ticketId)

        const { message, sender } = req.body

        // find ticket in db
        const ticket = await prisma.ticket.findUnique({
            where: {
                id: ticketId
            }
        })

        if (!ticket) {
            return res.status(404).json({
                message: "ticket not found"
            })
        }

        const newMessage = await prisma.ticketMessage.create({
            data: {
                ticketId,
                message,
                sender
            }
        })

        return res.status(201).json({
            message: "ticket message added successfully",
            ticketMessage: newMessage
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error"
        return res.status(500).json({ message })
    }
}


const getTicketMessages = async (req: Request, res: Response) => {
    try {
        const ticketId = String(req.params.ticketId)

        // find messages
        const messages = await prisma.ticketMessage.findMany({
            where: {
                ticketId: ticketId
            },
            orderBy: {
                createdAt: "asc"
            }
        })

        return res.status(200).json({
            message: "messages fetched successfully",
            ticketMessages: messages
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "unkown"
        return res.status(500).json({
            message
        })
    }
}



export {
    registerUser,
    createTicket,
    getUserTickets,
    getTicketById,
    updateTicketById,
    getAnalytics,
    addMessage,
    getTicketMessages
}