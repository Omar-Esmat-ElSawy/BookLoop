
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import BookForm from '@/components/BookForm';
import NavBar from '@/components/NavBar';
import { useBooks } from '@/contexts/BooksContext';
import { useAuth } from '@/contexts/AuthContext';
import { Book } from '@/types/database.types';
import { toast } from 'sonner';

const EditBookPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { genres, fetchBookById, updateBook, deleteBook } = useBooks();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const bookData = await fetchBookById(id);
        
        if (!bookData) {
          toast.error('Book not found');
          navigate('/my-books');
          return;
        }
        
        // Check if the user is the owner
        if (user && bookData.owner_id !== user.id) {
          toast.error('You do not have permission to edit this book');
          navigate('/books');
          return;
        }
        
        setBook(bookData);
      } catch (error) {
        console.error('Error fetching book details:', error);
        toast.error('Failed to load book details');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadBook();
    }
  }, [id, user, fetchBookById, navigate]);

  const handleUpdateBook = async (
    data: {
      title: string;
      author: string;
      description: string;
      genre: string;
      condition: string;
    }, 
    coverImage: File | null
  ) => {
    if (!id || !book || !user) return;
    
    setIsSubmitting(true);
    try {
      const updatedBook = await updateBook(id, data, coverImage || undefined);
      if (updatedBook) {
        toast.success('Book updated successfully');
        navigate(`/books/${updatedBook.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!id || !user) return;
    
    setIsDeleting(true);
    try {
      await deleteBook(id);
      toast.success('Book deleted successfully');
      navigate('/my-books');
    } finally {
      setIsDeleting(false);
    }
  };

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Book not found</h2>
            <p className="mb-6 text-muted-foreground">
              The book you're trying to edit doesn't exist or has been removed.
            </p>
            <Link to="/my-books">
              <Button>My Books</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Link to={`/books/${book.id}`} className="inline-flex items-center gap-1 text-primary mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Book Details
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Edit Book</h1>
            <p className="text-muted-foreground">
              Update your book details
            </p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-1">
                <Trash className="h-4 w-4" />
                Delete Book
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your book 
                  and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteBook}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <BookForm 
          book={book}
          genres={genres}
          onSubmit={handleUpdateBook}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  );
};

export default EditBookPage;
