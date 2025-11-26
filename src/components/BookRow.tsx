
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Book } from '@/types/database.types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import BookCard from './BookCard';

interface BookRowProps {
  title: string;
  books: Book[];
  viewAllLink?: string;
  emptyMessage?: string;
}

const BookRow = ({ title, books, viewAllLink, emptyMessage = "No books found" }: BookRowProps) => {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <div className="py-4 md:py-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        {viewAllLink && (
          <Link 
            to={viewAllLink} 
            className="flex items-center gap-1 text-primary hover:underline text-xs md:text-sm"
          >
            View all
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
          </Link>
        )}
      </div>
      
      {books.length > 0 ? (
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex gap-3 md:gap-4">
            {books.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                className="min-w-[140px] w-[140px] md:min-w-[200px] md:w-[200px]"
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="flex items-center justify-center h-64 border rounded-md">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

export default BookRow;
