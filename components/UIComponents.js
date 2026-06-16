import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

// ─── Primary Gradient Button ─────────────────────────────────────────────────
export const GradientButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  gradient = Colors.gradientPrimary,
  style,
  icon,
  size = 'md',
}) => {
  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const fontSize = size === 'sm' ? Typography.sm : size === 'lg' ? Typography.md : Typography.base;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.gradientBtnWrapper, style]}
    >
      <LinearGradient
        colors={disabled ? [Colors.gray300, Colors.gray400] : gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientBtn, { height }]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={[styles.gradientBtnText, { fontSize }]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ─── Outline Button ───────────────────────────────────────────────────────────
export const OutlineButton = ({ label, onPress, disabled, style, color = Colors.primary }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
    style={[styles.outlineBtn, { borderColor: color }, style]}
  >
    <Text style={[styles.outlineBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Ghost Button ─────────────────────────────────────────────────────────────
export const GhostButton = ({ label, onPress, style, color = Colors.primary }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.ghostBtn, style]}>
    <Text style={[styles.ghostBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress, elevated = false }) => {
  const shadow = elevated ? Shadows.lg : Shadows.sm;
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[styles.card, shadow, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, shadow, style]}>{children}</View>;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    available: { bg: Colors.successLight, text: Colors.success, label: 'Available' },
    taken: { bg: Colors.warningLight, text: Colors.warning, label: 'Taken' },
    completed: { bg: Colors.gray100, text: Colors.gray500, label: 'Completed' },
  };
  const cfg = map[status] || map.available;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: cfg.text }]} />
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
export const SkeletonLine = ({ width = '100%', height = 14, style }) => {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, opacity: anim, borderRadius: Radius.sm },
        style,
      ]}
    />
  );
};

export const JobCardSkeleton = () => (
  <Card style={styles.skeletonCard}>
    <SkeletonLine width="60%" height={18} style={{ marginBottom: 10 }} />
    <SkeletonLine width="100%" height={13} style={{ marginBottom: 6 }} />
    <SkeletonLine width="80%" height={13} style={{ marginBottom: 6 }} />
    <SkeletonLine width="40%" height={13} style={{ marginBottom: 6 }} />
    <View style={styles.skeletonRow}>
      <SkeletonLine width="30%" height={28} />
      <SkeletonLine width="45%" height={28} />
    </View>
  </Card>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '🔍', title, message, actionLabel, onAction }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    {actionLabel && (
      <GradientButton label={actionLabel} onPress={onAction} style={{ marginTop: 20 }} />
    )}
  </View>
);

// ─── Star Rating ──────────────────────────────────────────────────────────────
export const StarRating = ({ rating, size = 16, interactive = false, onRate }) => (
  <View style={styles.stars}>
    {[1, 2, 3, 4, 5].map((n) => (
      <TouchableOpacity
        key={n}
        disabled={!interactive}
        onPress={() => onRate && onRate(n)}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: size, color: n <= rating ? '#F59E0B' : Colors.gray300 }}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Input Field ──────────────────────────────────────────────────────────────
export const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  error,
  autoCapitalize = 'none',
  rightIcon,
  editable = true,
}) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={[styles.inputContainer, error && styles.inputError, !editable && styles.inputDisabled]}>
      <View style={{ flex: 1 }}>
        {/* We keep native TextInput from react-native */}
        {/* This wrapper is for consistent styling */}
      </View>
      {rightIcon && <View style={styles.inputRight}>{rightIcon}</View>}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
export const Divider = ({ label, style }) => (
  <View style={[styles.divider, style]}>
    <View style={styles.dividerLine} />
    {label && <Text style={styles.dividerLabel}>{label}</Text>}
    {label && <View style={styles.dividerLine} />}
  </View>
);

// ─── Pay Badge ────────────────────────────────────────────────────────────────
export const PayBadge = ({ pay, frequency }) => (
  <View style={styles.payBadge}>
    <Text style={styles.payAmount}>${pay}</Text>
    {frequency && <Text style={styles.payFreq}>/{frequency}</Text>}
  </View>
);

const styles = StyleSheet.create({
  gradientBtnWrapper: { borderRadius: Radius.md, overflow: 'hidden' },
  gradientBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  gradientBtnText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    letterSpacing: 0.3,
  },
  outlineBtn: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
  },
  outlineBtnText: { fontWeight: Typography.semibold, fontSize: Typography.base },
  ghostBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[2] },
  ghostBtnText: { fontWeight: Typography.semibold, fontSize: Typography.base },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  skeleton: { backgroundColor: Colors.gray200 },
  skeletonCard: { marginHorizontal: Spacing[4], marginVertical: Spacing[2] },
  skeletonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  sectionAction: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  emptyIcon: { fontSize: 56, marginBottom: Spacing[4] },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  emptyMessage: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stars: { flexDirection: 'row' },
  inputWrapper: { marginBottom: Spacing[4] },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    minHeight: 48,
    paddingHorizontal: Spacing[3],
    alignItems: 'center',
  },
  inputError: { borderColor: Colors.error },
  inputDisabled: { backgroundColor: Colors.gray50 },
  inputRight: { paddingLeft: Spacing[2] },
  errorText: { fontSize: Typography.xs, color: Colors.error, marginTop: 4 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  dividerLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginHorizontal: Spacing[3],
  },
  payBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  payAmount: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.success },
  payFreq: { fontSize: Typography.xs, color: Colors.success, marginLeft: 2 },
});
