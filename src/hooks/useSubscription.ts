import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_status: 'active' | 'inactive';
  product_id?: string;
  subscription_end?: string;
  has_stripe_customer?: boolean;
  loading: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    subscription_status: 'inactive',
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionStatus({
        subscribed: false,
        subscription_status: 'inactive',
        loading: false,
      });
      return;
    }

    try {
      setSubscriptionStatus(prev => ({ ...prev, loading: true }));
      
      // Get session and verify it exists with a valid access token
      let { data: sessionData } = await supabase.auth.getSession();
      let accessToken = sessionData?.session?.access_token;
      
      // Try to refresh the session if no access token
      if (!accessToken) {
        console.log('No access token, attempting session refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData?.session?.access_token) {
          console.log('Session refresh failed, no valid session');
          setSubscriptionStatus({
            subscribed: false,
            subscription_status: 'inactive',
            loading: false,
          });
          return;
        }
        accessToken = refreshData.session.access_token;
      }
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error('Subscription check error:', error);
        // If it's an auth error, the session might be invalid
        if (error.message?.includes('Auth') || error.message?.includes('session')) {
          console.log('Auth-related error, clearing subscription state');
        }
        throw error;
      }

      setSubscriptionStatus({
        subscribed: data.subscribed || false,
        subscription_status: data.subscription_status || 'inactive',
        product_id: data.product_id,
        subscription_end: data.subscription_end,
        has_stripe_customer: data.has_stripe_customer || false,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      // Don't show error for auth issues - just set as not subscribed
      setSubscriptionStatus({
        subscribed: false,
        subscription_status: 'inactive',
        loading: false,
      });
    }
  }, [user]);

  const createCheckoutSession = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to create checkout session');
    }
  }, [user]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to manage your subscription');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open customer portal');
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();

    // Auto-refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    ...subscriptionStatus,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
  };
};
