import type {
  ConversationDTO,
  MessageDTO,
  PresenceUpdateDTO,
  TypingUpdateDTO,
} from "./models";

export interface ServerToClientEvents {
  "message:new": (message: MessageDTO) => void;
  "message:update": (message: MessageDTO) => void;
  "message:delete": (data: { messageId: string; conversationId: string }) => void;
  "message:ack": (data: { clientTempId: string; message: MessageDTO }) => void;
  "message:failed": (data: { clientTempId: string; reason: string }) => void;

  "message:reaction_update": (data: {
    messageId: string;
    conversationId: string;
    reactions: MessageDTO["reactions"];
  }) => void;

  "presence:update": (data: PresenceUpdateDTO) => void;

  "typing:update": (data: TypingUpdateDTO) => void;

  "conversation:created": (conversation: ConversationDTO) => void;
  "conversation:updated": (conversation: ConversationDTO) => void;
  "conversation:member_added": (data: {
    conversationId: string;
    userId: string;
  }) => void;
  "conversation:member_removed": (data: {
    conversationId: string;
    userId: string;
  }) => void;
  "conversation:read": (data: {
    conversationId: string;
    userId: string;
    lastReadAt: string;
  }) => void;

  "notification:new": (data: {
    conversationId: string;
    messageId: string;
    preview: string;
  }) => void;

  "error": (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  "conversation:join": (data: { conversationId: string }) => void;
  "conversation:leave": (data: { conversationId: string }) => void;

  "message:send": (data: {
    conversationId: string;
    text?: string;
    attachments?: MessageDTO["attachments"];
    replyTo?: string | null;
    clientTempId: string;
  }) => void;
  "message:edit": (data: { messageId: string; text: string }) => void;
  "message:delete": (data: { messageId: string }) => void;
  "message:react": (data: { messageId: string; emoji: string }) => void;
  "message:unreact": (data: { messageId: string; emoji: string }) => void;

  "message:read": (data: { conversationId: string; messageId: string }) => void;

  "typing:start": (data: { conversationId: string }) => void;
  "typing:stop": (data: { conversationId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
}
