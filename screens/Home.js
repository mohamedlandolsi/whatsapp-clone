import { useEffect, useState } from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import ListUsers from './Home/ListUsers';
import Setting from './Home/Setting';
import Contacts from './Home/Contacts';
import firebase from '../Config';

const auth = firebase.auth();
const database = firebase.database();
const ref_listcomptes = database.ref("ListComptes");
const Tab = createMaterialBottomTabNavigator();

export default function Home({ route }) {
  const currentUserId = route.params?.currentUserId;
  const [isLoading, setIsLoading] = useState(true);

  console.log("[Home.js] Received currentUserId:", currentUserId);

  useEffect(() => {
    if (!currentUserId) {
      console.error("[Home.js] No currentUserId provided");
      setIsLoading(false);
      return;
    }

    const syncCurrentUserToListComptes = async () => {
      console.log("[Home.js] Starting sync of current user with ListComptes");
      try {
        // Get all existing entries in ListComptes
        const listComptesSnapshot = await ref_listcomptes.once('value');
        const existingEntries = listComptesSnapshot.val() || {};
        console.log("[Home.js] Existing entries in ListComptes:", Object.keys(existingEntries));

        // Make sure current user has an entry
        if (!existingEntries[currentUserId]) {
          console.log("[Home.js] Creating missing entry for current user:", currentUserId);
          const currentUser = auth.currentUser;
          if (currentUser) {
            await ref_listcomptes.child(currentUserId).set({
              id: currentUserId,
              email: currentUser.email,
              pseudo: currentUser.email ? currentUser.email.split('@')[0] : 'User',
              numero: ''
            });
            console.log("[Home.js] Created entry for current user:", currentUserId);
          }
        } else {
          console.log("[Home.js] User already exists in ListComptes:", currentUserId);
        }
      } catch (error) {
        console.error("[Home.js] Error syncing current user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    syncCurrentUserToListComptes();
  }, [currentUserId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeAreaLoadingContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaTabNavigatorContainer}>
      <Tab.Navigator 
        initialRouteName="Users"
        activeColor="#ffffff"
        inactiveColor="#bdc3c7"
        barStyle={{ backgroundColor: '#34495e' }}
        shifting={false}
      >
        <Tab.Screen 
          name="Users" 
          component={ListUsers} 
          initialParams={{ currentUserId }} 
          options={{
            tabBarLabel: 'Chats',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chat" color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="Contacts"
          component={Contacts}
          initialParams={{ currentUserId }}
          options={{
            tabBarLabel: 'Contacts',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="account-multiple" color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={Setting} 
          initialParams={{ currentUserId }}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cog" color={color} size={26} />
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaLoadingContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  safeAreaTabNavigatorContainer: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ecf0f1',
  }
});