import { 
  users, User, InsertUser,
  profiles, Profile, InsertProfile,
  platformAccounts, PlatformAccount, InsertPlatformAccount,
  contentStrategies, ContentStrategy, InsertContentStrategy,
  mediaFiles, MediaFile, InsertMediaFile,
  verificationDocuments, VerificationDocument, InsertVerificationDocument,
  subscriptions, Subscription, InsertSubscription,
  appointments, Appointment, InsertAppointment,
  messages, Message, InsertMessage,
  conversations, Conversation, InsertConversation,
  conversationParticipants, 
  notifications, Notification, InsertNotification,
  rentMenSettings, RentMenSettings, InsertRentMenSettings,
  analytics, Analytics, InsertAnalytics,
  communicationTemplates, CommunicationTemplate, InsertCommunicationTemplate,
  communicationHistory, CommunicationHistory, InsertCommunicationHistory
} from "@shared/schema";

// Define storage interface with all necessary methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Profile methods
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByUserId(userId: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profileData: Partial<Profile>): Promise<Profile>;
  
  // Platform account methods
  getPlatformAccount(id: number): Promise<PlatformAccount | undefined>;
  getPlatformAccountByUserIdAndType(userId: number, platformType: string): Promise<PlatformAccount | undefined>;
  getPlatformAccountsByUserId(userId: number): Promise<PlatformAccount[]>;
  createPlatformAccount(account: InsertPlatformAccount): Promise<PlatformAccount>;
  updatePlatformAccount(id: number, accountData: Partial<PlatformAccount>): Promise<PlatformAccount>;
  
  // Content strategy methods
  getContentStrategy(id: number): Promise<ContentStrategy | undefined>;
  getContentStrategyByUserId(userId: number): Promise<ContentStrategy | undefined>;
  createContentStrategy(strategy: InsertContentStrategy): Promise<ContentStrategy>;
  updateContentStrategy(id: number, strategyData: Partial<ContentStrategy>): Promise<ContentStrategy>;
  
  // Media file methods
  getMediaFile(id: number): Promise<MediaFile | undefined>;
  getMediaFilesByUserId(userId: number): Promise<MediaFile[]>;
  createMediaFile(file: InsertMediaFile): Promise<MediaFile>;
  updateMediaFile(id: number, fileData: Partial<MediaFile>): Promise<MediaFile>;
  deleteMediaFile(id: number): Promise<void>;
  
  // Verification document methods
  getVerificationDocument(id: number): Promise<VerificationDocument | undefined>;
  getVerificationDocumentsByUserId(userId: number): Promise<VerificationDocument[]>;
  createVerificationDocument(document: InsertVerificationDocument): Promise<VerificationDocument>;
  updateVerificationDocument(id: number, documentData: Partial<VerificationDocument>): Promise<VerificationDocument>;
  
  // Subscription methods
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  getSubscriptionsByUserId(userId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription>;
  
  // Appointment methods
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByUserId(userId: number): Promise<Appointment[]>;
  getAppointmentWithClient(id: number): Promise<(Appointment & { client?: User }) | undefined>;
  getAppointmentsByAdminId(adminId: number): Promise<Appointment[]>;
  getAppointmentsByClientId(clientId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment>;
  sendEmail(to: string, subject: string, content: string, html?: string): Promise<boolean>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  
  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversationData: Partial<Conversation>): Promise<Conversation>;
  addUserToConversation(conversationId: number, userId: number): Promise<void>;
  isUserInConversation(userId: number, conversationId: number): Promise<boolean>;
  
  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // RentMen settings methods
  getRentMenSettings(id: number): Promise<RentMenSettings | undefined>;
  getRentMenSettingsByUserId(userId: number): Promise<RentMenSettings | undefined>;
  createRentMenSettings(settings: InsertRentMenSettings): Promise<RentMenSettings>;
  updateRentMenSettings(id: number, settingsData: Partial<RentMenSettings>): Promise<RentMenSettings>;
  
  // Analytics methods
  getAnalytics(id: number): Promise<Analytics | undefined>;
  getAnalyticsByUserId(userId: number): Promise<Analytics[]>;
  getLatestAnalyticsByUserId(userId: number): Promise<Analytics | undefined>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  updateAnalytics(id: number, analyticsData: Partial<Analytics>): Promise<Analytics>;
  
  // Communication Template methods
  getCommunicationTemplate(id: number): Promise<CommunicationTemplate | undefined>;
  getCommunicationTemplatesByType(type: string): Promise<CommunicationTemplate[]>;
  getCommunicationTemplatesByCategory(category: string): Promise<CommunicationTemplate[]>;
  getDefaultCommunicationTemplate(type: string, category: string): Promise<CommunicationTemplate | undefined>;
  createCommunicationTemplate(template: InsertCommunicationTemplate): Promise<CommunicationTemplate>;
  updateCommunicationTemplate(id: number, templateData: Partial<CommunicationTemplate>): Promise<CommunicationTemplate>;
  deleteCommunicationTemplate(id: number): Promise<void>;
  getAllCommunicationTemplates(): Promise<CommunicationTemplate[]>;
  
  // Communication History methods
  getCommunicationHistory(id: number): Promise<CommunicationHistory | undefined>;
  getCommunicationHistoryByRecipientId(recipientId: number): Promise<CommunicationHistory[]>;
  getCommunicationHistoryBySenderId(senderId: number): Promise<CommunicationHistory[]>;
  getCommunicationHistoryByType(type: string): Promise<CommunicationHistory[]>;
  createCommunicationHistory(history: InsertCommunicationHistory): Promise<CommunicationHistory>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private profilesMap: Map<number, Profile>;
  private platformAccountsMap: Map<number, PlatformAccount>;
  private contentStrategiesMap: Map<number, ContentStrategy>;
  private mediaFilesMap: Map<number, MediaFile>;
  private verificationDocumentsMap: Map<number, VerificationDocument>;
  private subscriptionsMap: Map<number, Subscription>;
  private appointmentsMap: Map<number, Appointment>;
  private messagesMap: Map<number, Message>;
  private conversationsMap: Map<number, Conversation>;
  private conversationParticipantsMap: Map<number, { conversationId: number, userId: number }>;
  private notificationsMap: Map<number, Notification>;
  private rentMenSettingsMap: Map<number, RentMenSettings>;
  
  private analyticsMap: Map<number, Analytics>;
  private communicationTemplatesMap: Map<number, CommunicationTemplate>;
  private communicationHistoryMap: Map<number, CommunicationHistory>;
  
  private currentIds: {
    users: number;
    profiles: number;
    platformAccounts: number;
    contentStrategies: number;
    mediaFiles: number;
    verificationDocuments: number;
    subscriptions: number;
    appointments: number;
    messages: number;
    conversations: number;
    conversationParticipants: number;
    notifications: number;
    rentMenSettings: number;
    analytics: number;
    communicationTemplates: number;
    communicationHistory: number;
  };

  constructor() {
    this.usersMap = new Map();
    this.profilesMap = new Map();
    this.platformAccountsMap = new Map();
    this.contentStrategiesMap = new Map();
    this.mediaFilesMap = new Map();
    this.verificationDocumentsMap = new Map();
    this.subscriptionsMap = new Map();
    this.appointmentsMap = new Map();
    this.messagesMap = new Map();
    this.conversationsMap = new Map();
    this.conversationParticipantsMap = new Map();
    this.notificationsMap = new Map();
    this.rentMenSettingsMap = new Map();
    this.analyticsMap = new Map();
    this.communicationTemplatesMap = new Map();
    this.communicationHistoryMap = new Map();
    
    this.currentIds = {
      users: 1,
      profiles: 1,
      platformAccounts: 1,
      contentStrategies: 1,
      mediaFiles: 1,
      verificationDocuments: 1,
      subscriptions: 1,
      appointments: 1,
      messages: 1,
      conversations: 1,
      conversationParticipants: 1,
      notifications: 1,
      rentMenSettings: 1,
      analytics: 1,
      communicationTemplates: 1,
      communicationHistory: 1,
    };

    // Initialize with test users
    this.initializeTestUsers();
  }

  private async initializeTestUsers() {
    // Create admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: "$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm", // "secret" hashed with bcrypt
      email: "admin@managethefans.com",
      fullName: "Admin User",
      role: "admin",
      phone: "+1234567890"
    });

    // Create test OnlyFans creator
    const onlyFansUser = await this.createUser({
      username: "creator1",
      password: "$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm", // "secret" hashed with bcrypt
      email: "creator@example.com",
      fullName: "Test Creator",
      role: "client",
      phone: "+1987654321",
      plan: "premium"
    });

    // Create test Rent.Men masseur
    const rentMenUser = await this.createUser({
      username: "masseur1",
      password: "$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm", // "secret" hashed with bcrypt
      email: "masseur@example.com",
      fullName: "Test Masseur",
      role: "client",
      phone: "+1555555555",
      plan: "basic"
    });

    // Create profiles for test users
    await this.createProfile({
      userId: onlyFansUser.id,
      preferredContactMethod: "email",
      preferredCheckInTime: "morning",
      timezone: "America/New_York",
      brandDescription: "Lifestyle content creator",
      voiceTone: "playful",
      doNotSayTerms: "explicit terms",
      uploadFrequency: "weekly",
      birthDate: "1990-01-01"
    });

    await this.createProfile({
      userId: rentMenUser.id,
      preferredContactMethod: "sms",
      preferredCheckInTime: "evening",
      timezone: "America/Los_Angeles",
      brandDescription: "Professional massage therapist",
      voiceTone: "professional",
      doNotSayTerms: null,
      uploadFrequency: "bi-weekly",
      birthDate: "1985-05-15"
    });

    // Create platform accounts
    await this.createPlatformAccount({
      userId: onlyFansUser.id,
      platformType: "OnlyFans",
      username: "testcreator",
      password: "encrypted_password_would_go_here",
      needsCreation: false
    });

    await this.createPlatformAccount({
      userId: rentMenUser.id,
      platformType: "RentMen",
      username: "testmasseur",
      password: "encrypted_password_would_go_here",
      needsCreation: false
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const newUser: User = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now,
      onboardingStatus: "incomplete",
      onboardingStep: 1,
      verificationStatus: "pending",
      phone: user.phone || null,
      plan: user.plan || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser: User = {
      ...user,
      ...userData,
      id,
      updatedAt: new Date()
    };
    
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  // Profile methods
  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profilesMap.get(id);
  }

  async getProfileByUserId(userId: number): Promise<Profile | undefined> {
    return Array.from(this.profilesMap.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const id = this.currentIds.profiles++;
    const newProfile: Profile = {
      ...profile,
      id,
    };
    this.profilesMap.set(id, newProfile);
    return newProfile;
  }

  async updateProfile(id: number, profileData: Partial<Profile>): Promise<Profile> {
    const profile = await this.getProfile(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }
    
    const updatedProfile: Profile = {
      ...profile,
      ...profileData,
      id,
    };
    
    this.profilesMap.set(id, updatedProfile);
    return updatedProfile;
  }

  // Platform account methods
  async getPlatformAccount(id: number): Promise<PlatformAccount | undefined> {
    return this.platformAccountsMap.get(id);
  }

  async getPlatformAccountByUserIdAndType(userId: number, platformType: string): Promise<PlatformAccount | undefined> {
    return Array.from(this.platformAccountsMap.values()).find(
      (account) => account.userId === userId && account.platformType === platformType
    );
  }

  async getPlatformAccountsByUserId(userId: number): Promise<PlatformAccount[]> {
    return Array.from(this.platformAccountsMap.values()).filter(
      (account) => account.userId === userId
    );
  }

  async createPlatformAccount(account: InsertPlatformAccount): Promise<PlatformAccount> {
    const id = this.currentIds.platformAccounts++;
    const now = new Date();
    const newAccount: PlatformAccount = {
      ...account,
      id,
      createdAt: now,
    };
    this.platformAccountsMap.set(id, newAccount);
    return newAccount;
  }

  async updatePlatformAccount(id: number, accountData: Partial<PlatformAccount>): Promise<PlatformAccount> {
    const account = await this.getPlatformAccount(id);
    if (!account) {
      throw new Error(`Platform account with ID ${id} not found`);
    }
    
    const updatedAccount: PlatformAccount = {
      ...account,
      ...accountData,
      id,
    };
    
    this.platformAccountsMap.set(id, updatedAccount);
    return updatedAccount;
  }

  // Content strategy methods
  async getContentStrategy(id: number): Promise<ContentStrategy | undefined> {
    return this.contentStrategiesMap.get(id);
  }

  async getContentStrategyByUserId(userId: number): Promise<ContentStrategy | undefined> {
    return Array.from(this.contentStrategiesMap.values()).find(
      (strategy) => strategy.userId === userId
    );
  }

  async createContentStrategy(strategy: InsertContentStrategy): Promise<ContentStrategy> {
    const id = this.currentIds.contentStrategies++;
    const now = new Date();
    const newStrategy: ContentStrategy = {
      ...strategy,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.contentStrategiesMap.set(id, newStrategy);
    return newStrategy;
  }

  async updateContentStrategy(id: number, strategyData: Partial<ContentStrategy>): Promise<ContentStrategy> {
    const strategy = await this.getContentStrategy(id);
    if (!strategy) {
      throw new Error(`Content strategy with ID ${id} not found`);
    }
    
    const updatedStrategy: ContentStrategy = {
      ...strategy,
      ...strategyData,
      id,
      updatedAt: new Date(),
    };
    
    this.contentStrategiesMap.set(id, updatedStrategy);
    return updatedStrategy;
  }

  // Media file methods
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    return this.mediaFilesMap.get(id);
  }

  async getMediaFilesByUserId(userId: number): Promise<MediaFile[]> {
    return Array.from(this.mediaFilesMap.values()).filter(
      (file) => file.userId === userId
    );
  }

  async createMediaFile(file: InsertMediaFile): Promise<MediaFile> {
    const id = this.currentIds.mediaFiles++;
    const now = new Date();
    const newFile: MediaFile = {
      ...file,
      id,
      uploadDate: now,
      status: file.status || "pending",
    };
    this.mediaFilesMap.set(id, newFile);
    return newFile;
  }

  async updateMediaFile(id: number, fileData: Partial<MediaFile>): Promise<MediaFile> {
    const file = await this.getMediaFile(id);
    if (!file) {
      throw new Error(`Media file with ID ${id} not found`);
    }
    
    const updatedFile: MediaFile = {
      ...file,
      ...fileData,
      id,
    };
    
    this.mediaFilesMap.set(id, updatedFile);
    return updatedFile;
  }

  async deleteMediaFile(id: number): Promise<void> {
    if (!this.mediaFilesMap.has(id)) {
      throw new Error(`Media file with ID ${id} not found`);
    }
    
    this.mediaFilesMap.delete(id);
  }

  // Verification document methods
  async getVerificationDocument(id: number): Promise<VerificationDocument | undefined> {
    return this.verificationDocumentsMap.get(id);
  }

  async getVerificationDocumentsByUserId(userId: number): Promise<VerificationDocument[]> {
    return Array.from(this.verificationDocumentsMap.values()).filter(
      (document) => document.userId === userId
    );
  }

  async createVerificationDocument(document: InsertVerificationDocument): Promise<VerificationDocument> {
    const id = this.currentIds.verificationDocuments++;
    const now = new Date();
    const newDocument: VerificationDocument = {
      ...document,
      id,
      uploadDate: now,
      status: document.status || "pending",
    };
    this.verificationDocumentsMap.set(id, newDocument);
    return newDocument;
  }

  async updateVerificationDocument(id: number, documentData: Partial<VerificationDocument>): Promise<VerificationDocument> {
    const document = await this.getVerificationDocument(id);
    if (!document) {
      throw new Error(`Verification document with ID ${id} not found`);
    }
    
    const updatedDocument: VerificationDocument = {
      ...document,
      ...documentData,
      id,
    };
    
    this.verificationDocumentsMap.set(id, updatedDocument);
    return updatedDocument;
  }

  // Subscription methods
  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptionsMap.get(id);
  }

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptionsMap.values()).find(
      (subscription) => subscription.userId === userId
    );
  }
  
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptionsMap.values()).filter(
      (subscription) => subscription.userId === userId
    );
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentIds.subscriptions++;
    const now = new Date();
    const newSubscription: Subscription = {
      ...subscription,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptionsMap.set(id, newSubscription);
    return newSubscription;
  }

  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const subscription = await this.getSubscription(id);
    if (!subscription) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
    
    const updatedSubscription: Subscription = {
      ...subscription,
      ...subscriptionData,
      id,
      updatedAt: new Date(),
    };
    
    this.subscriptionsMap.set(id, updatedSubscription);
    return updatedSubscription;
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointmentsMap.get(id);
  }
  
  async getAppointmentWithClient(id: number): Promise<(Appointment & { client?: User }) | undefined> {
    const appointment = await this.getAppointment(id);
    if (!appointment) {
      return undefined;
    }
    
    // Get client information
    const client = await this.getUser(appointment.clientId);
    
    // Return appointment with client data
    return {
      ...appointment,
      client: client
    };
  }

  async getAppointmentsByAdminId(adminId: number): Promise<Appointment[]> {
    return Array.from(this.appointmentsMap.values()).filter(
      (appointment) => appointment.adminId === adminId
    );
  }
  
  async getAppointmentsByClientId(clientId: number): Promise<Appointment[]> {
    return Array.from(this.appointmentsMap.values()).filter(
      (appointment) => appointment.clientId === clientId
    );
  }
  
  // Keep this for backward compatibility
  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointmentsMap.values()).filter(
      (appointment) => appointment.adminId === userId || appointment.clientId === userId
    );
  }
  
  // Alias method for API compatibility with statistics endpoint
  async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return this.getAppointmentsByClientId(clientId);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentIds.appointments++;
    const now = new Date();
    const newAppointment: Appointment = {
      ...appointment,
      id,
      status: "pending",
      notificationSent: false,
      createdAt: now,
      updatedAt: now,
    };
    this.appointmentsMap.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment> {
    const appointment = await this.getAppointment(id);
    if (!appointment) {
      throw new Error(`Appointment with ID ${id} not found`);
    }
    
    const updatedAppointment: Appointment = {
      ...appointment,
      ...appointmentData,
      id,
      updatedAt: new Date(),
    };
    
    this.appointmentsMap.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  // Email sending function for appointments
  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    try {
      // In a real implementation, this would call SendGrid or another email service
      // Here we just log the email for demonstration purposes
      console.log(`Email notification sent to ${to} about ${subject}`);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messagesMap.get(id);
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messagesMap.values()).filter(
      (message) => message.conversationId === conversationId
    );
  }
  
  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messagesMap.values()).filter(
      (message) => message.senderId === userId
    );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentIds.messages++;
    const now = new Date();
    const newMessage: Message = {
      ...message,
      id,
      createdAt: now,
      readAt: null,
    };
    this.messagesMap.set(id, newMessage);
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<void> {
    const message = await this.getMessage(id);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    
    const updatedMessage: Message = {
      ...message,
      readAt: new Date(),
    };
    
    this.messagesMap.set(id, updatedMessage);
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversationsMap.get(id);
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    // Get all conversation IDs where the user is a participant
    const participantData = Array.from(this.conversationParticipantsMap.values()).filter(
      (participant) => participant.userId === userId
    );
    
    // Get conversations by IDs with participants
    return Promise.all(participantData.map(async (participant) => {
      const conversation = this.conversationsMap.get(participant.conversationId);
      if (!conversation) return null;
      
      // Find all participants for this conversation
      const allParticipants = Array.from(this.conversationParticipantsMap.values())
        .filter(p => p.conversationId === conversation.id);
      
      // Get user data for each participant
      const participantUsers = await Promise.all(
        allParticipants.map(async (p) => {
          const user = await this.getUser(p.userId);
          if (!user) return null;
          
          return {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role
          };
        })
      );
      
      // Filter out null users and add participants to conversation
      return {
        ...conversation,
        participants: participantUsers.filter(Boolean)
      };
    })).then(results => results.filter(Boolean) as Conversation[]);
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.currentIds.conversations++;
    const now = new Date();
    const newConversation: Conversation = {
      ...conversation,
      id,
      createdAt: now,
      updatedAt: now,
      lastMessagePreview: "",
    };
    this.conversationsMap.set(id, newConversation);
    return newConversation;
  }

  async updateConversation(id: number, conversationData: Partial<Conversation>): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    if (!conversation) {
      throw new Error(`Conversation with ID ${id} not found`);
    }
    
    const updatedConversation: Conversation = {
      ...conversation,
      ...conversationData,
      id,
      updatedAt: new Date(),
    };
    
    this.conversationsMap.set(id, updatedConversation);
    return updatedConversation;
  }

  async addUserToConversation(conversationId: number, userId: number): Promise<void> {
    const id = this.currentIds.conversationParticipants++;
    const now = new Date();
    const participant = {
      id,
      conversationId,
      userId,
      joinedAt: now,
    };
    this.conversationParticipantsMap.set(id, participant);
  }

  async isUserInConversation(userId: number, conversationId: number): Promise<boolean> {
    return Array.from(this.conversationParticipantsMap.values()).some(
      (participant) => participant.userId === userId && participant.conversationId === conversationId
    );
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values()).filter(
      (notification) => notification.userId === userId
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentIds.notifications++;
    const now = new Date();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: now,
      readAt: null,
    };
    this.notificationsMap.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const notification = await this.getNotification(id);
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    const updatedNotification: Notification = {
      ...notification,
      readAt: new Date(),
    };
    
    this.notificationsMap.set(id, updatedNotification);
  }

  // RentMen settings methods
  async getRentMenSettings(id: number): Promise<RentMenSettings | undefined> {
    return this.rentMenSettingsMap.get(id);
  }

  async getRentMenSettingsByUserId(userId: number): Promise<RentMenSettings | undefined> {
    return Array.from(this.rentMenSettingsMap.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createRentMenSettings(settings: InsertRentMenSettings): Promise<RentMenSettings> {
    const id = this.currentIds.rentMenSettings++;
    const now = new Date();
    const newSettings: RentMenSettings = {
      ...settings,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.rentMenSettingsMap.set(id, newSettings);
    return newSettings;
  }

  async updateRentMenSettings(id: number, settingsData: Partial<RentMenSettings>): Promise<RentMenSettings> {
    const settings = await this.getRentMenSettings(id);
    if (!settings) {
      throw new Error(`RentMen settings with ID ${id} not found`);
    }
    
    const updatedSettings: RentMenSettings = {
      ...settings,
      ...settingsData,
      id,
      updatedAt: new Date(),
    };
    
    this.rentMenSettingsMap.set(id, updatedSettings);
    return updatedSettings;
  }
  
  // Analytics methods
  async getAnalytics(id: number): Promise<Analytics | undefined> {
    return this.analyticsMap.get(id);
  }
  
  async getAnalyticsByUserId(userId: number): Promise<Analytics[]> {
    return Array.from(this.analyticsMap.values()).filter(
      (analytics) => analytics.userId === userId
    );
  }
  
  async getLatestAnalyticsByUserId(userId: number): Promise<Analytics | undefined> {
    const userAnalytics = await this.getAnalyticsByUserId(userId);
    if (userAnalytics.length === 0) {
      return undefined;
    }
    
    // Sort by report date (newest first) and return the most recent one
    return userAnalytics.sort((a, b) => 
      new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
    )[0];
  }
  
  async createAnalytics(analytics: InsertAnalytics): Promise<Analytics> {
    const id = this.currentIds.analytics++;
    const now = new Date();
    const newAnalytics: Analytics = {
      ...analytics,
      id,
      createdAt: now,
      updatedAt: now,
      reportDate: now,
    };
    this.analyticsMap.set(id, newAnalytics);
    return newAnalytics;
  }
  
  async updateAnalytics(id: number, analyticsData: Partial<Analytics>): Promise<Analytics> {
    const analytics = await this.getAnalytics(id);
    if (!analytics) {
      throw new Error(`Analytics with ID ${id} not found`);
    }
    
    const updatedAnalytics: Analytics = {
      ...analytics,
      ...analyticsData,
      id,
      updatedAt: new Date(),
    };
    
    this.analyticsMap.set(id, updatedAnalytics);
    return updatedAnalytics;
  }
  
  // Communication Template methods
  async getCommunicationTemplate(id: number): Promise<CommunicationTemplate | undefined> {
    return this.communicationTemplatesMap.get(id);
  }
  
  async getCommunicationTemplatesByType(type: string): Promise<CommunicationTemplate[]> {
    return Array.from(this.communicationTemplatesMap.values()).filter(
      (template) => template.type === type
    );
  }
  
  async getCommunicationTemplatesByCategory(category: string): Promise<CommunicationTemplate[]> {
    return Array.from(this.communicationTemplatesMap.values()).filter(
      (template) => template.category === category
    );
  }
  
  async getDefaultCommunicationTemplate(type: string, category: string): Promise<CommunicationTemplate | undefined> {
    return Array.from(this.communicationTemplatesMap.values()).find(
      (template) => template.type === type && template.category === category && template.isDefault
    );
  }
  
  async createCommunicationTemplate(template: InsertCommunicationTemplate): Promise<CommunicationTemplate> {
    const id = this.currentIds.communicationTemplates++;
    const now = new Date();
    const newTemplate: CommunicationTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.communicationTemplatesMap.set(id, newTemplate);
    return newTemplate;
  }
  
  async updateCommunicationTemplate(id: number, templateData: Partial<CommunicationTemplate>): Promise<CommunicationTemplate> {
    const template = await this.getCommunicationTemplate(id);
    if (!template) {
      throw new Error(`Communication template with ID ${id} not found`);
    }
    
    const updatedTemplate: CommunicationTemplate = {
      ...template,
      ...templateData,
      id,
      updatedAt: new Date(),
    };
    
    this.communicationTemplatesMap.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteCommunicationTemplate(id: number): Promise<void> {
    if (!this.communicationTemplatesMap.has(id)) {
      throw new Error(`Communication template with ID ${id} not found`);
    }
    
    this.communicationTemplatesMap.delete(id);
  }
  
  async getAllCommunicationTemplates(): Promise<CommunicationTemplate[]> {
    return Array.from(this.communicationTemplatesMap.values());
  }
  
  // Email methods
  async sendEmail(to: string, subject: string, content: string, html?: string): Promise<boolean> {
    try {
      // Use the sendEmail utility from utils/email.ts
      const { sendEmail } = await import('./utils/email');
      return await sendEmail(to, subject, content, html);
    } catch (error) {
      console.error("Error sending email from storage:", error);
      return false;
    }
  }

  // Communication History methods
  async getCommunicationHistory(id: number): Promise<CommunicationHistory | undefined> {
    return this.communicationHistoryMap.get(id);
  }
  
  async getCommunicationHistoryByRecipientId(recipientId: number): Promise<CommunicationHistory[]> {
    return Array.from(this.communicationHistoryMap.values()).filter(
      (history) => history.recipientId === recipientId
    );
  }
  
  async getCommunicationHistoryBySenderId(senderId: number): Promise<CommunicationHistory[]> {
    return Array.from(this.communicationHistoryMap.values()).filter(
      (history) => history.senderId === senderId
    );
  }
  
  async getCommunicationHistoryByType(type: string): Promise<CommunicationHistory[]> {
    return Array.from(this.communicationHistoryMap.values()).filter(
      (history) => history.type === type
    );
  }
  
  async createCommunicationHistory(history: InsertCommunicationHistory): Promise<CommunicationHistory> {
    const id = this.currentIds.communicationHistory++;
    const now = new Date();
    const newHistory: CommunicationHistory = {
      ...history,
      id,
      sentAt: now,
    };
    this.communicationHistoryMap.set(id, newHistory);
    return newHistory;
  }
}

import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, or, desc, inArray, isNull, like, not, notInArray, sql } from 'drizzle-orm';
import db from './db';

// PostgreSQL storage implementation
export class PgStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    this.db = drizzle(db);
    console.log('PostgreSQL storage initialized');
  }

  // User methods with enhanced debugging
  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log(`PgStorage: Getting user with ID: ${id}`);
      const result = await this.db.select().from(users).where(eq(users.id, id));
      
      if (result.length === 0) {
        console.warn(`PgStorage: No user found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`PgStorage: Found user ${result[0].username} (ID: ${id}, Role: ${result[0].role})`);
      return result[0];
    } catch (error) {
      console.error('PgStorage Error fetching user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`PgStorage: Getting user by username: ${username}`);
      const result = await this.db.select().from(users).where(eq(users.username, username));
      
      if (result.length === 0) {
        console.warn(`PgStorage: No user found with username: ${username}`);
        return undefined;
      }
      
      console.log(`PgStorage: Found user ${result[0].username} (ID: ${result[0].id}, Role: ${result[0].role})`);
      return result[0];
    } catch (error) {
      console.error('PgStorage Error fetching user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log(`PgStorage: Getting user by email: ${email}`);
      const result = await this.db.select().from(users).where(eq(users.email, email));
      
      if (result.length === 0) {
        console.warn(`PgStorage: No user found with email: ${email}`);
        return undefined;
      }
      
      console.log(`PgStorage: Found user ${result[0].username} (ID: ${result[0].id}, Role: ${result[0].role})`);
      return result[0];
    } catch (error) {
      console.error('PgStorage Error fetching user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await this.db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const result = await this.db.update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.db.select().from(users);
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // Profile methods
  async getProfile(id: number): Promise<Profile | undefined> {
    try {
      const result = await this.db.select().from(profiles).where(eq(profiles.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      return undefined;
    }
  }

  async getProfileByUserId(userId: number): Promise<Profile | undefined> {
    try {
      const result = await this.db.select().from(profiles).where(eq(profiles.userId, userId));
      return result[0];
    } catch (error) {
      console.error('Error fetching profile by user ID:', error);
      return undefined;
    }
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    try {
      const result = await this.db.insert(profiles).values(profile).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(id: number, profileData: Partial<Profile>): Promise<Profile> {
    try {
      const result = await this.db.update(profiles)
        .set(profileData)
        .where(eq(profiles.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Platform account methods
  async getPlatformAccount(id: number): Promise<PlatformAccount | undefined> {
    try {
      const result = await this.db.select().from(platformAccounts).where(eq(platformAccounts.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching platform account by ID:', error);
      return undefined;
    }
  }

  async getPlatformAccountByUserIdAndType(userId: number, platformType: string): Promise<PlatformAccount | undefined> {
    try {
      const result = await this.db.select().from(platformAccounts).where(
        and(
          eq(platformAccounts.userId, userId),
          eq(platformAccounts.platformType, platformType)
        )
      );
      return result[0];
    } catch (error) {
      console.error('Error fetching platform account by user ID and type:', error);
      return undefined;
    }
  }

  async getPlatformAccountsByUserId(userId: number): Promise<PlatformAccount[]> {
    try {
      return await this.db.select().from(platformAccounts).where(eq(platformAccounts.userId, userId));
    } catch (error) {
      console.error('Error fetching platform accounts by user ID:', error);
      return [];
    }
  }

  async createPlatformAccount(account: InsertPlatformAccount): Promise<PlatformAccount> {
    try {
      const result = await this.db.insert(platformAccounts).values(account).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating platform account:', error);
      throw error;
    }
  }

  async updatePlatformAccount(id: number, accountData: Partial<PlatformAccount>): Promise<PlatformAccount> {
    try {
      const result = await this.db.update(platformAccounts)
        .set(accountData)
        .where(eq(platformAccounts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating platform account:', error);
      throw error;
    }
  }

  // Implement remaining methods with appropriate fallbacks for now
  
  // Content strategy methods
  async getContentStrategy(id: number): Promise<ContentStrategy | undefined> {
    try {
      const result = await this.db.select().from(contentStrategies).where(eq(contentStrategies.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching content strategy:', error);
      return undefined;
    }
  }
  
  async getContentStrategyByUserId(userId: number): Promise<ContentStrategy | undefined> {
    try {
      const result = await this.db.select().from(contentStrategies).where(eq(contentStrategies.userId, userId));
      return result[0];
    } catch (error) {
      console.error('Error fetching content strategy by user ID:', error);
      return undefined;
    }
  }
  
  async createContentStrategy(strategy: InsertContentStrategy): Promise<ContentStrategy> {
    try {
      const result = await this.db.insert(contentStrategies).values(strategy).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating content strategy:', error);
      throw error;
    }
  }
  
  async updateContentStrategy(id: number, strategyData: Partial<ContentStrategy>): Promise<ContentStrategy> {
    try {
      const result = await this.db.update(contentStrategies)
        .set({ ...strategyData, updatedAt: new Date() })
        .where(eq(contentStrategies.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating content strategy:', error);
      throw error;
    }
  }

  // Media file methods
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    try {
      const result = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching media file:', error);
      return undefined;
    }
  }
  
  async getMediaFilesByUserId(userId: number): Promise<MediaFile[]> {
    try {
      return await this.db.select().from(mediaFiles).where(eq(mediaFiles.userId, userId));
    } catch (error) {
      console.error('Error fetching media files by user ID:', error);
      return [];
    }
  }
  
  async createMediaFile(file: InsertMediaFile): Promise<MediaFile> {
    try {
      const result = await this.db.insert(mediaFiles).values(file).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating media file:', error);
      throw error;
    }
  }
  
  async updateMediaFile(id: number, fileData: Partial<MediaFile>): Promise<MediaFile> {
    try {
      const result = await this.db.update(mediaFiles)
        .set(fileData)
        .where(eq(mediaFiles.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating media file:', error);
      throw error;
    }
  }
  
  async deleteMediaFile(id: number): Promise<void> {
    try {
      await this.db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    } catch (error) {
      console.error('Error deleting media file:', error);
      throw error;
    }
  }

  // Implement fallbacks for the remaining methods
  // These will be implemented as needed for specific functionality
  
  // For now, the rest of the methods will just log a warning and use in-memory storage as fallback
  
  // Placeholder for fallback methods
  private memStorage = new MemStorage();
  
  // Verification document methods
  async getVerificationDocument(id: number): Promise<VerificationDocument | undefined> {
    console.warn('Using fallback for getVerificationDocument');
    return this.memStorage.getVerificationDocument(id);
  }
  
  async getVerificationDocumentsByUserId(userId: number): Promise<VerificationDocument[]> {
    console.warn('Using fallback for getVerificationDocumentsByUserId');
    return this.memStorage.getVerificationDocumentsByUserId(userId);
  }
  
  async createVerificationDocument(document: InsertVerificationDocument): Promise<VerificationDocument> {
    console.warn('Using fallback for createVerificationDocument');
    return this.memStorage.createVerificationDocument(document);
  }
  
  async updateVerificationDocument(id: number, documentData: Partial<VerificationDocument>): Promise<VerificationDocument> {
    console.warn('Using fallback for updateVerificationDocument');
    return this.memStorage.updateVerificationDocument(id, documentData);
  }
  
  // Subscription methods
  async getSubscription(id: number): Promise<Subscription | undefined> {
    console.warn('Using fallback for getSubscription');
    return this.memStorage.getSubscription(id);
  }
  
  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    console.warn('Using fallback for getSubscriptionByUserId');
    return this.memStorage.getSubscriptionByUserId(userId);
  }
  
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    console.warn('Using fallback for getSubscriptionsByUserId');
    return this.memStorage.getSubscriptionsByUserId(userId);
  }
  
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    console.warn('Using fallback for createSubscription');
    return this.memStorage.createSubscription(subscription);
  }
  
  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription> {
    console.warn('Using fallback for updateSubscription');
    return this.memStorage.updateSubscription(id, subscriptionData);
  }
  
  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    try {
      const result = await this.db.select().from(appointments).where(eq(appointments.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error getting appointment:', error);
      return this.memStorage.getAppointment(id);
    }
  }
  
  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    try {
      const result = await this.db.select().from(appointments)
        .where(or(
          eq(appointments.adminId, userId),
          eq(appointments.clientId, userId)
        ));
      return result;
    } catch (error) {
      console.error('Error getting appointments by user ID:', error);
      return this.memStorage.getAppointmentsByUserId(userId);
    }
  }
  
  async getAppointmentWithClient(id: number): Promise<(Appointment & { client?: User }) | undefined> {
    try {
      // Get the appointment
      const appointment = await this.getAppointment(id);
      if (!appointment) {
        return undefined;
      }
      
      // Get the client information
      const client = await this.getUser(appointment.clientId);
      
      // Return the combined result
      return {
        ...appointment,
        client
      };
    } catch (error) {
      console.error('Error getting appointment with client:', error);
      return this.memStorage.getAppointmentWithClient(id);
    }
  }
  
  async getAppointmentsByAdminId(adminId: number): Promise<Appointment[]> {
    try {
      const result = await this.db.select().from(appointments)
        .where(eq(appointments.adminId, adminId))
        .orderBy(desc(appointments.appointmentDate));
      return result;
    } catch (error) {
      console.error('Error getting appointments by admin ID:', error);
      return this.memStorage.getAppointmentsByAdminId(adminId);
    }
  }
  
  async getAppointmentsByClientId(clientId: number): Promise<Appointment[]> {
    try {
      const result = await this.db.select().from(appointments)
        .where(eq(appointments.clientId, clientId))
        .orderBy(desc(appointments.appointmentDate));
      return result;
    } catch (error) {
      console.error('Error getting appointments by client ID:', error);
      return this.memStorage.getAppointmentsByClientId(clientId);
    }
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    try {
      // Insert the appointment into the database
      const result = await this.db.insert(appointments)
        .values({
          ...appointment,
          status: "pending",
          notificationSent: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log('Created appointment in database:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('Error creating appointment:', error);
      return this.memStorage.createAppointment(appointment);
    }
  }
  
  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment> {
    try {
      const result = await this.db.update(appointments)
        .set({ ...appointmentData, updatedAt: new Date() })
        .where(eq(appointments.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`Appointment with ID ${id} not found`);
      }
      
      console.log('Updated appointment in database:', id);
      return result[0];
    } catch (error) {
      console.error('Error updating appointment:', error);
      return this.memStorage.updateAppointment(id, appointmentData);
    }
  }
  
  async sendEmail(to: string, subject: string, content: string, html?: string): Promise<boolean> {
    console.warn('Using fallback for sendEmail');
    return this.memStorage.sendEmail(to, subject, content, html);
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    try {
      const result = await this.db.select().from(messages).where(eq(messages.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error getting message:', error);
      return this.memStorage.getMessage(id);
    }
  }
  
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    try {
      const result = await this.db.select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
      
      return result;
    } catch (error) {
      console.error('Error getting messages by conversation ID:', error);
      return this.memStorage.getMessagesByConversationId(conversationId);
    }
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const result = await this.db.insert(messages)
        .values({
          ...message,
          createdAt: new Date(),
          readAt: null
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating message:', error);
      return this.memStorage.createMessage(message);
    }
  }
  
  async markMessageAsRead(id: number): Promise<void> {
    try {
      await this.db.update(messages)
        .set({ readAt: new Date() })
        .where(eq(messages.id, id));
    } catch (error) {
      console.error('Error marking message as read:', error);
      return this.memStorage.markMessageAsRead(id);
    }
  }
  
  async getMessagesByUser(userId: number): Promise<Message[]> {
    try {
      const result = await this.db.select()
        .from(messages)
        .where(eq(messages.senderId, userId));
      
      return result;
    } catch (error) {
      console.error('Error getting messages by user ID:', error);
      return this.memStorage.getMessagesByUser(userId);
    }
  }
  
  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    try {
      const result = await this.db.select().from(conversations).where(eq(conversations.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return this.memStorage.getConversation(id);
    }
  }
  
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    try {
      // First, find all conversationIds the user is part of
      const participantResults = await this.db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, userId));
      
      if (participantResults.length === 0) {
        return [];
      }
      
      // Get all conversations matching these IDs
      const conversationIds = participantResults.map(p => p.conversationId);
      const result = await this.db.select()
        .from(conversations)
        .where(inArray(conversations.id, conversationIds));
      
      // For each conversation, get all participants
      const conversationsWithParticipants = await Promise.all(
        result.map(async (conversation) => {
          // Find all participants for this conversation
          const participants = await this.db
            .select({
              conversationParticipant: conversationParticipants,
              user: users
            })
            .from(conversationParticipants)
            .innerJoin(users, eq(conversationParticipants.userId, users.id))
            .where(eq(conversationParticipants.conversationId, conversation.id));
          
          // Extract user information from participants
          const participantUsers = participants.map(p => ({
            id: p.user.id,
            username: p.user.username,
            fullName: p.user.fullName,
            email: p.user.email,
            role: p.user.role
          }));
          
          // Return the conversation with participants
          return {
            ...conversation,
            participants: participantUsers
          };
        })
      );
      
      return conversationsWithParticipants;
    } catch (error) {
      console.error('Error getting conversations by user ID:', error);
      return this.memStorage.getConversationsByUserId(userId);
    }
  }
  
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      const result = await this.db.insert(conversations)
        .values({
          ...conversation,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating conversation:', error);
      return this.memStorage.createConversation(conversation);
    }
  }
  
  async updateConversation(id: number, conversationData: Partial<Conversation>): Promise<Conversation> {
    try {
      const result = await this.db.update(conversations)
        .set({ ...conversationData, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`Conversation with ID ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating conversation:', error);
      return this.memStorage.updateConversation(id, conversationData);
    }
  }
  
  async addUserToConversation(conversationId: number, userId: number): Promise<void> {
    try {
      await this.db.insert(conversationParticipants)
        .values({
          conversationId,
          userId
        });
    } catch (error) {
      console.error('Error adding user to conversation:', error);
      return this.memStorage.addUserToConversation(conversationId, userId);
    }
  }
  
  async isUserInConversation(userId: number, conversationId: number): Promise<boolean> {
    try {
      const result = await this.db.select()
        .from(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.userId, userId),
            eq(conversationParticipants.conversationId, conversationId)
          )
        );
      
      return result.length > 0;
    } catch (error) {
      console.error('Error checking if user is in conversation:', error);
      return this.memStorage.isUserInConversation(userId, conversationId);
    }
  }
  
  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    try {
      const result = await this.db.select().from(notifications).where(eq(notifications.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error getting notification:', error);
      return this.memStorage.getNotification(id);
    }
  }
  
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    try {
      // First check if the notifications table exists
      const tableCheck = await this.db.execute(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'notifications'
         );`
      );
      
      const tableExists = tableCheck.rows[0].exists;
      if (!tableExists) {
        console.warn('Notifications table does not exist, using fallback');
        return this.memStorage.getNotificationsByUserId(userId);
      }
      
      // Use raw SQL to match exactly the DB column names
      const result = await this.db.execute(
        `SELECT 
          id, 
          recipient_id as "recipientId", 
          type, 
          title, 
          content, 
          link, 
          is_read as "isRead", 
          created_at as "createdAt" 
        FROM notifications 
        WHERE recipient_id = $1 
        ORDER BY created_at DESC`,
        [userId]
      );
      
      return result.rows as Notification[];
    } catch (error) {
      console.error('Error getting notifications by user ID:', error);
      return this.memStorage.getNotificationsByUserId(userId);
    }
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const result = await this.db.insert(notifications)
        .values({
          ...notification,
          createdAt: new Date(),
          isRead: false // Default to unread 
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      return this.memStorage.createNotification(notification);
    }
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    try {
      // First check if the notifications table exists
      const tableCheck = await this.db.execute(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'notifications'
         );`
      );
      
      const tableExists = tableCheck.rows[0].exists;
      if (!tableExists) {
        console.warn('Notifications table does not exist, using fallback');
        return this.memStorage.markNotificationAsRead(id);
      }
      
      // Use raw SQL to match the schema
      await this.db.execute(
        `UPDATE notifications SET is_read = true WHERE id = $1`,
        [id]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return this.memStorage.markNotificationAsRead(id);
    }
  }
  
  // RentMen settings methods
  async getRentMenSettings(id: number): Promise<RentMenSettings | undefined> {
    console.warn('Using fallback for getRentMenSettings');
    return this.memStorage.getRentMenSettings(id);
  }
  
  async getRentMenSettingsByUserId(userId: number): Promise<RentMenSettings | undefined> {
    console.warn('Using fallback for getRentMenSettingsByUserId');
    return this.memStorage.getRentMenSettingsByUserId(userId);
  }
  
  async createRentMenSettings(settings: InsertRentMenSettings): Promise<RentMenSettings> {
    console.warn('Using fallback for createRentMenSettings');
    return this.memStorage.createRentMenSettings(settings);
  }
  
  async updateRentMenSettings(id: number, settingsData: Partial<RentMenSettings>): Promise<RentMenSettings> {
    console.warn('Using fallback for updateRentMenSettings');
    return this.memStorage.updateRentMenSettings(id, settingsData);
  }
  
  // Analytics methods
  async getAnalytics(id: number): Promise<Analytics | undefined> {
    console.warn('Using fallback for getAnalytics');
    return this.memStorage.getAnalytics(id);
  }
  
  async getAnalyticsByUserId(userId: number): Promise<Analytics[]> {
    console.warn('Using fallback for getAnalyticsByUserId');
    return this.memStorage.getAnalyticsByUserId(userId);
  }
  
  async getLatestAnalyticsByUserId(userId: number): Promise<Analytics | undefined> {
    console.warn('Using fallback for getLatestAnalyticsByUserId');
    return this.memStorage.getLatestAnalyticsByUserId(userId);
  }
  
  async createAnalytics(analytics: InsertAnalytics): Promise<Analytics> {
    console.warn('Using fallback for createAnalytics');
    return this.memStorage.createAnalytics(analytics);
  }
  
  async updateAnalytics(id: number, analyticsData: Partial<Analytics>): Promise<Analytics> {
    console.warn('Using fallback for updateAnalytics');
    return this.memStorage.updateAnalytics(id, analyticsData);
  }
  
  // Communication Template methods
  async getCommunicationTemplate(id: number): Promise<CommunicationTemplate | undefined> {
    try {
      const result = await this.db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.id, id));
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error getting communication template:', error);
      return this.memStorage.getCommunicationTemplate(id);
    }
  }
  
  async getCommunicationTemplatesByType(type: string): Promise<CommunicationTemplate[]> {
    try {
      const result = await this.db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.type, type));
      
      return result;
    } catch (error) {
      console.error('Error getting communication templates by type:', error);
      return this.memStorage.getCommunicationTemplatesByType(type);
    }
  }
  
  async getCommunicationTemplatesByCategory(category: string): Promise<CommunicationTemplate[]> {
    try {
      const result = await this.db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.category, category));
      
      return result;
    } catch (error) {
      console.error('Error getting communication templates by category:', error);
      return this.memStorage.getCommunicationTemplatesByCategory(category);
    }
  }
  
  async getDefaultCommunicationTemplate(type: string, category: string): Promise<CommunicationTemplate | undefined> {
    try {
      const result = await this.db.select()
        .from(communicationTemplates)
        .where(
          and(
            eq(communicationTemplates.type, type),
            eq(communicationTemplates.category, category),
            eq(communicationTemplates.isDefault, true)
          )
        );
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error getting default communication template:', error);
      return this.memStorage.getDefaultCommunicationTemplate(type, category);
    }
  }
  
  async createCommunicationTemplate(template: InsertCommunicationTemplate): Promise<CommunicationTemplate> {
    try {
      const result = await this.db.insert(communicationTemplates)
        .values({
          ...template,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating communication template:', error);
      return this.memStorage.createCommunicationTemplate(template);
    }
  }
  
  async updateCommunicationTemplate(id: number, templateData: Partial<CommunicationTemplate>): Promise<CommunicationTemplate> {
    try {
      const result = await this.db.update(communicationTemplates)
        .set({ ...templateData, updatedAt: new Date() })
        .where(eq(communicationTemplates.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`Communication template with ID ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating communication template:', error);
      return this.memStorage.updateCommunicationTemplate(id, templateData);
    }
  }
  
  async deleteCommunicationTemplate(id: number): Promise<void> {
    try {
      await this.db.delete(communicationTemplates)
        .where(eq(communicationTemplates.id, id));
    } catch (error) {
      console.error('Error deleting communication template:', error);
      return this.memStorage.deleteCommunicationTemplate(id);
    }
  }
  
  async getAllCommunicationTemplates(): Promise<CommunicationTemplate[]> {
    try {
      const result = await this.db.select().from(communicationTemplates);
      return result;
    } catch (error) {
      console.error('Error getting all communication templates:', error);
      return this.memStorage.getAllCommunicationTemplates();
    }
  }
  
  // Communication History methods
  async getCommunicationHistory(id: number): Promise<CommunicationHistory | undefined> {
    try {
      const result = await this.db.select()
        .from(communicationHistory)
        .where(eq(communicationHistory.id, id));
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error getting communication history:', error);
      return this.memStorage.getCommunicationHistory(id);
    }
  }
  
  async getCommunicationHistoryByRecipientId(recipientId: number): Promise<CommunicationHistory[]> {
    try {
      const result = await this.db.select()
        .from(communicationHistory)
        .where(eq(communicationHistory.recipientId, recipientId))
        .orderBy(desc(communicationHistory.sentAt));
      
      return result;
    } catch (error) {
      console.error('Error getting communication history by recipient ID:', error);
      return this.memStorage.getCommunicationHistoryByRecipientId(recipientId);
    }
  }
  
  async getCommunicationHistoryBySenderId(senderId: number): Promise<CommunicationHistory[]> {
    try {
      const result = await this.db.select()
        .from(communicationHistory)
        .where(eq(communicationHistory.senderId, senderId))
        .orderBy(desc(communicationHistory.sentAt));
      
      return result;
    } catch (error) {
      console.error('Error getting communication history by sender ID:', error);
      return this.memStorage.getCommunicationHistoryBySenderId(senderId);
    }
  }
  
  async getCommunicationHistoryByType(type: string): Promise<CommunicationHistory[]> {
    try {
      const result = await this.db.select()
        .from(communicationHistory)
        .where(eq(communicationHistory.type, type))
        .orderBy(desc(communicationHistory.sentAt));
      
      return result;
    } catch (error) {
      console.error('Error getting communication history by type:', error);
      return this.memStorage.getCommunicationHistoryByType(type);
    }
  }
  
  async createCommunicationHistory(history: InsertCommunicationHistory): Promise<CommunicationHistory> {
    try {
      const result = await this.db.insert(communicationHistory)
        .values({
          ...history,
          sentAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating communication history:', error);
      return this.memStorage.createCommunicationHistory(history);
    }
  }
}

// Use PostgreSQL storage if DATABASE_URL is available, otherwise use in-memory storage
export const storage = process.env.DATABASE_URL 
  ? new PgStorage() 
  : new MemStorage();
