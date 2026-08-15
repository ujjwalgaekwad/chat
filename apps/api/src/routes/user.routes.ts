import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { userRepository } from "../repositories/user.repository";
import { authService } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { updateProfileSchema, searchUsersSchema } from "../validators/user.validators";

const router = Router();

router.use(requireAuth);

router.get(
  "/search",
  validate(searchUsersSchema),
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "");
    const users = await userRepository.search(q, req.userId!);
    res.json({ success: true, data: users.map((u) => authService.toPublicUser(u as any)) });
  })
);

router.patch(
  "/me",
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const updated = await userRepository.updateProfile(req.userId!, req.body);
    if (!updated) throw ApiError.notFound("User not found");
    res.json({ success: true, data: authService.toPublicUser(updated) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await userRepository.findById(req.params.id);
    if (!user) throw ApiError.notFound("User not found");
    res.json({ success: true, data: authService.toPublicUser(user) });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await userRepository.listAll(req.userId!);
    res.json({ success: true, data: users.map((u) => authService.toPublicUser(u as any)) });
  })
);

export default router;
