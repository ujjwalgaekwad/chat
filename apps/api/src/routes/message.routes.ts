import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { messageController } from "../controllers/message.controller";
import {
  sendMessageSchema,
  editMessageSchema,
  listMessagesQuerySchema,
  reactionSchema,
} from "../validators/message.validators";

export const nestedMessageRouter = Router({ mergeParams: true });
nestedMessageRouter.use(requireAuth);
nestedMessageRouter.get(
  "/",
  validate(listMessagesQuerySchema),
  asyncHandler(messageController.list)
);
nestedMessageRouter.post(
  "/",
  validate(sendMessageSchema),
  asyncHandler(messageController.send)
);

const router = Router();
router.use(requireAuth);
router.patch("/:id", validate(editMessageSchema), asyncHandler(messageController.edit));
router.delete("/:id", asyncHandler(messageController.remove));
router.post("/:id/reactions", validate(reactionSchema), asyncHandler(messageController.react));
router.delete("/:id/reactions/:emoji", asyncHandler(messageController.unreactParam));

export default router;
