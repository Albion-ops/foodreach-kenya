import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PromoteToAdminRequest {
  userId: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userName }: PromoteToAdminRequest = await req.json();

    console.log(`Promoting user ${userId} (${userName}) to admin`);

    // Create Supabase client with service role to access auth.users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user's email from auth.users
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Promote user to admin
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });

    if (roleError) {
      console.error("Error promoting user:", roleError);
      return new Response(
        JSON.stringify({ error: roleError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`User ${userId} promoted to admin successfully`);

    // Send admin promotion email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    try {
      await resend.emails.send({
        from: "Food Donation Platform <onboarding@resend.dev>",
        to: [userEmail],
        subject: "🎉 You've Been Promoted to Admin!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
              </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                            🎉 Admin Promotion
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                            Congratulations, ${userName}!
                          </h2>
                          
                          <p style="margin: 0 0 16px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                            You've been promoted to <strong>Admin</strong> on the Food Donation Platform!
                          </p>
                          
                          <p style="margin: 0 0 16px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                            As an admin, you now have access to:
                          </p>
                          
                          <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
                            <li>View and manage all donations in the system</li>
                            <li>Access user management features</li>
                            <li>Promote other users to admin</li>
                            <li>Monitor platform statistics and activity</li>
                          </ul>
                          
                          <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 16px; margin: 24px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">
                              <strong>💡 Tip:</strong> Access the Admin Dashboard by clicking on the "Admin" link in the navigation menu.
                            </p>
                          </div>
                          
                          <p style="margin: 24px 0 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
                            If you have any questions about your new role, please don't hesitate to reach out.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                          <p style="margin: 0 0 8px 0; color: #999999; font-size: 14px;">
                            Best regards,<br>
                            <strong style="color: #667eea;">The Food Donation Platform Team</strong>
                          </p>
                          <p style="margin: 16px 0 0 0; color: #cccccc; font-size: 12px;">
                            This is an automated notification email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      console.log("Admin promotion email sent successfully to", userEmail);
    } catch (emailError: any) {
      console.error("Failed to send promotion email:", emailError);
      // Don't fail the promotion if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "User promoted to admin successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in promote-to-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
