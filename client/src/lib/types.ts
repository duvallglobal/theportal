// User types
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'client';
  plan?: string;
  onboardingStatus?: 'incomplete' | 'complete';
  onboardingStep?: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

// Profile types
export interface ProfileInfo {
  id: number;
  userId: number;
  preferredContactMethod?: string;
  preferredCheckInTime?: string;
  timezone?: string;
  brandDescription?: string;
  voiceTone?: string;
  doNotSayTerms?: string;
  uploadFrequency?: string;
  birthDate?: string;
}

// Platform Account types
export interface PlatformAccountInfo {
  id: number;
  userId: number;
  platformType: string;
  username?: string;
  password?: string;
  needsCreation?: boolean;
}

// Content Strategy types
export interface ContentStrategyInfo {
  id: number;
  userId: number;
  growthGoals: string[];
  contentTypes: string[];
  doNotSayTerms?: string;
  existingContent?: string;
}

// Media File types
export interface MediaFileInfo {
  id: number;
  userId: number;
  title: string;
  description?: string;
  fileType: string;
  storagePath: string;
  thumbnailPath?: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadDate: Date;
  scheduledDate?: Date;
  tags?: string[];
}

// Verification Document types
export interface VerificationDocumentInfo {
  id: number;
  userId: number;
  documentType: 'id_front' | 'id_back' | 'selfie';
  storagePath: string;
  uploadDate: Date;
  status: 'pending' | 'verified' | 'rejected';
}

// Subscription types
export interface SubscriptionInfo {
  id: number;
  userId: number;
  planType: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due';
  startDate: Date;
  endDate?: Date;
}

// Appointment types
export interface AppointmentInfo {
  id: number;
  userId: number;
  clientName: string;
  appointmentDate: Date;
  duration: number;
  location: string;
  details?: string;
  status: 'pending' | 'confirmed' | 'canceled';
}

// Message types
export interface MessageInfo {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: Date;
  readAt?: Date;
  attachments?: any[];
}

// Conversation types
export interface ConversationInfo {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessagePreview?: string;
  participants?: ParticipantInfo[];
}

export interface ParticipantInfo {
  id: number;
  conversationId: number;
  userId: number;
  joinedAt: Date;
}

// Notification types
export interface NotificationInfo {
  id: number;
  userId: number;
  type: string;
  content: string;
  createdAt: Date;
  readAt?: Date;
  deliveryMethod: 'email' | 'in-app';
}

// RentMen settings types
export interface RentMenSettingsInfo {
  id: number;
  userId: number;
  geographicAvailability?: string;
  minimumRate?: string;
  clientScreeningPreferences?: string;
  servicesOffered?: string[];
  approvalProcess?: 'auto' | 'manual';
  bookingSummaryPreferences?: string[];
  availabilityTimes?: AvailabilityTimeInfo[];
  receiveBookingAlerts?: boolean;
  showOnlyVerifiedClients?: boolean;
}

export interface AvailabilityTimeInfo {
  day: string;
  startTime?: string;
  endTime?: string;
  available: boolean;
}

// Onboarding types
export interface OnboardingStepInfo {
  id: number;
  title: string;
  status: 'completed' | 'current' | 'pending';
}

// Dashboard data types
export interface DashboardStats {
  subscriberCount: number;
  contentUploads: number;
  engagementRate: string;
  nextPayment: {
    amount: string;
    dueDate: Date;
  };
  completedSteps: number;
  totalSteps: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}
