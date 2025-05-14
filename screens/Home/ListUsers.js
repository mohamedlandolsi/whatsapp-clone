import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  TextInput, // Add TextInput
  StatusBar as RNStatusBar, // Import StatusBar
} from "react-native";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import firebase from "../../Config";

const database = firebase.database();
const ref_listcomptes = database.ref("ListComptes");
const ref_contacts = database.ref("Contacts");

export default function ListUsers({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;
  
  console.log("[ListUsers.js] Component mounted with currentUserId:", currentUserId);
  
  const [data, setData] = useState([]);
  const [userContacts, setUserContacts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // Add state for search query

  // Update user's contacts and fetch all users
  useEffect(() => {
    console.log("[ListUsers.js] useEffect running, currentUserId:", currentUserId);
    
    if (!currentUserId) {
      console.error("[ListUsers.js] No currentUserId provided, cannot filter users");
      setLoading(false);
      return;
    }

    // Fetch current user's contacts
    const currentUserContactsRef = ref_contacts.child(currentUserId);
    const contactsListener = currentUserContactsRef.on('value', snapshot => {
      console.log("[ListUsers.js] Contacts snapshot received:", snapshot.val());
      setUserContacts(snapshot.val() || {});
    }, error => {
      console.error("[ListUsers.js] Error fetching contacts:", error);
    });

    // Set up listener for users
    const usersListener = ref_listcomptes.on("value", (snapshot) => {
      console.log("[ListUsers.js] Users snapshot received, filtering with currentUserId:", currentUserId);
      
      const filteredUsers = [];
      let totalUsers = 0;
      let filteredCount = 0;
      
      snapshot.forEach(un_compte => {
        totalUsers++;
        const userData = un_compte.val();
        const userId = un_compte.key;
        
        console.log(`[ListUsers.js] Processing user: ${userId} (${userData.pseudo || 'unnamed'})`);
        console.log(`[ListUsers.js] Comparing with currentUserId: ${currentUserId}`);
        
        if (userId !== currentUserId) {
          filteredUsers.push({ ...userData, id: userId });
        } else {
          filteredCount++;
          console.log(`[ListUsers.js] Filtered out current user: ${userId}`);
        }
      });
      
      console.log(`[ListUsers.js] Found ${totalUsers} total users, filtered out ${filteredCount} (current user)`);
      console.log(`[ListUsers.js] Setting data with ${filteredUsers.length} users`);
      
      setData(filteredUsers);
      setLoading(false);
    }, error => {
      console.error("[ListUsers.js] Error fetching users:", error);
      setLoading(false);
    });

    // Clean up listeners on unmount
    return () => {
      console.log("[ListUsers.js] Cleaning up listeners");
      
      if (currentUserId) {
        currentUserContactsRef.off('value', contactsListener);
      }
      ref_listcomptes.off("value", usersListener);
    };
  }, [currentUserId]);

  // Filtered data based on search query
  const filteredData = data.filter(user => 
    user.pseudo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to add or remove a user from contacts
  const toggleContact = (contactId) => {
    console.log("[ListUsers.js] toggleContact called with contactId:", contactId); 
    if (!currentUserId) {
      console.error("[ListUsers.js] toggleContact: currentUserId is undefined");
      return;
    }
    if (!contactId) {
      console.error("[ListUsers.js] toggleContact: contactId is undefined");
      return;
    }
    console.log("[ListUsers.js] Current userContacts state before action:", userContacts);
    const currentUserContactEntryRef = ref_contacts.child(currentUserId).child(contactId);

    if (userContacts[contactId]) {
      console.log("[ListUsers.js] Attempting to remove contact:", contactId);
      currentUserContactEntryRef.remove()
        .then(() => console.log("[ListUsers.js] Contact removed successfully from Firebase:", contactId))
        .catch(error => console.error("[ListUsers.js] Error removing contact from Firebase:", error));
    } else {
      console.log("[ListUsers.js] Attempting to add contact:", contactId);
      currentUserContactEntryRef.set(true)
        .then(() => console.log("[ListUsers.js] Contact added successfully to Firebase:", contactId))
        .catch(error => console.error("[ListUsers.js] Error adding contact to Firebase:", error));
    }
  };

  // Show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.safeAreaFull}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Show no users message if empty after filtering or initially
  if (!loading && filteredData.length === 0) {
    return (
      <SafeAreaView style={styles.safeAreaFull}>
        <View style={styles.container}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#7f8c8d"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={60} color="#7f8c8d" />
            <Text style={styles.emptyText}>{searchQuery ? 'No users match your search' : 'No other users found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaFull}>
      <View style={styles.container}> 
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#7f8c8d"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          data={filteredData} // Use filteredData
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContentContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => navigation.navigate("Chat", { 
                currentUserId, 
                secondUserId: item.id 
              })}>
                <Image source={require("../../assets/profile.jpg")} style={styles.avatar} />
              </TouchableOpacity>

              <View style={styles.textContainer}>
                <Text style={styles.pseudo}>{item.pseudo || 'User'}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (item.numero) {
                      const telUrl = Platform.OS === "android"
                        ? `tel:${item.numero}`
                        : `telprompt:${item.numero}`;
                      Linking.openURL(telUrl);
                    }
                  }}
                >
                  <Text style={styles.numero}>{item.numero || 'No phone number'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionsContainer}> 
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleContact(item.id)}
                >
                  <Ionicons 
                    name={userContacts[item.id] ? "person-remove-outline" : "person-add-outline"} 
                    size={24} 
                    color={userContacts[item.id] ? "#e74c3c" : "#2ecc71"} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("Chat", { 
                    currentUserId,
                    secondUserId: item.id 
                  })}
                >
                  <MaterialIcons name="chat-bubble-outline" size={24} color="#3498db" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaFull: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    paddingHorizontal: 10, // Add some padding
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0, // Add paddingTop for Android status bar
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#34495e",
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pseudo: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ecf0f1",
    marginBottom: 3,
  },
  numero: {
    fontSize: 14,
    color: "#bdc3c7",
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    marginLeft: 10,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#bdc3c7',
    marginTop: 15,
    textAlign: 'center',
  },
  searchInput: {
    height: 50,
    backgroundColor: '#34495e',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#ecf0f1',
    marginBottom: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4a6572'
  },
});