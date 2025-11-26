
import { User, Message } from '@/types/database.types';

// Define types for the chat partner objects
export interface ChatPartner extends User {
  unreadCount: number;
  lastMessage?: Message;
}

// Define the Message with sender/receiver information
export interface MessageWithUser extends Message {
  sender?: User;
  receiver?: User;
}

// Define the current chat state
export interface CurrentChat {
  partner: User | null;
  messages: MessageWithUser[];
  loading: boolean;
}

// Define the context props
export interface MessagingContextProps {
  chatPartners: ChatPartner[];
  currentChat: CurrentChat;
  loading: boolean;
  startChat: (partnerId: string) => void;
  sendMessage: (content: string) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
}
