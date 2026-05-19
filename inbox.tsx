import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function InboxScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState({ role: '', className: '' });

  // ⚠️ IMPORTANT: Replace this with your actual Render URL later
  const PRODUCTION_URL = "https://YOUR-APP-NAME.onrender.com";

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const role = await AsyncStorage.getItem('role') || '';
        const className = await AsyncStorage.getItem('class_name') || '';
        setUserContext({ role, className });

        const res = await fetch(`${PRODUCTION_URL}/messages/${role}/${className}`);
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const getHeaderText = () => {
    if (userContext.role === 'teacher') return "Staff Notices";
    if (userContext.role === 'parent') return `Class ${userContext.className} Notices`;
    return "Notices";
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Dream's</Text>
          <Text style={styles.subTitle}>{getHeaderText()}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#eab308" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.msgTitle}>{item.title}</Text>
              </View>
              <Text style={styles.msgBody}>{item.body}</Text>
              <Text style={styles.msgTime}>{item.timestamp}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>You're all caught up!</Text>
              <Text style={styles.emptySub}>No new notices from the school.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 25 },
  brandTitle: { fontSize: 26, fontWeight: '900', color: '#1f2937' },
  subTitle: { fontSize: 14, color: '#eab308', fontWeight: 'bold', marginTop: -2 },
  logout: { color: '#ef4444', fontWeight: 'bold', padding: 10, backgroundColor: '#fee2e2', borderRadius: 8, overflow: 'hidden' },
  
  card: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 15, 
    borderLeftWidth: 6, 
    borderLeftColor: '#eab308', 
    elevation: 2 
  },
  cardHeader: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10, marginBottom: 10 },
  msgTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  msgBody: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 15 },
  msgTime: { fontSize: 12, color: '#9ca3af', textAlign: 'right', fontWeight: '500' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  emptySub: { color: '#6b7280', marginTop: 5 }
});