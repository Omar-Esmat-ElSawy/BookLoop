
import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  className?: string;
}

const BookCard = ({ book, className }: BookCardProps) => {
  const genreColor = getGenreColor(book.genre);
  
  return (
    <Link to={`/books/${book.id}`} className={cn("book-card flex flex-col rounded-lg overflow-hidden border bg-card h-full", className)}>
      <div className="relative aspect-[2/3] overflow-hidden">
        <img 
          src={book.cover_image_url || '/placeholder.svg'} 
          alt={book.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {!book.is_available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="secondary" className="text-xs px-2 py-0.5 md:text-sm md:px-3 md:py-1">Not Available</Badge>
          </div>
        )}
      </div>
      <div className="p-2 md:p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm md:text-base line-clamp-1">{book.title}</h3>
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{book.author}</p>
        <div className="mt-2 flex items-center">
          <Badge variant="outline" className={cn("text-[10px] md:text-xs", genreColor)}>
            {book.genre}
          </Badge>
        </div>
      </div>
    </Link>
  );
};

const getGenreColor = (genre: string): string => {
  switch (genre.toLowerCase()) {
    case 'fiction':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'non-fiction':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'mystery':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'science fiction':
    case 'sci-fi':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'fantasy':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'romance':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'thriller':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'horror':
      return 'bg-gray-800 text-gray-100 border-gray-700';
    case 'biography':
    case 'autobiography':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'history':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'children':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'poetry':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'self-help':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'business':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default BookCard;
