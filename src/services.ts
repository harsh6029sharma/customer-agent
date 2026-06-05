import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
})

export const analyzeTicket = async (description: string) => {
    const prompt = `
You are a customer support classifier.

Classify the ticket into:

Category:
- PAYMENT
- ACCOUNT
- TECHNICAL
- SHIPPING
- OTHER

Priority:
- LOW
- MEDIUM
- HIGH

Ticket:
"${description}"

Return ONLY JSON.

Example:
{
  "category":"PAYMENT",
  "priority":"HIGH"
}
`;

    const response = await ai.models.generateContent({
        model:"gemini-3.5-flash",
        contents:prompt
    })

    return response.text
}