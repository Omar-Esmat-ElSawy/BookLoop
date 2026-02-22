import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BookRow from '@/components/BookRow';
import NavBar from '@/components/NavBar';
import { useBooks } from '@/contexts/BooksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HomePage = () => {
  const [playHomeIntro] = useState(() => sessionStorage.getItem('homeIntroPlayed') !== '1');
  useEffect(() => {
    if (playHomeIntro) sessionStorage.setItem('homeIntroPlayed', '1');
  }, [playHomeIntro]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentlyAdded, booksByGenre, genres, loading } = useBooks();
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  // Get localized genre name from database or fallback to translation keys
  const getTranslatedGenre = (genreName: string) => {
    // First try to find the genre in the database and use its localized name
    const genreFromDb = genres.find(g => g.name.toLowerCase() === genreName.toLowerCase());
    if (genreFromDb) {
      return isArabic && genreFromDb.name_ar ? genreFromDb.name_ar : genreFromDb.name;
    }
    
    // Fallback to translation keys for backwards compatibility
    const genreKeyMap: Record<string, string> = {
      'fiction': 'genres.fiction',
      'non-fiction': 'genres.nonFiction',
      'nonfiction': 'genres.nonFiction',
      'mystery': 'genres.mystery',
      'science fiction': 'genres.scienceFiction',
      'sci-fi': 'genres.sciFi',
      'fantasy': 'genres.fantasy',
      'romance': 'genres.romance',
      'thriller': 'genres.thriller',
      'horror': 'genres.horror',
      'biography': 'genres.biography',
      'autobiography': 'genres.autobiography',
      'history': 'genres.history',
      'children': 'genres.children',
      'poetry': 'genres.poetry',
      'self-help': 'genres.selfHelp',
      'selfhelp': 'genres.selfHelp',
      'business': 'genres.business',
      'drama': 'genres.drama',
      'adventure': 'genres.adventure',
      'comedy': 'genres.comedy',
      'crime': 'genres.crime',
      'cooking': 'genres.cooking',
      'travel': 'genres.travel',
      'art': 'genres.art',
      'music': 'genres.music',
      'sports': 'genres.sports',
      'religion': 'genres.religion',
      'philosophy': 'genres.philosophy',
      'psychology': 'genres.psychology',
      'science': 'genres.science',
      'technology': 'genres.technology',
      'education': 'genres.education',
      'health': 'genres.health',
      'other': 'genres.other',
    };
    
    const key = genreKeyMap[genreName.toLowerCase()];
    return key ? t(key) : genreName;
  };
 
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-ink-100 to-transparent dark:from-ink-700/20 dark:to-transparent py-8 md:py-16 lg:py-24 animate-in fade-in duration-700">
          <div className="container mx-auto px-4 text-center">
            <h1
              className={`text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 ${
                playHomeIntro ? 'animate-in slide-in-from-bottom-8 fade-in duration-1100 ease-out delay-100' : ''
              }`}
            >
            <span className="gradient-text">{t('home.title')}</span> {t('home.subtitle')}
            </h1>
            <p
              className={`text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-2xl mx-auto text-muted-foreground ${
                playHomeIntro ? 'animate-in slide-in-from-bottom-8 fade-in duration-1100 ease-out delay-200' : ''
              }`}
            >
            {t('home.description')}
            </p>
            
            <form
              onSubmit={handleSearch}
              className={`flex gap-2 max-w-md mx-auto mb-6 md:mb-8 ${
                playHomeIntro ? 'animate-in slide-in-from-bottom-8 fade-in duration-1100 ease-out delay-300' : ''
              }`}
            > 
            <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('home.searchPlaceholder')}
                  className="ps-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">{t('common.search')}</Button>
            </form>
            
            <div
              className={`flex flex-col sm:flex-row justify-center gap-3 md:gap-4 ${
                playHomeIntro ? 'animate-in slide-in-from-bottom-8 fade-in duration-1100 ease-out delay-400' : ''
              }`}
            >
              <Link to="/books" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="gap-2 w-full sm:w-auto">
                  <BookOpen className="h-5 w-5" />
                  {t('home.browseBooks')}
                </Button>
              </Link>
              {!user ? (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">{t('home.joinNow')}</Button>
                </Link>
              ) : (
                <Link to="/books/add" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">{t('home.addYourBook')}</Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Recently Added Section */}
        <section
          className={`py-6 md:py-12 container mx-auto px-4 ${
            playHomeIntro ? 'animate-in fade-in duration-1200 ease-out delay-500' : ''
          }`}
        >
          <BookRow 
            title={t('home.recentlyAdded')} 
            books={recentlyAdded} 
            viewAllLink="/books"
            emptyMessage={loading ? t('common.loading') : t('home.noBooksYet')} 
          />
          
          {/* Books by Genre */}
          {Object.entries(booksByGenre).map(([genre, books]) => (
            books.length > 0 && (
              <BookRow 
                key={genre}
                 title={getTranslatedGenre(genre)}
                books={books}
                viewAllLink={`/books?genre=${encodeURIComponent(genre)}`}
              />
            )
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            {t('home.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
