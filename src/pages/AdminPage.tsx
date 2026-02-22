import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import NavBar from '@/components/NavBar';
import { Loader2, Shield, MessageSquare, Send, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

interface SupportMessage {
  id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  admin_reply: boolean;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface SupportThread {
  userId: string;
  username: string;
  avatarUrl: string | null;
  lastMessage: SupportMessage;
  unreadCount: number;
  messages: SupportMessage[];
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [isGranting, setIsGranting] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();
  
  // Support messaging state
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [loadingSupport, setLoadingSupport] = useState(true);
  const [replyImageUrl, setReplyImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Derive selectedThread from threads array and selectedThreadId
  const selectedThread = supportThreads.find(t => t.userId === selectedThreadId) || null;

  // Fetch support messages
  useEffect(() => {
    if (isAdmin) {
      fetchSupportMessages();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('admin-support-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'support_messages' },
          () => {
            fetchSupportMessages();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThreadId, supportThreads]);

  useEffect(() => {
    if (!selectedThread) return;
    if (selectedThread.unreadCount === 0) return;

    markThreadAsRead(selectedThread);
  }, [selectedThreadId, selectedThread?.unreadCount]);
  
  const fetchSupportMessages = async () => {
    try {
      setLoadingSupport(true);
      
      // Fetch all support messages first (without join to avoid RLS issues)
      const { data: messages, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching support messages:', error);
        throw error;
      }

      if (!messages || messages.length === 0) {
        setSupportThreads([]);
        setLoadingSupport(false);
        return;
      }

      // Get unique sender IDs (excluding admin replies since those use the user's ID)
      const userSenderIds = [...new Set(messages.filter(m => !m.admin_reply).map(m => m.sender_id))];
      
      // Fetch user info separately
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userSenderIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      const usersMap = new Map(users?.map(u => [u.id, u]) || []);

      // Group messages by user (non-admin senders)
      const threadsMap = new Map<string, SupportThread>();
      
      messages.forEach((msg: any) => {
        // Find the original user who started the conversation
        const userId = msg.admin_reply ? null : msg.sender_id;
        
        if (userId) {
          const userInfo = usersMap.get(userId);
          
          if (!threadsMap.has(userId)) {
            threadsMap.set(userId, {
              userId,
              username: userInfo?.username || 'Unknown',
              avatarUrl: userInfo?.avatar_url || null,
              lastMessage: msg,
              unreadCount: 0,
              messages: []
            });
          }
          
          const thread = threadsMap.get(userId)!;
          thread.messages.push(msg);
          
          if (!msg.is_read && !msg.admin_reply) {
            thread.unreadCount++;
          }
          
          if (new Date(msg.created_at) > new Date(thread.lastMessage.created_at)) {
            thread.lastMessage = msg;
          }
        }
      });

      // Also add admin replies to the correct threads
      messages.forEach((msg: any) => {
        if (msg.admin_reply) {
          // Admin replies have sender_id = thread user's ID
          const thread = threadsMap.get(msg.sender_id);
          if (thread) {
            if (!thread.messages.find((m) => m.id === msg.id)) {
              thread.messages.push(msg);
            }
            if (new Date(msg.created_at) > new Date(thread.lastMessage.created_at)) {
              thread.lastMessage = msg;
            }
          }
        }
      });

      // Sort messages within each thread
      threadsMap.forEach((thread) => {
        thread.messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      const threadsArray = Array.from(threadsMap.values()).sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );
      
      setSupportThreads(threadsArray);
      // No need to update selectedThread - it's derived from selectedThreadId
    } catch (error) {
      console.error('Error fetching support messages:', error);
    } finally {
      setLoadingSupport(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedThread || (!replyContent.trim() && !replyImageUrl)) return;
    
    setIsSendingReply(true);
    try {
      const { data, error } = await supabase
      .from('support_messages')
      .insert({
        sender_id: selectedThread.userId,
        content: replyContent.trim() || (replyImageUrl ? t('admin.imageAttached') : ''),
        image_url: replyImageUrl || null,
        admin_reply: true,
        is_read: false
      })
      .select()
      .single();

      if (error) throw error;
      
      if (data) {
      setSupportThreads(prev => {
        const updated = prev.map(thread => {
          if (thread.userId !== selectedThread.userId) return thread;
        
          const messages = [...thread.messages, data].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        
          return {
            ...thread,
            messages,
            lastMessage: data,
          };
        });
      
        updated.sort(
          (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
        );
      
        return updated;
      });
    }
      setReplyContent('');
      setReplyImageUrl('');
      toast.success(t('admin.replySent'));
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error(error.message || t('admin.replyError'));
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error(t('admin.invalidImageType'));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('admin.imageTooLarge'));
      return;
    }
    
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `support/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
      
      setReplyImageUrl(publicUrl);
      toast.success(t('admin.imageUploaded'));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || t('admin.imageUploadError'));
    } finally {
      setIsUploadingImage(false);
    }
  };
const markThreadAsRead = async (thread: SupportThread) => {
  const unreadIds = thread.messages
    .filter(m => !m.is_read && !m.admin_reply)
    .map(m => m.id);

  if (unreadIds.length === 0) return;

  setSupportThreads(prev =>
    prev.map(t => {
      if (t.userId !== thread.userId) return t;

      return {
        ...t,
        unreadCount: 0,
        messages: t.messages.map(m =>
          (!m.admin_reply && unreadIds.includes(m.id))
            ? { ...m, is_read: true }
            : m
        ),
      };
    })
  );

  const { error } = await supabase
    .from('support_messages')
    .update({ is_read: true })
    .in('id', unreadIds);

  if (error) {
    console.error('Error marking as read:', error);
  }
};


  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !username) {
      toast.error(t("toasts.provideEmailOrUsername"));
      return;
    }

    setIsGranting(true);

    try {
      const { data, error } = await supabase.functions.invoke('grant-subscription', {
        body: {
          email: email || undefined,
          username: username || undefined,
          duration_months: parseInt(durationMonths) || 1,
        },
      });

      if (error) throw error;

      toast.success(data.message || t('toasts.subscriptionGranted'));
      setEmail('');
      setUsername('');
      setDurationMonths('1');
    } catch (error: any) {
      console.error('Error granting subscription:', error);
      toast.error(error.message || t("toasts.failedToGrantSubscription"));
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Grant Subscription Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>{t('admin.grantSubscription')}</CardTitle>
            </div>
            <CardDescription>
              {t('admin.grantSubscriptionDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGrantSubscription} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('admin.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('admin.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isGranting}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">{t('admin.or')}</div>

              <div className="space-y-2">
                <Label htmlFor="username">{t('admin.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t('admin.usernamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isGranting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">{t('admin.duration')}</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="1"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  disabled={isGranting}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isGranting}>
                {isGranting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t('admin.grantButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Support Messages Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <CardTitle>{t('admin.supportMessages')}</CardTitle>
            </div>
            <CardDescription>
              {t('admin.supportMessagesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSupport ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
                {/* Threads List */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-3 border-b bg-secondary/50">
                    <h3 className="font-medium">{t('admin.conversations')}</h3>
                  </div>
                  <ScrollArea className="h-[440px]">
                    {supportThreads.length > 0 ? (
                      supportThreads.map((thread) => (
                        <button
                          key={thread.userId}
                          className={`w-full text-start p-3 hover:bg-secondary/50 flex items-center gap-3 border-b ${
                            selectedThread?.userId === thread.userId ? 'bg-secondary' : ''
                          }`}
                          onClick={() => {
                            setSelectedThreadId(thread.userId);
                          }}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={thread.avatarUrl || ''} />
                              <AvatarFallback>{thread.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            {thread.unreadCount > 0 && (
                              <span className="absolute -top-1 -end-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="font-medium truncate">{thread.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(thread.lastMessage.created_at), 'MMM d')}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {thread.lastMessage.admin_reply && `${t('common.you')}: `}
                              {thread.lastMessage.content}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full p-8 text-center">
                        <p className="text-muted-foreground">{t('admin.noSupportMessages')}</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 border rounded-lg overflow-hidden flex flex-col">
                  {selectedThread ? (
                    <>
                      <div className="p-3 border-b bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedThread.avatarUrl || ''} />
                            <AvatarFallback>{selectedThread.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{selectedThread.username}</span>
                        </div>
                      </div>
                      
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {selectedThread.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.admin_reply ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.admin_reply
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary'
                                }`}
                              >
                                {message.image_url && (
                                  <img 
                                    src={message.image_url} 
                                    alt="Attached" 
                                    className="max-w-full rounded mb-2 max-h-48 object-contain"
                                  />
                                )}
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {format(new Date(message.created_at), 'h:mm a')}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={bottomRef} />
                        </div>
                      </ScrollArea>

                      {/* Reply Input */}
                      <div className="border-t p-3 space-y-2">
                        {replyImageUrl && (
                          <div className="relative inline-block">
                            <img src={replyImageUrl} alt="Preview" className="h-20 rounded" />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -end-2 h-6 w-6"
                              onClick={() => setReplyImageUrl('')}
                            >
                              ×
                            </Button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={t('admin.typeReply')}
                            className="flex-1 min-h-[60px] max-h-[120px]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                          />
                          <div className="flex flex-col gap-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isUploadingImage}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={isUploadingImage}
                                asChild
                              >
                                <span>
                                  {isUploadingImage ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ImageIcon className="h-4 w-4" />
                                  )}
                                </span>
                              </Button>
                            </label>
                            <Button
                              onClick={handleSendReply}
                              size="icon"
                              disabled={isSendingReply || (!replyContent.trim() && !replyImageUrl)}
                            >
                              {isSendingReply ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">{t('admin.selectConversation')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}