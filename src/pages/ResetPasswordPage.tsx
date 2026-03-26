
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Book } from 'lucide-react';
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
import { toast } from 'sonner';
import supabase from '@/lib/supabase';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const ResetPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        toast.error(t('toasts.invalidOrExpiredResetSession'));
        navigate('/login');
      }
    };
    
    checkSession();
  }, [navigate]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) {
        throw error;
      }
      
      setResetComplete(true);
      toast.success(t('toasts.passwordResetSuccessful'));
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || t('toasts.failedToResetPassword'));
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
          <h2 className="text-3xl font-bold dark:text-dark-button">{t('auth.newPassword')}</h2>
          <p className="text-muted-foreground dark:text-dark-field">
            {t('auth.setNewPassword')}
          </p>
        </div>
        
        {!resetComplete ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-dark-button">{t('auth.newPassword')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={t('auth.enterYourPassword')} 
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-dark-button">{t('auth.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={t('auth.confirmYourPassword')} 
                        {...field} 
                        disabled={isSubmitting}
                        className="dark:bg-transparent dark:text-dark-field dark:border-dark-field"
                      />
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
                {isSubmitting ? t('common.loading') : t('auth.updatePassword')}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-800 rounded-md p-4 dark:bg-green-900/20 dark:text-green-300">
              <p>{t('auth.passwordResetSuccess')}</p>
              <p className="text-sm mt-2">
                {t('auth.redirectingToLogin')}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4 dark:border-dark-button dark:text-dark-button" 
              onClick={() => navigate('/login')}
            >
              {t('auth.backToLogin')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
