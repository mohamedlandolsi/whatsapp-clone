import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  BackHandler,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView, // Added SafeAreaView
} from "react-native";
import { useState } from "react";
import firebase from "../Config";
import { LinearGradient } from 'expo-linear-gradient';

const auth = firebase.auth();
const database = firebase.database();

export default function Auth({ navigation }) {
  const [email, setemail] = useState("mohamedlandolsi30@gmail.com");
  const [password, setpassword] = useState("123456");
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.background}
        >
          <View style={styles.authBox}>
            <Text style={styles.title}>Welcome Back</Text>
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
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.exitButton]}
                onPress={() => {
                  BackHandler.exitApp();
                }}
              >
                <Text style={styles.buttonText}>Exit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.connectButton]}
                onPress={() => {
                  auth
                    .signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                      const currentUserId = userCredential.user.uid;
                      const userEmail = userCredential.user.email;
                      const ref_listcomptes = database.ref("ListComptes");

                      ref_listcomptes.child(currentUserId).once("value")
                        .then(snapshot => {
                          if (!snapshot.exists()) {
                            console.log("Creating new ListComptes entry for user:", currentUserId);
                            return ref_listcomptes.child(currentUserId).set({
                              id: currentUserId,
                              email: userEmail,
                              pseudo: userEmail ? userEmail.split('@')[0] : 'New User',
                              numero: ''
                            });
                          }
                          return Promise.resolve();
                        })
                        .then(() => {
                          navigation.replace("Home", {currentUserId});
                        })
                        .catch(error => {
                          console.error("Database error:", error);
                          Alert.alert("Warning", "Signed in successfully, but couldn't update profile.");
                          navigation.replace("Home", {currentUserId});
                        });
                    })
                    .catch((error) => {
                      console.log(error);
                      Alert.alert("Login Failed", error.message);
                    });
                }}
              >
                <Text style={styles.buttonText}>Connect</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => {
              navigation.navigate("NewAccount");
            }}>
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
          <StatusBar style="light" />
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { // Renamed from container and added backgroundColor
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
  exitButton: {
    backgroundColor: "#FF6347",
  },
  connectButton: {
    backgroundColor: "#4A90E2",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signupText: {
    color: "#eee",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
  signupLink: {
    fontWeight: "bold",
    color: "#4A90E2",
  },
});