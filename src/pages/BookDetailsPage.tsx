
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Lock, Phone, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import ExchangeRequestDialog from '@/components/ExchangeRequestDialog';
import { useBooks } from '@/contexts/BooksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Book, User } from '@/types/database.types';
import { toast } from 'sonner';
import supabase from '@/lib/supabase';

import { useNavigate } from 'react-router-dom';

const BookDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, loading: subLoading, createCheckoutSession } = useSubscription();
  const { fetchBookById } = useBooks();
  const [book, setBook] = useState<Book | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [ownerRating, setOwnerRating] = useState<{ average: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const bookData = await fetchBookById(id);
        if (bookData) {
          setBook(bookData);
          
          // Fetch owner details - always fetch all fields, display based on subscription
          const { data: ownerData, error: ownerError } = await supabase
            .from('users')
            .select('id, username, avatar_url, created_at, phone_number, location_city')
            .eq('id', bookData.owner_id)
            .maybeSingle();
          
          if (ownerError) throw ownerError;
          setOwner(ownerData as unknown as User);

          // Fetch owner's ratings
          const { data: ratingsData, error: ratingsError } = await supabase
            .from('user_ratings')
            .select('rating')
            .eq('rated_user_id', bookData.owner_id);

          if (!ratingsError && ratingsData && ratingsData.length > 0) {
            const average = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
            setOwnerRating({ average, count: ratingsData.length });
          }
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
        toast.error('Failed to load book details');
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id, fetchBookById, subscribed]);


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
              The book you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/books">
              <Button>Browse Books</Button>
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
        <Link to="/books" className="inline-flex items-center gap-1 text-primary mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Books
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="md:col-span-1">
            <div className="rounded-lg overflow-hidden border aspect-[2/3] bg-muted">
              <img 
                src={book.cover_image_url || '/placeholder.svg'}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="mt-4 space-y-3">
              {user && user.id !== book.owner_id ? (
                <>
                  {subscribed ? (
                    <>
                      <Button 
                        className="w-full" 
                        disabled={!book.is_available}
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Request Exchange
                      </Button>
                      <ExchangeRequestDialog 
                        book={book}
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                      />
                    </>
                  ) : (
                    <Card className="border-2 border-muted">
                      <CardHeader className="text-center p-4">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-base">Subscription Required</CardTitle>
                        <CardDescription className="text-sm">
                          Subscribe to request exchanges and message owners
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Button 
                          onClick={createCheckoutSession}
                          className="w-full"
                          size="sm"
                        >
                          Subscribe - 20 EGP/month
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : user && user.id === book.owner_id && (
                <Link to={`/books/edit/${book.id}`}>
                  <Button className="w-full">Edit Book</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="md:col-span-2">
            {!book.is_available && (
              <Badge variant="secondary" className="mb-4">
                Not Available
              </Badge>
            )}
            
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8">
              <div>
                <p className="text-sm font-medium">Genre</p>
                <p>{book.genre}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Condition</p>
                <p>{book.condition}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Added</p>
                <p>{format(new Date(book.created_at), 'MMMM d, yyyy')}</p>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="whitespace-pre-line">{book.description}</p>
            </div>
            
            <Separator className="my-6" />
            
            {/* Book Owner */}
            {owner && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Book Owner</h2>
                {subscribed ? (
                  <div className="space-y-4">
                    <Link 
                      to={`/profile/${owner.id}`}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-secondary/50 transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={owner.avatar_url || ''} alt={owner.username} />
                        <AvatarFallback>{owner.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{owner.username}</p>
                        <p className="text-sm text-muted-foreground">
                          View profile
                        </p>
                      </div>
                    </Link>

                    {/* Owner Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg border bg-muted/30">
                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">Rating:</span>
                        {ownerRating ? (
                          <span className="text-sm">
                            {ownerRating.average.toFixed(1)} ({ownerRating.count} {ownerRating.count === 1 ? 'review' : 'reviews'})
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No ratings yet</span>
                        )}
                      </div>

                      {/* Phone Number */}
                      {owner.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Phone:</span>
                          <a href={`tel:${owner.phone_number}`} className="text-sm text-primary hover:underline">
                            {owner.phone_number}
                          </a>
                        </div>
                      )}

                      {/* Location */}
                      {owner.location_city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Location:</span>
                          <span className="text-sm">{owner.location_city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card className="border-2 border-muted">
                    <CardHeader className="text-center p-4">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-base">Subscription Required</CardTitle>
                      <CardDescription className="text-sm">
                        Subscribe to view owner details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Button 
                        onClick={createCheckoutSession}
                        className="w-full"
                        size="sm"
                      >
                        Subscribe - 20 EGP/month
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t mt-auto py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Book Loop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BookDetailsPage;
