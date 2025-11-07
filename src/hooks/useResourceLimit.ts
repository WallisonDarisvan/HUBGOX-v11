import { useState, useEffect } from 'react';
import { usePlan } from '@/contexts/PlanContext';

export function useResourceLimit(resource: 'cards' | 'forms' | 'lists' | 'profiles', profileId?: string) {
  const { currentPlan, canCreate, getRemainingSlots, invalidatePlanCache } = usePlan();
  const [canCreateResource, setCanCreateResource] = useState(true);
  const [remainingSlots, setRemainingSlots] = useState(0);
  const [loading, setLoading] = useState(true);

  const checkLimits = async () => {
    setLoading(true);
    const can = await canCreate(resource, profileId);
    const remaining = await getRemainingSlots(resource, profileId);
    setCanCreateResource(can);
    setRemainingSlots(remaining);
    setLoading(false);
  };

  useEffect(() => {
    checkLimits();
  }, [resource, currentPlan, profileId]);

  // Método para forçar revalidação
  const revalidate = async () => {
    await invalidatePlanCache();
    await checkLimits();
  };

  const limitMap = {
    cards: currentPlan?.limit_cards || 0,
    forms: currentPlan?.limit_forms || 0,
    lists: currentPlan?.limit_lists || 0,
    profiles: currentPlan?.limit_profiles || 0,
  };

  return {
    canCreate: canCreateResource,
    limit: limitMap[resource],
    remaining: remainingSlots,
    used: limitMap[resource] - remainingSlots,
    loading,
    planName: currentPlan?.plan_name || 'Plano Gratuito',
    revalidate,
  };
}
