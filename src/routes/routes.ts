import { Router } from "express";
import { createTicket,getUserTickets,getTicketById,registerUser,updateTicketById, getAnalytics, addMessage, getTicketMessages } from "../controllers/controllers.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/:id/tickets").get(getUserTickets)

router.route("/tickets").post(createTicket)
router.route("/tickets/:ticketId").get(getTicketById)
router.route("/tickets/:ticketId").patch(updateTicketById)
router.route("/analytics").get(getAnalytics)
router.route("/tickets/:ticketId/messages").post(addMessage)
router.route("/tickets/:ticketId/messages").get(getTicketMessages)

export default router