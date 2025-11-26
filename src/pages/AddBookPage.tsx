
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookForm from '@/components/BookForm';
import NavBar from '@/components/NavBar';
import { useBooks } from '@/contexts/BooksContext';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { toast } from 'sonner';

const AddBookPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { genres, addBook } = useBooks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBook = async (
    data: {
      title: string;
      author: string;
      description: string;
      genre: string;
      condition: string;
    }, 
    coverImage: File | null
  ) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!coverImage) {
      toast.error('Please upload a cover image for your book');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const bookData = {
        ...data,
        cover_image_url: '', // This will be replaced by the upload process
        is_available: true
      };
      
      const newBook = await addBook(bookData, coverImage);
      if (newBook) {
        toast.success('Book added successfully!');
        navigate(`/books/${newBook.id}`);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Link to="/my-books" className="inline-flex items-center gap-1 text-primary mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to My Books
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add a New Book</h1>
          <p className="text-muted-foreground">
            Share a book from your collection for exchange
          </p>
        </div>

        <SubscriptionGuard feature="adding books">
          <BookForm 
            genres={genres}
            onSubmit={handleAddBook}
            isSubmitting={isSubmitting}
          />
        </SubscriptionGuard>
      </main>
    </div>
  );
};

export default AddBookPage;
