import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import { isProduction } from "../config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, reqId: req.id }, err.message);
    }
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  logger.error({ err, reqId: req.id }, "Unhandled error");

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "Something went wrong" : String((err as Error)?.message ?? err),
    },
  });
}
