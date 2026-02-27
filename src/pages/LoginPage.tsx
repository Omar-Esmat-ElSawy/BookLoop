
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Book, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof formSchema>;

const LoginPage = () => {
  const { signIn, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const result = await signIn(data.email, data.password);
      
      if (result.error) {
        toast.error(result.error.message || t('toasts.failedToSignIn'));
      }
    } catch (error: any) {
      toast.error(error.message || t('toasts.unexpectedError'));
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <Book className="h-8 w-8 text-primary dark:text-dark-button" />
            <h1 className="text-2xl font-bold gradient-text">{t('home.title')}</h1>
          </div>
          <h2 className="text-3xl font-bold dark:text-dark-button">{t('auth.welcomeBack')}</h2>
          <p className="text-muted-foreground dark:text-dark-field">{t('auth.signInToContinue')}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-dark-button">{t('auth.email')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder={t('auth.enterYourEmail')} 
                      {...field} 
                      disabled={isSubmitting}
                      className="dark:bg-transparent dark:text-dark-field dark:border-dark-field"
                    />
                  </FormControl>
                  <FormMessage className="dark:text-dark-button" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="dark:text-dark-button">{t('auth.password')}</FormLabel>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline dark:text-dark-button">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder={t('auth.enterYourPassword')} 
                        {...field} 
                        disabled={isSubmitting}
                        className="dark:bg-transparent dark:text-dark-field dark:border-dark-field pe-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="dark:text-dark-button" />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full dark:bg-dark-button dark:text-dark-background dark:hover:bg-dark-button/90" 
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </Form>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground dark:text-dark-field">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-primary hover:underline dark:text-dark-button">
              {t('auth.signup')}
            </Link>
          <p className="text-sm text-muted-foreground dark:text-dark-field pt-2">
            <Link to="/" className="text-primary hover:underline dark:text-dark-button">
              {t('auth.ContinueAsGuest')}
            </Link>
          </p>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
