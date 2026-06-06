import { ChatGroq } from "@langchain/groq"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"
import { searchDocs } from "./rag/search.js"

// llm
const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3.1-8b-instant",
    temperature: 0
})

// parser
const parser = new JsonOutputParser()


// step 1 : classify
const classifyPrompt = ChatPromptTemplate.fromTemplate(`
You are a customer support AI.
Analyze this support ticket and return JSON with 3 fields:
1. category: PAYMENT | ACCOUNT | TECHNICAL | SHIPPING | OTHER
2. priority: LOW | MEDIUM | HIGH
3. suggestedReply: A professional and empathetic reply to the customer

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


export const analyzeTicket = async (description: string) => {
    const classified = await classifyChain.invoke({description}) as any

    const {category, priority} = classified

    let suggestedReply = ""

    // Routing
    if(category === "TECHNICAL" || category === "SHIPPING" || category === "ACCOUNT"){
        console.log(`RAG search for category:${category}`);
        const context = await searchDocs(description)   

        const result = await ragReplyChain.invoke({context,description}) as any
        suggestedReply = result.suggestedReply

    }else{
        console.log(`Direct reply for category:${category}`);
        const result = await directReplyChain.invoke({description}) as any
        suggestedReply = result.suggestedReply
    }

    return JSON.stringify({category,priority, suggestedReply})
}