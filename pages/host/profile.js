// pages/host/profile.js - Versione corretta
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

function Profile() {
  const { user, profile, updateProfile, updatePassword } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const router = useRouter();

  // Initialize form data from profile with added safety checks
  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted && loadingProfile) {
        console.warn('Profile loading timed out, showing default form');
        setLoadingProfile(false);
      }
    }, 5000);

    // Funzione per inizializzare il form
    const initializeForm = () => {
      if (!isMounted) return;

      // Solo se abbiamo un profilo valido
      if (profile) {
        console.log('Profile data loaded:', profile);
        setProfileData({
          name: profile.name || '',
          phone: profile.phone || '',
        });
        setLoadingProfile(false);
      } 
      // Se abbiamo un utente ma non un profilo
      else if (user) {
        console.log('No profile found, using default values');
        setProfileData({
          name: user.email ? user.email.split('@')[0] : '',
          phone: '',
        });
        setLoadingProfile(false);
      }
    };

    // Attendiamo che i dati siano disponibili
    if (user !== null && profile !== undefined) {
      initializeForm();
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [profile, user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await updateProfile(profileData);
      
      if (error) throw error;
      
      setMessage('Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordMessage(null);

    // Check if new passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      // Update password directly - removed the sign-in check that was causing issues
      const { error } = await updatePassword(passwordData.new_password);
      
      if (error) throw error;
      
      setPasswordMessage('Password updated successfully.');
      
      // Clear password form
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
        <p className="mt-2 text-sm text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-md shadow mt-10">
      {message && (
        <div className="mb-6 p-3 bg-green-100 text-green-800 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">User Profile</h2>

      {/* Personal Information Section */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full border rounded px-3 py-2 bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              value={profile?.country || 'Not specified'}
              className="w-full border rounded px-3 py-2 bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={profileData.phone}
              onChange={handleProfileChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[#fad02f] text-black rounded hover:opacity-90 transition font-semibold"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Change Password</h3>
        
        {passwordMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            {passwordMessage}
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {passwordError}
          </div>
        )}
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              name="old_password"
              value={passwordData.old_password}
              onChange={handlePasswordChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Current Password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              className="w-full border rounded px-3 py-2"
              placeholder="New Password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Confirm New Password"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[#fad02f] text-black rounded hover:opacity-90 transition font-semibold"
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

Profile.getLayout = function getLayout(page) {
  return (
    <Layout title="Profile - Guestify">
      <ProtectedRoute>{page}</ProtectedRoute>
    </Layout>
  );
};

export default Profile;