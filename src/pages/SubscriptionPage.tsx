import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import { Check, Crown, ArrowLeft } from 'lucide-react';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { 
    subscribed, 
    subscription_status,
    subscription_end,
    has_stripe_customer,
    loading,
    createCheckoutSession,
    openCustomerPortal 
  } = useSubscription();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {subscribed ? 'Manage Your Subscription' : 'Get Premium Access'}
          </h1>
          <p className="text-muted-foreground">
            {subscribed 
              ? 'You have full access to all premium features'
              : 'Unlock all features with a monthly subscription'
            }
          </p>
        </div>

        {subscribed && subscription_end && (
          <Card className="mb-8 border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Active Subscription</CardTitle>
              </div>
              <CardDescription>
                Your subscription renews on {new Date(subscription_end).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {has_stripe_customer ? (
                <Button onClick={openCustomerPortal} className="w-full">
                  Manage Subscription
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Your subscription was manually granted. Contact support to manage it.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={subscribed ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="text-2xl">Monthly Subscription</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">20 EGP</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <CardDescription>
              Access all premium features of the Book Exchange platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Included features:</h3>
              <ul className="space-y-2">
                {[
                  'Access to the chat system',
                  'Send book exchange requests',
                  'View book owner contact details',
                  'Add unlimited books for exchange',
                  'Priority support',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {!subscribed && (
              <Button 
                onClick={createCheckoutSession}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? 'Loading...' : 'Subscribe Now'}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Cancel anytime through the customer portal</p>
        </div>
      </div>
    </div>
  );
}
