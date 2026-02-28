import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LogIn, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import NotificationsPanel from './NotificationsPanel';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAdmin } from '@/hooks/useAdmin';
import { useTheme } from './theme-provider';
import { useTranslation } from 'react-i18next';
import logoLight from '@/assets/logo-light.ico';
import logoDark from '@/assets/logo-dark.ico';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavBarProps {}
let navIntroPlayed = false;

const NavBar = ({ }: NavBarProps) => {
  
  const [playNavIntro] = useState(() => !navIntroPlayed);
  useEffect(() => {
    navIntroPlayed = true;
  }, []);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { unreadCount } = useNotifications();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/home";  
  const navPositionClass = isHome
  ? "sticky top-0 md:fixed md:top-0 md:left-0 md:right-0"
  : "sticky top-0";
  
  const getActualTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const logo = getActualTheme() === 'dark' ? logoDark : logoLight;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  return (
    <motion.header
      className={cn(
        navPositionClass,
        "z-50 w-full border-b border-border/20 bg-transparent backdrop-blur-xl backdrop-saturate-150 shadow-sm"
      )}
      initial={playNavIntro ? { y: -16, opacity: 0, filter: "blur(10px)" } : false}
      animate={playNavIntro ? { y: 0, opacity: 1, filter: "blur(0px)" } : undefined}
      transition={{ duration: 1.2, delay: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto flex h-20 md:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="group flex items-center gap-2">
            <img
              src={logo}
              alt="Book Loop"
              className="h-8 w-8 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-3"
            />
            <span className="font-bold text-xl hidden md:inline gradient-text transition-all duration-200 ease-out group-hover:scale-105 group-hover:brightness-110 group-hover:rotate-3">
              Book Loop
            </span>
          </Link>
        </div>
        
        <div className="hidden md:flex md:items-center md:gap-6">
          <nav className="flex items-center gap-2">
            <Link 
              to="/" 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                location.pathname === '/' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-dark-button'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link 
              to="/books" 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                location.pathname === '/books' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-dark-button'
              }`}
            >
              {t('nav.books')}
            </Link>
            {user && (
              <>
                <Link 
                  to="/messages" 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    location.pathname === '/messages' 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-dark-button'
                  }`}
                >
                  {t('nav.messages')}
                </Link>
                <Link 
                  to="/exchange-requests" 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    location.pathname === '/exchange-requests' 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-dark-button'
                  }`}
                >
                  {t('nav.exchanges')}
                </Link>
              </>
            )}
          </nav>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          
          {user ? (
            <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-all"
                onClick={toggleNotifications}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-primary text-primary-foreground animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
              
              {/* Add Book */}
              <Link to="/books/add">
                <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-all">
                  <Plus className="h-5 w-5" />
                </Button>
              </Link>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                      <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dark:bg-dark-background dark:text-dark-button">
                  <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user.id}`}>
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-books">
                      {t('nav.myBooks')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subscription">
                      {t('nav.subscription')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/support">
                      {t('nav.support')}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        {t('nav.adminPanel')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="dark:text-dark-danger dark:hover:bg-dark-danger/20 dark:hover:text-dark-button"
                  >
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
                >
                  <LogIn className="h-4 w-4" />
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/signup" className="hidden md:block">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">{t('nav.signup')}</Button>
              </Link>
            </div>
          )}
          
        </div>
      </div>
      
      
      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-50" onClick={toggleNotifications}><div
  className={`absolute top-16 md:w-96 w-full md:max-w-md bg-card border rounded-lg shadow-lg p-4 max-h-[80vh] overflow-auto dark:bg-dark-background dark:border-dark-field ${
    isRtl ? 'left-4 right-auto' : 'right-4 left-auto'
  }`}
  onClick={(e) => e.stopPropagation()}
>            <NotificationsPanel onClose={toggleNotifications} />
          </div>
        </div>
      )}
    </motion.header>
  );
};

export default NavBar;
