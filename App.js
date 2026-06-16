import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  Image, Animated,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

import { auth } from './firebaseConfig';
import {
  requestNotificationPermissions,
  getAndStorePushToken,
  setupNotificationListeners,
} from './utils/notifications';
import { PaperTheme, Colors, Typography } from './theme';

import LoginScreen from './screens/Login';
import SignupScreen from './screens/Signup';
import DashboardScreen from './screens/Dashboard';
import JobListScreen from './screens/JobList';
import PostJobScreen from './screens/PostJob';
import JobDetailsScreen from './screens/JobDetails';
import SearchScreen from './screens/Search';
import TestimonialScreen from './screens/Testimonial';
import AllTestimonialsScreen from './screens/AllTestimonials';
import ProfileScreen from './screens/Profile';
import ChatScreen from './screens/Chat';

const Stack = createStackNavigator();

// ─── Splash / Loading Screen ──────────────────────────────────────────────────
function SplashScreen() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.splash}>
      <StatusBar style="light" />
      <Animated.View style={[styles.splashLogoWrap, { transform: [{ scale: pulse }] }]}>
        <Image
          source={require('./assets/logo1.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.splashName}>Quick-Job</Text>
      <Text style={styles.splashTagline}>Find work. Hire fast. Done.</Text>
      <ActivityIndicator
        color="rgba(255,255,255,0.7)"
        size="small"
        style={{ marginTop: 40 }}
      />
    </LinearGradient>
  );
}

// ─── Shared header logo ───────────────────────────────────────────────────────
const HeaderLogo = () => (
  <View style={{ marginRight: 12 }}>
    <Image source={require('./assets/logo1.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
  </View>
);

// ─── Shared screen options ────────────────────────────────────────────────────
const screenOptions = {
  headerStyle: {
    backgroundColor: Colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: Colors.white,
  headerTitleStyle: {
    fontWeight: Typography.bold,
    fontSize: Typography.md,
  },
  headerRight: () => <HeaderLogo />,
  cardStyle: { backgroundColor: Colors.background },
};

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef(null);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    requestNotificationPermissions();
    return unsub;
  }, []);

  // Push token when user logs in
  useEffect(() => {
    if (user) getAndStorePushToken();
  }, [user]);

  // Notification deep-link handler
  useEffect(() => {
    const handleNotification = (notification) => {
      let jobId =
        notification?.jobId ||
        notification?.request?.content?.data?.jobId ||
        null;
      if (jobId && navigationRef.current) {
        navigationRef.current.navigate('JobDetails', { job: { id: jobId } });
      }
    };
    const remove = setupNotificationListeners(handleNotification);
    return remove;
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={PaperTheme}>
        <StatusBar style={user ? 'light' : 'light'} />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName={user ? 'Home' : 'Login'}
            screenOptions={screenOptions}
          >
            {/* ── Auth ── */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{ headerShown: false }}
            />

            {/* ── App ── */}
            <Stack.Screen
              name="Home"
              component={DashboardScreen}
              options={{ title: 'Home', headerShown: false }}
            />
            <Stack.Screen
              name="JobList"
              component={JobListScreen}
              options={{ title: 'Nearby Jobs', headerShown: false }}
            />
            <Stack.Screen
              name="PostJob"
              component={PostJobScreen}
              options={{ title: 'Post a Job', headerShown: false }}
            />
            <Stack.Screen
              name="JobDetails"
              component={JobDetailsScreen}
              options={({ route }) => ({
                title: route.params?.job?.title || 'Job Details',
                headerShown: true,
              })}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ title: 'Search Jobs', headerShown: false }}
            />
            <Stack.Screen
              name="Testimonial"
              component={TestimonialScreen}
              options={{ title: 'Leave a Review', headerShown: false }}
            />
            <Stack.Screen
              name="AllTestimonials"
              component={AllTestimonialsScreen}
              options={{ title: 'All Reviews', headerShown: false }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'My Profile', headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({
                title: route.params?.jobTitle || 'Chat',
                headerShown: true,
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashLogo: { width: 70, height: 70 },
  splashName: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  splashTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
  },
});
