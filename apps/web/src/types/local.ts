import type { MessageDTO } from "@chat-platform/shared";

export type DeliveryState = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export interface LocalMessage extends MessageDTO {
  deliveryState?: DeliveryState;
}
