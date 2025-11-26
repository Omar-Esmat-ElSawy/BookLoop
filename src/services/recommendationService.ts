import { Book } from '@/types/database.types';

interface RecommendationOptions {
  searchQuery?: string;
  currentGenre?: string;
  excludeBookIds?: string[];
  limit?: number;
  userRequestHistory?: Book[];
}

interface UserPreferences {
  favoriteGenres: Map<string, number>;
  favoriteAuthors: Map<string, number>;
  totalRequests: number;
}

export class RecommendationService {
  /**
   * Generate book recommendations based on search context and user history
   */
  static getRecommendations(
    allBooks: Book[],
    options: RecommendationOptions = {}
  ): Book[] {
    const {
      searchQuery = '',
      currentGenre = '',
      excludeBookIds = [],
      limit = 6,
      userRequestHistory = []
    } = options;

    // Build user preferences from request history
    const userPreferences = this.buildUserPreferences(userRequestHistory);

    let scoredBooks = allBooks
      .filter(book => !excludeBookIds.includes(book.id) && book.is_available)
      .map(book => ({
        book,
        score: this.calculateRecommendationScore(
          book, 
          searchQuery, 
          currentGenre, 
          userPreferences
        )
      }));

    // Sort by score (highest first)
    scoredBooks.sort((a, b) => b.score - a.score);

    return scoredBooks.slice(0, limit).map(sb => sb.book);
  }

  /**
   * Build user preferences from their request history
   */
  private static buildUserPreferences(requestHistory: Book[]): UserPreferences {
    const favoriteGenres = new Map<string, number>();
    const favoriteAuthors = new Map<string, number>();

    requestHistory.forEach(book => {
      // Count genres
      if (book.genre) {
        favoriteGenres.set(book.genre, (favoriteGenres.get(book.genre) || 0) + 1);
      }

      // Count authors
      const author = book.author.toLowerCase();
      favoriteAuthors.set(author, (favoriteAuthors.get(author) || 0) + 1);
    });

    return {
      favoriteGenres,
      favoriteAuthors,
      totalRequests: requestHistory.length
    };
  }

  /**
   * Calculate recommendation score for a book
   */
  private static calculateRecommendationScore(
    book: Book,
    searchQuery: string,
    currentGenre: string,
    userPreferences: UserPreferences
  ): number {
    let score = 0;
    const query = searchQuery.toLowerCase().trim();

    // Base score for available books
    if (book.is_available) {
      score += 10;
    }

    // USER PREFERENCE SCORING (highest priority when history exists)
    if (userPreferences.totalRequests > 0) {
      // Boost books in user's favorite genres
      if (book.genre && userPreferences.favoriteGenres.has(book.genre)) {
        const genreCount = userPreferences.favoriteGenres.get(book.genre) || 0;
        const genreWeight = (genreCount / userPreferences.totalRequests) * 100;
        score += genreWeight; // Can add up to 100 points for frequently requested genres
      }

      // Boost books by user's favorite authors
      const authorLower = book.author.toLowerCase();
      if (userPreferences.favoriteAuthors.has(authorLower)) {
        const authorCount = userPreferences.favoriteAuthors.get(authorLower) || 0;
        const authorWeight = (authorCount / userPreferences.totalRequests) * 80;
        score += authorWeight; // Can add up to 80 points for frequently requested authors
      }
    }

    // Genre matching from current search/filter
    if (currentGenre && book.genre === currentGenre) {
      score += 50;
    }

    // Partial matches in search query
    if (query) {
      const title = book.title.toLowerCase();
      const author = book.author.toLowerCase();
      const description = book.description.toLowerCase();
      const genre = book.genre?.toLowerCase() || '';

      // Exact matches (high score)
      if (title.includes(query)) {
        score += 40;
      }
      if (author.includes(query)) {
        score += 35;
      }
      if (genre.includes(query)) {
        score += 30;
      }
      if (description.includes(query)) {
        score += 20;
      }

      // Word-by-word matching for multi-word queries
      const queryWords = query.split(' ').filter(w => w.length > 2);
      queryWords.forEach(word => {
        if (title.includes(word)) score += 15;
        if (author.includes(word)) score += 12;
        if (genre.includes(word)) score += 10;
        if (description.includes(word)) score += 5;
      });
    }

    // Boost for good condition books
    if (book.condition === 'Like New') {
      score += 5;
    } else if (book.condition === 'Good') {
      score += 3;
    }

    return score;
  }

  /**
   * Get popular books (most available and diverse genres)
   */
  static getPopularBooks(allBooks: Book[], limit: number = 6): Book[] {
    const availableBooks = allBooks.filter(book => book.is_available);
    
    // Group by genre to ensure diversity
    const genreGroups: Record<string, Book[]> = {};
    
    availableBooks.forEach(book => {
      const genre = book.genre || 'Other';
      if (!genreGroups[genre]) {
        genreGroups[genre] = [];
      }
      genreGroups[genre].push(book);
    });

    // Take one book from each genre until we reach the limit
    const popularBooks: Book[] = [];
    const genres = Object.keys(genreGroups);
    let genreIndex = 0;

    while (popularBooks.length < limit && popularBooks.length < availableBooks.length) {
      const currentGenre = genres[genreIndex % genres.length];
      const genreBooks = genreGroups[currentGenre];
      
      if (genreBooks && genreBooks.length > 0) {
        const book = genreBooks.shift();
        if (book) {
          popularBooks.push(book);
        }
        
        // Remove genre if empty
        if (genreBooks.length === 0) {
          genres.splice(genreIndex % genres.length, 1);
          if (genres.length === 0) break;
        }
      }
      
      genreIndex++;
    }

    return popularBooks;
  }

  /**
   * Get books by the same author
   */
  static getBooksByAuthor(
    allBooks: Book[],
    author: string,
    excludeBookIds: string[] = [],
    limit: number = 4
  ): Book[] {
    return allBooks
      .filter(book => 
        book.author.toLowerCase() === author.toLowerCase() &&
        !excludeBookIds.includes(book.id) &&
        book.is_available
      )
      .slice(0, limit);
  }

  /**
   * Get books in the same genre
   */
  static getBooksByGenre(
    allBooks: Book[],
    genre: string,
    excludeBookIds: string[] = [],
    limit: number = 6
  ): Book[] {
    return allBooks
      .filter(book => 
        book.genre === genre &&
        !excludeBookIds.includes(book.id) &&
        book.is_available
      )
      .slice(0, limit);
  }
}
