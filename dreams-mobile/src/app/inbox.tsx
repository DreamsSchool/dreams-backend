import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCTION_URL = "https://your-new-koyeb-link.koyeb.app"; // <-- PUT YOUR KOYEB URL HERE!

export default function InboxScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parentClass, setParentClass] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      // 1. Find out which class this parent belongs to
      const userClass = await AsyncStorage.getItem('user_class');
      setParentClass(userClass || "Unknown");

      // 2. Ask the Koyeb backend for notices specifically for this class
      const response = await fetch(`${PRODUCTION_URL}/messages?class_name=${userClass}`);
      const data = await response.json();
      
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Class {parentClass} Notices</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Message List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />
      ) : messages.length === 0 ? (
        <Text style={styles.emptyText}>No new notices for Class {parentClass} right now. 🎉</Text>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{item.message}</Text>
              <Text style={styles.dateText}>Sent: {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20, 
    paddingTop: 50, // pushes header below phone notch
    borderBottomWidth: 1, 
    borderColor: '#ddd' 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#FF4C4C', padding: 8, borderRadius: 5 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  messageCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    elevation: 3 
  },
  messageText: { fontSize: 16, color: '#333' },
  dateText: { fontSize: 12, color: '#888', marginTop: 10, textAlign: 'right' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' }
});