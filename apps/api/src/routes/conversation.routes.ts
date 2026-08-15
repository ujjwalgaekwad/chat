import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { conversationController } from "../controllers/conversation.controller";
import {
  openDirectSchema,
  createGroupSchema,
  updateConversationSchema,
  addMemberSchema,
  setMemberRoleSchema,
} from "../validators/conversation.validators";
import { nestedMessageRouter } from "./message.routes";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(conversationController.list));

router.post(
  "/",
  (req, res, next) => {
    const schema = req.body?.userId && !req.body?.name ? openDirectSchema : createGroupSchema;
    return validate(schema)(req, res, next);
  },
  asyncHandler(conversationController.create)
);

router.get("/:id", asyncHandler(conversationController.getOne));
router.patch("/:id", validate(updateConversationSchema), asyncHandler(conversationController.update));
router.delete("/:id", asyncHandler(conversationController.remove));

router.post("/:id/read", asyncHandler(conversationController.markRead));

router.get("/:id/members", asyncHandler(conversationController.listMembers));
router.post(
  "/:id/members",
  validate(addMemberSchema),
  asyncHandler(conversationController.addMember)
);
router.delete("/:id/members/:userId", asyncHandler(conversationController.removeMember));
router.patch(
  "/:id/members/:userId",
  validate(setMemberRoleSchema),
  asyncHandler(conversationController.setMemberRole)
);

router.use("/:id/messages", nestedMessageRouter);

export default router;
