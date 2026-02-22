import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check database for manually granted subscriptions
    const { data: dbUser, error: dbError } = await supabaseClient
      .from('users')
      .select('subscription_status, subscription_end_date, stripe_product_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (dbError) {
      logStep("Error fetching user from database", { error: dbError });
    } else if (dbUser) {
      logStep("Database user data", dbUser);
      
      // Check if there's a valid manually granted subscription
      if (dbUser.subscription_status === 'active' && dbUser.subscription_end_date) {
        const endDate = new Date(dbUser.subscription_end_date);
        const now = new Date();
        
        if (endDate > now) {
          logStep("Valid manually granted subscription found", { 
            endDate: dbUser.subscription_end_date,
            productId: dbUser.stripe_product_id,
            hasStripeCustomer: !!dbUser.stripe_customer_id
          });
          
          return new Response(JSON.stringify({
            subscribed: true,
            subscription_status: 'active',
            product_id: dbUser.stripe_product_id,
            subscription_end: dbUser.subscription_end_date,
            has_stripe_customer: !!dbUser.stripe_customer_id
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          logStep("Manually granted subscription expired", { endDate: dbUser.subscription_end_date });
        }
      }
    }

    // If no valid manual subscription, check Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking if manual subscription exists");

      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_status: 'inactive',
        has_stripe_customer: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionStatus = 'inactive';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      subscriptionStatus = 'active';
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        productId 
      });

      // Update user record with subscription info
      await supabaseClient
        .from('users')
        .update({
          subscription_status: subscriptionStatus,
          stripe_customer_id: customerId,
          stripe_product_id: productId,
          subscription_end_date: subscriptionEnd
        })
        .eq('id', user.id);
        
      logStep("Database updated with subscription info");
    } else {
      logStep("No active subscription found");
      
      await supabaseClient
        .from('users')
        .update({
          subscription_status: 'inactive',
          stripe_customer_id: customerId,
          stripe_product_id: null,
          subscription_end_date: null
        })
        .eq('id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_status: subscriptionStatus,
      product_id: productId,
      subscription_end: subscriptionEnd,
      has_stripe_customer: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
