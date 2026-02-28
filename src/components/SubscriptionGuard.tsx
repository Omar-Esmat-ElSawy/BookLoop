import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { t } from 'i18next';

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
          <CardTitle>{t('subscription.required')}</CardTitle>
          <CardDescription>
            {t('subscription.needToSubscribe' )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">{t('subscription.SubscriptionFeatures')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('subscription.accessToChatSystem')}</li>
              <li>{t('subscription.sendBookExchangeRequests')}</li>
              <li>{t('subscription.viewBookOwnerDetails')}</li>
              <li>{t('subscription.addBooksForExchange')}</li>
            </ul>
          </div>
          <Button 
            onClick={createCheckoutSession} 
            className="w-full"
            size="lg"
          >
            {t('subscription.subscribeNow')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
