// hooks/useRequireAuth.js
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login'); // or wherever your login is
    }
  }, [isAuthenticated]);
}
