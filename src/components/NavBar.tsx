
import React, { useState } from 'react';
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
import { useAdmin } from '@/hooks/useAdmin';
import { useTheme } from './theme-provider';
import logoLight from '@/assets/logo-light.ico';
import logoDark from '@/assets/logo-dark.ico';

interface NavBarProps {}

const NavBar = ({ }: NavBarProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { unreadCount } = useNotifications();
  const { theme } = useTheme();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

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
    <header className="sticky top-0 z-40 w-full border-b border-border/20 bg-background/70 backdrop-blur-xl backdrop-saturate-150 shadow-sm dark:shadow-primary/5">
      <div className="container mx-auto flex h-20 md:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Book Loop" className="h-8 w-8" />
            <span className="font-bold text-xl hidden md:inline gradient-text">Book Loop</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
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
              Home
            </Link>
            <Link 
              to="/books" 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                location.pathname === '/books' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-dark-button'
              }`}
            >
              Books
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
                  Messages
                </Link>
                <Link 
                  to="/exchange-requests" 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    location.pathname === '/exchange-requests' 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-dark-button'
                  }`}
                >
                  Exchanges
                </Link>
              </>
            )}
          </nav>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center gap-4">
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
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user.id}`}>
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-books">
                      My Books
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subscription">
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="dark:text-dark-danger dark:hover:bg-dark-danger/20 dark:hover:text-dark-button"
                  >
                    Log out
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
                  Log In
                </Button>
              </Link>
              <Link to="/signup" className="hidden md:block">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">Sign Up</Button>
              </Link>
            </div>
          )}
          
        </div>
      </div>
      
      
      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-50" onClick={toggleNotifications}>
          <div className="absolute right-4 top-16 md:w-96 w-full md:max-w-md bg-card border rounded-lg shadow-lg p-4 max-h-[80vh] overflow-auto dark:bg-dark-background dark:border-dark-field" onClick={(e) => e.stopPropagation()}>
            <NotificationsPanel onClose={toggleNotifications} />
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
