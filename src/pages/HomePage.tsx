
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BookRow from '@/components/BookRow';
import NavBar from '@/components/NavBar';
import { useBooks } from '@/contexts/BooksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentlyAdded, booksByGenre, genres, loading } = useBooks();
  const [searchQuery, setSearchQuery] = useState('');

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
        <section className="bg-gradient-to-b from-ink-100 to-transparent dark:from-ink-700/20 dark:to-transparent py-8 md:py-16 lg:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6">
              <span className="gradient-text">Book Loop</span> Book Exchange
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-2xl mx-auto text-muted-foreground">
              Discover, share, and exchange books with fellow readers. Join our community and find your next great read.
            </p>
            
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto mb-6 md:mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for books..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <Link to="/books" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="gap-2 w-full sm:w-auto">
                  <BookOpen className="h-5 w-5" />
                  Browse Books
                </Button>
              </Link>
              {!user ? (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">Join Now</Button>
                </Link>
              ) : (
                <Link to="/books/add" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">Add Your Book</Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Recently Added Section */}
        <section className="py-6 md:py-12 container mx-auto px-4">
          <BookRow 
            title="Recently Added" 
            books={recentlyAdded} 
            viewAllLink="/books"
            emptyMessage={loading ? "Loading..." : "No books available yet"} 
          />
          
          {/* Books by Genre */}
          {Object.entries(booksByGenre).map(([genre, books]) => (
            books.length > 0 && (
              <BookRow 
                key={genre}
                title={genre}
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
            &copy; {new Date().getFullYear()} Book Loop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
