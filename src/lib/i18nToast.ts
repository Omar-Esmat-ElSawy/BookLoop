 import { toast } from 'sonner';
 import i18n from '@/lib/i18n';
 
 // Helper function to show localized toast messages
 export const showToast = {
   success: (key: string, options?: Record<string, string>) => {
     toast.success(i18n.t(key, options));
   },
   error: (key: string, options?: Record<string, string>) => {
     toast.error(i18n.t(key, options));
   },
   info: (key: string, options?: Record<string, string>) => {
     toast.info(i18n.t(key, options));
   },
   // Fallback for dynamic error messages that shouldn't be translated
   errorMessage: (message: string) => {
     toast.error(message);
   },
   successMessage: (message: string) => {
     toast.success(message);
   },
 };