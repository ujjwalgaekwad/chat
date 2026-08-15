import type { Request, Response } from "express";
import { messageService } from "../services/message.service";

export const messageController = {
  async list(req: Request, res: Response) {
    const conversationId = req.params.id;
    const before = req.query.before as string | undefined;
    const limit = Number(req.query.limit ?? 50);
    const page = await messageService.getPage(conversationId, req.userId!, before, limit);
    res.json({ success: true, data: page });
  },

  async send(req: Request, res: Response) {
    const conversationId = req.params.id;
    const message = await messageService.send(conversationId, req.userId!, req.body);
    res.status(201).json({ success: true, data: message });
  },

  async edit(req: Request, res: Response) {
    const message = await messageService.edit(req.params.id, req.userId!, req.body.text);
    res.json({ success: true, data: message });
  },

  async remove(req: Request, res: Response) {
    const message = await messageService.remove(req.params.id, req.userId!);
    res.json({ success: true, data: message });
  },

  async react(req: Request, res: Response) {
    const message = await messageService.react(req.params.id, req.userId!, req.body.emoji);
    res.json({ success: true, data: message });
  },

  async unreact(req: Request, res: Response) {
    const message = await messageService.unreact(req.params.id, req.userId!, req.body.emoji);
    res.json({ success: true, data: message });
  },

  async unreactParam(req: Request, res: Response) {
    const message = await messageService.unreact(
      req.params.id,
      req.userId!,
      decodeURIComponent(req.params.emoji)
    );
    res.json({ success: true, data: message });
  },
};
