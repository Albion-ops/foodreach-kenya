import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userName: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${userEmail} (${userName})`);

    const emailResponse = await resend.emails.send({
      from: "Food Donation Platform <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Welcome to Food Donation Platform! 🍎",
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
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                          🍎 Welcome to Food Donation Platform!
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                          Hi ${userName}! 👋
                        </h2>
                        
                        <p style="margin: 0 0 16px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                          Thank you for joining our community! We're excited to have you on board and help reduce food waste together.
                        </p>
                        
                        <p style="margin: 0 0 16px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                          With your account, you can:
                        </p>
                        
                        <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
                          <li><strong>Donate Food:</strong> Share surplus food with those who need it</li>
                          <li><strong>Browse Donations:</strong> Find available food donations near you</li>
                          <li><strong>Track Your Impact:</strong> See how much food you've helped save</li>
                          <li><strong>Manage Your Donations:</strong> Update and track your contributions</li>
                        </ul>
                        
                        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
                          <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">
                            <strong>💡 Getting Started:</strong> Head to your Dashboard to create your first donation or browse available food donations in your area.
                          </p>
                        </div>
                        
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace('supabase.co', 'lovable.app') || 'https://app.lovable.app'}" 
                             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Go to Dashboard
                          </a>
                        </div>
                        
                        <p style="margin: 24px 0 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
                          If you have any questions or need assistance, feel free to reach out through our contact page.
                        </p>
                        
                        <p style="margin: 16px 0 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
                          Together, we can make a difference! 🌍
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 8px 0; color: #999999; font-size: 14px;">
                          Best regards,<br>
                          <strong style="color: #10b981;">The Food Donation Platform Team</strong>
                        </p>
                        <p style="margin: 16px 0 0 0; color: #cccccc; font-size: 12px;">
                          You're receiving this email because you created an account on our platform.
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

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
