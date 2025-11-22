import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly digest email job...");

    // Create Supabase client with service role
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

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Get all users who have made donations
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users to process`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let emailsSent = 0;
    let emailsFailed = 0;

    // Process each user
    for (const profile of profiles || []) {
      try {
        // Get user's email from auth
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        
        if (userError || !user?.email) {
          console.log(`Skipping user ${profile.id}: no email found`);
          continue;
        }

        // Get user's donation statistics
        const { data: allDonations, error: allDonationsError } = await supabaseAdmin
          .from('donations')
          .select('*')
          .eq('user_id', profile.id);

        if (allDonationsError) {
          console.error(`Error fetching donations for user ${profile.id}:`, allDonationsError);
          continue;
        }

        // Skip users with no donations
        if (!allDonations || allDonations.length === 0) {
          console.log(`Skipping user ${profile.id}: no donations`);
          continue;
        }

        // Calculate statistics
        const totalDonations = allDonations.length;
        const availableDonations = allDonations.filter(d => d.status === 'available').length;
        const claimedDonations = allDonations.filter(d => d.status === 'claimed').length;
        
        const thisWeekDonations = allDonations.filter(d => 
          new Date(d.created_at) >= sevenDaysAgo
        );
        
        const thisWeekCount = thisWeekDonations.length;
        
        // Skip if no activity this week (optional - you can remove this to send to everyone)
        if (thisWeekCount === 0) {
          console.log(`Skipping user ${profile.id}: no activity this week`);
          continue;
        }

        // Build recent donations HTML
        let recentDonationsHtml = '';
        if (thisWeekCount > 0) {
          recentDonationsHtml = `
            <div style="margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #333333; font-size: 18px;">
                📦 Your Recent Donations
              </h3>
              <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px;">
                ${thisWeekDonations.slice(0, 5).map(donation => `
                  <div style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <strong style="color: #333333;">${donation.food_type}</strong>
                        <p style="margin: 4px 0 0 0; color: #6c757d; font-size: 14px;">
                          ${donation.quantity} • ${donation.location}
                        </p>
                      </div>
                      <span style="background-color: ${donation.status === 'available' ? '#d1fae5' : '#fef3c7'}; 
                                   color: ${donation.status === 'available' ? '#065f46' : '#92400e'}; 
                                   padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${donation.status}
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }

        // Send digest email
        const emailResponse = await resend.emails.send({
          from: "Food Donation Platform <onboarding@resend.dev>",
          to: [user.email],
          subject: `📊 Your Weekly Impact Summary - ${thisWeekCount} ${thisWeekCount === 1 ? 'donation' : 'donations'} this week!`,
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
                          <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                              📊 Your Weekly Impact
                            </h1>
                            <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px;">
                              ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                              Hi ${profile.full_name}! 👋
                            </h2>
                            
                            <p style="margin: 0 0 24px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                              Here's a summary of your impact on the Food Donation Platform this week.
                            </p>
                            
                            <!-- Stats Cards -->
                            <div style="margin: 24px 0;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td width="32%" style="padding: 16px; background-color: #dbeafe; border-radius: 6px; text-align: center;">
                                    <div style="font-size: 32px; font-weight: bold; color: #1e40af; margin-bottom: 4px;">
                                      ${thisWeekCount}
                                    </div>
                                    <div style="font-size: 14px; color: #1e40af;">
                                      This Week
                                    </div>
                                  </td>
                                  <td width="2%"></td>
                                  <td width="32%" style="padding: 16px; background-color: #d1fae5; border-radius: 6px; text-align: center;">
                                    <div style="font-size: 32px; font-weight: bold; color: #065f46; margin-bottom: 4px;">
                                      ${availableDonations}
                                    </div>
                                    <div style="font-size: 14px; color: #065f46;">
                                      Available
                                    </div>
                                  </td>
                                  <td width="2%"></td>
                                  <td width="32%" style="padding: 16px; background-color: #fef3c7; border-radius: 6px; text-align: center;">
                                    <div style="font-size: 32px; font-weight: bold; color: #92400e; margin-bottom: 4px;">
                                      ${claimedDonations}
                                    </div>
                                    <div style="font-size: 14px; color: #92400e;">
                                      Claimed
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </div>
                            
                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
                              <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">
                                <strong>🎉 Great work!</strong> You've made <strong>${totalDonations}</strong> total ${totalDonations === 1 ? 'donation' : 'donations'} and helped reduce food waste in your community!
                              </p>
                            </div>
                            
                            ${recentDonationsHtml}
                            
                            <div style="text-align: center; margin: 32px 0;">
                              <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace('supabase.co', 'lovable.app') || 'https://app.lovable.app'}" 
                                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                View Dashboard
                              </a>
                            </div>
                            
                            <p style="margin: 24px 0 0 0; color: #555555; font-size: 14px; line-height: 1.6; text-align: center;">
                              Keep up the amazing work! Every donation makes a difference. 🌍
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 8px 0; color: #999999; font-size: 14px;">
                              Best regards,<br>
                              <strong style="color: #3b82f6;">The Food Donation Platform Team</strong>
                            </p>
                            <p style="margin: 16px 0 0 0; color: #cccccc; font-size: 12px;">
                              You're receiving this weekly digest because you have an active account with donations.
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

        console.log(`Weekly digest sent to ${user.email}:`, emailResponse);
        emailsSent++;
      } catch (error) {
        console.error(`Failed to send digest to user ${profile.id}:`, error);
        emailsFailed++;
      }
    }

    console.log(`Weekly digest job completed: ${emailsSent} sent, ${emailsFailed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        emailsSent,
        emailsFailed,
        message: `Weekly digest sent to ${emailsSent} users`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-digest function:", error);
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
