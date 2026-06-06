import { Router } from "express";
import { createTicket,getUserTickets,getTicketById,registerUser,updateTicketById, getAnalytics } from "./controllers";

const router = Router()

router.route("/register").post(registerUser)
router.route("/:id/tickets").get(getUserTickets)

router.route("/tickets").post(createTicket)
router.route("/tickets/:ticketId").get(getTicketById)
router.route("/tickets/:ticketId").patch(updateTicketById)
router.route("/analytics").get(getAnalytics)

export default router