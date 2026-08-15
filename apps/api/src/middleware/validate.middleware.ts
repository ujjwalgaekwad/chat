import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(
        ApiError.badRequest(
          "VALIDATION_ERROR",
          "Request validation failed",
          result.error.flatten()
        )
      );
    }
    
    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.query !== undefined) {
      Object.assign(req.query, result.data.query);
    }
    next();
  };
}
