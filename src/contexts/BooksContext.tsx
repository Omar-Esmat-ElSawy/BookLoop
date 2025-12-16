import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import supabase from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Book, BookGenre } from '@/types/database.types';
import { getSearchFactory } from '@/services/searchFactoryService';

interface BooksContextProps {
  books: Book[];
  userBooks: Book[];
  genres: BookGenre[];
  recentlyAdded: Book[];
  booksByGenre: Record<string, Book[]>;
  loading: boolean;
  addBook: (book: Omit<Book, 'id' | 'created_at' | 'owner_id'>, coverImage: File) => Promise<Book | null>;
  updateBook: (id: string, updates: Partial<Book>, coverImage?: File) => Promise<Book | null>;
  deleteBook: (id: string) => Promise<void>;
  fetchBooksByGenre: (genre: string) => Promise<Book[]>;
  searchBooks: (query: string, genreFilter?: string, searchType?: 'title' | 'author' | 'genre' | 'owner' | 'combined') => Promise<Book[]>;
  fetchBookById: (id: string) => Promise<Book | null>;
  requestBookExchange: (bookId: string, message: string, offeredBookId?: string) => Promise<boolean>;
  respondToExchangeRequest: (requestId: string, accept: boolean) => Promise<boolean>;
  cancelExchangeRequest: (requestId: string) => Promise<boolean>;
  markExchangeAsDone: (requestId: string) => Promise<boolean>;
  fetchUserRequestHistory: () => Promise<Book[]>;
  toggleBookAvailability: (bookId: string, isAvailable: boolean) => Promise<boolean>;
}

const BooksContext = createContext<BooksContextProps | undefined>(undefined);

