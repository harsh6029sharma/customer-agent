import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true, limit:'16kb'}))
app.use(express.static('public'))
app.use(cookieParser())  

const PORT = process.env.PORT||3000

import userRouterV1 from './routes/user.route.js'
import ticketRouterV1 from './routes/ticket.route.js'
import { ingestDocs } from './rag/ingest.js'

app.use("/api/v1/users", userRouterV1)
app.use("/api/v1/tickets", ticketRouterV1)

app.listen(PORT, async()=>{
    await ingestDocs()
    console.log(`Server is listening on port:${PORT}`)
})
