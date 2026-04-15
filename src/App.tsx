import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import { AssistantFAB } from "@/components/BookAssistant/AssistantFAB";

// Pages
import HomePage from "./pages/HomePage";
import BooksPage from "./pages/BooksPage";
import BookDetailsPage from "./pages/BookDetailsPage";
import AddBookPage from "./pages/AddBookPage";
import EditBookPage from "./pages/EditBookPage";
import MyBooksPage from "./pages/MyBooksPage";
import ExchangeRequestsPage from "./pages/ExchangeRequestsPage";
import ProfilePage from "./pages/ProfilePage";
import MessagesPage from "./pages/MessagesPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccessPage";
import AdminPage from "./pages/AdminPage";
import SupportPage from "./pages/SupportPage";
import BookAssistantPage from "./pages/BookAssistantPage";
import NotFound from "./pages/NotFound";
import TermsPage from "./pages/TermsPage";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { BooksProvider } from "./contexts/BooksContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { MessagingProvider } from "./contexts/MessagingContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="book-loop-theme">
        <LanguageProvider>
          <AuthProvider>
            <BooksProvider>
              <NotificationsProvider>
                <MessagingProvider>
                  <TooltipProvider>
                  {/* Floating book stickers background */}
                  <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                    <div className="book-sticker" style={{ top: '10%', left: '5%', animation: 'float 6s ease-in-out infinite' }}>📘</div>
                    <div className="book-sticker" style={{ top: '20%', right: '10%', animation: 'float-delayed 7s ease-in-out infinite' }}>📗</div>
                    <div className="book-sticker" style={{ top: '60%', left: '15%', animation: 'float-slow 8s ease-in-out infinite' }}>📙</div>
                    <div className="book-sticker" style={{ bottom: '15%', right: '8%', animation: 'float 7s ease-in-out infinite 1s' }}>📕</div>
                    <div className="book-sticker" style={{ top: '40%', right: '25%', animation: 'float-delayed 6s ease-in-out infinite 2s' }}>📘</div>
                    <div className="book-sticker" style={{ bottom: '30%', left: '8%', animation: 'float-slow 7s ease-in-out infinite 1.5s' }}>📗</div>
                    <div className="book-sticker" style={{ top: '75%', right: '20%', animation: 'float 8s ease-in-out infinite 0.5s' }}>📙</div>
                    <div className="book-sticker" style={{ top: '30%', left: '30%', animation: 'float-delayed 7s ease-in-out infinite 3s' }}>📕</div>
                  </div>
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/books" element={<BooksPage />} />
                    <Route path="/books/:id" element={<BookDetailsPage />} />
                    <Route path="/books/add" element={<AddBookPage />} />
                    <Route path="/books/edit/:id" element={<EditBookPage />} />
                    <Route path="/my-books" element={<MyBooksPage />} />
                    <Route path="/exchange-requests" element={<ExchangeRequestsPage />} />
                    <Route path="/profile/:id" element={<ProfilePage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/messages/:id" element={<MessagesPage />} />
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    <Route path="/subscription-success" element={<SubscriptionSuccessPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/book-assistant" element={<BookAssistantPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                    <BottomNav />
                    <AssistantFAB />
                  </TooltipProvider>
                </MessagingProvider>
              </NotificationsProvider>
            </BooksProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
