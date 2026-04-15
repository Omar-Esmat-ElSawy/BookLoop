import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageBubble, ChatMessage } from './MessageBubble';
import { QuickActions } from './QuickActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { bookAssistant } from '@/services/bookAssistant';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ChatInterface: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.language === 'ar';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        setIsInitialLoading(true);
        try {
          const history = await chatService.getChatHistory(user.id);
          if (history.length > 0) {
            setMessages(history);
          } else {
            // Initial welcome message if no history
            const welcome: ChatMessage = {
              id: 'welcome',
              role: 'assistant',
              content: isRtl 
                ? `مرحباً ${user?.username || ''}! أنا مساعدك الشخصي للكتب. كيف يمكنني مساعدتك اليوم؟ يمكنني اقتراح كتب بناءً على ذوقك!`
                : `Hello ${user?.username || ''}! I'm your AI Book Assistant. How can I help you today? I can suggest books based on your taste!`,
              timestamp: new Date()
            };
            setMessages([welcome]);
          }
        } catch (error) {
          console.error("Failed to load background history:", error);
        } finally {
          setIsInitialLoading(false);
        }
      }
    };

    loadHistory();
  }, [user?.id, isRtl]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to DB
      await chatService.saveMessage(user.id, 'user', text);

      // Historical context for AI
      const history = messages.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      const response = await bookAssistant.processUserMessage(user.id, text, history);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        recommendedBooks: response.recommendedBooks
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      // Save assistant response to DB
      await chatService.saveMessage(user.id, 'assistant', response.text, response.recommendedBooks);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(isRtl ? "فشل الاتصال بالمساعد" : "Failed to connect to assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (user) {
      if (isLoading) {
        toast.error(isRtl ? "يرجى الانتظار حتى ينتهي المساعد من الرد" : "Please wait for the assistant to finish responding");
        return;
      }

      setIsDeleting(true);
      try {
        console.log("Attempting to clear history for user:", user.id);
        const success = await chatService.clearHistory(user.id);
        
        if (success) {
          // Initial welcome message if history cleared
          const welcome: ChatMessage = {
            id: 'welcome',
            role: 'assistant',
            content: isRtl 
              ? `مرحباً ${user?.username || ''}! أنا مساعدك الشخصي للكتب. كيف يمكنني مساعدتك اليوم؟ يمكنني اقتراح كتب بناءً على ذوقك!`
              : `Hello ${user?.username || ''}! I'm your AI Book Assistant. How can I help you today? I can suggest books based on your taste!`,
            timestamp: new Date()
          };
          setMessages([welcome]);
          toast.success(t('assistant.chatCleared'));
        } else {
          toast.error(t('toasts.errorOccurred'));
        }
      } catch (error) {
        console.error("Failed to clear chat:", error);
        toast.error(t('toasts.errorOccurred'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-130px)] md:h-[calc(100vh-140px)] w-full max-w-4xl mx-auto md:border md:border-primary/10 md:rounded-3xl overflow-hidden bg-background/50 backdrop-blur-md md:shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-card/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{isRtl ? "مساعد الكتب" : "Book Assistant"}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {isRtl ? "متصل" : "Online"}
              </span>
            </div>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-destructive"
              disabled={isDeleting || isLoading}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
            <AlertDialogHeader className={isRtl ? "sm:text-right" : "sm:text-left"}>
              <AlertDialogTitle className={isRtl ? "text-right" : "text-left"}>
                {t('assistant.deleteConfirmTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription className={isRtl ? "text-right" : "text-left"}>
                {t('assistant.deleteConfirmDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className={cn(
              "gap-2",
              isRtl ? "sm:flex-row-reverse sm:justify-start sm:space-x-reverse" : ""
            )}>
              <AlertDialogCancel>{t('assistant.deleteConfirmCancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={clearChat}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('assistant.deleteConfirmAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Messages */}
      <div 
        className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent"
        ref={scrollRef}
      >
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{isRtl ? "جاري تحميل المحادثة..." : "Loading conversation..."}</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} isRtl={isRtl} />
          ))
        )}
        
        {isLoading && (
          <div className={cn(
            "flex w-full mb-6 animate-pulse",
            isRtl ? "flex-row-reverse" : "flex-row"
          )}>
            <div className="p-2 bg-secondary rounded-xl flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">
                {isRtl ? "يفكر..." : "Thinking..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card/30 border-t border-primary/10">
        <QuickActions onAction={handleSend} isRtl={isRtl} />
        
        <form 
          className={cn(
            "flex gap-2 items-center",
            isRtl ? "flex-row-reverse" : "flex-row"
          )}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <Input
            placeholder={isRtl ? "اسأل عن أي كتاب..." : "Ask about any book..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-grow h-12 rounded-2xl border-primary/20 bg-background/50 focus-visible:ring-primary/30"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 rounded-2xl shrink-0 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className={cn("h-5 w-5", isRtl && "rotate-180")} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

// Helper for class consolidation
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
