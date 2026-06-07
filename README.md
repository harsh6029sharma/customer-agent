# customer-agent
npx prisma migrate dev --name init
npx prisma generate
npx prisma migrate reset

fb:Gabija Stirbytė

<!-- to start chroma server -->
/home/harsh/.local/bin/chroma run --path ./chroma_db


<!-- project structure -->

src/
├── controllers/
│   ├── user.controller.ts
│   └── ticket.controller.ts
├── services/
│   ├── ai.service.ts          ← analyzeTicket logic
│   └── ticket.service.ts      ← DB operations
├── routes/
│   └── index.ts
├── middlewares/
│   └── auth.middleware.ts
├── rag/
│   ├── embeddings.ts
│   ├── ingest.ts
│   └── search.ts
├── utils/
│   ├── ApiError.ts
│   ├── ApiResponse.ts
│   ├── asyncHandler.ts
│   └── helpers.ts             ← hashPassword, checkPassword, generateTokens
├── schemas/
│   └── zod.schemas.ts
├── lib/
│   └── prisma.ts
└── server.ts