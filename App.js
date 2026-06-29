import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';

import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './firebaseConfig';

import {
  requestNotificationPermissions,
  getAndStorePushToken,
  setupNotificationListeners,
} from './utils/notifications';

import { PaperTheme, Colors, Typography } from './src/shared/theme';

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

function SplashScreen() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.splash}>
      <StatusBar style="light" />

      <Animated.View
        style={[
          styles.splashLogoWrap,
          {
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <Image
          source={require('./assets/logo1.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
      </Animated.View>

      <Text style={styles.splashName}>Quick-Job</Text>

      <Text style={styles.splashTagline}>
        Find work. Hire fast. Done.
      </Text>

      <ActivityIndicator
        color="rgba(255,255,255,0.7)"
        style={{ marginTop: 30 }}
      />
    </LinearGradient>
  );
}

const HeaderLogo = () => (
  <View style={{ marginRight: 12 }}>
    <Image
      source={require('./assets/logo1.png')}
      style={{ width: 36, height: 36 }}
      resizeMode="contain"
    />
  </View>
);

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
  cardStyle: {
    backgroundColor: Colors.background,
  },
};

export default function App() {
  const navigationRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    if (Constants.appOwnership !== 'expo') {
      requestNotificationPermissions();
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (
      user &&
      Constants.appOwnership !== 'expo'
    ) {
      getAndStorePushToken();
    }
  }, [user]);

  useEffect(() => {
    const handleNotification = notification => {
      const jobId =
        notification?.jobId ||
        notification?.request?.content?.data?.jobId;

      if (!jobId) return;

      navigationRef.current?.navigate(
        'JobDetails',
        {
          job: {
            id: jobId,
          },
        }
      );
    };

    if (Constants.appOwnership !== 'expo') {
      const remove =
        setupNotificationListeners(
          handleNotification
        );

      return remove;
    }
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={PaperTheme}>
        <StatusBar style="light" />

        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            screenOptions={screenOptions}
          >
            {!user ? (
              <>
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="Signup"
                  component={SignupScreen}
                  options={{
                    headerShown: false,
                  }}
                />
              </>
            ) : (
              <>
                <Stack.Screen
                  name="Home"
                  component={DashboardScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="JobList"
                  component={JobListScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="PostJob"
                  component={PostJobScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="JobDetails"
                  component={JobDetailsScreen}
                  options={({ route }) => ({
                    title:
                      route.params?.job?.title ||
                      'Job Details',
                  })}
                />

                <Stack.Screen
                  name="Search"
                  component={SearchScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="Testimonial"
                  component={TestimonialScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="AllTestimonials"
                  component={
                    AllTestimonialsScreen
                  }
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="Profile"
                  component={ProfileScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="Chat"
                  component={ChatScreen}
                  options={({ route }) => ({
                    title:
                      route.params?.jobTitle ||
                      'Chat',
                  })}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  splashLogoWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor:
      'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  splashLogo: {
    width: 70,
    height: 70,
  },

  splashName: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
  },

  splashTagline: {
    marginTop: 6,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
  },
});