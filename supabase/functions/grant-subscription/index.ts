import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GRANT-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const adminUser = userData.user;
    if (!adminUser) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: adminUser.id });

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) throw new Error(`Role check error: ${roleError.message}`);
    if (!roleData) throw new Error("Unauthorized: Admin access required");
    logStep("Admin access verified");

    // Parse request body
    const { email, username, duration_months = 1 } = await req.json();
    if (!email && !username) {
      throw new Error("Either email or username is required");
    }
    logStep("Request data", { email, username, duration_months });

    // Find the target user
    let targetUserId: string | null = null;
    
    if (email) {
      const { data: authUserData, error: authError } = await supabaseClient.auth.admin.listUsers();
      if (authError) throw new Error(`Error fetching users: ${authError.message}`);
      
      const targetAuthUser = authUserData.users.find(u => u.email === email);
      if (targetAuthUser) {
        targetUserId = targetAuthUser.id;
      }
    }

    if (!targetUserId && username) {
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      
      if (userError) throw new Error(`Error finding user: ${userError.message}`);
      if (userData) {
        targetUserId = userData.id;
      }
    }

    if (!targetUserId) {
      throw new Error("User not found");
    }
    logStep("Target user found", { userId: targetUserId });

    // Calculate subscription end date
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration_months);

    // Update user subscription
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        subscription_status: 'active',
        stripe_product_id: 'prod_TTAx2HInIE0P54',
        subscription_end_date: endDate.toISOString()
      })
      .eq('id', targetUserId);

    if (updateError) throw new Error(`Error updating subscription: ${updateError.message}`);
    logStep("Subscription granted successfully");

    return new Response(JSON.stringify({ 
      success: true,
      message: "Subscription granted successfully",
      subscription_end: endDate.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in grant-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
