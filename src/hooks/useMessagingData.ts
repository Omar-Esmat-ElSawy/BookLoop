
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import supabase from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User, Message } from '@/types/database.types';
import { ChatPartner, CurrentChat, MessageWithUser } from '@/types/messaging.types';
import { 
  fetchUserProfile, 
  fetchMessagesBetweenUsers,
  markAllMessagesAsRead
} from '@/services/messagingService';

export const useMessagingData = () => {
  const { user } = useAuth();
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [currentChat, setCurrentChat] = useState<CurrentChat>({
    partner: null,
    messages: [],
    loading: false,
  });
  const [loading, setLoading] = useState(true);

  // Fetch chat partners when user changes
  useEffect(() => {
    if (user) {
      fetchChatPartners();
      
      // Subscribe to new messages
      const messagesSubscription = supabase
        .channel('messages_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            handleNewMessage(newMessage);
          }
        )
        .subscribe();

      return () => {
        messagesSubscription.unsubscribe();
      };
    } else {
      setChatPartners([]);
      setCurrentChat({
        partner: null,
        messages: [],
        loading: false,
      });
    }
  }, [user]);

  // Handle new incoming messages
  const handleNewMessage = async (message: Message) => {
    try {
      // Only process if we're the receiver
      if (!user || message.receiver_id !== user.id) return;
      
      // Fetch the sender details
      const sender = await fetchUserProfile(message.sender_id);
      if (!sender) return;
      
      // Update the chat partners list
      setChatPartners(prev => {
        // Check if we already have this partner in our list
        const existingPartnerIndex = prev.findIndex(p => p.id === sender.id);
        
        if (existingPartnerIndex >= 0) {
          // Update existing partner
          const updatedPartners = [...prev];
          const partner = updatedPartners[existingPartnerIndex];
          
          // Check if this is a newer message than the one we have
          const isNewer = !partner.lastMessage || 
            new Date(message.created_at) > new Date(partner.lastMessage.created_at);
          
          if (isNewer) {
            updatedPartners[existingPartnerIndex] = {
              ...partner,
              unreadCount: partner.unreadCount + 1,
              lastMessage: message,
            };
          }
          
          // Move this partner to the top of the list
          const [partnerToMove] = updatedPartners.splice(existingPartnerIndex, 1);
          updatedPartners.unshift(partnerToMove);
          
          return updatedPartners;
        } else {
          // Add new partner to the beginning of the list
          return [{
            ...sender,
            unreadCount: 1,
            lastMessage: message,
          }, ...prev];
        }
      });
      
      // If we're currently chatting with this person, update the current chat
      if (currentChat.partner?.id === sender.id) {
        setCurrentChat(prev => ({
          ...prev,
          messages: [...prev.messages, { ...message, sender }]
        }));
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  // Fetch all chat partners for the current user
  const fetchChatPartners = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      
      // Get all users that the current user has messaged or received messages from
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('receiver_id')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sentError) throw sentError;
      
      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
      
      if (receivedError) throw receivedError;
      
      // Combine and deduplicate user IDs
      const userIds = new Set([
        ...sentMessages.map(m => m.receiver_id),
        ...receivedMessages.map(m => m.sender_id),
      ]);
      
      if (userIds.size === 0) {
        setLoading(false);
        return;
      }
      
      // Get user profiles for all partners
      const partners: ChatPartner[] = [];
      
      for (const partnerId of userIds) {
        const partner = await fetchUserProfile(partnerId);
        
        if (partner) {
          // Get the last message between these users
          const { data: lastMessages, error: lastMessageError } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}), and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (lastMessageError) throw lastMessageError;
          
          // Count unread messages from this partner
          const { count, error: countError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: false })
            .eq('sender_id', partnerId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
          
          if (countError) throw countError;
          
          partners.push({
            ...partner,
            unreadCount: count || 0,
            lastMessage: lastMessages[0],
          });
        }
      }
      
      // Sort partners by last message date
      partners.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });
      
      setChatPartners(partners);
    } catch (error) {
      console.error('Error fetching chat partners:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    chatPartners,
    currentChat,
    setCurrentChat,
    loading,
    fetchChatPartners,
    handleNewMessage
  };
};
