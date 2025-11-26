import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import NavBar from '@/components/NavBar';
import { Loader2, Shield } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [isGranting, setIsGranting] = useState(false);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !username) {
      toast.error('Please provide either email or username');
      return;
    }

    setIsGranting(true);

    try {
      const { data, error } = await supabase.functions.invoke('grant-subscription', {
        body: {
          email: email || undefined,
          username: username || undefined,
          duration_months: parseInt(durationMonths) || 1,
        },
      });

      if (error) throw error;

      toast.success(data.message || 'Subscription granted successfully');
      setEmail('');
      setUsername('');
      setDurationMonths('1');
    } catch (error: any) {
      console.error('Error granting subscription:', error);
      toast.error(error.message || 'Failed to grant subscription');
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>Admin Dashboard</CardTitle>
            </div>
            <CardDescription>
              Grant subscription access to users manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGrantSubscription} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isGranting}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">OR</div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isGranting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Months)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="1"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  disabled={isGranting}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isGranting}>
                {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Grant Subscription
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
