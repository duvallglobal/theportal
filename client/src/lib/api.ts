import { apiRequest } from './queryClient';

/**
 * Send a welcome email to a client
 * @param email Client's email address
 * @param name Client's full name
 * @returns Promise<boolean> True if email was sent successfully
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/admin/send-welcome-email', {
      email,
      name
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send welcome email');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send a verification confirmation email to a client
 * @param email Client's email address
 * @param name Client's full name
 * @returns Promise<boolean> True if email was sent successfully
 */
export async function sendVerificationEmail(email: string, name: string): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/admin/send-verification-email', {
      email,
      name
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send verification email');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Send an SMS notification to a client
 * @param phone Client's phone number
 * @param message SMS message content
 * @returns Promise<boolean> True if SMS was sent successfully
 */
export async function sendSmsNotification(phone: string, message: string): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/admin/send-sms', {
      phone,
      message
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send SMS');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Verify a client's account
 * @param userId Client's user ID
 * @param status Verification status ("verified" | "rejected")
 * @returns Promise<boolean> True if verification status was updated successfully
 */
export async function updateVerificationStatus(userId: number, status: 'verified' | 'rejected'): Promise<boolean> {
  try {
    const response = await apiRequest('PATCH', `/api/admin/users/${userId}/verification`, {
      status
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update verification status');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating verification status:', error);
    return false;
  }
}