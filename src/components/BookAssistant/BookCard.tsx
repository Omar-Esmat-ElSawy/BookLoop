import React from 'react';
import { Book } from '@/types/database.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { preferenceService } from '@/services/preferenceService';
import { toast } from 'sonner';

interface BookAssistantCardProps {
  book: Book;
}

export const BookAssistantCard: React.FC<BookAssistantCardProps> = ({ book }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.language === 'ar';

  const handleLike = async () => {
    if (!user) return;
    const success = await preferenceService.addLikedBook(user.id, book.id);
    if (success) {
      toast.success(isRtl ? "تمت الإضافة للمفضلة" : "Added to favorites");
    }
  };

  return (
    <Card className="overflow-hidden mb-2 border-primary/20 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
      <CardContent className="p-0 flex h-24">
        <div className="w-16 h-full flex-shrink-0">
          <img 
            src={book.cover_image_url || "/placeholder.svg"} 
            alt={book.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-2 flex flex-col justify-between flex-grow min-w-0">
          <div>
            <h4 className="font-semibold text-sm line-clamp-1">{book.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary self-start">
              {book.genre}
            </span>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLike}
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
