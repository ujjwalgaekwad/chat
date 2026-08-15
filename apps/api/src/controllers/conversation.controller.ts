import type { Request, Response } from "express";
import { conversationService } from "../services/conversation.service";
import { conversationRepository } from "../repositories/conversation.repository";
import { ApiError } from "../utils/ApiError";

export const conversationController = {
  async list(req: Request, res: Response) {
    const conversations = await conversationService.listForUser(req.userId!);
    res.json({ success: true, data: conversations });
  },

  async getOne(req: Request, res: Response) {
    const conversation = await conversationService.getById(req.params.id, req.userId!);
    res.json({ success: true, data: conversation });
  },

  async create(req: Request, res: Response) {
    if (req.body.userId && !req.body.name) {
      const conversation = await conversationService.openDirect(req.userId!, req.body.userId);
      return res.status(201).json({ success: true, data: conversation });
    }
    const conversation = await conversationService.createGroup(req.userId!, req.body);
    res.status(201).json({ success: true, data: conversation });
  },

  async update(req: Request, res: Response) {
    const member = await conversationRepository.getMember(req.params.id, req.userId!);
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      throw ApiError.forbidden("Only owners and admins can edit this conversation");
    }
    await conversationRepository.updateInfo(req.params.id, req.body);
    const conversation = await conversationService.getById(req.params.id, req.userId!);
    res.json({ success: true, data: conversation });
  },

  async remove(req: Request, res: Response) {
    await conversationService.leaveConversation(req.params.id, req.userId!);
    res.json({ success: true, data: { left: true } });
  },

  async listMembers(req: Request, res: Response) {
    const conversation = await conversationService.getById(req.params.id, req.userId!);
    res.json({ success: true, data: conversation.members });
  },

  async addMember(req: Request, res: Response) {
    const conversation = await conversationService.addMember(
      req.params.id,
      req.userId!,
      req.body.userId
    );
    res.status(201).json({ success: true, data: conversation });
  },

  async removeMember(req: Request, res: Response) {
    await conversationService.removeMember(req.params.id, req.userId!, req.params.userId);
    res.json({ success: true, data: { removed: true } });
  },

  async setMemberRole(req: Request, res: Response) {
    const member = await conversationRepository.getMember(req.params.id, req.userId!);
    if (!member || member.role !== "OWNER") {
      throw ApiError.forbidden("Only the owner can change member roles");
    }
    const updated = await conversationRepository.setMemberRole(
      req.params.id,
      req.params.userId,
      req.body.role
    );
    res.json({ success: true, data: updated });
  },

  async markRead(req: Request, res: Response) {
    const member = await conversationService.markRead(req.params.id, req.userId!);
    res.json({ success: true, data: member });
  },
};
