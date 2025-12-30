import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { verifySession } from "@/lib/auth/session";

// Initialize Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Configure feedback recipient email
const FEEDBACK_RECIPIENT = process.env.FEEDBACK_EMAIL || "feedback@dopeshot.io";

interface FeedbackRequest {
  message: string;
  email?: string;
  screenshot?: string; // base64 data URL
}

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!resend) {
      console.error("Resend is not configured (missing RESEND_API_KEY)");
      return NextResponse.json(
        { error: "Feedback service is not configured. Please check environment variables." },
        { status: 503 }
      );
    }

    // Parse request body with size validation
    let body: FeedbackRequest;
    try {
      body = (await request.json()) as FeedbackRequest;
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { message, email, screenshot } = body;

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Feedback message is required" },
        { status: 400 }
      );
    }

    // Validate screenshot size (max 3MB to stay under Vercel's 4.5MB payload limit)
    if (screenshot && screenshot.length > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Screenshot is too large. Please try again." },
        { status: 413 }
      );
    }

    // Try to get user session (optional - allow anonymous feedback)
    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      const sessionResult = await verifySession();
      if (sessionResult.isAuth && sessionResult.userId) {
        userId = sessionResult.userId;
        userEmail = sessionResult.session?.user?.email || null;
      }
    } catch {
      // Session verification failed - continue as anonymous
    }

    // Gather context
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const referer = request.headers.get("referer") || "Unknown";
    const timestamp = new Date().toISOString();

    // Build email HTML
    const emailHtml = buildFeedbackEmailHtml({
      message,
      userId,
      userEmail,
      replyEmail: email,
      referer,
      timestamp,
      userAgent,
      hasScreenshot: !!screenshot,
    });

    // Prepare email attachments
    const attachments: Array<{
      filename: string;
      content: Buffer;
    }> = [];

    if (screenshot) {
      try {
        // Convert data URL to buffer
        const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        attachments.push({
          filename: "screenshot.png",
          content: buffer,
        });
      } catch (error) {
        console.error("Failed to process screenshot:", error);
        // Continue without screenshot rather than failing
      }
    }

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: "dopeshot Feedback <feedback@dopeshot.io>",
      to: FEEDBACK_RECIPIENT,
      subject: `New Feedback: ${message.slice(0, 50)}${message.length > 50 ? "..." : ""}`,
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyTo: email || userEmail || undefined,
    });

    if (emailResult.error) {
      console.error("Resend API error:", emailResult.error);
      throw new Error(emailResult.error.message);
    }

    return NextResponse.json({ success: true, id: emailResult.data?.id });
  } catch (error) {
    console.error("Feedback submission failed:", error);

    // Always return JSON, even for unexpected errors
    const errorMessage = error instanceof Error
      ? error.message
      : "An unexpected error occurred while submitting feedback";

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function buildFeedbackEmailHtml(context: {
  message: string;
  userId: string | null;
  userEmail: string | null;
  replyEmail?: string;
  referer: string;
  timestamp: string;
  userAgent: string;
  hasScreenshot: boolean;
}): string {
  const {
    message,
    userId,
    userEmail,
    replyEmail,
    referer,
    timestamp,
    userAgent,
    hasScreenshot,
  } = context;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin: -20px -20px 20px -20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .message {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 16px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .context {
      background: #fff;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
    }
    .context h2 {
      margin: 0 0 12px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.5px;
    }
    .context-item {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .context-item:last-child {
      border-bottom: none;
    }
    .context-label {
      font-weight: 600;
      min-width: 140px;
      color: #666;
    }
    .context-value {
      color: #333;
      word-break: break-word;
    }
    .screenshot-notice {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e1e4e8;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📢 New Feedback Received</h1>
  </div>

  <div class="message">
    ${escapeHtml(message)}
  </div>

  ${
    hasScreenshot
      ? '<div class="screenshot-notice">📸 Screenshot attached to this email</div>'
      : ""
  }

  <div class="context">
    <h2>Context</h2>

    ${
      userId
        ? `<div class="context-item">
      <span class="context-label">User ID:</span>
      <span class="context-value">${escapeHtml(userId)}</span>
    </div>`
        : '<div class="context-item"><span class="context-label">User:</span><span class="context-value">Anonymous</span></div>'
    }

    ${
      userEmail
        ? `<div class="context-item">
      <span class="context-label">User Email:</span>
      <span class="context-value"><a href="mailto:${escapeHtml(userEmail)}">${escapeHtml(userEmail)}</a></span>
    </div>`
        : ""
    }

    ${
      replyEmail
        ? `<div class="context-item">
      <span class="context-label">Reply Email:</span>
      <span class="context-value"><a href="mailto:${escapeHtml(replyEmail)}">${escapeHtml(replyEmail)}</a></span>
    </div>`
        : ""
    }

    <div class="context-item">
      <span class="context-label">Page:</span>
      <span class="context-value">${escapeHtml(referer)}</span>
    </div>

    <div class="context-item">
      <span class="context-label">Timestamp:</span>
      <span class="context-value">${new Date(timestamp).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "long",
      })}</span>
    </div>

    <div class="context-item">
      <span class="context-label">Browser:</span>
      <span class="context-value">${escapeHtml(userAgent)}</span>
    </div>
  </div>

  <div class="footer">
    Sent from dopeshot Feedback System
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
