import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { signup } from '../services/authService';
import { validateSignup } from '../../../shared/utils/validation';
import { useGoogleSignIn } from '../utils/googleAuth';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../../shared/theme';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
        if (error) Alert.alert('Google Sign-up Failed', error.message);
      }
    };
    handleGoogleResponse();
  }, [response]);

  const validate = () => {
    const errs = validateSignup(email, password, confirmPassword);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async () => {
  if (!validate()) return;

  setLoading(true);

  const result = await signup(email, password);

  setLoading(false);

  if (result.success) {
    Alert.alert(
      'Account Created! 🎉',
      'Please verify your email before signing in. Check your inbox.',
      [
        {
          text: 'Go to Login',
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  } else {
    Alert.alert('Sign Up Failed', result.message);
  }
};

  const Field = ({ label, icon, value, onChange, secure, showToggle, onToggle, keyboard, placeholder, errKey }) => (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputRow, errors[errKey] && s.inputError]}>
        <Text style={s.inputIcon}>{icon}</Text>
        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={t => { onChange(t); setErrors(e => ({ ...e, [errKey]: null })); }}
          secureTextEntry={secure}
          keyboardType={keyboard || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {showToggle !== undefined && (
          <TouchableOpacity onPress={onToggle} style={s.eyeBtn}>
            <Text style={{ fontSize: 18 }}>{showToggle ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {errors[errKey] ? <Text style={s.errText}>{errors[errKey]}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={Colors.gradientPrimary} style={s.hero}>
            <View style={s.logoWrap}>
              <Image source={require('../../../../assets/logo1.png')} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.appName}>Join Quick-Job</Text>
            <Text style={s.tagline}>Start earning or hiring today</Text>
          </LinearGradient>

          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={s.cardTitle}>Create account</Text>
            <Text style={s.cardSub}>It's free and takes less than a minute</Text>

            <Field label="Email address" icon="✉️" value={email} onChange={setEmail}
              placeholder="you@example.com" keyboard="email-address" errKey="email" />
            <Field label="Password" icon="🔒" value={password} onChange={setPassword}
              placeholder="Min. 8 characters" secure={!showPassword}
              showToggle={showPassword} onToggle={() => setShowPassword(!showPassword)} errKey="password" />
            <Field label="Confirm password" icon="✅" value={confirmPassword} onChange={setConfirmPassword}
              placeholder="Repeat your password" secure={!showConfirm}
              showToggle={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} errKey="confirmPassword" />

            {/* Password hint */}
            <View style={s.hintBox}>
              <Text style={s.hintText}>Password must be 8+ chars with uppercase, lowercase, and a number.</Text>
            </View>

            <TouchableOpacity onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={Colors.gradientPrimary} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={s.submitBtnText}>Create Account</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divText}>or</Text>
              <View style={s.divLine} />
            </View>

            <TouchableOpacity
              style={s.googleBtn}
              onPress={() => promptAsync()}
              disabled={!request || googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading
                ? <ActivityIndicator color={Colors.primary} />
                : <>
                    <Text style={{ fontSize: 20, marginRight: 10, fontWeight: 'bold', color: '#4285F4' }}>G</Text>
                    <Text style={s.googleBtnText}>Sign up with Google</Text>
                  </>}
            </TouchableOpacity>

            <View style={s.loginRow}>
              <Text style={s.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.loginLink}>Sign in</Text>
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
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 36 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logo: { width: 56, height: 56 },
  appName: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.white },
  tagline: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    flex: 1, padding: Spacing[6], paddingTop: Spacing[7],
  },
  cardTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing[5] },
  fieldWrap: { marginBottom: Spacing[3] },
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
  hintBox: { backgroundColor: Colors.infoLight, borderRadius: Radius.sm, padding: Spacing[3], marginBottom: Spacing[5] },
  hintText: { fontSize: Typography.xs, color: Colors.info },
  submitBtn: { height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadows.md },
  submitBtnText: { color: Colors.white, fontSize: Typography.md, fontWeight: Typography.bold },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing[5] },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  divText: { marginHorizontal: Spacing[3], color: Colors.textMuted, fontSize: Typography.sm },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md,
    height: 52, backgroundColor: Colors.white, ...Shadows.sm,
  },
  googleBtnText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[6], marginBottom: Spacing[4] },
  loginText: { fontSize: Typography.base, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.base, color: Colors.primary, fontWeight: Typography.bold },
});
