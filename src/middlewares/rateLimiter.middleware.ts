import rateLimit from 'express-rate-limit'
import {RedisStore} from 'rate-limit-redis'
import { redisClient } from '../../lib/redis.js'

// general api rate limiter 
export const apiLimiter = rateLimit({
    windowMs: 15*60*1000, // 15 minutes
    max:100,
    message:"Too many requests, please try again later",
    store: new RedisStore({
        sendCommand:(...args:string[]) => redisClient.sendCommand(args)
    })
})

// login/register rate limiter
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,                    // only 10 attempts allowed
    message: "Too many login attempts, please try again later",
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args)
    })
})