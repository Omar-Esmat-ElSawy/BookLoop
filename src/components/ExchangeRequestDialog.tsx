import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Book } from '@/types/database.types';
import { useBooks } from '@/contexts/BooksContext';
 import { useTranslation } from 'react-i18next';

interface ExchangeRequestDialogProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExchangeRequestDialog = ({ book, open, onOpenChange }: ExchangeRequestDialogProps) => {
  const { userBooks, requestBookExchange } = useBooks();
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [isRequesting, setIsRequesting] = useState(false);
  const { t } = useTranslation();
  const availableUserBooks = userBooks.filter(b => b.is_available);

  const handleSubmit = async () => {
    if (!selectedBookId) return;
    
    setIsRequesting(true);
    try {
      const success = await requestBookExchange(book.id, requestMessage, selectedBookId);
      if (success) {
        onOpenChange(false);
        setRequestMessage('');
        setSelectedBookId('');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md ">
        <DialogHeader className= "flex items-start justify-between mt-2">
           <DialogTitle>{t('exchangeDialog.title')}</DialogTitle>
          <DialogDescription>
             {t('exchangeDialog.description', { title: book.title })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">{true && (
  <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold">
          {t('exchangeDialog.safetyTitle')}
        </p>

        <ul className="list-disc ps-5 text-xs text-muted-foreground space-y-1">
          <li>{t('exchangeDialog.safety.1')}</li>
          <li>{t('exchangeDialog.safety.2')}</li>
          <li>{t('exchangeDialog.safety.3')}</li>
          <li>{t('exchangeDialog.safety.4')}</li>
          <li>{t('exchangeDialog.safety.5')}</li>
          <li>{t('exchangeDialog.safety.6')}</li>
        </ul>

        <p className="text-xs text-muted-foreground">
          <Link to="/terms" className="underline">
            {t('exchangeDialog.readTerms')}
          </Link>
        </p>
      </div>
    </div>

  </div>
)}
          <div className="space-y-2">
             <Label>{t('exchangeDialog.bookYouWant')}</Label>
            <p className="text-sm font-medium border rounded-md p-3 bg-muted/30">
               {book.title} {t('exchangeDialog.by')} {book.author}
            </p>
          </div>

          <div className="space-y-2">
             <Label htmlFor="offered-book">{t('exchangeDialog.yourBookToOffer')}</Label>
            {availableUserBooks.length > 0 ? (
              <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                <SelectTrigger id="offered-book">
                   <SelectValue placeholder={t('exchangeDialog.selectBook')} />
                </SelectTrigger>
                <SelectContent>
                  {availableUserBooks.map((userBook) => (
                    <SelectItem key={userBook.id} value={userBook.id}>
                       {userBook.title} {t('exchangeDialog.by')} {userBook.author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground border rounded-md p-3 bg-destructive/10">
                 {t('exchangeDialog.noAvailableBooks')}
              </p>
            )}
          </div>

          <div className="space-y-2">
             <Label htmlFor="message">{t('exchangeDialog.messageOptional')}</Label>
            <Textarea
              id="message"
               placeholder={t('exchangeDialog.messagePlaceholder')}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
             {t('exchangeDialog.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isRequesting || !selectedBookId || availableUserBooks.length === 0}
          >
             {isRequesting ? t('exchangeDialog.sending') : t('exchangeDialog.sendRequest')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeRequestDialog;
