import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendInvitationEmail({
  to,
  projectName,
  builderName,
  invitationLink,
}: {
  to: string;
  projectName: string;
  builderName: string;
  invitationLink: string;
}) {
  if (!resend) {
    console.warn('Resend API key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Honestly Housing <noreply@honestlyhousing.com>',
      to: [to],
      subject: `You've been invited to ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Project Invitation</title>
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Honestly Housing</h1>
            </div>
            
            <div style="background: white; padding: 40px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1F2937; margin-top: 0; font-size: 24px;">You've Been Invited!</h2>
              
              <p style="font-size: 16px; color: #4B5563; margin: 20px 0;">
                <strong>${builderName}</strong> has invited you to collaborate on the project:
              </p>
              
              <div style="background: #F5F5DC; border-left: 4px solid #B8860B; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1F2937;">${projectName}</p>
              </div>
              
              <p style="font-size: 16px; color: #4B5563; margin: 20px 0;">
                Click the button below to accept the invitation and start making your selections:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${invitationLink}" style="display: inline-block; background: #B8860B; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6B7280; margin: 30px 0 10px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #B8860B; word-break: break-all; background: #F9FAFB; padding: 12px; border-radius: 4px;">
                ${invitationLink}
              </p>
              
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Honestly Housing. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}
