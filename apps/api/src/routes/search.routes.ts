import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { conversationRepository } from "../repositories/conversation.repository";
import { messageRepository } from "../repositories/message.repository";
import { userRepository } from "../repositories/user.repository";
import { authService } from "../services/auth.service";
import { toMessageDTO } from "../utils/mappers";

const router = Router();
router.use(requireAuth);

router.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) throw ApiError.badRequest("VALIDATION_ERROR", "Query parameter 'q' is required");

    const { conversations } = await conversationRepository.findForUser(req.userId!);
    const conversationIds = conversations.map((c) => c._id.toString());
    const results = await messageRepository.searchInConversations(conversationIds, q);

    res.json({
      success: true,
      data: results.map((m) => toMessageDTO(m, req.userId!)),
    });
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) throw ApiError.badRequest("VALIDATION_ERROR", "Query parameter 'q' is required");

    const users = await userRepository.search(q, req.userId!);
    res.json({ success: true, data: users.map((u) => authService.toPublicUser(u as any)) });
  })
);

export default router;
