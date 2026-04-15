import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types/database.types";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendedBooks?: Book[];
}

export const chatService = {
  async saveMessage(
    userId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    bookData: any[] = []
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('assistant_chat_history')
      .insert({
        user_id: userId,
        role,
        content,
        book_data: bookData
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error saving chat message:", error);
      return null;
    }

    return data.id;
  },

  async getChatHistory(userId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('assistant_chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      timestamp: new Date(row.created_at || Date.now()),
      recommendedBooks: (row.book_data as unknown as Book[]) || []
    }));
  },

  async clearHistory(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('assistant_chat_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error("Error clearing chat history:", error);
      return false;
    }

    return true;
  }
};
