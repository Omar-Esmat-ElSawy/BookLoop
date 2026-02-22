
import React from 'react';
import { Book } from '@/types/database.types';
import BookCard from './BookCard';

interface BookGridProps {
  books: Book[];
}

const BookGrid = ({ books }: BookGridProps) => {
  if (!books || books.length === 0) {
    return null;
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
