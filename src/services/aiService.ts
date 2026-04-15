export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-lite-001";

export const aiService = {
  async generateResponse(
    messages: Message[],
    availableBooksContext: string,
    userPreferencesContext: string
  ): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.warn("VITE_OPENROUTER_API_KEY is not set. Using mock response.");
      return "I'm sorry, I'm currently in offline mode. Please add an OpenRouter API key to enable my full potential!";
    }

    const systemPrompt: Message = {
      role: 'system',
      content: `You are a smart book assistant for the "Book Loop" platform. 
      Your goal is to help users find books available on our platform.
      
      RULES:
      1. DO NOT list or suggest specific available books from our database until the user explicitly asks for suggestions or confirms they want to see what's available.
      2. If a user asks for recommendations, respond with a polite confirmation message first (e.g. "I can definitely help with that! Would you like me to show you available books from our platform that match your taste?").
      3. ONLY when the user confirms (e.g. "Yes", "Yes please", "أيوه", "أعرضلي"), provide the response and append the hidden tag [SHOW_RECOMMENDATIONS] at the end.
      4. Use the provided AVAILABLE BOOKS CONTEXT only after the confirmation.
      5. Support both Arabic and English (respond in the user's language).
      6. Keep the conversation helpful and friendly.
      7. Ask follow-up questions to better understand their taste.
      
      USER PREFERENCES:
      ${userPreferencesContext}
      
      AVAILABLE BOOKS CONTEXT:
      ${availableBooksContext}
      `
    };

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "BookLoop Assistant"
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [systemPrompt, ...messages],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch from OpenRouter");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("AI Service Error:", error);
      return "I encountered an error while processing your request. Please try again later.";
    }
  }
};
