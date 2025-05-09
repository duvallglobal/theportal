import { MailService } from '@sendgrid/mail';

// Initialize SendGrid client
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SendGrid API key is missing. Email functionality will be unavailable.");
} else {
  console.log("SendGrid initialized");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'Welcome to ManageTheFans Portal',
    text: (name: string) => `Hello ${name},\n\nWelcome to ManageTheFans Portal! Your account has been created. Please log in to start managing your content and appointments.\n\nBest regards,\nThe ManageTheFans Team`,
    html: (name: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to ManageTheFans Portal!</h2>
        <p>Hello ${name},</p>
        <p>Your account has been successfully created and is now ready to use.</p>
        <p>With ManageTheFans, you can:</p>
        <ul>
          <li>Manage your content across platforms</li>
          <li>Schedule and track appointments</li>
          <li>View analytics and performance metrics</li>
          <li>Communicate with administrators</li>
        </ul>
        <p>Please log in to get started with your content management journey.</p>
        <div style="margin: 30px 0;">
          <a href="https://managethefans.com/login" style="background-color: #4a90e2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Log In Now
          </a>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,</p>
        <p><strong>The ManageTheFans Team</strong></p>
      </div>
    `
  },
  ACCOUNT_VERIFICATION: {
    subject: 'Your ManageTheFans Account is Verified',
    text: (name: string) => `Hello ${name},\n\nYour ManageTheFans account has been verified! You now have full access to all platform features.\n\nBest regards,\nThe ManageTheFans Team`,
    html: (name: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Account Verified!</h2>
        <p>Hello ${name},</p>
        <p>We're pleased to inform you that your ManageTheFans account has been successfully verified!</p>
        <p>You now have full access to all platform features and services. Log in to explore everything we have to offer.</p>
        <div style="margin: 30px 0;">
          <a href="https://managethefans.com/login" style="background-color: #4a90e2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Access Your Account
          </a>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,</p>
        <p><strong>The ManageTheFans Team</strong></p>
      </div>
    `
  }
};

/**
 * Send an email using SendGrid
 * @param to Recipient email address
 * @param subject Email subject
 * @param text Plain text email content
 * @param html HTML email content (optional)
 * @returns Promise<boolean> True if email was sent successfully
 */
export async function sendEmail(
  to: string, 
  subject: string, 
  text: string, 
  html?: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid not configured. Email not sent.");
    return false;
  }

  try {
    await mailService.send({
      to,
      from: 'info@managethefans.com', // Replace with verified sender email
      subject,
      text,
      html: html || text,
    });
    console.log(`Email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return false;
  }
}

/**
 * Send a welcome email to a new client
 * @param email Client's email address
 * @param name Client's full name
 * @returns Promise<boolean> True if email was sent successfully
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const template = EMAIL_TEMPLATES.WELCOME;
  return await sendEmail(
    email,
    template.subject,
    template.text(name),
    template.html(name)
  );
}

/**
 * Send a verification confirmation email to a client
 * @param email Client's email address
 * @param name Client's full name
 * @returns Promise<boolean> True if email was sent successfully
 */
export async function sendVerificationEmail(email: string, name: string): Promise<boolean> {
  const template = EMAIL_TEMPLATES.ACCOUNT_VERIFICATION;
  return await sendEmail(
    email,
    template.subject,
    template.text(name),
    template.html(name)
  );
}