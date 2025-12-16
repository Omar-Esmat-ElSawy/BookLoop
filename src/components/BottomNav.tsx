import { Link, useLocation } from 'react-router-dom';
import { ArrowRightLeft, BookOpen, MessageSquare, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { to: '/books', icon: BookOpen, label: 'Books' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/exchange-requests', icon: ArrowRightLeft, label: 'Exchanges' },
    { to: `/profile/${user.id}`, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t dark:bg-dark-background dark:border-dark-field">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary dark:text-dark-button" 
                  : "text-muted-foreground dark:text-dark-icon hover:text-primary dark:hover:text-dark-button"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
