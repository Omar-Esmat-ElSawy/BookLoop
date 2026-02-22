import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Bell, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationsPanelProps {
  onClose: () => void;
}

const NotificationsPanel = ({ onClose }: NotificationsPanelProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { language } = useLanguage();
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  // Map notification types to translation keys
  const getNotificationContent = (type: string, originalContent: string): string => {
    const typeToKeyMap: Record<string, string> = {
      'exchange_request': 'notifications.exchangeRequest',
      'exchange_response': 'notifications.exchangeResponse',
      'message': 'notifications.newMessage',
      'book_added': 'notifications.bookAdded',
      'exchange_accepted': 'notifications.exchangeAccepted',
      'exchange_rejected': 'notifications.exchangeRejected',
      'exchange_cancelled': 'notifications.exchangeCancelled',
    };

    const translationKey = typeToKeyMap[type];
    if (translationKey) {
      return t(translationKey);
    }
    // Fallback to original content if type not mapped
    return originalContent;
  };

  const handleClick = async (notificationId: string, isRead: boolean, relatedId?: string, type?: string) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
    
    onClose();
    
    if (relatedId) {
      if (type === 'exchange_request' || type === 'exchange_response') {
        navigate('/exchange-requests');
      } else if (type?.includes('message')) {
        navigate(`/messages`);
      } else {
        navigate(`/books/${relatedId}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const dateLocale = language === 'ar' ? ar : enUS;
    
    if (isToday) {
      return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
    }
    
    return format(date, 'MMM d, yyyy h:mm a', { locale: dateLocale });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-lg font-medium">{t('notifications.title')}</h3>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>
      
      <Separator />
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2 mt-2 max-h-[60vh] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-md cursor-pointer ${
                notification.is_read ? 'bg-background hover:bg-secondary/50' : 'bg-secondary hover:bg-secondary/80'
              }`}
              onClick={() => handleClick(notification.id, notification.is_read, notification.related_id, notification.type)}
            >
              <div className="flex gap-2">
                <div className={`rounded-full p-2 ${notification.is_read ? 'bg-muted' : 'bg-primary/10'}`}>
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className={`text-sm ${!notification.is_read && 'font-medium'}`}>{getNotificationContent(notification.type, notification.content)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ms-2 opacity-60 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8">
          <Bell className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{t('notifications.noNotifications')}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
