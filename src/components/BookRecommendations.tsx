import React from 'react';
import { Book } from '@/types/database.types';
import BookCard from './BookCard';
import { Sparkles } from 'lucide-react';

interface BookRecommendationsProps {
  books: Book[];
  title?: string;
  subtitle?: string;
}

const BookRecommendations: React.FC<BookRecommendationsProps> = ({
  books,
  title = "Recommended for you",
  subtitle = "Based on your search"
}) => {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-lg p-6 border border-border/50" style={{ backgroundColor: 'hsl(var(--recommendations-bg))' }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
};

export default BookRecommendations;
