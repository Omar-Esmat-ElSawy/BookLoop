
import React, { useState } from 'react';
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

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setEmailSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
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
          <h2 className="text-3xl font-bold dark:text-dark-button">Reset password</h2>
          <p className="text-muted-foreground dark:text-dark-field">
            Enter your email to receive a password reset link
          </p>
        </div>
        
        {!emailSent ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              
              <Button 
                type="submit" 
                className="w-full dark:bg-dark-button dark:text-dark-background dark:hover:bg-dark-button/90" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-800 rounded-md p-4 dark:bg-green-900/20 dark:text-green-300">
              <p>Password reset link sent to your email.</p>
              <p className="text-sm mt-2">
                Please check your inbox and follow the instructions.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4 dark:border-dark-button dark:text-dark-button" 
              onClick={() => navigate('/login')}
            >
              Return to login
            </Button>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground dark:text-dark-field">
            Remember your password?{' '}
            <Link to="/login" className="text-primary hover:underline dark:text-dark-button">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
