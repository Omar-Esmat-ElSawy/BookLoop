import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: string;
}

export const SubscriptionGuard = ({ children, feature }: SubscriptionGuardProps) => {
  const { subscribed, loading, createCheckoutSession } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscribed) {
    return (
      <Card className="border-2 border-muted">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Subscription Required</CardTitle>
          <CardDescription>
            You need to subscribe for 20 EGP/month to access {feature}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">Monthly subscription includes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Access to chat system</li>
              <li>Send book exchange requests</li>
              <li>View book owner details</li>
              <li>Add books for exchange</li>
            </ul>
          </div>
          <Button 
            onClick={createCheckoutSession} 
            className="w-full"
            size="lg"
          >
            Subscribe Now - 20 EGP/month
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
