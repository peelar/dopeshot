import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured - skipping email signup");
      return NextResponse.json(
        { success: true, message: "Waitlist feature not configured yet" },
        { status: 200 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Add to Resend audience (if configured)
    if (process.env.RESEND_AUDIENCE_ID) {
      await resend.contacts.create({
        email,
        audienceId: process.env.RESEND_AUDIENCE_ID,
        unsubscribed: false,
      });
    }

    // Send welcome email
    const welcomeEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #f97316; font-size: 32px; margin-bottom: 20px;">You're in! 🎉</h1>
        <p style="color: #666; font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          Thanks for joining the dopeshot brand kits waitlist.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We're building brand kits so you can upload your logo and colors once,
          and every screenshot automatically gets your brand treatment. No manual work,
          no inconsistencies—just your vibe, every time.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          We'll ping you as soon as it's ready to ship.
        </p>
        <a href="https://dopeshot.io" style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Try dopeshot now
        </a>
        <p style="color: #999; font-size: 14px; margin-top: 40px;">
          Built for indie hackers who ship fast and post often.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "dopeshot <noreply@dopeshot.io>",
      to: email,
      subject: "You're on the list! 🚀",
      html: welcomeEmail,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist. Please try again." },
      { status: 500 }
    );
  }
}
