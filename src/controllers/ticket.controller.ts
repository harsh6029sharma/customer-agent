import { type Request, type Response } from "express"
import { prisma } from "../../lib/prisma.js"
import { createTicketSchema, TicketAnalysisSchema } from "../schemas/zod.schemas.js"
import { analyzeTicket } from "../services/ai.service.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const createTicket = asyncHandler(async (req: Request, res: Response) => {

    const ticketValidationData = createTicketSchema.parse(req.body)

    const decodedToken = req.user

    console.log(decodedToken)


    const aiResult = await analyzeTicket(ticketValidationData.description, decodedToken?.id)

    if (!aiResult) {
        throw new ApiError(400, "AI doesn't response")
    }

    const parsedAiResult = JSON.parse(aiResult)

    console.log(parsedAiResult);

    // now validate ai response from zod
    const validateAiResult = TicketAnalysisSchema.parse(parsedAiResult!)

    console.log(validateAiResult);

    const ticket = await prisma.ticket.create({
        data: {
            userId: decodedToken.id,
            title: ticketValidationData.title,
            description: ticketValidationData.description,

            category: validateAiResult.category,
            priority: validateAiResult.priority,
            suggestedReply: validateAiResult.suggestedReply
        }
    })

    return res.status(201).json(
        new ApiResponse(201, ticket, "ticket created successfully")
    )

})


const getUserTickets = asyncHandler(async (req: Request, res: Response) => {

    const decodedToken = req.user
    const userId = decodedToken?.id

    const tickets = await prisma.ticket.findMany({
        where: {
            userId: userId
        }
    })
    console.log(tickets);

    if (tickets.length === 0) {
        throw new ApiError(404, "No tickets found")
    }

    return res.status(200).json(
        new ApiResponse(200, tickets, "ticket fetched successfully")
    )

})


const getTicketById = asyncHandler(async (req: Request, res: Response) => {

    const ticketId = String(req.params.ticketId)

    console.log(ticketId);

    const ticket = await prisma.ticket.findUnique({
        where: {
            id: ticketId
        }
    })

    if (!ticket) {
        throw new ApiError(404, "Ticket not found")
    }

    console.log(ticket);


    return res.status(200).json(
        new ApiResponse(200, ticket, "ticket fetched successfully")
    )

})


const updateTicketById = asyncHandler(async (req: Request, res: Response) => {
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


    return res.status(200).json(
        new ApiResponse(200, updatedTicket, "ticket updated successfully")
    )
})

const getAnalytics = asyncHandler(async (req: Request, res: Response) => {

    const decodedToken = req.user
    const userId = decodedToken?.id
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })

    if (!user) {
        throw new ApiError(404, "User not loggedin")
    }

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

    console.log("analytics for user:", user);

    return res.status(200).json(
        new ApiResponse(200,
            {
                totalTickets,
                byCategory: Object.fromEntries(byCategory.map(c => [c.category ?? "UNKNOWN", c._count])),
                byPriority: Object.fromEntries(byPriority.map(p => [p.priority ?? "UNKNOWN", p._count])),
                byStatus: Object.fromEntries(byStatus.map(s => [s.status ?? "UNKNOWN", s._count]))
            },
            "dashboard analytics fetched successfully"
        )
    )

})


const addMessage = asyncHandler(async (req: Request, res: Response) => {
    
    const ticketId = String(req.params.ticketId)

    const { message, sender } = req.body

    // find ticket in db
    const ticket = await prisma.ticket.findUnique({
        where: {
            id: ticketId
        }
    })

    if (!ticket) {
        throw new ApiError(404, "Ticket not found")
    }

    const newMessage = await prisma.ticketMessage.create({
        data: {
            ticketId,
            message,
            sender
        }
    })

    return res.status(201).json(
        new ApiResponse(201, newMessage, "ticket message added successfully")
    )
})

const getTicketMessages = asyncHandler(async (req: Request, res: Response) => {
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

    return res.status(200).json(
        new ApiResponse(200, messages, "messages fetched successfully")
    )
})


export {
    createTicket,
    getUserTickets,
    getTicketById,
    updateTicketById,
    getAnalytics,
    addMessage,
    getTicketMessages
}