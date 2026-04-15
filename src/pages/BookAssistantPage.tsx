import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChatInterface } from '@/components/BookAssistant/ChatInterface';
import { LockedState } from '@/components/BookAssistant/LockedState';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, Sparkles } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const BookAssistantPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const isRtl = i18n.language === 'ar';

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-grow container mx-auto px-0 md:px-4 py-0 md:py-10 flex flex-col">
        <div className="mb-4 md:mb-8 text-center hidden md:block">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 group">
            <Sparkles className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {isRtl ? "مساعد الكتب الذكي" : "AI Book Assistant"}
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">
            {isRtl ? "مدعوم بالذكاء الاصطناعي" : "Powered by Advanced AI"}
          </p>
        </div>

        <div className="flex-grow flex flex-col h-full">
          {subscribed ? (
            <ChatInterface />
          ) : (
            <div className="px-4 py-8">
              <LockedState />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookAssistantPage;
