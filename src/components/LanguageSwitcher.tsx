import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-all"
      title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
    >
      <span className="font-semibold text-sm">
        {language === 'en' ? 'AR' : 'EN'}
      </span>
    </Button>
  );
}
