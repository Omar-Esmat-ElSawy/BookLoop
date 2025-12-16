import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Check, CheckCircle, X, MessageCircle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { useBooks } from '@/contexts/BooksContext';
import { Book, User, ExchangeRequest } from '@/types/database.types';
import { toast } from 'sonner';
import supabase from '@/lib/supabase';

interface ExchangeRequestWithDetails extends ExchangeRequest {
  book: Book;
  offeredBook?: Book;
  requester: User;
}

interface ReceivedRequest {
  id: string;
  created_at: string;
  status: string;
  message?: string;
  book: Book;
  offeredBook?: Book;
  requester: User;
}

const ExchangeRequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { respondToExchangeRequest, cancelExchangeRequest, markExchangeAsDone } = useBooks();
  const [receivedRequests, setReceivedRequests] = useState<ReceivedRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ExchangeRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch requests for books I own (received requests)
      const { data: myBooks, error: booksError } = await supabase
        .from('books')
        .select('id')
        .eq('owner_id', user.id);

      if (booksError) throw booksError;

      const myBookIds = myBooks?.map(b => b.id) || [];

      if (myBookIds.length > 0) {
        const { data: received, error: receivedError } = await supabase
          .from('exchange_requests')
          .select(`
            id,
            created_at,
            status,
            message,
            book_id,
            requester_id,
            offered_book_id
          `)
          .in('book_id', myBookIds)
          .order('created_at', { ascending: false });

        if (receivedError) throw receivedError;

        // Fetch additional details for received requests
        const receivedWithDetails = await Promise.all(
          (received || []).map(async (req) => {
            const [bookRes, requesterRes, offeredBookRes] = await Promise.all([
              supabase.from('books').select('*').eq('id', req.book_id).single(),
              supabase.from('users').select('id, username, avatar_url').eq('id', req.requester_id).single(),
              req.offered_book_id 
                ? supabase.from('books').select('*').eq('id', req.offered_book_id).single()
                : Promise.resolve({ data: null })
            ]);

            return {
              ...req,
              book: bookRes.data as Book,
              offeredBook: offeredBookRes.data as Book | undefined,
              requester: requesterRes.data as User
            };
          })
        );

        setReceivedRequests(receivedWithDetails);
      }

      // Fetch requests I sent
      const { data: sent, error: sentError } = await supabase
        .from('exchange_requests')
        .select(`
          id,
          created_at,
          status,
          message,
          book_id,
          requester_id,
          offered_book_id
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Fetch additional details for sent requests
      const sentWithDetails = await Promise.all(
        (sent || []).map(async (req) => {
          const [bookRes, ownerRes, offeredBookRes] = await Promise.all([
            supabase.from('books').select('*').eq('id', req.book_id).single(),
            supabase.from('books').select('owner_id').eq('id', req.book_id).single()
              .then(async (b) => {
                if (b.data?.owner_id) {
                  return supabase.from('users').select('id, username, avatar_url').eq('id', b.data.owner_id).single();
                }
                return { data: null };
              }),
            req.offered_book_id 
              ? supabase.from('books').select('*').eq('id', req.offered_book_id).single()
              : Promise.resolve({ data: null })
          ]);

          return {
            ...req,
            book: bookRes.data as Book,
            offeredBook: offeredBookRes.data as Book | undefined,
            requester: ownerRes.data as User
          };
        })
      );

      setSentRequests(sentWithDetails);
    } catch (error) {
      console.error('Error fetching exchange requests:', error);
      toast.error('Failed to load exchange requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, accept: boolean) => {
    setResponding(requestId);
    try {
      const success = await respondToExchangeRequest(requestId, accept);
      if (success) {
        await fetchRequests();
      }
    } finally {
      setResponding(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setCancelling(requestId);
    try {
      const success = await cancelExchangeRequest(requestId);
      if (success) {
        await fetchRequests();
      }
    } finally {
      setCancelling(null);
    }
  };

  const handleMarkAsDone = async (requestId: string) => {
    setCompleting(requestId);
    try {
      const success = await markExchangeAsDone(requestId);
      if (success) {
        await fetchRequests();
      }
    } finally {
      setCompleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      case 'done':
        return <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">Done</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Please log in to view exchange requests</p>
          <Link to="/login">
            <Button className="mt-4">Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Link to="/my-books" className="inline-flex items-center gap-1 text-primary mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to My Books
        </Link>

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <ArrowRightLeft className="h-8 w-8" />
          Exchange Requests
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="received">
                Received ({receivedRequests.filter(r => r.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent ({sentRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {receivedRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No exchange requests received yet</p>
                  </CardContent>
                </Card>
              ) : (
                receivedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.requester?.avatar_url || ''} />
                            <AvatarFallback>
                              {request.requester?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {request.requester?.username || 'Unknown User'}
                            </CardTitle>
                            <CardDescription>
                              {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">They want your book</p>
                          <Link to={`/books/${request.book?.id}`} className="hover:underline">
                            <p className="font-medium">{request.book?.title}</p>
                            <p className="text-sm text-muted-foreground">by {request.book?.author}</p>
                          </Link>
                        </div>
                        {request.offeredBook && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">They're offering</p>
                            <Link to={`/books/${request.offeredBook.id}`} className="hover:underline">
                              <p className="font-medium">{request.offeredBook.title}</p>
                              <p className="text-sm text-muted-foreground">by {request.offeredBook.author}</p>
                            </Link>
                          </div>
                        )}
                      </div>

                      {request.message && (
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-sm italic">"{request.message}"</p>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleResponse(request.id, true)}
                              disabled={responding === request.id}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept Exchange
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleResponse(request.id, false)}
                              disabled={responding === request.id}
                              className="flex-1"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/messages/${request.requester?.id}`)}
                            className="w-full"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message {request.requester?.username} to discuss
                          </Button>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <div className="flex flex-col gap-3">
                          <Button 
                            onClick={() => handleMarkAsDone(request.id)}
                            disabled={completing === request.id}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            The exchange is done
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/messages/${request.requester?.id}`)}
                            className="w-full"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message {request.requester?.username}
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleCancel(request.id)}
                            disabled={cancelling === request.id}
                            className="w-full"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Exchange
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">You haven't sent any exchange requests yet</p>
                    <Link to="/books">
                      <Button className="mt-4">Browse Books</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardDescription>
                          {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                        </CardDescription>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">You want</p>
                          <Link to={`/books/${request.book?.id}`} className="hover:underline">
                            <p className="font-medium">{request.book?.title}</p>
                            <p className="text-sm text-muted-foreground">by {request.book?.author}</p>
                          </Link>
                        </div>
                        {request.offeredBook && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">You're offering</p>
                            <Link to={`/books/${request.offeredBook.id}`} className="hover:underline">
                              <p className="font-medium">{request.offeredBook.title}</p>
                              <p className="text-sm text-muted-foreground">by {request.offeredBook.author}</p>
                            </Link>
                          </div>
                        )}
                      </div>

                      {request.message && (
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-sm italic">Your message: "{request.message}"</p>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <Button 
                          onClick={() => handleMarkAsDone(request.id)}
                          disabled={completing === request.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          The exchange is done
                        </Button>
                      )}

                      {(request.status === 'pending' || request.status === 'accepted') && (
                        <Button 
                          variant="destructive"
                          onClick={() => handleCancel(request.id)}
                          disabled={cancelling === request.id}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Request
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ExchangeRequestsPage;
