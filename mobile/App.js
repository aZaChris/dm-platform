import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CampaignsScreen from './src/screens/CampaignsScreen';
import CampaignDetailsScreen from './src/screens/CampaignDetailsScreen';
import CombatTrackerScreen from './src/screens/CombatTrackerScreen';
import CharactersScreen from './src/screens/CharactersScreen';
import CharacterDetailsScreen from './src/screens/CharacterDetailsScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import MonstersScreen from './src/screens/MonstersScreen';
import JournalScreen from './src/screens/JournalScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (Login/Register)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Tab Navigator for main sections
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Campaigns') {
            iconName = '🏰';
          } else if (route.name === 'Characters') {
            iconName = '👤';
          } else if (route.name === 'Monsters') {
            iconName = '👹';
          } else if (route.name === 'Journal') {
            iconName = '📖';
          }
          
          return <Text style={{ fontSize: size, color }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : 20,
          paddingTop: 5,
          height: Platform.OS === 'android' ? 80 + Math.max(insets.bottom, 20) : 80,
          // Solleva la tab bar sopra i tasti di navigazione Android
          elevation: 8, // Per Android
          shadowColor: '#000', // Per iOS
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        headerShown: false,
      })}
    >
    <Tab.Screen 
      name="Campaigns" 
      component={CampaignsStack}
      options={{ 
        title: 'Campaigns',
      }}
    />
    <Tab.Screen 
      name="Characters" 
      component={CharactersScreen}
      options={{ 
        title: 'Characters',
      }}
    />
    <Tab.Screen 
      name="Monsters" 
      component={MonstersScreen}
      options={{ 
        title: 'Monsters',
      }}
    />
    <Tab.Screen 
      name="Journal" 
      component={JournalScreen}
      options={{ 
        title: 'Journal',
      }}
    />
      </Tab.Navigator>
    );
  };

// Campaigns Stack (for navigation within campaigns)
const CampaignsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CampaignsList" 
      component={CampaignsScreen}
      options={{ 
        title: 'My Campaigns',
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
    <Stack.Screen 
      name="CampaignDetails" 
      component={CampaignDetailsScreen}
      options={{ 
        title: 'Campaign Details',
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
    <Stack.Screen 
      name="CombatTracker" 
      component={CombatTrackerScreen}
      options={{ 
        title: 'Combat Tracker',
        headerStyle: {
          backgroundColor: '#dc3545',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
    <Stack.Screen 
      name="CharacterDetails" 
      component={CharacterDetailsScreen}
      options={{ 
        title: 'Character Details',
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
    <Stack.Screen 
      name="Inventory" 
      component={InventoryScreen}
      options={{ 
        title: 'Inventory',
        headerStyle: {
          backgroundColor: '#28a745',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  </Stack.Navigator>
);

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007bff" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Main App Component
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Root App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});