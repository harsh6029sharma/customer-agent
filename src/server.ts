import express from 'express'
import type { Request,Response } from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(express.json({strict:true}))
app.use(express.urlencoded({extended:true, limit:'16kb'}))
app.use(express.static('public'))
app.use(cookieParser())

const PORT = process.env.PORT||3000

app.get("/", (req:Request,res:Response)=>{
    res.send("hello world")
})

app.listen(PORT, ()=>{
    console.log(`Server is listening on port:${PORT}`)
})