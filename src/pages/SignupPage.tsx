
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LocationInput } from '@/components/LocationInput';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { t as i18nT } from 'i18next';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone_number: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_city: z.string().optional(),
  termsAccepted: z.boolean().refine((v) => v === true, { message: i18nT('terms.mustAccept') }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

const SignupPage = () => {
  const { signUp, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone_number: '',
      latitude: undefined,
      longitude: undefined,
      location_city: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const result = await signUp(
        data.email, 
        data.password, 
        data.username,
        data.phone_number,
        data.latitude,
        data.longitude,
        data.location_city
      );
      
      if (result?.error) {
        const errorMessage = result.error.message || '';
        if (errorMessage.toLowerCase().includes('row-level security') || 
            errorMessage.toLowerCase().includes('rls')) {
          toast.success(t('toasts.checkYourEmail'));
        } else {
          toast.error(errorMessage || t('toasts.failedToCreateAccount'));
        }
      } else if (result?.success) {
        toast.success(t('toasts.checkYourEmail'));
        navigate('/login');
      }
    } catch (error: any) {
      const errorMessage = error.message || '';
      if (errorMessage.toLowerCase().includes('row-level security') || 
          errorMessage.toLowerCase().includes('rls')) {
        toast.success(t('toasts.checkYourEmail'));
      } else {
        toast.error(errorMessage || t('toasts.failedToCreateAccount'));
      }
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
          <h2 className="text-3xl font-bold dark:text-dark-button">{t('auth.createAccountTitle')}</h2>
          <p className="text-muted-foreground dark:text-dark-field">{t('auth.joinCommunity')}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-dark-button">{t('auth.username')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('auth.chooseUsername')} 
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
                  <FormLabel className="dark:text-dark-button">{t('auth.password')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={t('auth.createPassword')} 
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
            
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-dark-button">{t('profile.phoneOptional')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder={t('auth.enterPhoneNumber')} 
                      {...field} 
                      disabled={isSubmitting}
                      className="dark:bg-transparent dark:text-dark-field dark:border-dark-field"
                    />
                  </FormControl>
                  <FormMessage className="dark:text-dark-button" />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel className="dark:text-dark-button">{t('profile.locationOptional')}</FormLabel>
              <LocationInput
                latitude={form.watch('latitude') ?? null}
                longitude={form.watch('longitude') ?? null}
                city={form.watch('location_city') ?? ''}
                onLocationChange={(city, lat, lng) => {
                  form.setValue('latitude', lat);
                  form.setValue('longitude', lng);
                  form.setValue('location_city', city);
                }}
              />
            </div>
            
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 dark:border-dark-field">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={isSubmitting}
                      className="mt-1"
                    />
                  </FormControl>
              
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal dark:text-dark-button">
                      {t("terms.acceptLabel")}{" "}
                      <Link to="/terms" className="text-primary hover:underline dark:text-dark-button">
                        {t("terms.linkText")}
                      </Link>
                    </FormLabel>
              
                    <FormMessage className="dark:text-dark-button" />
                    <p className="text-xs text-muted-foreground dark:text-dark-field">
                      {t("terms.shortSafetyNote")}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit" 
              className="w-full mt-6 dark:bg-dark-button dark:text-dark-background dark:hover:bg-dark-button/90" 
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>
          </form>
        </Form>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground dark:text-dark-field">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline dark:text-dark-button">
              {t('auth.signIn')}
            </Link>
          </p>
                  <p className="text-sm text-muted-foreground dark:text-dark-field pt-2">
                    <Link to="/books" className="text-primary hover:underline dark:text-dark-button">
                      {t('auth.ContinueAsGuest')}
                    </Link>
                  </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
