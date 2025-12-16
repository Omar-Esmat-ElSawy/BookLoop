
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, FilterX, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import NavBar from '@/components/NavBar';
import BookGrid from '@/components/BookGrid';
import BookRecommendations from '@/components/BookRecommendations';
import { useBooks } from '@/contexts/BooksContext';
import { useAuth } from '@/contexts/AuthContext';
import { Book } from '@/types/database.types';
import { RecommendationService } from '@/services/recommendationService';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

const BooksPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { books, genres, searchBooks, loading, fetchUserRequestHistory } = useBooks();
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'title' | 'author' | 'genre' | 'owner' | 'combined'>('combined');
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [userRequestHistory, setUserRequestHistory] = useState<Book[]>([]);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(50); // km
  const [userBooks, setUserBooks] = useState<Book[]>([]);

  // Fetch user request history on mount
  useEffect(() => {
    const loadUserHistory = async () => {
      const history = await fetchUserRequestHistory();
      setUserRequestHistory(history);
    };
    loadUserHistory();
  }, []);

  // Parse query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchParam = queryParams.get('search');
    const genreParam = queryParams.get('genre');
    const typeParam = queryParams.get('type') as 'title' | 'author' | 'genre' | 'owner' | 'combined' | null;
    
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    
    if (genreParam) {
      setSelectedGenre(genreParam);
    }
    
    if (typeParam) {
      setSearchType(typeParam);
    }
    
    // Perform search based on URL parameters
    if (searchParam || genreParam) {
      performSearch(searchParam || '', genreParam || '', typeParam || 'combined');
    } else {
      setSearchResults(books);
    }
  }, [location.search, books]);

  const performSearch = async (query: string, genre: string, type: 'title' | 'author' | 'genre' | 'owner' | 'combined') => {
    setIsSearching(true);
    try {
      let results = await searchBooks(query, genre, type);
      
      // searchBooks already excludes user's own books, so we need to find user's matching books separately
      if (user && query.trim()) {
        // Get user's books that match the search query from the context's books
        const userBooksFromContext = books.filter(book => book.owner_id === user.id);
        const queryNormalized = query.trim().toLowerCase();
        const matchingUserBooks = userBooksFromContext.filter(book => 
          book.title.toLowerCase().includes(queryNormalized) ||
          book.title.includes(query.trim()) || // Direct match for non-Latin scripts like Arabic
          book.author.toLowerCase().includes(queryNormalized) ||
          book.author.includes(query.trim()) ||
          (book.genre && (book.genre.toLowerCase().includes(queryNormalized) || book.genre.includes(query.trim())))
        );
        console.log('User books found:', userBooksFromContext.length, 'Matching:', matchingUserBooks.length, 'Query:', query);
        setUserBooks(matchingUserBooks);
      } else {
        setUserBooks([]);
      }
      
      // Apply location-based filtering if enabled
      if (useLocationFilter && user?.latitude && user?.longitude) {
        results = await filterBooksByLocation(results);
      }
      
      setSearchResults(results);
      
      // Generate recommendations based on search results and user history
      if (query.trim().length >= 2 || genre) {
        const resultIds = results.map(b => b.id);
        const recommendedBooks = RecommendationService.getRecommendations(books, {
          searchQuery: query,
          currentGenre: genre && genre !== 'all' ? genre : undefined,
          excludeBookIds: resultIds,
          limit: 6,
          userRequestHistory
        });
        setRecommendations(recommendedBooks);
        setShowRecommendations(recommendedBooks.length > 0);
      } else {
        setShowRecommendations(false);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const filterBooksByLocation = async (booksToFilter: Book[]) => {
    if (!user?.latitude || !user?.longitude) return booksToFilter;

    try {
      // Exclude user's own books
      const otherUsersBooks = booksToFilter.filter(book => book.owner_id !== user.id);
      
      // Get owner IDs
      const ownerIds = [...new Set(otherUsersBooks.map(b => b.owner_id))];
      
      // Fetch owner locations
      const { data: owners, error } = await supabase
        .from('users')
        .select('id, latitude, longitude, location_city')
        .in('id', ownerIds);

      if (error) throw error;

      // Calculate distances and filter
      const booksWithDistance = otherUsersBooks
        .map(book => {
          const owner = owners?.find(o => o.id === book.owner_id);
          if (!owner?.latitude || !owner?.longitude) {
            return { book, distance: Infinity };
          }

          // Simple haversine distance calculation
          const distance = calculateDistance(
            user.latitude!,
            user.longitude!,
            owner.latitude,
            owner.longitude
          );

          return { book, distance };
        })
        .filter(item => item.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .map(item => item.book);

      if (booksWithDistance.length === 0) {
        toast.info(`No books found within ${maxDistance}km. Showing all results.`);
        return booksToFilter;
      }

      return booksWithDistance;
    } catch (error) {
      console.error('Error filtering by location:', error);
      return booksToFilter;
    }
  };

  // Simple haversine distance calculation (client-side)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Re-run search when location filter changes
  useEffect(() => {
    if (searchQuery || selectedGenre) {
      performSearch(searchQuery, selectedGenre, searchType);
    } else if (useLocationFilter && user?.latitude && user?.longitude) {
      // Apply location filter to all books
      filterBooksByLocation(books).then(setSearchResults);
    } else {
      setSearchResults(books);
    }
  }, [useLocationFilter, maxDistance]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, selectedGenre, searchType);
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (searchType !== 'combined') params.set('type', searchType);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `/books${newUrl}`);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Show recommendations when user starts typing
    if (value.trim().length >= 2) {
      const recommendedBooks = RecommendationService.getRecommendations(books, {
        searchQuery: value,
        currentGenre: selectedGenre && selectedGenre !== 'all' ? selectedGenre : undefined,
        limit: 6,
        userRequestHistory
      });
      setRecommendations(recommendedBooks);
      setShowRecommendations(true);
    } else {
      setShowRecommendations(false);
      setRecommendations([]);
    }
  };

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    performSearch(searchQuery, value, searchType);
    
    // Update URL with genre parameter
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (value) params.set('genre', value);
    if (searchType !== 'combined') params.set('type', searchType);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `/books${newUrl}`);
  };

  const handleSearchTypeChange = (value: 'title' | 'author' | 'genre' | 'owner' | 'combined') => {
    setSearchType(value);
    performSearch(searchQuery, selectedGenre, value);
    
    // Update URL with type parameter
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (value !== 'combined') params.set('type', value);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `/books${newUrl}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSearchType('combined');
    setUseLocationFilter(false);
    setMaxDistance(50);
    setSearchResults(books);
    setShowRecommendations(false);
    setRecommendations([]);
    window.history.pushState({}, '', '/books');
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      <NavBar />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Browse Books</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search books..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                />
              </div>
              <Select value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.name}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={searchType} onValueChange={handleSearchTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">All Fields</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="genre">Genre</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              
              {user?.latitude && user?.longitude && (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="location-filter" className="text-sm cursor-pointer whitespace-nowrap">
                    Near me
                  </Label>
                  <Switch
                    id="location-filter"
                    checked={useLocationFilter}
                    onCheckedChange={setUseLocationFilter}
                  />
                  {useLocationFilter && (
                    <Select value={maxDistance.toString()} onValueChange={(v) => setMaxDistance(Number(v))}>
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="25">25 km</SelectItem>
                        <SelectItem value="50">50 km</SelectItem>
                        <SelectItem value="100">100 km</SelectItem>
                        <SelectItem value="200">200 km</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              
              <Button type="submit">Search</Button>
              {(searchQuery || selectedGenre || searchType !== 'combined') && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="gap-1"
                >
                  <FilterX className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </form>
          </div>
        </div>

        {isSearching || loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : (
          <>
            {showRecommendations && recommendations.length > 0 && (
              <BookRecommendations 
                books={recommendations}
                title="Recommended for you"
                subtitle={userRequestHistory.length > 0 
                  ? "Based on your reading preferences and search" 
                  : "Based on your search"
                }
              />
            )}
            
            {searchResults.length > 0 && (
              <BookGrid books={searchResults} />
            )}
            
            {/* Your Books section - shown when searching and user has matching books */}
            {userBooks.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-xl font-semibold mb-4">Your Books</h2>
                <BookGrid books={userBooks} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Book Loop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BooksPage;
