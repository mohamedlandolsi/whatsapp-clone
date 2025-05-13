import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView, // Added SafeAreaView
} from "react-native";
import firebase from "../Config";
import { LinearGradient } from 'expo-linear-gradient';

const auth = firebase.auth();
const database = firebase.database();

export default function NewAccount({ navigation }) {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [confirmpassword, setconfirmpassword] = useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer} // Changed from styles.container
      >
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.background}
        >
          <View style={styles.authBox}>
            <Text style={styles.title}>Create New Account</Text>
            <TextInput
              onChangeText={(ch) => {
                setemail(ch);
              }}
              style={styles.input}
              placeholder="Enter your Email"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              onChangeText={(ch) => {
                setpassword(ch);
              }}
              style={styles.input}
              placeholder="Enter your Password"
              placeholderTextColor="#ccc"
              secureTextEntry={true}
            />
            <TextInput
              onChangeText={(ch) => {
                setconfirmpassword(ch);
              }}
              style={styles.input}
              placeholder="Confirm your Password"
              placeholderTextColor="#ccc"
              secureTextEntry={true}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={() => {
                  if (password === confirmpassword) {
                    auth
                      .createUserWithEmailAndPassword(email, password)
                      .then((userCredential) => {
                        const currentUserId = userCredential.user.uid;
                        const userEmail = userCredential.user.email;

                        const ref_listcomptes = database.ref("ListComptes");

                        ref_listcomptes.child(currentUserId).set({
                          id: currentUserId,
                          email: userEmail,
                          pseudo: userEmail ? userEmail.split('@')[0] : 'New User',
                          numero: ''
                        })
                        .then(() => {
                          console.log("User profile created in ListComptes");
                          navigation.replace("Home", {currentUserId});
                        })
                        .catch((dbError) => {
                          console.error("Error creating user profile:", dbError);
                          Alert.alert("Error", "Account created but profile setup failed: " + dbError.message);
                          navigation.replace("Home", {currentUserId});
                        });
                      })
                      .catch((err) => {
                        Alert.alert("Error", err.message);
                      });
                  } else {
                    Alert.alert("Error", "Passwords do not match");
                  }
                }}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
          <StatusBar style="light" />
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { // Added for SafeAreaView
    flex: 1,
    backgroundColor: '#192f6a', // Darkest color of the gradient
  },
  keyboardAvoidingContainer: { // Added for KeyboardAvoidingView
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authBox: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 25,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Light' : 'sans-serif-light',
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  backButton: {
    backgroundColor: "#6c757d",
  },
  createButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});