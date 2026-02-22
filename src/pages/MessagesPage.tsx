
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import NavBar from '@/components/NavBar';
import ChatInterface from '@/components/ChatInterface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { cn } from '@/lib/utils';
import { User } from '@/types/database.types';
import { useTranslation } from 'react-i18next';

const MessagesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { chatPartners, currentChat, startChat, loading, searchUsers } = useMessaging();
  const { t } = useTranslation();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);

  React.useEffect(() => {
    if (id && id !== selectedPartnerId) {
      setSelectedPartnerId(id);
      startChat(id);
    }
  }, [id, startChat, selectedPartnerId]);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    startChat(partnerId);
    setNewChatDialogOpen(false);
    navigate(`/messages/${partnerId}`);
  };

  const handleStartNewChat = (user: User) => {
    handleSelectPartner(user.id);
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">{t('auth.pleaseLogIn')}</h2>
          <Button onClick={() => navigate('/login')}>{t('nav.login')}</Button>
        </div>
      </div>
    );
  }

  const ConversationsList = () => (
    <>
      <div className="p-4 border-b bg-secondary/50 flex items-center justify-between">
        <h2 className="font-medium">{t('messages.conversations')}</h2>
        <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title={t('messages.startNewConversation')}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('messages.startNewConversation')}</DialogTitle>
              <DialogDescription>
                {t('messages.searchForUsers')}
              </DialogDescription>
            </DialogHeader>
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder={t('messages.searchUsers')}
                value={searchQuery}
                onValueChange={setSearchQuery}
                autoFocus
              />
              <CommandList>
                {isSearching && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                
                {!isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                  <CommandEmpty>
                    {searchQuery.trim().length < 2 
                      ? t('messages.typeToSearch')
                      : t('messages.noUsersFound')}
                  </CommandEmpty>
                )}
                
                {!isSearching && searchResults.length > 0 && (
                  <CommandGroup heading={t('messages.users')}>
                    {searchResults.map((searchUser) => (
                      <CommandItem
                        key={searchUser.id}
                        onSelect={() => handleStartNewChat(searchUser)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={searchUser.avatar_url || ''} alt={searchUser.username} />
                            <AvatarFallback>{searchUser.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <span>{searchUser.username}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      </div>
      
      <ScrollArea className="h-[calc(80vh-6rem)]">
        {loading && chatPartners.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : chatPartners.length > 0 ? (
          <div>
            {chatPartners.map((partner) => (
              <button
                key={partner.id}
                className={cn(
                  "w-full text-start p-3 hover:bg-secondary/50 flex items-center gap-3 border-b",
                  selectedPartnerId === partner.id && "bg-secondary"
                )}
                onClick={() => handleSelectPartner(partner.id)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={partner.avatar_url || ''} alt={partner.username} />
                    <AvatarFallback>{partner.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  {partner.unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {partner.unreadCount > 9 ? '9+' : partner.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="font-medium truncate">{partner.username}</p>
                    {partner.lastMessage && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(partner.lastMessage.created_at), 'MMM d')}
                      </p>
                    )}
                  </div>
                  {partner.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {partner.lastMessage.sender_id === user.id ? `${t('common.you')}: ` : ''}
                      {partner.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">{t('messages.noConversations')}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {t('messages.startConversation')}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setNewChatDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              {t('messages.newConversation')}
            </Button>
          </div>
        )}
      </ScrollArea>
    </>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <NavBar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('messages.title')}</h1>

        <SubscriptionGuard feature="the chat system">
          {isMobile ? (
            <>
              {!selectedPartnerId ? (
                <div className="border rounded-lg overflow-hidden">
                  <ConversationsList />
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden h-[calc(100vh-12rem)]">
                  <div className="flex items-center gap-3 p-4 border-b bg-secondary/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedPartnerId(null);
                        navigate('/messages');
                      }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="font-medium">
                      {currentChat.partner?.username || t('messages.chat')}
                    </h2>
                  </div>
                  {currentChat.partner && <ChatInterface partner={currentChat.partner} />}
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="border rounded-lg overflow-hidden lg:col-span-1">
                <ConversationsList />
              </div>

              <div className="border rounded-lg overflow-hidden lg:col-span-3 h-[calc(80vh-6rem)]">
                {selectedPartnerId && currentChat.partner ? (
                  <ChatInterface partner={currentChat.partner} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <p className="text-muted-foreground">{t('messages.noConversations')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('messages.startConversation')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SubscriptionGuard>
      </div>
    </div>
  );
};

export default MessagesPage;
