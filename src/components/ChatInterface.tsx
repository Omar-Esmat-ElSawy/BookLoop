
import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Paperclip, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { User } from '@/types/database.types';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  partner: User;
}

const ChatInterface = ({ partner }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { currentChat, sendMessage, markAsRead } = useMessaging();
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat.messages]);

  // Mark messages as read when viewing the chat
  useEffect(() => {
    if (partner && currentChat.messages.length > 0) {
      // Mark all unread messages from this partner as read
      const unreadMessages = currentChat.messages.filter(
        msg => msg.sender_id === partner.id && !msg.is_read
      );
      
      unreadMessages.forEach(message => {
        markAsRead(message.id);
      });
    }
  }, [partner, currentChat.messages, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting || !user) return;
    
    try {
      setIsSubmitting(true);
      const success = await sendMessage(newMessage.trim());
      if (success) {
        setNewMessage('');
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!partner) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b bg-secondary/50">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={partner.avatar_url || ''} />
            <AvatarFallback>{partner.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{partner.username}</h3>
            <p className="text-xs text-muted-foreground">
              {currentChat.messages.length > 0 ? 'Last active ' + format(new Date(currentChat.messages[currentChat.messages.length - 1].created_at), 'MMM d, h:mm a') : 'Start a conversation'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea 
        ref={scrollAreaRef} 
        className="flex-1 p-4"
      >
        <div className="space-y-4">
          {currentChat.messages.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          
          {currentChat.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {format(new Date(message.created_at), 'h:mm a')}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isSubmitting || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
