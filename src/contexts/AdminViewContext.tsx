import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { usePlan } from './PlanContext';

interface AdminViewContextType {
  viewingUserId: string | null;
  setViewingUserId: (userId: string | null) => void;
  isViewingOtherUser: boolean;
  isAdminMode: boolean;
  canAdmin: boolean;
  resetView: () => void;
}

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined);

export function AdminViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentPlan, isLoading: planLoading } = usePlan();
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  
  const canAdmin = currentPlan?.allow_admin_mode || false;

  // Initialize viewingUserId based on plan permissions (wait for plan to load)
  useEffect(() => {
    // Don't initialize until we have plan data
    if (planLoading || !user?.id) {
      console.log('AdminViewContext: Waiting for plan to load', { planLoading, userId: user?.id });
      return;
    }
    
    console.log('AdminViewContext: Initializing with', { 
      canAdmin, 
      viewingUserId, 
      userId: user.id 
    });
    
    // Only initialize if viewingUserId hasn't been set yet
    if (viewingUserId === null) {
      if (canAdmin) {
        // User WITH admin mode: KEEP null (manager mode)
        console.log('AdminViewContext: Starting in Manager Mode (viewingUserId = null)');
        // Don't do anything - viewingUserId is already null
      } else {
        // User WITHOUT admin mode: set own ID
        console.log('AdminViewContext: Starting in own dashboard');
        setViewingUserId(user.id);
      }
    }
  }, [user?.id, canAdmin, planLoading, viewingUserId]);

  // Reset view when user logs out
  useEffect(() => {
    if (!user) {
      setViewingUserId(null);
    }
  }, [user]);

  const resetView = useCallback(() => {
    setViewingUserId(user?.id || null);
  }, [user?.id]);

  const isViewingOtherUser = canAdmin && viewingUserId !== null && viewingUserId !== user?.id;
  const isAdminMode = canAdmin && viewingUserId === null;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ 
      viewingUserId, 
      setViewingUserId, 
      isViewingOtherUser,
      isAdminMode,
      canAdmin,
      resetView 
    }),
    [viewingUserId, isViewingOtherUser, isAdminMode, canAdmin, resetView]
  );

  return (
    <AdminViewContext.Provider value={contextValue}>
      {children}
    </AdminViewContext.Provider>
  );
}

export function useAdminView() {
  const context = useContext(AdminViewContext);
  if (context === undefined) {
    throw new Error('useAdminView must be used within an AdminViewProvider');
  }
  return context;
}
