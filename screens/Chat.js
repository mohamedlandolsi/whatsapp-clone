import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import React, { useState, useEffect } from "react";
import firebase from "../Config";
import { MaterialIcons } from "@expo/vector-icons";
import { EmojiKeyboard } from "rn-emoji-keyboard"; // Import EmojiKeyboard

const database = firebase.database();
const ref_database = database.ref();
const ref_lesdiscussions = ref_database.child("LesDiscussions");
const ref_listcomptes = ref_database.child("ListComptes");

export default function Chat({ route, navigation }) {
  // Get user IDs from route params
  const currentUserId = route.params?.currentUserId;
  const secondUserId = route.params?.secondUserId;

  // State for messages and user data
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [secondUserName, setSecondUserName] = useState("");
  const [secondUserPhoto, setSecondUserPhoto] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [isEmojiKeyboardVisible, setIsEmojiKeyboardVisible] = useState(false); // State for emoji keyboard visibility

  const handleEmojiToggle = () => {
    if (!isEmojiKeyboardVisible) {
      Keyboard.dismiss(); // Dismiss system keyboard first
    }
    setIsEmojiKeyboardVisible(!isEmojiKeyboardVisible);
  };

  const handleInputFocus = () => {
    if (isEmojiKeyboardVisible) {
      setIsEmojiKeyboardVisible(false); // Hide emoji keyboard when text input is focused
    }
  };

  // Create a unique discussion ID
  const idDesc =
    currentUserId > secondUserId
      ? currentUserId + secondUserId
      : secondUserId + currentUserId;

  const ref_undiscussion = ref_lesdiscussions.child(idDesc);

  // Fetch user names from database
  useEffect(() => {
    // Fetch current user info
    if (currentUserId) {
      ref_listcomptes
        .child(currentUserId)
        .once("value")
        .then((snapshot) => {
          if (snapshot.exists()) {
            setCurrentUserName(snapshot.val().pseudo || "You");
          }
        });
    }

    // Fetch second user info
    if (secondUserId) {
      ref_listcomptes
        .child(secondUserId)
        .once("value")
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setSecondUserName(userData.pseudo || "Other User");
            setSecondUserPhoto(userData.photoURL || null);
            navigation.setOptions({
              title: userData.pseudo || "Chat",
              headerShown: true,
              headerStyle: {
                backgroundColor: "#34495e",
              },
              headerTintColor: "#ffffff",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            });
          }
          setLoadingUserInfo(false);
        })
        .catch(() => setLoadingUserInfo(false));
    } else {
      setLoadingUserInfo(false);
    }

    // Define the listener callback
    const messageListenerCallback = (snapshot) => {
      const messageList = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          messageList.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });
        // Sort messages by timestamp
        messageList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messageList);
      } else {
        // If the discussion node doesn't exist or is empty, clear local messages.
        setMessages([]);
      }
    };

    // Attach the listener
    ref_undiscussion.on("value", messageListenerCallback);

    // Clean up listeners
    return () => {
      // Detach the specific listener
      ref_undiscussion.off("value", messageListenerCallback);
    };
  }, [currentUserId, secondUserId, navigation, ref_undiscussion]);

  // Send message function
  const handleSend = () => {
    if (msg.trim() === "") return;

    const messageData = {
      sender: currentUserId,
      text: msg,
      timestamp: Date.now(),
    };

    ref_undiscussion
      .push(messageData)
      .then(() => {
        console.log("Message sent successfully");
        setMsg(""); // Clear input after sending
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
      });
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMsg((prevMsg) => prevMsg + emoji.emoji);
  };

  // Delete message function
  const handleDelete = (messageId) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            ref_undiscussion
              .child(messageId)
              .remove()
              .then(() => {
                console.log("Message deleted successfully");
              })
              .catch((error) => {
                console.error("Error deleting message:", error);
                alert("Failed to delete message: " + error.message);
              });
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  // Render individual message item
  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender === currentUserId;

    if (isCurrentUser) {
      return (
        <TouchableOpacity onLongPress={() => handleDelete(item.id)}>
          <View style={[styles.messageRow, styles.currentUserRow]}>
            <View style={[styles.messageBubble, styles.currentUserMessage]}>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.timestampText}>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={[styles.messageRow, styles.otherUserRow]}>
          {secondUserPhoto ? (
            <Image source={{ uri: secondUserPhoto }} style={styles.messageAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {secondUserName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.messageBubble, styles.otherUserMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestampText}>
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      );
    }
  };

  if (loadingUserInfo) {
    return (
      <SafeAreaView style={styles.loadingScreenContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
        contentContainerStyle={styles.messageListContentContainer}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity 
            style={styles.emojiButton} 
            onPress={handleEmojiToggle}
          >
            <MaterialIcons name={isEmojiKeyboardVisible ? "keyboard" : "emoji-emotions"} size={24} color="#bdc3c7" />
          </TouchableOpacity>
          <TextInput
            placeholder="Type your message..."
            value={msg}
            onChangeText={setMsg}
            style={styles.input}
            placeholderTextColor="#95a5a6"
            onFocus={handleInputFocus}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={msg.trim() === ""}
          >
            <MaterialIcons name="send" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {isEmojiKeyboardVisible && (
        <EmojiKeyboard
          onEmojiSelected={handleEmojiSelect}
          onRequestClose={() => setIsEmojiKeyboardVisible(false)}
          theme={{ dark: true }}
          styles={{
            container: {
              backgroundColor: '#2c3e50',
              borderTopColor: '#34495e',
              borderTopWidth: 1,
            },
          }}
          categoryPosition="top"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c3e50",
  },
  flatList: {
    flex: 1,
  },
  loadingScreenContainer: {
    flex: 1,
    backgroundColor: "#2c3e50",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ecf0f1",
  },
  messageListContentContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 8,
    alignItems: "flex-end",
  },
  currentUserRow: {
    justifyContent: "flex-end",
  },
  otherUserRow: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: "#4a6572",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: "#4a6572",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 1,
  },
  currentUserMessage: {
    backgroundColor: "#005d4b",
    borderBottomRightRadius: 4,
    marginLeft: "auto",
  },
  otherUserMessage: {
    backgroundColor: "#37474f",
    borderBottomLeftRadius: 4,
    marginRight: "auto",
  },
  messageText: {
    fontSize: 16,
    color: "#ffffff",
  },
  timestampText: {
    fontSize: 11,
    color: "#bdc3c7",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#34495e",
    alignItems: "center",
  },
  emojiButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    backgroundColor: "#4a6572",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: "#ffffff",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#2980b9",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
});
