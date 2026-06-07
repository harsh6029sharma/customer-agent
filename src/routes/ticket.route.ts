import { Router } from "express";
import { createTicket,getUserTickets,getTicketById,updateTicketById, getAnalytics, addMessage, getTicketMessages } from "../controllers/ticket.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

// Static routes 
router.route("/analytics").get(verifyJwt, getAnalytics)  // ← upar

// Dynamic routes
router.route("/").post(verifyJwt, createTicket)
router.route("/:ticketId").get(verifyJwt, getTicketById)
router.route("/:ticketId").patch(verifyJwt, updateTicketById)
router.route("/:ticketId/messages").post(verifyJwt, addMessage)
router.route("/:ticketId/messages").get(verifyJwt, getTicketMessages)

// User tickets
router.route("/:id/tickets").get(verifyJwt, getUserTickets)

// router.route("/:id/tickets").get(verifyJwt, getUserTickets)

// router.route("/").post(verifyJwt, createTicket)
// router.route("/:ticketId").get(verifyJwt, getTicketById)
// router.route("/:ticketId").patch(verifyJwt, updateTicketById)
// router.route("/analytics").get(verifyJwt, getAnalytics)
// router.route("/:ticketId/messages").post(verifyJwt, addMessage)
// router.route("/:ticketId/messages").get(verifyJwt, getTicketMessages)

export default router