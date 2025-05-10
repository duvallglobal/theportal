import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { users, mediaFiles, appointments, messages, subscriptions } from '@shared/schema';

const router = Router();

// Helper function to get date range based on timeRange parameter
function getDateRange(timeRange: string): { startDate: Date, endDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(now);
  let startDate = new Date(now);
  
  switch (timeRange) {
    case 'today':
      startDate = today;
      break;
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      endDate.setDate(today.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'last7Days':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last30Days':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    default:
      // Default to last 7 days
      startDate.setDate(startDate.getDate() - 7);
  }
  
  return { startDate, endDate };
}

// Helper function to get previous period date range
function getPreviousPeriodRange(timeRange: string, currentRange: { startDate: Date, endDate: Date }) {
  const { startDate, endDate } = currentRange;
  const periodLength = endDate.getTime() - startDate.getTime();
  
  const previousStartDate = new Date(startDate.getTime() - periodLength);
  const previousEndDate = new Date(endDate.getTime() - periodLength);
  
  return { startDate: previousStartDate, endDate: previousEndDate };
}

// Helper function to calculate percentage change
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Get dashboard statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    const timeRange = (req.query.timeRange as string) || 'last7Days';
    const currentRange = getDateRange(timeRange);
    const previousRange = getPreviousPeriodRange(timeRange, currentRange);
    
    // Get all users for the current period
    const allUsers = await storage.getAllUsers();
    const clientUsers = allUsers.filter(user => user.role === 'client');
    
    // Count active clients (created within the time range)
    const activeClients = clientUsers.filter(user => 
      new Date(user.createdAt) >= currentRange.startDate && 
      new Date(user.createdAt) <= currentRange.endDate
    ).length;
    
    // Count active clients in the previous period
    const previousActiveClients = clientUsers.filter(user => 
      new Date(user.createdAt) >= previousRange.startDate && 
      new Date(user.createdAt) <= previousRange.endDate
    ).length;
    
    // Count verified clients
    const verifiedClients = clientUsers.filter(user => 
      user.verificationStatus === 'verified' && 
      new Date(user.updatedAt) >= currentRange.startDate && 
      new Date(user.updatedAt) <= currentRange.endDate
    ).length;
    
    // Count verified clients in the previous period
    const previousVerifiedClients = clientUsers.filter(user => 
      user.verificationStatus === 'verified' && 
      new Date(user.updatedAt) >= previousRange.startDate && 
      new Date(user.updatedAt) <= previousRange.endDate
    ).length;
    
    // Get all appointments for the current period
    const allAppointments = await Promise.all(
      clientUsers.map(user => storage.getAppointmentsByClient(user.id))
    ).then(results => results.flat());
    
    const appointments = allAppointments.filter(appointment => 
      new Date(appointment.createdAt) >= currentRange.startDate && 
      new Date(appointment.createdAt) <= currentRange.endDate
    ).length;
    
    // Count appointments in the previous period
    const previousAppointments = allAppointments.filter(appointment => 
      new Date(appointment.createdAt) >= previousRange.startDate && 
      new Date(appointment.createdAt) <= previousRange.endDate
    ).length;
    
    // Get all messages for the current period
    const allMessages = await Promise.all(
      clientUsers.map(user => storage.getMessagesByUser(user.id))
    ).then(results => results.flat());
    
    const unreadMessages = allMessages.filter(message => 
      message.readAt === null && 
      new Date(message.createdAt) >= currentRange.startDate && 
      new Date(message.createdAt) <= currentRange.endDate
    ).length;
    
    // Count unread messages in the previous period
    const previousUnreadMessages = allMessages.filter(message => 
      message.readAt === null && 
      new Date(message.createdAt) >= previousRange.startDate && 
      new Date(message.createdAt) <= previousRange.endDate
    ).length;
    
    // Calculate revenue from subscriptions
    const allSubscriptions = await Promise.all(
      clientUsers.map(user => storage.getSubscriptionsByUserId(user.id))
    ).then(results => results.flat());
    
    const currentSubscriptions = allSubscriptions.filter(subscription => 
      subscription.status === 'active' && 
      new Date(subscription.startDate) >= currentRange.startDate && 
      new Date(subscription.startDate) <= currentRange.endDate
    );
    
    const previousSubscriptions = allSubscriptions.filter(subscription => 
      subscription.status === 'active' && 
      new Date(subscription.startDate) >= previousRange.startDate && 
      new Date(subscription.startDate) <= previousRange.endDate
    );
    
    // Simple revenue calculation (in a real app, this would be more complex)
    const planPricing = {
      'basic': 9.99,
      'pro': 19.99,
      'premium': 29.99,
      'enterprise': 99.99
    };
    
    const calculateRevenue = (subs) => subs.reduce((total, sub) => {
      const price = planPricing[sub.planType.toLowerCase()] || 0;
      return total + price;
    }, 0);
    
    const revenue = calculateRevenue(currentSubscriptions);
    const previousRevenue = calculateRevenue(previousSubscriptions);
    
    // Get media content count
    const allMediaFiles = await Promise.all(
      clientUsers.map(user => storage.getMediaFilesByUserId(user.id))
    ).then(results => results.flat());
    
    const mediaContent = allMediaFiles.filter(media => 
      new Date(media.uploadDate) >= currentRange.startDate && 
      new Date(media.uploadDate) <= currentRange.endDate
    ).length;
    
    // Count media content in the previous period
    const previousMediaContent = allMediaFiles.filter(media => 
      new Date(media.uploadDate) >= previousRange.startDate && 
      new Date(media.uploadDate) <= previousRange.endDate
    ).length;
    
    // Calculate percentage changes
    const activeClientsChange = calculatePercentageChange(activeClients, previousActiveClients);
    const verifiedClientsChange = calculatePercentageChange(verifiedClients, previousVerifiedClients);
    const appointmentsChange = calculatePercentageChange(appointments, previousAppointments);
    const unreadMessagesChange = calculatePercentageChange(unreadMessages, previousUnreadMessages);
    const revenueChange = calculatePercentageChange(revenue, previousRevenue);
    const mediaContentChange = calculatePercentageChange(mediaContent, previousMediaContent);
    
    // Return the statistics
    res.json({
      timeRange,
      activeClients,
      activeClientsChange,
      verifiedClients,
      verifiedClientsChange,
      appointments,
      appointmentsChange,
      unreadMessages,
      unreadMessagesChange,
      revenue,
      revenueChange,
      mediaContent,
      mediaContentChange,
      // Add extra context for debugging
      periodStart: currentRange.startDate,
      periodEnd: currentRange.endDate,
      previousPeriodStart: previousRange.startDate,
      previousPeriodEnd: previousRange.endDate
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ message: 'Error getting statistics' });
  }
});

export default router;