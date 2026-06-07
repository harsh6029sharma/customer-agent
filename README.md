# Customer Agent

A backend project I built to explore how LLMs can be integrated into real customer support workflows instead of being used as simple chatbots.

The idea was to create a system that can automatically classify support tickets, decide where information should come from (knowledge base or database), and generate a suggested response for support teams.

---

## Why I Built This

Most AI projects online are just wrappers around ChatGPT.

I wanted to build something closer to a real SaaS product where AI is part of the backend workflow.

Some questions I wanted to explore:

* How can an LLM automatically classify support requests?
* When should the system use RAG instead of querying the database?
* How can support teams save time on repetitive tickets?
* How can AI fit into an existing backend architecture?

---
## What It Does

When a customer submits a support ticket:

1. The ticket is validated using Zod.
2. The AI classifies the ticket category and priority.
3. The system decides how to handle the request:
   * Technical questions go through the knowledge base (RAG).
   * User-specific questions fetch data from PostgreSQL.
4. A draft response is generated.
5. Everything is stored in PostgreSQL.

Example:

Customer:
> My API keeps returning a 401 error.

The system:
* Detects it as a technical issue
* Searches the internal documentation
* Retrieves relevant context
* Generates a suggested response

---

## How It Works

\```
POST /api/v1/tickets
        │
        ▼
Zod Validation
        │
        ▼
LLM Classification (category + priority)
        │
        ▼
LangChain Agent
├── Tool 1: search_knowledge_base → ChromaDB
└── Tool 2: check_user_data → PostgreSQL
        │
        ▼
Draft Reply → Saved to DB
\```

## Tech Stack

* Node.js
* TypeScript
* Express
* PostgreSQL
* Prisma ORM
* Redis
* ChromaDB
* LangChain
* Groq LLM
* HuggingFace Embeddings
* Zod
* JWT Authentication
* Docker

---

## Project Structure

```text
customer-agent/
├── src/
├── prisma/
├── lib/
├── docs/
├── chroma_db/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## API Endpoints

### Authentication

```http
POST /api/v1/users/register
POST /api/v1/users/login
POST /api/v1/users/logout
```

### Tickets

```http
POST   /api/v1/tickets
GET    /api/v1/tickets/my-tickets
GET    /api/v1/tickets/:ticketId
PATCH  /api/v1/tickets/:ticketId
```

### Messages

```http
POST /api/v1/tickets/:ticketId/messages
GET  /api/v1/tickets/:ticketId/messages
```

---

## Running Locally

Clone the repository:

```bash
git clone https://github.com/harsh6029sharma/customer-agent
cd customer-agent
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

---

## Things I Learned

While building this project I got hands-on experience with:

* Prisma relations
* PostgreSQL schema design
* JWT authentication
* LangChain agents
* Retrieval-Augmented Generation (RAG)
* Vector databases
* AI tool calling
* Backend project structuring
* Docker basics

---

## Future Improvements

Some things I still want to add:

* Role-based access control
* Better document chunking for RAG
* Order tracking tools
* Unit and integration tests
* Structured logging
* Frontend dashboard

---

## Notes

This project is mainly focused on backend engineering and AI integration. The goal wasn't to build a chatbot, but to explore how LLMs can become part of a larger backend system and automate parts of a customer support workflow.
