import { NextRequest, NextResponse } from "next/server";
import { BrevoClient, BrevoEnvironment } from "@getbrevo/brevo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, mobile_number, course, message, admin_email } = body;

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "Hustlify";

    if (!apiKey || !senderEmail) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const recipients: { email: string; name?: string }[] = [];
    if (admin_email && typeof admin_email === "string" && admin_email.trim()) {
      recipients.push({ email: admin_email.trim() });
    }
    if (
      senderEmail &&
      typeof senderEmail === "string" &&
      senderEmail.trim() &&
      !recipients.some((r) => r.email.toLowerCase() === senderEmail.toLowerCase().trim())
    ) {
      recipients.push({ email: senderEmail.trim() });
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipient email configured" },
        { status: 400 }
      );
    }

    const client = new BrevoClient({
      apiKey,
      environment: BrevoEnvironment.Default,
    });

    const submittedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const cleanPhone = (mobile_number || "").replace(/[^0-9]/g, "");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 0;">
        <div style="background: #000; padding: 24px 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
            ${senderName}
          </h1>
        </div>

        <div style="background: #fff; padding: 32px;">
          <div style="border-left: 3px solid #000; padding-left: 16px; margin-bottom: 28px;">
            <h2 style="margin: 0 0 4px 0; font-size: 18px; color: #111; font-weight: 700;">
              New Enquiry Received
            </h2>
            <p style="margin: 0; font-size: 13px; color: #888;">
              Submitted on ${submittedAt}
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 10px 12px; background: #f5f5f5; font-weight: 600; color: #555; width: 36%; border-bottom: 1px solid #eee;">
                Full Name
              </td>
              <td style="padding: 10px 12px; color: #111; border-bottom: 1px solid #eee; background: #fafafa;">
                ${full_name || "—"}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: #f5f5f5; font-weight: 600; color: #555; border-bottom: 1px solid #eee;">
                Mobile Number
              </td>
              <td style="padding: 10px 12px; color: #111; border-bottom: 1px solid #eee; background: #fafafa;">
                <a href="tel:${mobile_number}" style="color: #000; text-decoration: none;">
                  ${mobile_number || "—"}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: #f5f5f5; font-weight: 600; color: #555; border-bottom: 1px solid #eee;">
                Course Interest
              </td>
              <td style="padding: 10px 12px; color: #111; border-bottom: 1px solid #eee; background: #fafafa;">
                ${course || "General Inquiry"}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: #f5f5f5; font-weight: 600; color: #555; vertical-align: top;">
                Message
              </td>
              <td style="padding: 10px 12px; color: #111; background: #fafafa; line-height: 1.6;">
                ${message ? message.replace(/\n/g, "<br/>") : "—"}
              </td>
            </tr>
          </table>

          <div style="margin-top: 28px; padding: 16px; background: #f5f5f5; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #555;">
              Quick actions:&nbsp;
              <a href="tel:${mobile_number}" style="color: #000; font-weight: 700; text-decoration: underline;">Call Now</a>
              &nbsp;·&nbsp;
              <a href="https://wa.me/${cleanPhone}" style="color: #25D366; font-weight: 700; text-decoration: underline;">WhatsApp</a>
            </p>
          </div>
        </div>

        <div style="padding: 16px 32px; background: #f0f0f0; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #aaa;">
            This is an automated notification from ${senderName}. Do not reply to this email.
          </p>
        </div>
      </div>
    `;

    const subject = `🔔 New Enquiry: ${full_name || "Visitor"} • ${submittedAt}`;

    await client.transactionalEmails.sendTransacEmail({
      sender: { name: senderName, email: senderEmail },
      to: recipients,
      subject,
      htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Enquiry email notification error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
