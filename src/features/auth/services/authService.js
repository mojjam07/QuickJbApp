import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';

import { auth } from '../../../../firebaseConfig';

const ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
};

export const login = async (email, password) => {
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return {
      success: true,
      user: credential.user,
    };
  } catch (error) {
    return {
      success: false,
      message:
        ERROR_MESSAGES[error.code] ??
        'Login failed. Please check your credentials.',
    };
  }
};

export const signup = async (email, password) => {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await sendEmailVerification(credential.user);

    return {
      success: true,
      user: credential.user,
    };
  } catch (error) {
    const messages = {
      'auth/email-already-in-use':
        'An account with this email already exists.',
      'auth/weak-password':
        'Password is too weak. Use at least 8 characters.',
    };

    return {
      success: false,
      message:
        messages[error.code] ??
        'Sign up failed. Please try again.',
    };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message:
        'Could not send reset email. Please check the address.',
    };
  }
};