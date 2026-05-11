import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BookCard from '@/components/BookCard';
import { Book } from '@/types/database.types';

const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  description: 'Test Description',
  genre: 'Fiction',
  condition: 'Good',
  cover_image_url: 'https://test.com/cover.jpg',
  owner_id: 'user1',
  is_available: true,
  created_at: new Date().toISOString(),
};

describe('BookCard', () => {
  it('renders book details correctly', () => {
    render(<BookCard book={mockBook} />);
    
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('genres.fiction')).toBeInTheDocument();
    
    const img = screen.getByAltText('Test Book') as HTMLImageElement;
    expect(img.src).toBe('https://test.com/cover.jpg');
  });

  it('shows not available badge when book is not available', () => {
    const unavailableBook = { ...mockBook, is_available: false };
    render(<BookCard book={unavailableBook} />);
    
    expect(screen.getByText('books.notAvailable')).toBeInTheDocument();
  });

  it('uses placeholder image if cover_image_url is missing', () => {
    const noImageBook = { ...mockBook, cover_image_url: '' };
    render(<BookCard book={noImageBook} />);
    
    const img = screen.getByAltText('Test Book') as HTMLImageElement;
    expect(img.src).toContain('placeholder.svg');
  });
});
