import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { startSession, endSession } from '@/services/eventTrackingService';

export const useSessionTracking = () => {
  const { user } = useAuth();
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startSession({ user: userRef.current });

    const handleEnd = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      endSession({ user: userRef.current });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleEnd();
      }
    };

    window.addEventListener('beforeunload', handleEnd);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      handleEnd();
      window.removeEventListener('beforeunload', handleEnd);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
};

export default useSessionTracking;
