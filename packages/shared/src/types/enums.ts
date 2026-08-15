export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MemberRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const ConversationType = {
  DIRECT: "DIRECT",
  GROUP: "GROUP",
} as const;
export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType];

export const MessageType = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
  FILE: "FILE",
  SYSTEM: "SYSTEM",
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const MessageDeliveryState = {
  SENDING: "SENDING",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
  FAILED: "FAILED",
} as const;
export type MessageDeliveryState =
  (typeof MessageDeliveryState)[keyof typeof MessageDeliveryState];

export const PresenceStatus = {
  ONLINE: "online",
  OFFLINE: "offline",
} as const;
export type PresenceStatus = (typeof PresenceStatus)[keyof typeof PresenceStatus];
