import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClaimedEmailRequest {
  donationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donationId }: ClaimedEmailRequest = await req.json();

    console.log(`Processing claimed notification for donation: ${donationId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch donation details
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single();

    if (donationError || !donation) {
      console.error("Error fetching donation:", donationError);
      throw new Error("Donation not found");
    }

    // Fetch donor's profile and email
    const { data: { user: donor }, error: userError } = await supabase.auth.admin.getUserById(
      donation.user_id
    );

    if (userError || !donor) {
      console.error("Error fetching donor:", userError);
      throw new Error("Donor not found");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", donation.user_id)
      .single();

    const donorName = profile?.full_name || "there";
    const donorEmail = donor.email!;

    // Send notification email
    const emailResponse = await resend.emails.send({
      from: "Food Donation Platform <onboarding@resend.dev>",
      to: [donorEmail],
      subject: "Your donation has been claimed! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
              }
              .donation-card {
                background: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
              }
              .donation-detail {
                margin: 10px 0;
                display: flex;
                justify-content: space-between;
              }
              .label {
                font-weight: 600;
                color: #666;
              }
              .value {
                color: #333;
              }
              .impact-box {
                background: #e8f5e9;
                border: 2px solid #4caf50;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 14px;
                border-top: 1px solid #e0e0e0;
              }
              .emoji {
                font-size: 24px;
                margin: 10px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Great News!</h1>
              <p>Your donation has been claimed</p>
            </div>
            
            <div class="content">
              <p>Hi ${donorName},</p>
              
              <p>We're excited to let you know that your donation has been claimed by someone in need!</p>
              
              <div class="donation-card">
                <h3>📦 Donation Details</h3>
                <div class="donation-detail">
                  <span class="label">Food Type:</span>
                  <span class="value">${donation.food_type}</span>
                </div>
                <div class="donation-detail">
                  <span class="label">Quantity:</span>
                  <span class="value">${donation.quantity}</span>
                </div>
                <div class="donation-detail">
                  <span class="label">Location:</span>
                  <span class="value">${donation.location}</span>
                </div>
                ${donation.description ? `
                <div class="donation-detail">
                  <span class="label">Description:</span>
                  <span class="value">${donation.description}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="impact-box">
                <div class="emoji">🌟</div>
                <h3>You're Making a Difference!</h3>
                <p>Your generosity is helping reduce food waste and support those in need in your community.</p>
              </div>
              
              <p>Thank you for being part of our mission to connect surplus food with people who need it most.</p>
              
              <p style="margin-top: 30px;">
                <strong>Keep up the amazing work!</strong><br>
                The Food Donation Team
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from the Food Donation Platform.</p>
              <p>© ${new Date().getFullYear()} Food Donation Platform. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-donation-claimed-email function:", error);
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
