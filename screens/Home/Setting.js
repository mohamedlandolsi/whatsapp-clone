import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Platform, 
  SafeAreaView 
} from "react-native";
import firebase from "../../Config/index";
import { MaterialIcons } from '@expo/vector-icons';

const auth = firebase.auth();
const database = firebase.database();
const ref_database = database.ref();
const ref_listcomptes = ref_database.child("ListComptes");

export default function Setting({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;

  const [pseudo, setPseudo] = useState("");
  const [numero, setNumero] = useState("");

  useEffect(() => {
    if (currentUserId) {
      const ref_uncompte = ref_listcomptes.child(currentUserId);
      ref_uncompte.once('value', (snapshot) => {
        if (snapshot.exists()) {
          setPseudo(snapshot.val().pseudo || '');
          setNumero(snapshot.val().numero || '');
        }
      });
    }
  }, [currentUserId]);

  const handleSave = () => {
    if (!currentUserId) {
      console.error("User ID is undefined");
      Alert.alert("Error", "User ID is missing. Cannot save settings.");
      return;
    }

    const ref_uncompte = ref_listcomptes.child(currentUserId);
    ref_uncompte.update({
      id: currentUserId,
      pseudo,
      numero
    })
    .then(() => {
      Alert.alert("Success", "Profile updated successfully");
    })
    .catch((error) => {
      Alert.alert("Error", "Failed to update profile: " + error.message);
    });
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigation.replace("Auth");
    }).catch(error => {
      Alert.alert("Logout Error", error.message);
    });
  };

  return (
    <SafeAreaView style={styles.safeAreaFull}> 
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        <Text style={styles.title}>
          Settings
        </Text>
        <View style={styles.profileImageContainer}>
          <Image
            source={require("../../assets/profile.jpg")}
            style={styles.profileImage}
          />
        </View>
        <TextInput
          placeholder="Pseudo (Username)"
          value={pseudo}
          onChangeText={setPseudo}
          style={styles.input}
          placeholderTextColor="#bdc3c7"
        />
        <TextInput
          placeholder="Numéro (Phone Number)"
          keyboardType="phone-pad"
          value={numero}
          onChangeText={setNumero}
          style={styles.input}
          placeholderTextColor="#bdc3c7"
        />
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaFull: { // Added SafeAreaView style
    flex: 1,
    backgroundColor: '#2c3e50', // Match screen background
  },
  container: {
    flex: 1,
    backgroundColor: "#2c3e50",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ecf0f1",
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Light' : 'sans-serif-light',
  },
  profileImageContainer: {
    marginBottom: 30,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#3498db',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderColor: "#7f8c8d",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    color: '#ecf0f1',
    fontSize: 16,
  },
  button: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: "#27ae60",
  },
  logoutButton: {
    backgroundColor: "#c0392b",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: 'center',
  },
});