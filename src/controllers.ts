import { type Request, type Response } from "express"
import { prisma } from "../lib/prisma"
import { createUserSchema, createTicketSchema, TicketAnalysisSchema } from "./zod_schemas"
import { analyzeTicket } from "./services"


// interface User{
//     email:string
//     name:string
// }

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
            data: validatedData
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

const createTicket = async (req: Request, res: Response) => {
    try {
        const ticketValidationData = createTicketSchema.parse(req.body)

        const aiResult = await analyzeTicket(ticketValidationData.description)
        const parsedAiResult = JSON.parse(aiResult!)
        console.log(aiResult);
        console.log(parsedAiResult);
        // now validate ai response from zod
        const validateAiResult = TicketAnalysisSchema.parse(parsedAiResult!)
        console.log(validateAiResult);
        const ticket = await prisma.ticket.create({
            data: {
                userId: ticketValidationData.userId,
                title: ticketValidationData.title,
                description: ticketValidationData.description,

                category:validateAiResult.category,
                priority:validateAiResult.priority,

                status: "OPEN",  //default
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


export {
    registerUser,
    createTicket
}