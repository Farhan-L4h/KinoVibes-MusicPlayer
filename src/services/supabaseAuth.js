// Supabase Authentication Service
import { supabase } from '../config/supabase';

// Sign up with email and password. New accounts start 'pending' and must be
// approved by an admin before they can sign in, so any session created here is
// immediately dropped.
export const signUp = async (email, password, displayName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          full_name: displayName
        }
      }
    });

    if (error) throw error;

    // Create user profile in database (the signup trigger also does this; the
    // insert is idempotent and the DB forces role/status defaults).
    if (data.user) {
      await createUserProfile(data.user.id, {
        email: data.user.email,
        displayName: displayName,
        createdAt: new Date().toISOString()
      });
    }

    if (data.session) await supabase.auth.signOut();
    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

// Throws with a user-facing Indonesian message when the account is not allowed
// in. Tolerates the pre-migration schema (no status column) as approved.
export const assertAccountAllowed = async (user) => {
  const profile = await getUserProfile(user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('Gagal memverifikasi status akun. Coba masuk lagi.');
  }
  if (profile.is_banned) {
    await supabase.auth.signOut();
    throw new Error('Akun kamu dibanned. Hubungi admin untuk info lebih lanjut.');
  }
  const status = profile.status || 'approved';
  if (status === 'rejected') {
    await supabase.auth.signOut();
    throw new Error('Pendaftaran akun kamu ditolak admin.');
  }
  if (status !== 'approved') {
    await supabase.auth.signOut();
    throw new Error('Akun kamu menunggu persetujuan admin. Coba masuk lagi setelah disetujui.');
  }
  return profile;
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    await assertAccountAllowed(data.user);
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign in with Google OAuth
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

// Get current session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

// Reset password
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// Update password
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) throw error;

    // Update user profile in database
    await updateUserProfile(user.id, updates);
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Create user profile in database
const createUserProfile = async (userId, profileData) => {
  try {
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        ...profileData
      });

    if (error) throw error;
  } catch (error) {
    console.error('Create profile error:', error);
    // Don't throw - profile creation is optional
  }
};

// Update user profile in database
const updateUserProfile = async (userId, updates) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Update profile error:', error);
  }
};

// Get user profile from database
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};
