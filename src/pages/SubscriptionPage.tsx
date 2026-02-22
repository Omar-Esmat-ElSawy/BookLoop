import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import { Check, Crown, ArrowLeft } from 'lucide-react';
 import { useTranslation } from 'react-i18next';

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
   const { t, i18n } = useTranslation();
 
   const features = [
     t('subscriptionPage.chatAccess'),
     t('subscriptionPage.exchangeRequests'),
     t('subscriptionPage.viewOwnerDetails'),
     t('subscriptionPage.unlimitedBooks'),
     t('subscriptionPage.prioritySupport'),
   ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
           <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
           {t('subscriptionPage.backToHome')}
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
             {subscribed ? t('subscriptionPage.manageSubscription') : t('subscriptionPage.getPremium')}
          </h1>
          <p className="text-muted-foreground">
            {subscribed 
               ? t('subscriptionPage.fullAccess')
               : t('subscriptionPage.unlockFeatures')
            }
          </p>
        </div>

        {subscribed && subscription_end && (
          <Card className="mb-8 border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                 <CardTitle>{t('subscriptionPage.activeSubscription')}</CardTitle>
              </div>
              <CardDescription>
                 {t('subscriptionPage.renewsOn', { date: new Date(subscription_end).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {has_stripe_customer ? (
                <Button onClick={openCustomerPortal} className="w-full">
                   {t('subscription.manage')}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                   {t('subscriptionPage.manuallyGranted')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={subscribed ? 'border-primary' : ''}>
          <CardHeader>
             <CardTitle className="text-2xl">{t('subscriptionPage.monthlySubscription')}</CardTitle>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-bold" dir="ltr">20 EGP</span>
               <span className="text-muted-foreground">{t('subscriptionPage.perMonth')}</span>
            </div>
            <CardDescription>
               {t('subscriptionPage.accessFeatures')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
               <h3 className="font-semibold">{t('subscriptionPage.includedFeatures')}</h3>
              <ul className="space-y-2">
                 {features.map((feature, index) => (
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
                 {loading ? t('common.loading') : t('subscriptionPage.subscribeNow')}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
           <p>{t('subscriptionPage.cancelAnytime')}</p>
        </div>
      </div>
    </div>
  );
}
