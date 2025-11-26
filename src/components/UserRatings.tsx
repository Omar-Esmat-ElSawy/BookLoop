import React, { useState, useEffect } from 'react';
import { Star, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { UserRating } from '@/types/database.types';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserRatingsProps {
  userId: string;
  isOwnProfile: boolean;
}

export const UserRatings = ({ userId, isOwnProfile }: UserRatingsProps) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<(UserRating & { rater: { username: string; avatar_url?: string } })[]>([]);
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [userId]);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      // Fetch all ratings for this user
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('user_ratings')
        .select(`
          *,
          rater:users!user_ratings_rater_user_id_fkey(username, avatar_url)
        `)
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      setRatings(ratingsData || []);

      // If logged in and not own profile, check if user has already rated
      if (user && !isOwnProfile) {
        const { data: existingRating, error: ratingError } = await supabase
          .from('user_ratings')
          .select('*')
          .eq('rated_user_id', userId)
          .eq('rater_user_id', user.id)
          .maybeSingle();

        if (ratingError) throw ratingError;

        if (existingRating) {
          setUserRating(existingRating);
          setRatingValue(existingRating.rating);
          setComment(existingRating.comment || '');
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast.error('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!user || isOwnProfile) return;

    setSubmitting(true);
    try {
      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from('user_ratings')
          .update({
            rating: ratingValue,
            comment: comment.trim() || null,
          })
          .eq('id', userRating.id);

        if (error) throw error;
        toast.success('Rating updated successfully');
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('user_ratings')
          .insert({
            rated_user_id: userId,
            rater_user_id: user.id,
            rating: ratingValue,
            comment: comment.trim() || null,
          });

        if (error) throw error;
        toast.success('Rating added successfully');
      }

      setIsEditing(false);
      fetchRatings();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      if (error.message?.includes('violates row-level security policy')) {
        toast.error('You need an active subscription to rate users');
      } else {
        toast.error('Failed to submit rating');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userRating) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_ratings')
        .delete()
        .eq('id', userRating.id);

      if (error) throw error;

      toast.success('Rating deleted successfully');
      setUserRating(null);
      setRatingValue(5);
      setComment('');
      setIsEditing(false);
      fetchRatings();
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('Failed to delete rating');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  const renderStars = (rating: number, interactive: boolean = false, onSelect?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onSelect?.(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Ratings</CardTitle>
        <CardDescription>
          {ratings.length > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-lg font-semibold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
          ) : (
            <span>No ratings yet</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add/Edit Rating Form - Only for logged-in users viewing others' profiles */}
        {user && !isOwnProfile && (
          <SubscriptionGuard feature="user rating system">
            <div className="border rounded-lg p-4 bg-muted/50">
              {!isEditing && userRating ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Your rating:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteRating}
                        disabled={submitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {renderStars(userRating.rating)}
                  {userRating.comment && (
                    <p className="mt-2 text-sm">{userRating.comment}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rating">Your Rating</Label>
                    {renderStars(ratingValue, true, setRatingValue)}
                  </div>
                  
                  <div>
                    <Label htmlFor="comment">Comment (optional)</Label>
                    <Textarea
                      id="comment"
                      placeholder="Share your experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSubmitRating} disabled={submitting}>
                      {submitting ? 'Submitting...' : userRating ? 'Update Rating' : 'Submit Rating'}
                    </Button>
                    {isEditing && userRating && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setRatingValue(userRating.rating);
                          setComment(userRating.comment || '');
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SubscriptionGuard>
        )}

        {/* Display all ratings */}
        {ratings.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <h4 className="font-medium">All Ratings</h4>
            {ratings.map((rating) => (
              <div key={rating.id} className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={rating.rater.avatar_url || ''} />
                  <AvatarFallback>
                    {rating.rater.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{rating.rater.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(rating.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {renderStars(rating.rating)}
                  {rating.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">{rating.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
