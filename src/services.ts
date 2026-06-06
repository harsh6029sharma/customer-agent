import { ChatGroq } from "@langchain/groq"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"
import { searchDocs } from "./rag/search.js"
import { createAgent } from 'langchain'
import { tool } from "@langchain/core/tools"
import * as z from 'zod'
import { prisma } from "../lib/prisma.js"

// llm
const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3.1-8b-instant",
    temperature: 0
})

// parser
const parser = new JsonOutputParser()


// Tool 1 : RAG search
const searchKnowledgeBase = tool(
    async ({ query }: { query: string }) => {
        const result = await searchDocs(query)
        return result
    },
    {
        name: "search_knowledge_base",
        description: "Search internal docs for policies, technical issues, FAQs",
        schema: z.object({
            query: z.string().describe("Search query")
        })
    }
)


// Tool 2 : DB check
const checkUserData = tool(
    async ({ userId }: { userId: number }) => {
        const tickets = await prisma.ticket.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 5
        })

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        return JSON.stringify({ user, recentTickets: tickets })
    },
    {
        name: "check_user_data",
        description: "Fetch user information and recent tickets from database when customer asks about their account, orders, or past issues",
        schema: z.object({
            userId: z.number().describe("User ID")
        })
    }
)

const agent = createAgent({
    model: "groq:llama-3.3-70b-versatile",
    tools: [searchKnowledgeBase, checkUserData]
})


// step 1 : classify
const classifyPrompt = ChatPromptTemplate.fromTemplate(`
You are a customer support AI.
Analyze this support ticket and return JSON with 3 fields:
1. category: PAYMENT | ACCOUNT | TECHNICAL | SHIPPING | OTHER
2. priority: LOW | MEDIUM | HIGH

Ticket: "{description}"

Return ONLY JSON:
{{"category":"PAYMENT","priority":"HIGH","suggestedReply":"Dear customer, we sincerely apologize for the inconvenience..."}}
`)

const classifyChain = classifyPrompt.pipe(llm).pipe(parser)


// step2 : RAG reply prompt
const ragReplyPrompt = ChatPromptTemplate.fromTemplate(`
    You are a customer support AI.
Use the following internal documentation to answer the customer's ticket.

Documentation:
{context}

Customer Ticket: "{description}"

Draft a professional and empathetic reply based on the documentation.
Return ONLY JSON:
{{"suggestedReply":"your reply here"}}
`)

const ragReplyChain = ragReplyPrompt.pipe(llm).pipe(parser)


// step 3 : direct reply 
const directReplyPrompt = ChatPromptTemplate.fromTemplate(`
    You are a customer support AI.
Draft a professional and empathetic reply for this ticket.

Customer Ticket: "{description}"

Return ONLY JSON:
{{"suggestedReply":"your reply here"}}
`)

const directReplyChain = directReplyPrompt.pipe(llm).pipe(parser)


export const analyzeTicket = async (description: string, userId: number) => {

    // step 1 : classify
    const classified = await classifyChain.invoke({ description }) as any
    const { category, priority } = classified

    // Step 2 — Agent decide karega kaunsa tool use karna hai
    console.log(`Agent routing for category: ${category}`)

    // Routing
    const agentResult = await agent.invoke({
        messages: [{
            role: "user",
            content: `You are a customer support AI.
            Use the available tools to find relevant information and draft a professional reply.
            Customer userId: ${userId}
            Ticket: "${description}"
            If customer asks about their account or tickets, use check_user_data tool.`
        }]
    })

    const lastMessage = agentResult.messages[agentResult.messages.length - 1]
    const suggestedReply = lastMessage?.content
    return JSON.stringify({ category, priority, suggestedReply })
}