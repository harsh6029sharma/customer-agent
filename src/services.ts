import { ChatGroq } from "@langchain/groq"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"

const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3.1-8b-instant",
    temperature: 0
})

const parser = new JsonOutputParser()

const prompt = ChatPromptTemplate.fromTemplate(`
You are a customer support AI.
Analyze this support ticket and return JSON with 3 fields:
1. category: PAYMENT | ACCOUNT | TECHNICAL | SHIPPING | OTHER
2. priority: LOW | MEDIUM | HIGH
3. suggestedReply: A professional and empathetic reply to the customer

Ticket: "{description}"

Return ONLY JSON:
{{"category":"PAYMENT","priority":"HIGH","suggestedReply":"Dear customer, we sincerely apologize for the inconvenience..."}}
`)

const chain = prompt.pipe(llm).pipe(parser)

export const analyzeTicket = async (description: string) => {
    const result = await chain.invoke({ description })
    return JSON.stringify(result)
}

