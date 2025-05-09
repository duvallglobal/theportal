import { createContext, ReactNode, useContext } from 'react';
import { useRealTimeMessaging } from '@/hooks/use-real-time-messaging';

type MessagingContextType = ReturnType<typeof useRealTimeMessaging>;

const MessagingContext = createContext<MessagingContextType | null>(null);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const messagingUtils = useRealTimeMessaging();
  
  return (
    <MessagingContext.Provider value={messagingUtils}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  
  return context;
}