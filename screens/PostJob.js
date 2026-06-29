import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { validateJobPost } from '../utils/validation';
import { encryptContact } from '../utils/encryption';
import { getCurrentPositionAsync, openLocationSettings } from '../utils/geocoding';
import { Colors, Typography, Spacing, Radius, Shadows } from '../src/shared/theme';

const PAY_FREQUENCIES = ['hourly', 'daily', 'weekly', 'monthly'];
const JOB_TYPES = ['Cleaner', 'Babysitter', 'Driver', 'Gardener', 'Plumber', 'Cook', 'Security', 'Labourer', 'Tutor', 'Other'];

const Field = ({ label, required, error, children }) => (
  <View style={s.field}>
    <Text style={s.label}>{label}{required && <Text style={{ color: Colors.error }}> *</Text>}</Text>
    {children}
    {error ? <Text style={s.errText}>{error}</Text> : null}
  </View>
);

export default function PostJobScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType] = useState('');
  const [pay, setPay] = useState('');
  const [payFrequency, setPayFrequency] = useState('daily');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [errors, setErrors] = useState({});
  const [locationError, setLocationError] = useState(null);

  const getLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable it in Settings.');
        return;
      }
      const loc = await getCurrentPositionAsync({});
      setLocation(loc.coords);
    } catch (err) {
      setLocationError(err.userMessage || 'Could not get location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePost = async () => {
    const errs = validateJobPost(title, description, jobType, pay, contact);
    if (!location) errs.location = 'Please get your current location first.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPosting(true);
    try {
      await addDoc(collection(db, 'jobs'), {
        title: title.trim(),
        description: description.trim(),
        jobType: jobType.trim(),
        pay: parseFloat(pay),
        payFrequency,
        contact: encryptContact(contact.trim()),
        location: { lat: location.latitude, lng: location.longitude },
        status: 'available',
        postedBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        applicants: [],
        approvedSeekers: [],
      });
      Alert.alert('Job Posted! 🎉', 'Your job is now live and visible to workers nearby.', [
        { text: 'View Jobs', onPress: () => navigation.navigate('JobList') },
        { text: 'Post Another', onPress: () => {
          setTitle(''); setDescription(''); setJobType(''); setPay('');
          setContact(''); setLocation(null); setErrors({});
        }},
      ]);
    } catch (err) {
      Alert.alert('Failed to Post', 'Please check your connection and try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <LinearGradient colors={Colors.gradientPrimary} style={s.header}>
        <Text style={s.headerTitle}>Post a Job</Text>
        <Text style={s.headerSub}>Fill in the details to hire someone nearby</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Title */}
          <Field label="Job Title" required error={errors.title}>
            <View style={[s.inputWrap, errors.title && s.inputError]}>
              <TextInput
                style={s.input} placeholder="e.g. Need a reliable cleaner"
                placeholderTextColor={Colors.textMuted} value={title}
                onChangeText={t => { setTitle(t); setErrors(e => ({ ...e, title: null })); }}
              />
            </View>
          </Field>

          {/* Job Type chips */}
          <Field label="Job Type" required error={errors.jobType}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              {JOB_TYPES.map(type => (
                <TouchableOpacity
                  key={type} onPress={() => { setJobType(type); setErrors(e => ({ ...e, jobType: null })); }}
                  style={[s.chip, jobType === type && s.chipSelected]}
                >
                  <Text style={[s.chipText, jobType === type && s.chipTextSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Custom input if needed */}
            {jobType === 'Other' && (
              <View style={[s.inputWrap, { marginTop: Spacing[2] }, errors.jobType && s.inputError]}>
                <TextInput
                  style={s.input} placeholder="Specify job type"
                  placeholderTextColor={Colors.textMuted} value={jobType === 'Other' ? '' : jobType}
                  onChangeText={t => { setJobType(t); setErrors(e => ({ ...e, jobType: null })); }}
                />
              </View>
            )}
          </Field>

          {/* Description */}
          <Field label="Description" required error={errors.description}>
            <View style={[s.inputWrap, s.textareaWrap, errors.description && s.inputError]}>
              <TextInput
                style={[s.input, s.textarea]} placeholder="Describe the job, requirements, schedule…"
                placeholderTextColor={Colors.textMuted} value={description}
                onChangeText={t => { setDescription(t); setErrors(e => ({ ...e, description: null })); }}
                multiline numberOfLines={4} textAlignVertical="top"
              />
            </View>
          </Field>

          {/* Pay */}
          <Field label="Pay Amount ($)" required error={errors.pay}>
            <View style={[s.inputWrap, errors.pay && s.inputError]}>
              <Text style={s.inputPrefix}>$</Text>
              <TextInput
                style={s.input} placeholder="0.00"
                placeholderTextColor={Colors.textMuted} value={pay}
                onChangeText={t => { setPay(t); setErrors(e => ({ ...e, pay: null })); }}
                keyboardType="decimal-pad"
              />
            </View>
          </Field>

          {/* Pay frequency */}
          <Field label="Pay Frequency">
            <View style={s.freqRow}>
              {PAY_FREQUENCIES.map(f => (
                <TouchableOpacity
                  key={f} onPress={() => setPayFrequency(f)}
                  style={[s.freqChip, payFrequency === f && s.freqChipSelected]}
                >
                  <Text style={[s.freqText, payFrequency === f && s.freqTextSelected]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Contact */}
          <Field label="Contact Phone" required error={errors.contact}>
            <View style={[s.inputWrap, errors.contact && s.inputError]}>
              <Text style={s.inputPrefix}>📞</Text>
              <TextInput
                style={s.input} placeholder="+1 234 567 8900"
                placeholderTextColor={Colors.textMuted} value={contact}
                onChangeText={t => { setContact(t); setErrors(e => ({ ...e, contact: null })); }}
                keyboardType="phone-pad"
              />
            </View>
          </Field>

          {/* Location */}
          <Field label="Your Location" required error={errors.location}>
            {location ? (
              <View style={s.locSuccess}>
                <Text style={s.locSuccessIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.locSuccessTitle}>Location captured!</Text>
                  <Text style={s.locSuccessCoords}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
                </View>
                <TouchableOpacity onPress={getLocation}>
                  <Text style={s.locRefresh}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={getLocation} disabled={locationLoading} activeOpacity={0.85}>
                <LinearGradient
                  colors={locationLoading ? [Colors.gray300, Colors.gray400] : Colors.gradientCool}
                  style={s.locBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {locationLoading
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={s.locBtnText}>📍 Get Current Location</Text>}
                </LinearGradient>
              </TouchableOpacity>
            )}
            {locationError && (
              <View style={s.locErrBox}>
                <Text style={s.locErrText}>{locationError}</Text>
                <TouchableOpacity onPress={openLocationSettings} style={{ marginTop: 6 }}>
                  <Text style={s.locErrAction}>Open Settings →</Text>
                </TouchableOpacity>
              </View>
            )}
          </Field>

          {/* Submit */}
          <TouchableOpacity onPress={handlePost} disabled={posting} activeOpacity={0.85} style={{ marginTop: Spacing[4] }}>
            <LinearGradient colors={Colors.gradientPrimary} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {posting
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.submitBtnText}>Post Job</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: Spacing[6] },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.white },
  headerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scroll: { padding: Spacing[4] },
  field: { marginBottom: Spacing[5] },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md,
    backgroundColor: Colors.white, minHeight: 50, paddingHorizontal: Spacing[3],
  },
  inputError: { borderColor: Colors.error },
  inputPrefix: { fontSize: Typography.base, marginRight: 6, color: Colors.textSecondary },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary, paddingVertical: Spacing[2] },
  textareaWrap: { alignItems: 'flex-start', paddingVertical: Spacing[2] },
  textarea: { minHeight: 90 },
  errText: { fontSize: Typography.xs, color: Colors.error, marginTop: 4 },
  chipScroll: { marginTop: 4 },
  chip: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.full,
    paddingHorizontal: Spacing[4], paddingVertical: 8, marginRight: Spacing[2],
    backgroundColor: Colors.white,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  chipTextSelected: { color: Colors.primary, fontWeight: Typography.bold },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: 4 },
  freqChip: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md,
    paddingHorizontal: Spacing[4], paddingVertical: 10,
  },
  freqChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  freqText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  freqTextSelected: { color: Colors.white, fontWeight: Typography.bold },
  locSuccess: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.successLight, borderRadius: Radius.md, padding: Spacing[3],
  },
  locSuccessIcon: { fontSize: 24 },
  locSuccessTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.success },
  locSuccessCoords: { fontSize: Typography.xs, color: Colors.success, marginTop: 2 },
  locRefresh: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  locBtn: { height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  locBtnText: { color: Colors.white, fontSize: Typography.base, fontWeight: Typography.bold },
  locErrBox: { backgroundColor: Colors.errorLight, borderRadius: Radius.sm, padding: Spacing[3], marginTop: Spacing[2] },
  locErrText: { fontSize: Typography.sm, color: Colors.error },
  locErrAction: { fontSize: Typography.sm, color: Colors.error, fontWeight: Typography.bold },
  submitBtn: { height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadows.lg },
  submitBtnText: { color: Colors.white, fontSize: Typography.md, fontWeight: Typography.extrabold, letterSpacing: 0.5 },
});
