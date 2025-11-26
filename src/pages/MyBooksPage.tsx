
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import NavBar from '@/components/NavBar';
import BookGrid from '@/components/BookGrid';
import { useBooks } from '@/contexts/BooksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Book, ExchangeRequest } from '@/types/database.types';
import supabase from '@/lib/supabase';
import { useIsMobile } from '@/hooks/use-mobile';

const MyBooksPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, createCheckoutSession } = useSubscription();
  const { userBooks, loading } = useBooks();
  const [incomingRequests, setIncomingRequests] = useState<(ExchangeRequest & { book: Book })[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<(ExchangeRequest & { book: Book })[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      
      setLoadingRequests(true);
      try {
        // Fetch incoming requests for user's books
        const { data: incoming, error: incomingError } = await supabase
          .from('exchange_requests')
          .select(`
            *,
            book:book_id (*)
          `)
          .in('book_id', userBooks.map(book => book.id));
        
        if (incomingError) throw incomingError;
        
        // Fetch outgoing requests from user
        const { data: outgoing, error: outgoingError } = await supabase
          .from('exchange_requests')
          .select(`
            *,
            book:book_id (*)
          `)
          .eq('requester_id', user.id);
        
        if (outgoingError) throw outgoingError;
        
        // Filter out any requests with undefined book data
        const validIncoming = (incoming || []).filter(req => req.book);
        const validOutgoing = (outgoing || []).filter(req => req.book);
        
        setIncomingRequests(validIncoming as (ExchangeRequest & { book: Book })[]);
        setOutgoingRequests(validOutgoing as (ExchangeRequest & { book: Book })[]);
      } catch (error) {
        console.error('Error fetching exchange requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    if (userBooks.length > 0) {
      fetchRequests();
    } else {
      setLoadingRequests(false);
    }
  }, [user, userBooks]);

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <NavBar />

      <main className="container mx-auto px-4 py-6 md:py-8 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">My Books</h1>
          {subscribed ? (
            <Link to="/books/add">
              <Button className="gap-1 w-full md:w-auto">
                <Plus className="h-4 w-4" />
                Add Book
              </Button>
            </Link>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className="gap-1 w-full md:w-auto" 
                    onClick={createCheckoutSession}
                  >
                    <Lock className="h-4 w-4" />
                    Add Book
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Subscribe to add books</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <Tabs defaultValue="my-books" className="w-full">
          <TabsList className="mb-6 w-full md:w-auto flex">
            <TabsTrigger value="my-books" className="flex-1 md:flex-none">My Books</TabsTrigger>
            <TabsTrigger value="incoming-requests" className="flex-1 md:flex-none">
              Incoming
              {incomingRequests.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {incomingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing-requests" className="flex-1 md:flex-none">
              Sent
              {outgoingRequests.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {outgoingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-books">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : (
              <BookGrid 
                books={userBooks} 
                emptyMessage="You haven't added any books yet" 
              />
            )}
          </TabsContent>
          
          <TabsContent value="incoming-requests">
            {loadingRequests ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : incomingRequests.length > 0 ? (
              <div className="space-y-4">
                {incomingRequests.map(request => (
                  <div key={request.id} className="border rounded-lg p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4">
                    <div className="shrink-0 flex justify-center md:block">
                      {request.book && (
                        <img
                          src={request.book.cover_image_url}
                          alt={request.book.title}
                          className="w-20 h-28 md:w-24 md:h-32 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm md:text-base">{request.book?.title || 'Untitled Book'}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2">Status: {request.status}</p>
                      {request.message && (
                        <p className="text-xs md:text-sm border-l-2 pl-3 py-1 mb-2 md:mb-3 italic line-clamp-2 md:line-clamp-none">"{request.message}"</p>
                      )}
                      <div className="flex gap-2">
                        <Link to={`/books/${request.book_id}`}>
                          <Button variant="outline" size={isMobile ? "sm" : "default"}>View Book</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No incoming exchange requests</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="outgoing-requests">
            {loadingRequests ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : outgoingRequests.length > 0 ? (
              <div className="space-y-4">
                {outgoingRequests.map(request => (
                  <div key={request.id} className="border rounded-lg p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4">
                    <div className="shrink-0 flex justify-center md:block">
                      {request.book && (
                        <img
                          src={request.book.cover_image_url}
                          alt={request.book.title}
                          className="w-20 h-28 md:w-24 md:h-32 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm md:text-base">{request.book?.title || 'Untitled Book'}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2">
                        Status: <span className={
                          request.status === 'accepted' ? 'text-green-600' :
                          request.status === 'rejected' ? 'text-destructive' :
                          ''
                        }>{request.status}</span>
                      </p>
                      {request.message && (
                        <p className="text-xs md:text-sm border-l-2 pl-3 py-1 mb-2 md:mb-3 italic line-clamp-2 md:line-clamp-none">"{request.message}"</p>
                      )}
                      <div className="flex gap-2">
                        <Link to={`/books/${request.book_id}`}>
                          <Button variant="outline" size={isMobile ? "sm" : "default"}>View Book</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No outgoing exchange requests</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t mt-auto py-4 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Book Loop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MyBooksPage;
