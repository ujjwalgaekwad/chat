import type {
  UserRole,
  MemberRole,
  ConversationType,
  MessageType,
} from "./enums";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  status: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentDTO {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  thumbnailUrl: string | null;
}

export interface ReactionSummaryDTO {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  userIds: string[];
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: Pick<UserDTO, "id" | "name" | "avatar">;
  type: MessageType;
  text: string | null;
  attachments: AttachmentDTO[];
  replyTo: string | null;
  reactions: ReactionSummaryDTO[];
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  clientTempId?: string;
}

export interface ConversationMemberDTO {
  conversationId: string;
  userId: string;
  user?: Pick<UserDTO, "id" | "name" | "avatar" | "isOnline" | "lastSeenAt">;
  role: MemberRole;
  joinedAt: string;
  lastReadAt: string | null;
  muted: boolean;
  archived: boolean;
}

export interface ConversationDTO {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  avatar: string | null;
  createdBy: string;
  lastMessage: Pick<MessageDTO, "id" | "text" | "type" | "senderId" | "createdAt"> | null;
  lastMessageAt: string | null;
  members: ConversationMemberDTO[];
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PresenceUpdateDTO {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface TypingUpdateDTO {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}
