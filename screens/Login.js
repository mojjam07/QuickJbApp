import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator, Alert, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { validateLogin } from '../utils/validation';
import { useGoogleSignIn } from '../utils/googleAuth';
import { Colors, Typography, Spacing, Radius, Shadows } from '../src/shared/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const { request, response, promptAsync, signInWithGoogle } = useGoogleSignIn();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        setGoogleLoading(true);
        const { user, error } = await signInWithGoogle();
        setGoogleLoading(false);
        if (error) Alert.alert('Google Sign-in Failed', error.message);
      }
    };
    handleGoogleResponse();
  }, [response]);

  const validate = () => {
    const errs = validateLogin(email, password);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const msg = error.code === 'auth/user-not-found' ? 'No account found with this email.'
        : error.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.'
        : error.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.'
        : 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Reset Password', 'Please enter your email address first.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
    } catch (error) {
      Alert.alert('Error', 'Could not send reset email. Please check the address.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <LinearGradient colors={Colors.gradientPrimary} style={s.hero}>
            <View style={s.logoWrap}>
              <Image source={require('../assets/logo1.png')} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.appName}>Quick-Job</Text>
            <Text style={s.tagline}>Find work. Hire fast. Done.</Text>
          </LinearGradient>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={s.cardTitle}>Welcome back</Text>
            <Text style={s.cardSub}>Sign in to your account</Text>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>Email address</Text>
              <View style={[s.inputRow, errors.email && s.inputError]}>
                <Text style={s.inputIcon}>✉️</Text>
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: null })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? <Text style={s.errText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>Password</Text>
              <View style={[s.inputRow, errors.password && s.inputError]}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput
                  style={s.input}
                  placeholder="Your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: null })); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={s.errText}>{errors.password}</Text> : null}
            </View>

            {/* Forgot */}
            <TouchableOpacity onPress={handlePasswordReset} style={s.forgotBtn} disabled={resetLoading}>
              {resetLoading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={s.forgotText}>Forgot password?</Text>}
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={Colors.gradientPrimary} style={s.loginBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={s.loginBtnText}>Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divText}>or</Text>
              <View style={s.divLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={s.googleBtn}
              onPress={() => promptAsync()}
              disabled={!request || googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading
                ? <ActivityIndicator color={Colors.primary} />
                : <>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>G</Text>
                    <Text style={s.googleBtnText}>Continue with Google</Text>
                  </>}
            </TouchableOpacity>

            {/* Sign up */}
            <View style={s.signupRow}>
              <Text style={s.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={s.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingTop: 48, paddingBottom: 40 },
  logoWrap: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    ...Shadows.md,
  },
  logo: { width: 64, height: 64 },
  appName: { fontSize: Typography['3xl'], fontWeight: Typography.extrabold, color: Colors.white, letterSpacing: -0.5 },
  tagline: { fontSize: Typography.base, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    flex: 1, padding: Spacing[6], paddingTop: Spacing[8], minHeight: height * 0.6,
  },
  cardTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing[6] },
  fieldWrap: { marginBottom: Spacing[4] },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md,
    backgroundColor: Colors.gray50, height: 52, paddingHorizontal: Spacing[3],
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  eyeBtn: { padding: 4 },
  errText: { fontSize: Typography.xs, color: Colors.error, marginTop: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing[5], minHeight: 24, justifyContent: 'center' },
  forgotText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  loginBtn: {
    height: 52, borderRadius: Radius.md, alignItems: 'center',
    justifyContent: 'center', ...Shadows.md,
  },
  loginBtnText: { color: Colors.white, fontSize: Typography.md, fontWeight: Typography.bold, letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing[5] },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  divText: { marginHorizontal: Spacing[3], color: Colors.textMuted, fontSize: Typography.sm },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md,
    height: 52, backgroundColor: Colors.white, ...Shadows.sm,
  },
  googleBtnText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[6] },
  signupText: { fontSize: Typography.base, color: Colors.textSecondary },
  signupLink: { fontSize: Typography.base, color: Colors.primary, fontWeight: Typography.bold },
});
