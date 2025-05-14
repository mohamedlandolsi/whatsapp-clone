import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, SafeAreaView, TextInput, Platform, StatusBar as RNStatusBar } from 'react-native';
import firebase from '../../Config';
import { MaterialIcons, Ionicons } from '@expo/vector-icons'; // Import Ionicons

const database = firebase.database();

export default function Contacts({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  console.log("[Contacts.js] currentUserId:", currentUserId);

  useEffect(() => {
    if (!currentUserId) {
      console.log("[Contacts.js] useEffect: currentUserId is null or undefined, returning.");
      return;
    }
    console.log(`[Contacts.js] useEffect: Attaching listener to Contacts/${currentUserId}`);
    const contactsRef = database.ref(`Contacts/${currentUserId}`);
    
    const listener = contactsRef.on('value', async (snapshot) => {
      const contactsData = snapshot.val();
      console.log("[Contacts.js] Firebase contacts listener triggered. contactsData:", contactsData);

      if (contactsData) {
        const contactIds = Object.keys(contactsData);
        console.log("[Contacts.js] Extracted contactIds:", contactIds);

        if (contactIds.length === 0) {
          console.log("[Contacts.js] No contact IDs found, setting contacts to empty array.");
          setContacts([]);
          return;
        }

        const userPromises = contactIds.map(userId => 
          database.ref(`ListComptes/${userId}`).once('value')
        );
        
        try {
          const userSnapshots = await Promise.all(userPromises);
          const detailedContacts = userSnapshots.map(snap => ({
            id: snap.key,
            ...snap.val()
          }));
          console.log("[Contacts.js] Fetched detailedContacts:", detailedContacts);
          setContacts(detailedContacts);
        } catch (error) {
          console.error("[Contacts.js] Error fetching user details for contacts:", error);
          setContacts([]);
        }
      } else {
        console.log("[Contacts.js] contactsData is null or undefined, setting contacts to empty array.");
        setContacts([]);
      }
    });

    return () => {
      console.log(`[Contacts.js] useEffect cleanup: Detaching listener from Contacts/${currentUserId}`);
      contactsRef.off('value', listener);
    };
  }, [currentUserId]);

  // Filtered contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    contact.pseudo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    console.log("[Contacts.js] Contacts state updated:", contacts);
  }, [contacts]);

  const removeContact = (contactId) => {
    if (!currentUserId || !contactId) {
      console.error("[Contacts.js] removeContact: Missing currentUserId or contactId");
      return;
    }
    console.log(`[Contacts.js] Attempting to remove contact: ${contactId} for user: ${currentUserId}`);
    database.ref(`Contacts/${currentUserId}/${contactId}`).remove()
      .then(() => {
        console.log(`[Contacts.js] Contact removed successfully from Firebase: ${contactId}`);
        // The listener on contactsRef should automatically update the list
      })
      .catch(error => {
        console.error(`[Contacts.js] Error removing contact ${contactId} from Firebase:`, error);
      });
  };

  const renderContact = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardClickableArea}
        onPress={() => navigation.navigate('Chat', { currentUserId, secondUserId: item.id })}
      >
        <Image source={require("../../assets/profile.jpg")} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.pseudo}>{item.pseudo || 'N/A'}</Text>
          <Text style={styles.details}>{item.numero || 'No phone number'}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => removeContact(item.id)}
        >
          <Ionicons
            name={"person-remove-outline"}
            size={24}
            color={"#e74c3c"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeAreaFull}> 
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#7f8c8d"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {filteredContacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name={searchQuery ? "search-off" : "person-search"} size={60} color="#7f8c8d" />
            <Text style={styles.emptyText}>{searchQuery ? 'No contacts match your search' : 'No contacts yet.'}</Text>
            {!searchQuery && <Text style={styles.emptySubText}>Go to Chats to add contacts.</Text>}
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            contentContainerStyle={styles.listContentContainer}
          />
        )}
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
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  searchInput: {
    height: 50,
    backgroundColor: '#34495e',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#ecf0f1',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4a6572'
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    alignItems: 'center',
  },
  cardClickableArea: { // Added to make most of the card clickable for chat
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pseudo: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ecf0f1',
    marginBottom: 3,
  },
  details: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  actionsContainer: { // Added from ListUsers
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: { // Added from ListUsers
    padding: 10,
    marginLeft: 10, // Space between chat icon (implicitly) and remove icon
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
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
});
