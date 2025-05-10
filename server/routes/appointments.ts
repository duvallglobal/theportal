import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { format } from "date-fns";
import twilio from "twilio";

const router = Router();

// Initialize Twilio if API keys exist
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
let twilioClient: twilio.Twilio | undefined;

if (twilioAccountSid && twilioAuthToken && twilioAccountSid.startsWith('AC')) {
  try {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    console.log("Twilio client initialized in appointments routes");
  } catch (error) {
    console.error("Error initializing Twilio client:", error);
  }
} else {
  console.warn("Twilio credentials missing or invalid in appointments routes. SMS functionality will be unavailable.");
}

// Utility to format phone number for Twilio
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Ensure it has country code, add +1 (US) if needed
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length > 10 && !phoneNumber.startsWith('+')) {
    return `+${digitsOnly}`;
  }
  
  // If already has +, just return the cleaned version
  return phoneNumber.startsWith('+') ? phoneNumber : `+${digitsOnly}`;
}

// Function to send SMS notifications
async function sendSmsNotification(to: string, message: string): Promise<boolean> {
  if (!twilioClient || !twilioPhoneNumber) {
    console.warn("Twilio not configured. SMS not sent.");
    return false;
  }

  try {
    // Format the phone number for Twilio
    const formattedNumber = formatPhoneNumber(to);
    
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedNumber
    });
    
    console.log(`SMS sent successfully: ${result.sid}`);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

// Send notification for appointment
router.post("/:id/notification", async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const { method, message } = req.body;
    
    if (!method || !message) {
      return res.status(400).json({ message: "Method and message are required" });
    }
    
    // Get appointment with client info
    const appointment = await storage.getAppointmentWithClient(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Ensure client data is available
    if (!appointment.client) {
      return res.status(404).json({ message: "Client information not found" });
    }
    
    let notificationSent = false;
    const notificationType = method;
    
    // Format date for message
    const appointmentDate = new Date(appointment.appointmentDate);
    const formattedDate = format(appointmentDate, "MMMM d, yyyy 'at' h:mm a");
    
    // Check notification method and send
    if (method === "sms" || method === "all") {
      if (!appointment.client.phone) {
        return res.status(400).json({ message: "Client has no phone number for SMS" });
      }
      
      const smsMessage = message || `Reminder: You have an appointment on ${formattedDate} at ${appointment.location}. Duration: ${appointment.duration} minutes.`;
      
      const smsSent = await sendSmsNotification(appointment.client.phone, smsMessage);
      
      if (smsSent) {
        notificationSent = true;
        
        // Log notification to communication history
        await storage.createCommunicationHistory({
          userId: appointment.clientId,
          content: smsMessage,
          type: "appointment",
          deliveryMethod: "sms",
        });
      }
    }
    
    if (method === "in-app" || method === "all") {
      // Create in-app notification
      await storage.createNotification({
        userId: appointment.clientId,
        content: message || `Appointment reminder for ${formattedDate}`,
        type: "appointment",
        deliveryMethod: "in-app",
      });
      
      notificationSent = true;
    }
    
    if (method === "email" || method === "all") {
      if (!appointment.client.email) {
        return res.status(400).json({ message: "Client has no email for email notification" });
      }
      
      // Send email using your email service (implementation depends on your email service)
      const emailSent = await storage.sendEmail(
        appointment.client.email, 
        "Appointment Notification", 
        message || `You have an appointment on ${formattedDate} at ${appointment.location}. Duration: ${appointment.duration} minutes.`
      );
      
      if (emailSent) {
        notificationSent = true;
        
        // Log notification to communication history
        await storage.createCommunicationHistory({
          userId: appointment.clientId,
          content: message || `Email notification for appointment on ${formattedDate}`,
          type: "appointment", 
          deliveryMethod: "email",
        });
      }
    }
    
    if (notificationSent) {
      // Update appointment notification status
      await storage.updateAppointment(appointmentId, {
        notificationSent: true,
        notificationMethod: notificationType,
      });
      
      return res.status(200).json({ 
        success: true,
        message: `Notification sent via ${method}` 
      });
    } else {
      return res.status(500).json({ 
        success: false,
        message: "Failed to send notification" 
      });
    }
  } catch (error) {
    console.error("Error sending appointment notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Resend appointment notification
router.post("/:id/resend-notification", async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const { notificationMethod } = req.body;
    
    // Get appointment with client info
    const appointment = await storage.getAppointmentWithClient(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Ensure client data is available
    if (!appointment.client) {
      return res.status(404).json({ message: "Client information not found" });
    }
    
    // Format date for message
    const appointmentDate = new Date(appointment.appointmentDate);
    const formattedDate = format(appointmentDate, "MMMM d, yyyy 'at' h:mm a");
    
    const message = `Reminder: You have an appointment on ${formattedDate} at ${appointment.location}. Duration: ${appointment.duration} minutes.`;
    
    // Call the notification endpoint
    const result = await fetch(`${req.protocol}://${req.get('host')}/api/appointments/${appointmentId}/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || '',
      },
      body: JSON.stringify({
        method: notificationMethod || appointment.notificationMethod,
        message,
      }),
    });
    
    if (result.ok) {
      return res.status(200).json({ success: true, message: "Notification resent successfully" });
    } else {
      const error = await result.json();
      return res.status(result.status).json(error);
    }
  } catch (error) {
    console.error("Error resending appointment notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;