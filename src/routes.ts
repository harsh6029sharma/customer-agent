import { Router } from "express";
import { createTicket,registerUser } from "./controllers";

const router = Router()

router.route("/register").post(registerUser)
router.route("/tickets").post(createTicket)

export default router