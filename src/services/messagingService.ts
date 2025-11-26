
import supabase from '@/lib/supabase';
import { User, Message } from '@/types/database.types';
import { getMessageFactory } from './messageFactoryService';

/**
 * Search for users by username
 */
export const searchUsers = async (query: string, currentUserId: string): Promise<User[]> => {
  try {
    if (!currentUserId || !query || query.trim().length < 2) return [];
    
    console.log("Searching for users with query:", query);
    
    // Case-insensitive search with wildcards
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', `%${query.trim()}%`) 
      .neq('id', currentUserId) // Exclude current user
      .limit(10);
    
    if (error) {
      console.error("Search error:", error);
      throw error;
    }
    
    console.log("Search results:", data);
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Fetch user profile by ID
 */
export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  try {
    if (!userId) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', userId);
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/**
 * Mark all messages from a specific sender as read
 */
export const markAllMessagesAsRead = async (senderId: string, userId: string): Promise<void> => {
  try {
    if (!userId) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', userId)
      .eq('is_read', false);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Send a message using the factory pattern
 */
export const sendNewMessage = async (
  content: string, 
  senderId: string, 
  receiverId: string,
  messageType: 'direct' = 'direct'
): Promise<Message | null> => {
  try {
    // Use the factory to create the appropriate message type
    const messageFactory = getMessageFactory(messageType);
    return await messageFactory.create({ content, senderId, receiverId });
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

/**
 * Fetch messages between two users
 */
export const fetchMessagesBetweenUsers = async (
  userId: string, 
  partnerId: string
): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}), and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};
