import React, { useState } from 'react';
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

  // Filter user's available books
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Book Exchange</DialogTitle>
          <DialogDescription>
            Select one of your books to offer in exchange for "{book.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Book you want</Label>
            <p className="text-sm font-medium border rounded-md p-3 bg-muted/30">
              {book.title} by {book.author}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offered-book">Your book to offer</Label>
            {availableUserBooks.length > 0 ? (
              <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                <SelectTrigger id="offered-book">
                  <SelectValue placeholder="Select a book to offer" />
                </SelectTrigger>
                <SelectContent>
                  {availableUserBooks.map((userBook) => (
                    <SelectItem key={userBook.id} value={userBook.id}>
                      {userBook.title} by {userBook.author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground border rounded-md p-3 bg-destructive/10">
                You don't have any available books to offer. Add a book first!
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Write a message to the book owner..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isRequesting || !selectedBookId || availableUserBooks.length === 0}
          >
            {isRequesting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeRequestDialog;
