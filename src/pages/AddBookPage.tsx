
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BookForm from '@/components/BookForm';
import NavBar from '@/components/NavBar';
import { useBooks } from '@/contexts/BooksContext';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const AddBookPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { genres, addBook } = useBooks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

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
      toast.error(t('addBook.uploadCoverError'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      const bookData = {
        ...data,
        cover_image_url: '',
        is_available: true
      };
      
      const newBook = await addBook(bookData, coverImage);
      if (newBook) {
        toast.success(t('addBook.success'));
        navigate(`/books/${newBook.id}`);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error(t('addBook.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Link to="/my-books" className="inline-flex items-center gap-1 text-primary mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('common.backToMyBooks')}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('addBook.title')}</h1>
          <p className="text-muted-foreground">
            {t('addBook.description')}
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
