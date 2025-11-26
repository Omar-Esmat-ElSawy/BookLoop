
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
import { LocationInput } from '@/components/LocationInput';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone_number: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_city: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

const SignupPage = () => {
  const { signUp, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already logged in, redirect to home page
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
          toast.success('Check your Email');
        } else {
          toast.error(errorMessage || 'Failed to create account');
        }
      } else if (result?.success) {
        toast.success('Check your Email');
        navigate('/login');
      }
    } catch (error: any) {
      const errorMessage = error.message || '';
      if (errorMessage.toLowerCase().includes('row-level security') || 
          errorMessage.toLowerCase().includes('rls')) {
        toast.success('Check your Email');
      } else {
        toast.error(errorMessage || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <Book className="h-8 w-8 text-primary dark:text-dark-button" />
            <h1 className="text-2xl font-bold gradient-text">Book Loop</h1>
          </div>
          <h2 className="text-3xl font-bold dark:text-dark-button">Create an account</h2>
          <p className="text-muted-foreground dark:text-dark-field">Sign up to start exchanging books</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-dark-button">Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Choose a username" 
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
                  <FormLabel className="dark:text-dark-button">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
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
                  <FormLabel className="dark:text-dark-button">Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Create a password" 
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
                  <FormLabel className="dark:text-dark-button">Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirm your password" 
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
                  <FormLabel className="dark:text-dark-button">Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Enter your phone number" 
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
              <FormLabel className="dark:text-dark-button">Location (Optional)</FormLabel>
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
            
            <Button
              type="submit" 
              className="w-full mt-6 dark:bg-dark-button dark:text-dark-background dark:hover:bg-dark-button/90" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </Form>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground dark:text-dark-field">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline dark:text-dark-button">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
