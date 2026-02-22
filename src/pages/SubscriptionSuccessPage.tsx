import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();

  useEffect(() => {
    // Check subscription status after successful payment
    checkSubscription();
  }, [checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Subscription Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing to our premium features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>You now have access to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Chat system</li>
              <li>Book exchange requests</li>
              <li>View owner details</li>
              <li>Add books for exchange</li>
            </ul>
          </div>
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
            size="lg"
          >
            Start Exploring
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
