# TODO

## v2 Features
- [ ] Tool Calling — LangChain `tool()` function use karke
  - `search_knowledge_base` tool — RAG search
  - `check_order_status` tool — DB se order check
  - `createAgent` se LLM khud decide kare kaunsa tool use karna hai
- [ ] Chunking — RecursiveCharacterTextSplitter add karo ingest mein
- [ ] Rate limiting — express-rate-limit
- [ ] Pagination — getAllTickets mein

- [ ] Role based access control (ADMIN, AGENT, USER)

<!-- 7 june 2026 -->

## V1 Remaining
- [ ] Pagination — in progress
- [ ] Rate limiting
- [ ] Redis caching (analytics + tickets)
- [ ] Docker (Node + PostgreSQL + ChromaDB + Redis)
- [ ] README
- [ ] Deploy

## V2 Features
- [ ] Reset password
- [ ] Forgot password  
- [ ] Update account
- [ ] Role based access control (ADMIN, AGENT, USER)
- [ ] Order model + checkOrderStatus tool
- [ ] Chunking — RecursiveCharacterTextSplitter
- [ ] WebSockets — real-time ticket updates
- [ ] Tests — Jest/Vitest