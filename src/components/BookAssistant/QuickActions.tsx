import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Sparkles, Heart, Search } from 'lucide-react';

interface QuickActionsProps {
  onAction: (text: string) => void;
  isRtl?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, isRtl }) => {
  const { t } = useTranslation();

  const actions = [
    { 
      id: 'recommend', 
      labelEn: 'Recommend me a book', 
      labelAr: 'اقترح لي كتاباً',
      icon: <Sparkles className="h-4 w-4 mr-2" />
    },
    { 
      id: 'genre', 
      labelEn: 'I like fantasy books', 
      labelAr: 'أنا أحب كتب الفانتازيا',
      icon: <Heart className="h-4 w-4 mr-2" />
    },
    { 
      id: 'similar', 
      labelEn: 'Show me something similar', 
      labelAr: 'أرني شيئاً مشابهاً',
      icon: <Search className="h-4 w-4 mr-2" />
    }
  ];

  return (
    <div className="flex flex-nowrap overflow-x-auto gap-2 mb-4 pb-2 -mx-1 px-1 scrollbar-hide animate-in fade-in slide-in-from-left-2 duration-500">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          className="rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 text-xs py-2 px-4 h-10 shrink-0"
          onClick={() => onAction(isRtl ? action.labelAr : action.labelEn)}
        >
          {React.cloneElement(action.icon, { className: `h-3.5 w-3.5 ${isRtl ? 'ml-2 mr-0' : 'mr-2'}` })}
          {isRtl ? action.labelAr : action.labelEn}
        </Button>
      ))}
    </div>
  );
};
