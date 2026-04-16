import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types/database.types";
import { aiService, Message } from "./aiService";
import { preferenceService, UserPreference } from "./preferenceService";
import { RecommendationService } from "./recommendationService";

export interface AssistantResponse {
  text: string;
  recommendedBooks: Book[];
}

export const bookAssistant = {
  async processUserMessage(
    userId: string,
    message: string,
    chatHistory: Message[] = []
  ): Promise<AssistantResponse> {
    // 1. Fetch user preferences
    const preferences = await preferenceService.getPreferences(userId);
    
    // 2. Fetch all available books to provide context to AI
    const { data: allBooks } = await supabase
      .from('books')
      .select('*')
      .eq('is_available', true)
      .neq('owner_id', userId);
    
    const availableBooks = (allBooks as unknown as Book[]) || [];
    
    // Get recommendations based on current message + preferences
    const relevantBooks = RecommendationService.getRecommendations(availableBooks, {
      searchQuery: message,
      currentGenre: preferences?.favorite_genres?.[0],
      limit: 10
    });

    // 3. Prepare AI Context
    const bookContext = relevantBooks.length > 0 
      ? relevantBooks.map(b => 
          `ID: ${b.id}, Title: ${b.title}, Author: ${b.author}, Genre: ${b.genre}, Description: ${b.description}`
        ).join('\n---\n')
      : "ATTENTION: There are currently NO books available from other users in our database. If the user confirms they want to see recommendations, you MUST politely inform them that 'No recommendations are available right now, try again later'.";

    const preferenceContext = preferences ? 
      `Favorite Genres: ${preferences.favorite_genres?.join(', ') || 'None'}. Liked Books: ${preferences.liked_books?.length || 0} books.` : 
      "No preferences yet.";

    // 4. Call AI
    const apiMessages: Message[] = [...chatHistory, { role: 'user', content: message }];
    
    // Add instruction for preference extraction
    const enrichedMessages: Message[] = [
      ...apiMessages,
      { 
        role: 'system', 
        content: "IMPORTANT: If you detect the user likes a new genre or book from our list, please end your message with this hidden tag: [UPDATE_PREFS: {\"genres\": [\"genre1\"], \"books\": [\"uuid1\"]}]" 
      }
    ];

    const aiRes = await aiService.generateResponse(apiMessages, bookContext, preferenceContext);

    // 5. Extract preference updates if any
    const updateMatch = aiRes.match(/\[UPDATE_PREFS: (.*?)\]/);
    if (updateMatch && updateMatch[1]) {
      try {
        const updates = JSON.parse(updateMatch[1]);
        if (updates.genres || updates.books) {
          await this.applyPreferenceUpdates(userId, updates, preferences);
        }
      } catch (e) {
        console.error("Failed to parse preference update:", e);
      }
    }

    // 6. Check for recommendation trigger
    const shouldShowBooks = aiRes.includes('[SHOW_RECOMMENDATIONS]');

    // Cleaning the response text from ALL technical tags
    const cleanText = aiRes
      .replace(/\[UPDATE_PREFS: .*?\]/, '')
      .replace('[SHOW_RECOMMENDATIONS]', '')
      .trim();

    return {
      text: cleanText,
      recommendedBooks: shouldShowBooks ? relevantBooks.slice(0, 5) : [] 
    };
  },

  async applyPreferenceUpdates(
    userId: string, 
    updates: { genres?: string[], books?: string[] },
    currentPrefs: UserPreference | null
  ) {
    const newGenres = [...new Set([...(currentPrefs?.favorite_genres || []), ...(updates.genres || [])])];
    const newBooks = [...new Set([...(currentPrefs?.liked_books || []), ...(updates.books || [])])];

    await preferenceService.updatePreferences(userId, {
      favorite_genres: newGenres,
      liked_books: newBooks,
      chat_history: currentPrefs?.chat_history // We can store local history if needed
    });
  }
};
