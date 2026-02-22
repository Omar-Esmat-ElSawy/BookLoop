
import { User, Message } from '@/types/database.types';
import supabase from '@/lib/supabase';

// Interface for message creation operations
export interface MessageFactory {
  create(data: MessageCreationData): Promise<Message | null>;
}

// Common data needed to create any message
export interface MessageCreationData {
  content: string;
  senderId: string;
  receiverId: string;
}

// Direct message factory implementation
export class DirectMessageFactory implements MessageFactory {
  async create(data: MessageCreationData): Promise<Message | null> {
    try {
      const newMessage: Partial<Message> = {
        content: data.content,
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        is_read: false,
      };
      
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();
      
      if (error) throw error;
      return messageData;
    } catch (error) {
      console.error('Error creating direct message:', error);
      return null;
    }
  }
}

// Factory method to get the appropriate message factory
export function getMessageFactory(type: 'direct' = 'direct'): MessageFactory {
  switch (type) {
    case 'direct':
      return new DirectMessageFactory();
    // We can add more types in the future like:
    // case 'group':
    //   return new GroupMessageFactory();
    default:
      return new DirectMessageFactory();
  }
}
