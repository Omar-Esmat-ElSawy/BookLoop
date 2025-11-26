
import React, { createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { User } from '@/types/database.types';
import { MessagingContextProps, CurrentChat } from '@/types/messaging.types';
import { useAuth } from './AuthContext';
import { useMessagingData } from '@/hooks/useMessagingData';
import { 
  searchUsers as searchUsersService, 
  fetchUserProfile,
  markMessageAsRead,
  markAllMessagesAsRead,
  sendNewMessage,
  fetchMessagesBetweenUsers
} from '@/services/messagingService';

// Create the context
const MessagingContext = createContext<MessagingContextProps | undefined>(undefined);

// Provider component
export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { 
    chatPartners, 
    currentChat, 
    setCurrentChat,
    loading, 
    fetchChatPartners 
  } = useMessagingData();

  // Start a chat with a specific user
  const startChat = async (partnerId: string) => {
    try {
      if (!user) return;
      if (partnerId === user.id) {
        toast.error("You cannot chat with yourself");
        return;
      }
      
      setCurrentChat({
        partner: null,
        messages: [],
        loading: true,
      });
      
      // Get the partner profile
      const partner = await fetchUserProfile(partnerId);
      
      if (!partner) {
        toast.error("User not found");
        setCurrentChat({
          partner: null,
          messages: [],
          loading: false,
        });
        return;
      }
      
      // Get all messages between these users
      const messages = await fetchMessagesBetweenUsers(user.id, partnerId);
      
      // Enrich messages with sender/receiver info
      const enrichedMessages = messages.map(message => {
        const sender = message.sender_id === user.id ? user : partner;
        const receiver = message.receiver_id === user.id ? user : partner;
        
        return {
          ...message,
          sender,
          receiver,
        };
      });
      
      setCurrentChat({
        partner,
        messages: enrichedMessages,
        loading: false,
      });
      
      // Mark all messages from this partner as read
      await markAllMessagesAsRead(partnerId, user.id);
      
      // Refresh chat partners to update unread counts
      fetchChatPartners();
    } catch (error) {
      console.error('Error starting chat:', error);
      setCurrentChat({
        partner: null,
        messages: [],
        loading: false,
      });
    }
  };

  // Send a message to the current chat partner
  const sendMessage = async (content: string): Promise<boolean> => {
    try {
      if (!user || !currentChat.partner) return false;
      
      // Using the factory pattern to create and send a message
      const messageData = await sendNewMessage(content, user.id, currentChat.partner.id, 'direct');
      
      if (!messageData) {
        throw new Error('Failed to send message');
      }
      
      // Add to current chat
      setCurrentChat(prev => ({
        ...prev,
        messages: [...prev.messages, { 
          ...messageData, 
          sender: user, 
          receiver: prev.partner 
        }],
      }));
      
      // Refresh the chat partners list to update with the new message
      fetchChatPartners();
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      return false;
    }
  };

  // Mark a message as read
  const markAsRead = async (messageId: string): Promise<void> => {
    if (!user) return;
    
    try {
      await markMessageAsRead(messageId, user.id);
      
      // Update local state to reflect the read message
      setCurrentChat(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      }));
      
      // Also refresh chat partners to update unread counts
      fetchChatPartners();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Search for users by username
  const searchUsers = async (query: string): Promise<User[]> => {
    if (!user || !query) return [];
    
    try {
      console.log(`Searching users with query: "${query}"`);
      const results = await searchUsersService(query, user.id);
      console.log(`Found ${results.length} users matching "${query}"`);
      return results;
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  };

  const value = {
    chatPartners,
    currentChat,
    loading,
    startChat,
    sendMessage,
    markAsRead,
    searchUsers
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
