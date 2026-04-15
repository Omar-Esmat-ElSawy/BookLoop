import React from 'react';
import { cn } from '@/lib/utils';
import { BookAssistantCard } from './BookCard';
import { Book } from '@/types/database.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendedBooks?: Book[];
}

interface MessageBubbleProps {
  message: ChatMessage;
  isRtl?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isRtl }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isAssistant ? "justify-start" : "justify-end",
      isRtl ? "flex-row-reverse" : "flex-row"
    )}>
      {isAssistant && (
        <Avatar className="h-8 w-8 mt-1 border border-primary/20 shrink-0">
          <AvatarFallback className="bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isAssistant ? (isRtl ? "mr-2" : "ml-2") : (isRtl ? "ml-2" : "mr-2")
      )}>
        <div className={cn(
          "px-4 py-3 rounded-2xl shadow-sm",
          isAssistant 
            ? "bg-secondary text-secondary-foreground rounded-tl-none" 
            : "bg-primary text-primary-foreground rounded-tr-none"
        )}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
        
        {isAssistant && message.recommendedBooks && message.recommendedBooks.length > 0 && (
          <div className="mt-3 grid gap-2">
            {message.recommendedBooks.map(book => (
              <BookAssistantCard key={book.id} book={book} />
            ))}
          </div>
        )}
        
        <span className={cn(
          "text-[10px] text-muted-foreground mt-1 px-1",
          isAssistant ? "text-start" : "text-end"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {!isAssistant && (
        <Avatar className="h-8 w-8 mt-1 border border-primary/20 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary uppercase">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
