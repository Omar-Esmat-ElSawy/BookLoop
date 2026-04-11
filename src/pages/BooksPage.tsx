
import React, { useState, useEffect, useRef } from 'react';
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
import { useTranslation } from 'react-i18next';

const BooksPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { books, genres, searchBooks, loading, fetchUserRequestHistory } = useBooks();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'title' | 'author' | 'genre' | 'owner' | 'combined'>('combined');
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [userRequestHistory, setUserRequestHistory] = useState<Book[]>([]);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const searchSeqRef = useRef(0);
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Helper function to get localized genre name
  const getLocalizedGenreName = (genre: { name: string; name_ar?: string }) => {
    return isArabic && genre.name_ar ? genre.name_ar : genre.name;
  };

  useEffect(() => {
    const loadUserHistory = async () => {
      const history = await fetchUserRequestHistory();
      setUserRequestHistory(history);
    };
    loadUserHistory();
  }, []);

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
    
    if (searchParam || genreParam) {
      performSearch(searchParam || '', genreParam || '', typeParam || 'combined');
    } else {
      setSearchResults(books);
    }
  }, [location.search, books]);

const performSearch = async (
  query: string,
  genre: string,
  type: 'title' | 'author' | 'genre' | 'owner' | 'combined'
) => {
  const seq = ++searchSeqRef.current;

  if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
  spinnerTimerRef.current = setTimeout(() => {
    if (searchSeqRef.current === seq) setIsSearching(true);
  }, 250);

  try {
    let results = await searchBooks(query, genre, type);

    if (searchSeqRef.current !== seq) return;

    if (user && query.trim()) {
      const userBooksFromContext = books.filter(book => book.owner_id === user.id);
      const queryNormalized = query.trim().toLowerCase();
      const matchingUserBooks = userBooksFromContext.filter(book =>
        book.title.toLowerCase().includes(queryNormalized) ||
        book.title.includes(query.trim()) ||
        book.author.toLowerCase().includes(queryNormalized) ||
        book.author.includes(query.trim()) ||
        (book.genre && (book.genre.toLowerCase().includes(queryNormalized) || book.genre.includes(query.trim())))
      );
      setUserBooks(matchingUserBooks);
    } else {
      setUserBooks([]);
    }

    if (useLocationFilter && user?.latitude && user?.longitude) {
      results = await filterBooksByLocation(results);
    }

    if (searchSeqRef.current !== seq) return;

    setSearchResults(results);

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
    if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    
    if (searchSeqRef.current === seq) setIsSearching(false);
  }
};


  const filterBooksByLocation = async (booksToFilter: Book[]) => {
    if (!user?.latitude || !user?.longitude) return booksToFilter;

    try {
      const otherUsersBooks = booksToFilter.filter(book => book.owner_id !== user.id);
      const ownerIds = [...new Set(otherUsersBooks.map(b => b.owner_id))];
      
      const { data: owners, error } = await supabase
        .from('users')
        .select('id, latitude, longitude, location_city')
        .in('id', ownerIds);

      if (error) throw error;

      const booksWithDistance = otherUsersBooks
        .map(book => {
          const owner = owners?.find(o => o.id === book.owner_id);
          if (!owner?.latitude || !owner?.longitude) {
            return { book, distance: Infinity };
          }

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
        toast.info(t('books.noNearbyBooks', { distance: maxDistance }));
        return booksToFilter;
      }

      return booksWithDistance;
    } catch (error) {
      console.error('Error filtering by location:', error);
      return booksToFilter;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || selectedGenre) {
        performSearch(searchQuery, selectedGenre, searchType);
      } else if (useLocationFilter && user?.latitude && user?.longitude) {
        filterBooksByLocation(books).then(setSearchResults);
      } else {
        setSearchResults(books);
      }
    }, 300); 
  
    return () => clearTimeout(timer);
  }, [
    searchQuery,
    selectedGenre,
    searchType,
    useLocationFilter,
    maxDistance,
    books,
    user?.latitude,
    user?.longitude
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, selectedGenre, searchType);
    
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (searchType !== 'combined') params.set('type', searchType);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `/books${newUrl}`);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
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
          <h1 className="text-3xl font-bold">{t('books.browseBooks')}</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('books.searchPlaceholder')}
                  className="ps-10"
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                />
                {(isSearching || loading) && (
                  <div className="absolute end-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary" />
                  </div>
                )}
              </div>
              <Select dir={isArabic ? 'rtl' : 'ltr'} value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('books.allGenres')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('books.allGenres')}</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.name}>
                      {getLocalizedGenreName(genre)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select dir={isArabic ? 'rtl' : 'ltr'} value={searchType} onValueChange={handleSearchTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('books.searchBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">{t('books.allFields')}</SelectItem>
                  <SelectItem value="title">{t('form.title')}</SelectItem>
                  <SelectItem value="author">{t('form.author')}</SelectItem>
                  <SelectItem value="genre">{t('form.genre')}</SelectItem>
                  <SelectItem value="owner">{t('books.owner')}</SelectItem>
                </SelectContent>
              </Select>
              
              {user?.latitude && user?.longitude && (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Label htmlFor="location-filter" className="text-sm cursor-pointer whitespace-nowrap">
                    {t('books.nearMe')}
                  </Label>
                  <Switch
                    id="location-filter"
                    checked={useLocationFilter}
                    onCheckedChange={setUseLocationFilter}
                  />
                  {useLocationFilter && (
                    <Select dir={isArabic ? 'rtl' : 'ltr'} value={maxDistance.toString()} onValueChange={(v) => setMaxDistance(Number(v))}>
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
              
              <Button type="submit">{t('common.search')}</Button>
              {(searchQuery || selectedGenre || searchType !== 'combined') && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="gap-1"
                >
                  <FilterX className="h-4 w-4" />
                  {t('common.clear')}
                </Button>
              )}
            </form>
          </div>
        </div>

<>
  {showRecommendations && recommendations.length > 0 && (
    <BookRecommendations
      books={recommendations}
      title={t('books.recommendedForYou')}
      subtitle={userRequestHistory.length > 0
        ? t('books.basedOnPreferences')
        : t('books.basedOnSearch')
      }
    />
  )}

  {searchResults.length > 0 && (
    <BookGrid books={searchResults} />
  )}

  {userBooks.length > 0 && (
    <div className="mt-8 pt-8 border-t">
      <h2 className="text-xl font-semibold mb-4">{t('books.yourBooks')}</h2>
      <BookGrid books={userBooks} />
    </div>
  )}
</>
      </main>

      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            {t('common.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BooksPage;
