import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login page
    router.push('/auth/signin');
  }, []);

  // Show a brief loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#5e2bff] mb-4">Guestify</h1>
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    </div>
  );
}

Home.getLayout = function getLayout(page) {
  return <Layout title="Guestify - Food Service for Airbnb Hosts">{page}</Layout>;
};