import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import NavBar from '@/components/NavBar';
import { Loader2, Send, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SUPPORT_CATEGORIES, getCategoryById } from '@/constants/supportConstants';

interface SupportMessage {
  id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  admin_reply: boolean;
  category: string | null;
  subcategory: string | null;
}

export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('user-support-messages')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'support_messages',
            filter: `sender_id=eq.${user.id}`
          },
          () => {
            fetchMessages();
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'support_messages',
            filter: `admin_reply=eq.true`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch user's own messages and admin replies to this user's thread
      // The RLS policy handles visibility - admins can see all, users see their own + admin replies
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Filter to only show this user's thread
      // User's own messages + admin replies (admin replies have sender_id = user.id when replying to that user)
      const filteredMessages = data?.filter(m => 
        m.sender_id === user.id
      ) || [];
      
      setMessages(filteredMessages);
      
      // Mark admin replies as read
      const unreadAdminReplies = filteredMessages.filter(m => m.admin_reply && !m.is_read);
      for (const msg of unreadAdminReplies) {
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('id', msg.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || (!newMessage.trim() && !imageUrl)) return;
    
    if (!selectedCategoryId || !selectedSubcategory) {
      toast.error(t('support.selectCategoryFirst'));
      return;
    }
    
    setIsSending(true);
    try {
    const { data, error } = await supabase
    .from('support_messages')
    .insert({
      sender_id: user.id,
      content: newMessage.trim() || (imageUrl ? t('support.imageAttached') : ''),
      image_url: imageUrl || null,
      admin_reply: false,
      is_read: false,
      category: selectedCategoryId,
      subcategory: selectedSubcategory
    })
    .select()
    .single();

      if (error) throw error;
      
    setMessages(prev => {
      if (!data) return prev;
      if (prev.some(m => m.id === data.id)) return prev; 
      return [...prev, data];
    });

      setNewMessage('');
      setImageUrl('');
      toast.success(t('support.messageSent'));
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || t('support.sendError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error(t('support.invalidImageType'));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('support.imageTooLarge'));
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
      
      setImageUrl(publicUrl);
      toast.success(t('support.imageUploaded'));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || t('support.imageUploadError'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">{t('auth.pleaseLogIn')}</h2>
          <Button onClick={() => navigate('/login')}>{t('nav.login')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              <CardTitle>{t('support.title')}</CardTitle>
            </div>
            <CardDescription>
              {t('support.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-8rem)]">
            {loading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 pe-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t('support.noMessages')}</p>
                        <p className="text-sm mt-2">{t('support.startConversation')}</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.admin_reply ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.admin_reply
                                ? 'bg-secondary'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            {message.admin_reply && (
                              <p className="text-xs font-medium mb-1 text-primary">
                                {t('support.adminReply')}
                              </p>
                            )}
                            {message.image_url && (
                              <img 
                                src={message.image_url} 
                                alt="Attached" 
                                className="max-w-full rounded mb-2 max-h-48 object-contain cursor-pointer"
                                onClick={() => window.open(message.image_url!, '_blank')}
                              />
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {format(new Date(message.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t pt-4 mt-4 space-y-2">
                  {imageUrl && (
                    <div className="relative inline-block">
                      <img src={imageUrl} alt="Preview" className="h-20 rounded" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -end-2 h-6 w-6"
                        onClick={() => setImageUrl('')}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground ms-1">
                        {t('support.category')}
                      </label>
                      <Select
                        value={selectedCategoryId}
                        onValueChange={(value) => {
                          setSelectedCategoryId(value);
                          setSelectedSubcategory(''); // Reset subcategory when category changes
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('support.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {t(cat.labelKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground ms-1">
                        {t('support.subcategory')}
                      </label>
                      <Select
                        value={selectedSubcategory}
                        onValueChange={setSelectedSubcategory}
                        disabled={!selectedCategoryId}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('support.selectSubcategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCategoryId && getCategoryById(selectedCategoryId).subcategories.map((sub) => (
                            <SelectItem key={sub} value={sub}>
                              {t(sub)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('support.typeMessage')}
                      className="flex-1 min-h-[60px] max-h-[120px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
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
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={isSending || (!newMessage.trim() && !imageUrl)}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}