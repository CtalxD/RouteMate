import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/auth-context';

const Home = () => {
  const { authState } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (authState.authenticated) {
      router.push('/lists');
    } else {
      router.push('/(auth)/sign-in');
    }
  }, [authState.authenticated, isMounted, router]);

  return null;
};

export default Home;
