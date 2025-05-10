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
    subject: 'Welcome to ManageTheFans - Get Started with Your Account',
    text: (name: string) => `
Hello ${name},

Thank you for joining ManageTheFans! We're excited to help you manage and grow your online presence.

Here's how to get started:

STEP 1: COMPLETE YOUR ONBOARDING
Your onboarding process helps us understand your unique needs and tailor our services accordingly.
Go through each step in the onboarding checklist to provide essential information about your brand, content strategy, and platform accounts.

STEP 2: SELECT YOUR PACKAGE
After completing onboarding, you'll be prompted to choose a subscription package:
- Basic Package: Core management features for one platform
- Pro Package: Enhanced support and multi-platform management
- Premium Package: Full-service content creation and management

Each package offers different levels of support to match your needs and budget.

STEP 3: COMPLETE PAYMENT
After selecting your package, you'll be directed to our secure payment portal where you can enter your payment details.
We accept all major credit cards and process payments securely through Stripe.

If you have any questions along the way, please don't hesitate to contact our support team at support@managethefans.com.

Best regards,
The ManageTheFans Team
    `,
    html: (name: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #0d47a1; text-align: center;">Welcome to ManageTheFans!</h2>
        
        <p>Dear ${name},</p>
        
        <p>Thank you for joining ManageTheFans! We're excited to help you manage and grow your online presence. Our platform is designed to streamline your workflow and maximize your success.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0d47a1;">Step 1: Complete Your Onboarding</h3>
          <p>Your onboarding process helps us understand your unique needs and tailor our services accordingly.</p>
          <p>Go through each step in the onboarding checklist to provide essential information about your brand, content strategy, and platform accounts.</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0d47a1;">Step 2: Select Your Package</h3>
          <p>After completing onboarding, you'll be prompted to choose a subscription package:</p>
          <ul>
            <li><strong>Basic Package:</strong> Core management features for one platform</li>
            <li><strong>Pro Package:</strong> Enhanced support and multi-platform management</li>
            <li><strong>Premium Package:</strong> Full-service content creation and management</li>
          </ul>
          <p>Each package offers different levels of support to match your needs and budget.</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0d47a1;">Step 3: Complete Payment</h3>
          <p>After selecting your package, you'll be directed to our secure payment portal where you can enter your payment details.</p>
          <p>We accept all major credit cards and process payments securely through Stripe.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://managethefans.com/onboarding" style="background-color: #0d47a1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Continue Your Onboarding
          </a>
        </div>
        
        <p>If you have any questions along the way, please don't hesitate to contact our support team at <a href="mailto:support@managethefans.com" style="color: #0d47a1; text-decoration: underline;">support@managethefans.com</a>.</p>
        
        <p>We look forward to helping you succeed!</p>
        
        <p>Best regards,<br>The ManageTheFans Team</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
          <p>© 2025 ManageTheFans. All rights reserved.</p>
        </div>
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