
import React from 'react';
import { Book } from '@/types/database.types';
import BookCard from './BookCard';

interface BookGridProps {
  books: Book[];
  emptyMessage?: string;
}

const BookGrid = ({ books, emptyMessage = "No books found" }: BookGridProps) => {
  if (!books || books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};

export default BookGrid;
