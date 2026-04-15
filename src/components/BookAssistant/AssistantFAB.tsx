import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const AssistantFAB: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Hide on desktop, if not logged in, or if already on the assistant page
  const isAssistantPage = location.pathname === '/book-assistant';
  const shouldShow = user && !isAssistantPage;

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 20 }}
        className="fixed bottom-24 right-6 z-50 md:hidden"
      >
        <Button
          onClick={() => navigate('/book-assistant')}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 transition-all duration-300 group"
        >
          <Sparkles className="h-6 w-6 text-primary-foreground group-hover:rotate-12 transition-transform" />
          <span className="sr-only">Book Assistant</span>
          
          {/* Subtle pulse effect */}
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 scale-125" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
};