export const BooksProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<BookGenre[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Book[]>([]);
  const [booksByGenre, setBooksByGenre] = useState<Record<string, Book[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch books and genres when user changes
  useEffect(() => {
    fetchBooks();
    fetchGenres();
    
    // Subscribe to book changes
    const booksSubscription = supabase
      .channel('books_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBook = payload.new as Book;
            setBooks(prev => [newBook, ...prev]);
            setRecentlyAdded(prev => [newBook, ...prev].slice(0, 10));
            
            // Update genre-specific lists
            if (newBook.genre) {
              setBooksByGenre(prev => ({
                ...prev,
                [newBook.genre]: [newBook, ...(prev[newBook.genre] || [])].slice(0, 12)
              }));
            }
            
            if (user && newBook.owner_id === user.id) {
              setUserBooks(prev => [newBook, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedBook = payload.new as Book;
            const oldBook = payload.old as Book;
            
            // Update main books list
            setBooks(prev => prev.map(book => 
              book.id === updatedBook.id ? updatedBook : book
            ));
            
            // Update recently added if it's there
            setRecentlyAdded(prev => prev.map(book => 
              book.id === updatedBook.id ? updatedBook : book
            ));
            
            // Update genre-specific lists
            if (oldBook.genre !== updatedBook.genre) {
              // Remove from old genre
              if (oldBook.genre && booksByGenre[oldBook.genre]) {
                setBooksByGenre(prev => ({
                  ...prev,
                  [oldBook.genre]: prev[oldBook.genre].filter(b => b.id !== updatedBook.id)
                }));
              }
              
              // Add to new genre
              if (updatedBook.genre) {
                setBooksByGenre(prev => ({
                  ...prev,
                  [updatedBook.genre]: [updatedBook, ...(prev[updatedBook.genre] || [])].slice(0, 12)
                }));
              }
            } else if (updatedBook.genre) {
              // Just update in the same genre
              setBooksByGenre(prev => ({
                ...prev,
                [updatedBook.genre]: prev[updatedBook.genre].map(book => 
                  book.id === updatedBook.id ? updatedBook : book
                )
              }));
            }
            
            // Update user books if it belongs to current user
            if (user && updatedBook.owner_id === user.id) {
              setUserBooks(prev => prev.map(book => 
                book.id === updatedBook.id ? updatedBook : book
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedBook = payload.old as Book;
            
            // Update main books list
            setBooks(prev => prev.filter(book => book.id !== deletedBook.id));
            
            // Update recently added if it's there
            setRecentlyAdded(prev => prev.filter(book => book.id !== deletedBook.id));
            
            // Update genre-specific lists
            if (deletedBook.genre && booksByGenre[deletedBook.genre]) {
              setBooksByGenre(prev => ({
                ...prev,
                [deletedBook.genre]: prev[deletedBook.genre].filter(b => b.id !== deletedBook.id)
              }));
            }
            
            // Update user books if it belongs to current user
            if (user && deletedBook.owner_id === user.id) {
              setUserBooks(prev => prev.filter(book => book.id !== deletedBook.id));
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      booksSubscription.unsubscribe();
    };
  }, [user]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      
      // Fetch all available books (excluding unavailable ones from other users)
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter to only show available books for display (except user's own books)
      const availableBooks = data.filter(book => 
        book.is_available === true || (user && book.owner_id === user.id)
      );
      
      setBooks(availableBooks);
      
      // Set recently added books (only available ones from other users)
      const recentAvailable = data.filter(book => book.is_available === true);
      setRecentlyAdded(recentAvailable.slice(0, 10));
      
      // Set user books if logged in (include all user's books regardless of availability)
      if (user) {
        const userBooks = data.filter(book => book.owner_id === user.id);
        setUserBooks(userBooks);
      }
      
      // Initialize books by genre (only available books)
      const byGenre: Record<string, Book[]> = {};
      
      // Group available books by genre
      recentAvailable.forEach(book => {
        if (book.genre) {
          if (!byGenre[book.genre]) {
            byGenre[book.genre] = [];
          }
          
          if (byGenre[book.genre].length < 12) {
            byGenre[book.genre].push(book);
          }
        }
      });
      
      setBooksByGenre(byGenre);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const { data, error } = await supabase
        .from('book_genres')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const addBook = async (
    book: Omit<Book, 'id' | 'created_at' | 'owner_id'>, 
    coverImage: File
  ): Promise<Book | null> => {
    try {
      if (!user) {
        toast.error('You must be logged in to add a book');
        return null;
      }
      
      setLoading(true);
      
      // Upload cover image
      const fileExt = coverImage.name.split('.').pop();
      const filePath = `book-covers/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('book-content')
        .upload(filePath, coverImage);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: fileData } = supabase.storage
        .from('book-content')
        .getPublicUrl(filePath);
      
      const coverUrl = fileData.publicUrl;
      
      // Create book record
      const newBook = {
        ...book,
        owner_id: user.id,
        cover_image_url: coverUrl,
        is_available: true
      };
      
      const { data, error } = await supabase
        .from('books')
        .insert(newBook)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Book added successfully');
      return data as Book;
    } catch (error: any) {
      console.error('Error adding book:', error);
      toast.error(error.message || 'Error adding book');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBook = async (
    id: string, 
    updates: Partial<Book>, 
    coverImage?: File
  ): Promise<Book | null> => {
    try {
      if (!user) {
        toast.error('You must be logged in to update a book');
        return null;
      }
      
      setLoading(true);
      
      // Check if book belongs to user
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();
      
      if (bookError) throw bookError;
      
      let coverUrl = bookData.cover_image_url;
      
      // Upload new cover image if provided
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const filePath = `book-covers/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('book-content')
          .upload(filePath, coverImage);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: fileData } = supabase.storage
          .from('book-content')
          .getPublicUrl(filePath);
        
        coverUrl = fileData.publicUrl;
      }
      
      // Update book record
      const updatedBook = {
        ...updates,
        cover_image_url: coverUrl
      };
      
      const { data, error } = await supabase
        .from('books')
        .update(updatedBook)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Book updated successfully');
      return data as Book;
    } catch (error: any) {
      console.error('Error updating book:', error);
      toast.error(error.message || 'Error updating book');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (id: string): Promise<void> => {
    try {
      if (!user) {
        toast.error('You must be logged in to delete a book');
        return;
      }
      
      setLoading(true);
      
      // Check if book belongs to user
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();
      
      if (bookError) throw bookError;
      
      // Delete book record
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Book deleted successfully');
    } catch (error: any) {
      console.error('Error deleting book:', error);
      toast.error(error.message || 'Error deleting book');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooksByGenre = async (genre: string): Promise<Book[]> => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('genre', genre)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${genre} books:`, error);
      return [];
    }
  };

  const searchBooks = async (
    query: string, 
    genreFilter?: string,
    searchType: 'title' | 'author' | 'genre' | 'owner' | 'combined' = 'combined'
  ): Promise<Book[]> => {
    try {
      let results: Book[] = [];
      
      // If we have a specific genre filter, prioritize that
      if (genreFilter && genreFilter !== 'all') {
        const genreSearchFactory = getSearchFactory('genre');
        results = await genreSearchFactory.search(genreFilter);
        
        // If we also have a search query, filter the genre results
        if (query && query.trim() !== '') {
          const searchFactory = getSearchFactory(searchType);
          const searchResults = await searchFactory.search(query);
          
          // Find the intersection of both result sets
          results = results.filter(book => 
            searchResults.some(searchBook => searchBook.id === book.id)
          );
        }
      } else {
        // Just perform the search by the specified type
        if (query && query.trim() !== '') {
          const searchFactory = getSearchFactory(searchType);
          results = await searchFactory.search(query);
        } else {
          // No query and no genre, return all books
          results = books;
        }
      }
      
      // Exclude user's own books and unavailable books from search results
      if (user) {
        results = results.filter(book => book.owner_id !== user.id && book.is_available !== false);
      } else {
        results = results.filter(book => book.is_available !== false);
      }
      
      return results;
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  };

  const fetchBookById = async (id: string): Promise<Book | null> => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data as Book;
    } catch (error) {
      console.error('Error fetching book:', error);
      return null;
    }
  };

  const requestBookExchange = async (bookId: string, message: string, offeredBookId?: string): Promise<boolean> => {
    try {
      if (!user) {
        toast.error('You must be logged in to request a book exchange');
        return false;
      }
      
      // Get book details first to know the owner
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();
      
      if (bookError) throw bookError;
      
      const book = bookData as Book;
      
      // Get offered book details if provided
      let offeredBook: Book | null = null;
      if (offeredBookId) {
        const { data: offeredBookData, error: offeredBookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', offeredBookId)
          .single();
        
        if (!offeredBookError && offeredBookData) {
          offeredBook = offeredBookData as Book;
        }
      }
      
      // Check if user already has a pending request for this book
      const { data: existingRequests, error: checkError } = await supabase
        .from('exchange_requests')
        .select('id')
        .eq('book_id', bookId)
        .eq('requester_id', user.id)
        .eq('status', 'pending');
      
      if (checkError) throw checkError;
      
      if (existingRequests && existingRequests.length > 0) {
        toast.error('You already have a pending request for this book');
        return false;
      }
      
      // Create exchange request with offered book
      const { error } = await supabase
        .from('exchange_requests')
        .insert({
          book_id: bookId,
          requester_id: user.id,
          status: 'pending',
          message,
          offered_book_id: offeredBookId || null
        });
      
      if (error) {
        console.error('Error creating exchange request:', error);
        throw error;
      }

      // Build message content
      let messageContent = `Hi! I'm interested in your book "${book.title}".`;
      if (offeredBook) {
        messageContent += ` I'd like to offer my book "${offeredBook.title}" in exchange.`;
      }
      if (message) {
        messageContent += ` Message: ${message}`;
      }

      // Send a direct message to the book owner about the exchange request
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: book.owner_id,
          content: messageContent,
          is_read: false
        });

      if (messageError) {
        console.error('Error sending message to book owner:', messageError);
        // Don't throw here - the exchange request was created successfully
        toast.error('Exchange request created but failed to notify the owner');
      }
      
      toast.success('Exchange request sent successfully');
      return true;
    } catch (error: any) {
      console.error('Error requesting book exchange:', error);
      toast.error(error.message || 'Error sending exchange request');
      return false;
    }
  };

  const cancelExchangeRequest = async (requestId: string): Promise<boolean> => {
    try {
      if (!user) {
        toast.error('You must be logged in to cancel exchange requests');
        return false;
      }
      
      // Get request details
      const { data: request, error: requestError } = await supabase
        .from('exchange_requests')
        .select('*, book:books!exchange_requests_book_id_fkey(*)')
        .eq('id', requestId)
        .single();
      
      if (requestError) throw requestError;
      
      const book = request.book as Book;
      const isOwner = book.owner_id === user.id;
      const isRequester = request.requester_id === user.id;
      
      if (!isOwner && !isRequester) {
        toast.error('You can only cancel your own exchange requests');
        return false;
      }
      
      // Update request status to cancelled
      const { error: updateError } = await supabase
        .from('exchange_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // If the request was accepted, make BOTH books available again using database function
      if (request.status === 'accepted') {
        const { error: availabilityError } = await supabase
          .rpc('cancel_exchange_and_mark_books_available', {
            p_book_id: book.id,
            p_offered_book_id: request.offered_book_id
          });
        
        if (availabilityError) {
          console.error('Error updating book availability:', availabilityError);
        }
      }
      
      // Notify the other party
      const notifyUserId = isOwner ? request.requester_id : book.owner_id;
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: notifyUserId,
          type: 'exchange_cancelled',
          content: `Exchange request for "${book.title}" has been cancelled`,
          is_read: false,
          related_id: book.id
        });
      
      if (notificationError) console.error('Error creating notification:', notificationError);
      
      toast.success('Exchange request cancelled');
      return true;
    } catch (error: any) {
      console.error('Error cancelling exchange request:', error);
      toast.error(error.message || 'Error cancelling exchange request');
      return false;
    }
  };

  const markExchangeAsDone = async (requestId: string): Promise<boolean> => {
    try {
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }
      
      // Get request details
      const { data: request, error: requestError } = await supabase
        .from('exchange_requests')
        .select('*, book:books!exchange_requests_book_id_fkey(*)')
        .eq('id', requestId)
        .single();
      
      if (requestError) throw requestError;
      
      const book = request.book as Book;
      const isOwner = book.owner_id === user.id;
      const isRequester = request.requester_id === user.id;
      
      if (!isOwner && !isRequester) {
        toast.error('You can only complete your own exchanges');
        return false;
      }
      
      if (request.status !== 'accepted') {
        toast.error('Only accepted exchanges can be marked as done');
        return false;
      }
      
      // Update request status to done
      const { error: updateError } = await supabase
        .from('exchange_requests')
        .update({ status: 'done' })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // Mark BOTH books as unavailable (remove from system)
      await supabase
        .from('books')
        .update({ is_available: false })
        .eq('id', book.id);
      
      if (request.offered_book_id) {
        await supabase
          .from('books')
          .update({ is_available: false })
          .eq('id', request.offered_book_id);
      }
      
      // Notify the other party
      const notifyUserId = isOwner ? request.requester_id : book.owner_id;
      await supabase
        .from('notifications')
        .insert({
          user_id: notifyUserId,
          type: 'exchange_done',
          content: `Exchange for "${book.title}" has been completed!`,
          is_read: false,
          related_id: book.id
        });
      
      toast.success('Exchange marked as done!');
      return true;
    } catch (error: any) {
      console.error('Error marking exchange as done:', error);
      toast.error(error.message || 'Error completing exchange');
      return false;
    }
  };

  const respondToExchangeRequest = async (requestId: string, accept: boolean): Promise<boolean> => {
    try {
      if (!user) {
        toast.error('You must be logged in to respond to exchange requests');
        return false;
      }
      
      // Get request details - explicitly specify the foreign key to use
      const { data: request, error: requestError } = await supabase
        .from('exchange_requests')
        .select('*, book:books!exchange_requests_book_id_fkey(*)')
        .eq('id', requestId)
        .single();
      
      if (requestError) throw requestError;
      
      // Check if user is the book owner
      const book = request.book as Book;
      
      if (book.owner_id !== user.id) {
        toast.error('You can only respond to requests for your own books');
        return false;
      }
      
      // Update request status
      const newStatus = accept ? 'accepted' : 'rejected';
      
      const { error: updateError } = await supabase
        .from('exchange_requests')
        .update({ status: newStatus })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // Update book availability if accepted - make BOTH books unavailable using database function
      if (accept) {
        const { error: availabilityError } = await supabase
          .rpc('accept_exchange_and_mark_books_unavailable', {
            p_request_id: requestId,
            p_book_id: book.id,
            p_offered_book_id: request.offered_book_id
          });
        
        if (availabilityError) {
          console.error('Error updating book availability:', availabilityError);
          throw availabilityError;
        }
      }
      
      // Create notification for requester
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.requester_id,
          type: 'exchange_response',
          content: `Your request for "${book.title}" has been ${accept ? 'accepted' : 'rejected'}`,
          is_read: false,
          related_id: book.id
        });
      
      if (notificationError) throw notificationError;
      
      toast.success(`Exchange request ${accept ? 'accepted' : 'rejected'} successfully`);
      return true;
    } catch (error: any) {
      console.error('Error responding to exchange request:', error);
      toast.error(error.message || 'Error responding to exchange request');
      return false;
    }
  };

  const fetchUserRequestHistory = async (): Promise<Book[]> => {
    try {
      if (!user) return [];

      // Fetch all exchange requests made by the user
      const { data: requests, error } = await supabase
        .from('exchange_requests')
        .select('book_id')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!requests || requests.length === 0) return [];

      // Get unique book IDs
      const bookIds = [...new Set(requests.map(r => r.book_id))];

      // Fetch the actual book data
      const { data: requestedBooks, error: booksError } = await supabase
        .from('books')
        .select('*')
        .in('id', bookIds);

      if (booksError) throw booksError;

      return (requestedBooks as Book[]) || [];
    } catch (error) {
      console.error('Error fetching user request history:', error);
      return [];
    }
  };

  const toggleBookAvailability = async (bookId: string, isAvailable: boolean): Promise<boolean> => {
    try {
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }
      
      // Verify user owns the book
      const { data: book, error: checkError } = await supabase
        .from('books')
        .select('owner_id')
        .eq('id', bookId)
        .single();
      
      if (checkError) throw checkError;
      
      if (book.owner_id !== user.id) {
        toast.error('You can only change availability of your own books');
        return false;
      }
      
      const { error } = await supabase
        .from('books')
        .update({ is_available: isAvailable })
        .eq('id', bookId);
      
      if (error) throw error;
      
      toast.success(`Book marked as ${isAvailable ? 'available' : 'unavailable'}`);
      return true;
    } catch (error: any) {
      console.error('Error toggling book availability:', error);
      toast.error(error.message || 'Error updating book availability');
      return false;
    }
  };

  const value = {
    books,
    userBooks,
    genres,
    recentlyAdded,
    booksByGenre,
    loading,
    addBook,
    updateBook,
    deleteBook,
    fetchBooksByGenre,
    searchBooks,
    fetchBookById,
    requestBookExchange,
    respondToExchangeRequest,
    cancelExchangeRequest,
    markExchangeAsDone,
    fetchUserRequestHistory,
    toggleBookAvailability
  };

  return (
    <BooksContext.Provider value={value}>
      {children}
    </BooksContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
};
