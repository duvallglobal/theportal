export const emailTemplates = {
  welcomeEmail: {
    subject: "Welcome to ManageTheFans - Get Started with Your Account",
    html: (clientName: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ManageTheFans</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 150px;
          }
          h1 {
            color: #0d47a1;
          }
          .step {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
          }
          .step h3 {
            margin-top: 0;
            color: #0d47a1;
          }
          .cta-button {
            display: inline-block;
            background-color: #0d47a1;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to ManageTheFans!</h1>
        </div>
        
        <p>Dear ${clientName},</p>
        
        <p>Thank you for joining ManageTheFans! We're excited to help you manage and grow your online presence. Our platform is designed to streamline your workflow and maximize your success.</p>
        
        <p>Here's how to get started:</p>
        
        <div class="step">
          <h3>Step 1: Complete Your Onboarding</h3>
          <p>Your onboarding process helps us understand your unique needs and tailor our services accordingly.</p>
          <p>Go through each step in the onboarding checklist to provide essential information about your brand, content strategy, and platform accounts.</p>
        </div>
        
        <div class="step">
          <h3>Step 2: Select Your Package</h3>
          <p>After completing onboarding, you'll be prompted to choose a subscription package:</p>
          <ul>
            <li><strong>Basic Package:</strong> Core management features for one platform</li>
            <li><strong>Pro Package:</strong> Enhanced support and multi-platform management</li>
            <li><strong>Premium Package:</strong> Full-service content creation and management</li>
          </ul>
          <p>Each package offers different levels of support to match your needs and budget.</p>
        </div>
        
        <div class="step">
          <h3>Step 3: Complete Payment</h3>
          <p>After selecting your package, you'll be directed to our secure payment portal where you can enter your payment details.</p>
          <p>We accept all major credit cards and process payments securely through Stripe.</p>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://managethefans.com/onboarding" class="cta-button">Continue Your Onboarding</a>
        </p>
        
        <p>If you have any questions along the way, please don't hesitate to contact our support team at support@managethefans.com.</p>
        
        <p>We look forward to helping you succeed!</p>
        
        <p>Best regards,<br>The ManageTheFans Team</p>
        
        <div class="footer">
          <p>© 2025 ManageTheFans. All rights reserved.</p>
          <p>123 Business Ave, Suite 100, Los Angeles, CA 90001</p>
        </div>
      </body>
      </html>
    `,
    text: (clientName: string) => `
Welcome to ManageTheFans!

Dear ${clientName},

Thank you for joining ManageTheFans! We're excited to help you manage and grow your online presence.

Here's how to get started:

Step 1: Complete Your Onboarding
Your onboarding process helps us understand your unique needs and tailor our services accordingly.
Go through each step in the onboarding checklist to provide essential information about your brand, content strategy, and platform accounts.

Step 2: Select Your Package
After completing onboarding, you'll be prompted to choose a subscription package:
- Basic Package: Core management features for one platform
- Pro Package: Enhanced support and multi-platform management
- Premium Package: Full-service content creation and management

Each package offers different levels of support to match your needs and budget.

Step 3: Complete Payment
After selecting your package, you'll be directed to our secure payment portal where you can enter your payment details.
We accept all major credit cards and process payments securely through Stripe.

If you have any questions along the way, please don't hesitate to contact our support team at support@managethefans.com.

We look forward to helping you succeed!

Best regards,
The ManageTheFans Team

© 2025 ManageTheFans. All rights reserved.
123 Business Ave, Suite 100, Los Angeles, CA 90001
    `
  }
};