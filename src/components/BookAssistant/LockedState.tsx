import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Lock, Sparkles, Zap, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LockedState: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative bg-card border-2 border-primary/20 p-6 rounded-3xl shadow-2xl">
          <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
          <div className="flex justify-center -space-x-2">
            {[1, 2, 3].map((i) => (
              <Zap key={i} className={`h-5 w-5 text-yellow-500 fill-yellow-500 animate-bounce delay-${i * 100}`} />
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        {isRtl ? "مساعد الكتاب الذكي" : "AI Book Assistant"}
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        {isRtl 
          ? "هذه الميزة متاحة فقط للمشتركين المميزين. احصل على توصيات شخصية مدعومة بالذكاء الاصطناعي بناءً على اهتماماتك المفضلة."
          : "This feature is available for premium users only. Get personalized AI recommendations based on your unique reading taste."}
      </p>

      <div className="grid gap-4 w-full max-w-sm">
        <Button 
          className="w-full h-12 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all group"
          onClick={() => navigate('/subscription')}
        >
          <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
          {isRtl ? "اشترك الآن" : "Upgrade Now"}
        </Button>
        
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex flex-col items-center">
            <MessageSquare className="h-5 w-5 text-primary/60 mb-1" />
            <span className="text-[10px] uppercase font-medium">{isRtl ? "دردشة ذكية" : "Smart Chat"}</span>
          </div>
          <div className="flex flex-col items-center border-x px-6 border-border">
            <Zap className="h-5 w-5 text-primary/60 mb-1" />
            <span className="text-[10px] uppercase font-medium">{isRtl ? "اقتراحات" : "Suggestions"}</span>
          </div>
          <div className="flex flex-col items-center">
            <Heart className="h-5 w-5 text-primary/60 mb-1" />
            <span className="text-[10px] uppercase font-medium">{isRtl ? "مخصص" : "Personalized"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Heart = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
