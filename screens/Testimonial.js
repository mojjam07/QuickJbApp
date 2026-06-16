import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function TestimonialScreen({ route, navigation }) {
  const { jobId } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!jobId) {
      Alert.alert('Error', 'No job selected for this review.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Comment Required', 'Please write a short comment about your experience.');
      return;
    }
    if (comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        testimonials: arrayUnion({
          userId: auth.currentUser.uid,
          rating,
          comment: comment.trim(),
          createdAt: new Date(),
        }),
      });
      Alert.alert('Review Submitted! ⭐', 'Thank you for sharing your experience.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Submission Failed', 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hovered || rating;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {/* Header */}
      <LinearGradient colors={Colors.gradientPrimary} style={s.header}>
        <Text style={s.headerTitle}>Leave a Review</Text>
        <Text style={s.headerSub}>Help others by sharing your experience</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Star Rating Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>How was your experience?</Text>
              <Text style={s.cardSub}>Tap a star to rate</Text>

              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    onPressIn={() => setHovered(star)}
                    onPressOut={() => setHovered(0)}
                    activeOpacity={0.7}
                    style={s.starBtn}
                  >
                    <Animated.Text
                      style={[
                        s.star,
                        { color: star <= displayRating ? '#F59E0B' : Colors.gray200 },
                        star <= displayRating && s.starActive,
                      ]}
                    >
                      ★
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </View>

              {displayRating > 0 && (
                <Text style={s.ratingLabel}>{STAR_LABELS[displayRating]}</Text>
              )}
            </View>

            {/* Comment Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Your Review</Text>
              <Text style={s.cardSub}>Tell us what you liked or what could be improved</Text>

              <View style={[s.textareaWrap, comment.length > 0 && s.textareaActive]}>
                <TextInput
                  style={s.textarea}
                  placeholder="e.g. The worker was punctual, professional and did an excellent job…"
                  placeholderTextColor={Colors.textMuted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>

              <View style={s.charRow}>
                <Text style={s.charCount}>{comment.length}/500</Text>
                {comment.trim().length > 0 && comment.trim().length < 10 && (
                  <Text style={s.charHint}>At least 10 characters</Text>
                )}
              </View>
            </View>

            {/* Tips */}
            <View style={s.tipsCard}>
              <Text style={s.tipsTitle}>💡 Review Tips</Text>
              <Text style={s.tipItem}>• Was the worker on time?</Text>
              <Text style={s.tipItem}>• Was the job completed properly?</Text>
              <Text style={s.tipItem}>• Would you hire them again?</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || rating === 0 || comment.trim().length < 10}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  rating === 0 || comment.trim().length < 10
                    ? [Colors.gray300, Colors.gray400]
                    : Colors.gradientPrimary
                }
                style={s.submitBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={s.submitBtnText}>Submit Review ⭐</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={s.skipBtn}>
              <Text style={s.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[6],
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: Colors.white,
  },
  headerSub: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scroll: { padding: Spacing[4], paddingBottom: Spacing[10] },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[5],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing[4],
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  starBtn: { padding: 4 },
  star: { fontSize: 44 },
  starActive: { transform: [{ scale: 1.1 }] },
  ratingLabel: {
    textAlign: 'center',
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  textareaWrap: {
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray50,
    padding: Spacing[3],
    minHeight: 120,
  },
  textareaActive: { borderColor: Colors.primary },
  textarea: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    minHeight: 100,
  },
  charRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[2],
  },
  charCount: { fontSize: Typography.xs, color: Colors.textMuted },
  charHint: { fontSize: Typography.xs, color: Colors.warning },
  tipsCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[5],
  },
  tipsTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.info,
    marginBottom: Spacing[2],
  },
  tipItem: {
    fontSize: Typography.sm,
    color: Colors.info,
    marginBottom: 4,
    lineHeight: 20,
  },
  submitBtn: {
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    letterSpacing: 0.3,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  skipBtnText: {
    fontSize: Typography.base,
    color: Colors.textMuted,
  },
});
