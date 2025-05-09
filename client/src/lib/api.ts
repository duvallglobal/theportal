import { apiRequest } from './queryClient';
import type { ApiResponse, LoginCredentials, RegisterData, UserInfo, ProfileInfo, PlatformAccountInfo, ContentStrategyInfo, MediaFileInfo, AppointmentInfo, RentMenSettingsInfo } from './types';

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<UserInfo>> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  register: async (userData: RegisterData): Promise<ApiResponse<UserInfo>> => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      return { success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  getCurrentUser: async (): Promise<ApiResponse<UserInfo>> => {
    try {
      const response = await apiRequest('GET', '/api/auth/me', undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Profile API
export const profileApi = {
  getProfile: async (): Promise<ApiResponse<ProfileInfo>> => {
    try {
      const response = await apiRequest('GET', '/api/profile', undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  updatePersonalInfo: async (personalInfo: Partial<ProfileInfo> & { fullName?: string, email?: string }): Promise<ApiResponse<ProfileInfo>> => {
    try {
      const response = await apiRequest('PUT', '/api/profile/personal-info', personalInfo);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  updateAccountCredentials: async (platforms: Partial<PlatformAccountInfo>[]): Promise<ApiResponse<null>> => {
    try {
      const response = await apiRequest('PUT', '/api/profile/account-credentials', { platforms });
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  updateSecuritySettings: async (securitySettings: { currentPassword?: string, newPassword?: string, twoFactorEnabled?: boolean, receiveAlerts?: boolean }): Promise<ApiResponse<null>> => {
    try {
      const response = await apiRequest('PUT', '/api/profile/security-settings', securitySettings);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Brand Strategy API
export const brandStrategyApi = {
  getBrandStrategy: async (): Promise<ApiResponse<ContentStrategyInfo>> => {
    try {
      const response = await apiRequest('GET', '/api/brand-strategy', undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  updateBrandStrategy: async (strategyData: Partial<ContentStrategyInfo> & { brandDescription?: string, voiceTone?: string, doNotSayTerms?: string, uploadFrequency?: string }): Promise<ApiResponse<ContentStrategyInfo>> => {
    try {
      const response = await apiRequest('PUT', '/api/brand-strategy', strategyData);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Onboarding API
export const onboardingApi = {
  saveStep: async (stepNumber: number, stepData: any): Promise<ApiResponse<{ success: boolean }>> => {
    try {
      const response = await apiRequest('POST', `/api/onboarding/step/${stepNumber}`, stepData);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  getProgress: async (): Promise<ApiResponse<{ currentStep: number, status: string }>> => {
    try {
      const response = await apiRequest('GET', '/api/onboarding/progress', undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Content API
export const contentApi = {
  uploadContent: async (formData: FormData): Promise<ApiResponse<{ message: string, files: MediaFileInfo[] }>> => {
    try {
      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  getUserContent: async (userId: number): Promise<ApiResponse<MediaFileInfo[]>> => {
    try {
      const response = await apiRequest('GET', `/api/content/user/${userId}`, undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  deleteContent: async (contentId: number): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiRequest('DELETE', `/api/content/${contentId}`, undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Payment API
export const paymentApi = {
  createPaymentIntent: async (amount: number): Promise<ApiResponse<{ clientSecret: string }>> => {
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', { amount });
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  createSubscription: async (planId: string): Promise<ApiResponse<{ subscriptionId: string, clientSecret: string }>> => {
    try {
      const response = await apiRequest('POST', '/api/create-subscription', { planId });
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Appointments API
export const appointmentsApi = {
  createAppointment: async (appointmentData: Omit<AppointmentInfo, 'id' | 'userId'>): Promise<ApiResponse<AppointmentInfo>> => {
    try {
      const response = await apiRequest('POST', '/api/appointments', appointmentData);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  getUserAppointments: async (userId: number): Promise<ApiResponse<AppointmentInfo[]>> => {
    try {
      const response = await apiRequest('GET', `/api/appointments/user/${userId}`, undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  updateAppointment: async (appointmentId: number, appointmentData: Partial<AppointmentInfo>): Promise<ApiResponse<AppointmentInfo>> => {
    try {
      const response = await apiRequest('PUT', `/api/appointments/${appointmentId}`, appointmentData);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// RentMen API
export const rentMenApi = {
  getRentMenProfile: async (): Promise<ApiResponse<RentMenSettingsInfo>> => {
    try {
      const response = await apiRequest('GET', '/api/rent-men/profile', undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  updateRentMenProfile: async (rentMenData: Partial<RentMenSettingsInfo>): Promise<ApiResponse<RentMenSettingsInfo>> => {
    try {
      const response = await apiRequest('PUT', '/api/rent-men/profile', rentMenData);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Admin API
export const adminApi = {
  getAllUsers: async (): Promise<ApiResponse<UserInfo[]>> => {
    try {
      const response = await apiRequest('GET', '/api/admin/users', undefined);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  updateUser: async (userId: number, userData: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
    try {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, userData);
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  approveContent: async (contentId: number): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiRequest('PUT', `/api/admin/content/${contentId}/approve`, {});
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },

  rejectContent: async (contentId: number, reason: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiRequest('PUT', `/api/admin/content/${contentId}/reject`, { reason });
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};
