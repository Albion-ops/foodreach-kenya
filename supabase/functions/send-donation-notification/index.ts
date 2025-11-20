import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DonationNotificationRequest {
  donationId: string;
  foodType: string;
  quantity: string;
  location: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donationId, foodType, quantity, location }: DonationNotificationRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    console.log("Sending donation notification for:", { donationId, foodType, location });

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "FoodReach Kenya <onboarding@resend.dev>",
        to: ["georgekoikai922@gmail.com"],
        subject: "New Food Donation Posted - FoodReach Kenya",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">New Food Donation Available!</h1>
            <p>A new donation has been posted on FoodReach Kenya:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Food Type:</strong> ${foodType}</p>
              <p><strong>Quantity:</strong> ${quantity}</p>
              <p><strong>Location:</strong> ${location}</p>
            </div>
            <p>Visit <a href="https://foodreach-kenya.lovable.app/donations" style="color: #10b981;">FoodReach Kenya</a> to view all available donations.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              FoodReach Kenya - Fighting Hunger Together<br>
              Contact: +254-113-480-651 | georgekoikai922@gmail.com
            </p>
          </div>
        `,
      })
    });

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-donation-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
