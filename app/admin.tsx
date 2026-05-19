import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' or 'users'
  const [loading, setLoading] = useState(false);

  // TARGET BACKEND: Swap this with your Render URL
  const PRODUCTION_URL = "https://dreams-api-jgmt.onrender.com";

  // --- BROADCAST STATE ---
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [targetClass, setTargetClass] = useState('ALL');

  // --- ADD USER STATE ---
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState('parent'); // 'parent' or 'teacher'
  const [userClass, setUserClass] = useState('');

  const handleSendNotice = async () => {
    if (!title || !body) return Alert.alert("Error", "Please fill out the title and body.");
    setLoading(true);
    try {
      await fetch(`${PRODUCTION_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, target_role: targetRole, target_class: targetClass })
      });
      Alert.alert("Sent", "Message broadcasted successfully!");
      setTitle(''); setBody('');
    } catch (e) {
      Alert.alert("Error", "Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!fullName || !phone) return Alert.alert("Error", "Name and Phone are required.");
    setLoading(true);
    try {
      const res = await fetch(`${PRODUCTION_URL}/manage-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone,
          role: userRole,
          class_name: userRole === 'teacher' ? 'ALL' : userClass || 'ALL'
        })
      });
      
      if (!res.ok) throw new Error("Conflict");
      
      const data = await res.json();
      Alert.alert(
        "User Created!", 
        `Username: ${data.username}\nPassword: ${data.password}\n\nThey can now log in!`
      );
      setFullName(''); setPhone(''); setUserClass('');
    } catch (e) {
      Alert.alert("Error", "Could not create user. They might already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={async () => { await AsyncStorage.clear(); router.replace('/'); }}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* --- TAB NAVIGATION --- */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'broadcast' && styles.activeTab]} 
          onPress={() => setActiveTab('broadcast')}
        >
          <Text style={[styles.tabText, activeTab === 'broadcast' && styles.activeTabText]}>Send Notice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Add Users</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* --- TAB 1: SEND NOTICE --- */}
        {activeTab === 'broadcast' && (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Draft Announcement</Text>
            
            <Text style={styles.label}>Message Title</Text>
            <TextInput style={styles.input} placeholder="e.g., Tomorrow is a Holiday" value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Message Body</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline placeholder="Type your message here..." value={body} onChangeText={setBody} />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>To Role (ALL/parent/teacher)</Text>
                <TextInput style={styles.input} value={targetRole} onChangeText={setTargetRole} autoCapitalize="none" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>To Class (ALL/10A)</Text>
                <TextInput style={styles.input} value={targetClass} onChangeText={setTargetClass} autoCapitalize="characters" />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSendNotice} disabled={loading}>
              {loading ? <ActivityIndicator color="#eab308" /> : <Text style={styles.buttonText}>🚀 Broadcast Notice</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* --- TAB 2: ADD USERS --- */}
        {activeTab === 'users' && (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Register New User</Text>
            
            <Text style={styles.label}>Full Name (Teacher or Child's Name)</Text>
            <TextInput style={styles.input} placeholder="e.g., Aarav Sharma" value={fullName} onChangeText={setFullName} />

            <Text style={styles.label}>Mobile Number (Will be their password)</Text>
            <TextInput style={styles.input} placeholder="e.g., 9876543210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

            <Text style={styles.label}>User Role (parent or teacher)</Text>
            <TextInput style={styles.input} value={userRole} onChangeText={setUserRole} autoCapitalize="none" />

            {userRole.toLowerCase() === 'parent' && (
              <>
                <Text style={styles.label}>Class Name (e.g., 10A)</Text>
                <TextInput style={styles.input} placeholder="10A" value={userClass} onChangeText={setUserClass} autoCapitalize="characters" />
              </>
            )}

            <TouchableOpacity style={styles.buttonSecondary} onPress={handleAddUser} disabled={loading}>
               {loading ? <ActivityIndicator color="#1f2937" /> : <Text style={styles.buttonTextSecondary}>+ Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 <Text style={{fontWeight: 'bold'}}>How it works:</Text> The system will automatically remove spaces from the Full Name to create their Username.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  logout: { color: '#ef4444', fontWeight: 'bold', padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 10, pading: 5, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#1f2937', elevation: 2 },
  tabText: { fontWeight: 'bold', color: '#6b7280' },
  activeTabText: { color: '#eab308' },
  
  formContainer: { backgroundColor: 'white', padding: 20, borderRadius: 12, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  label: { fontSize: 13, fontWeight: '700', color: '#4b5563', marginBottom: 5 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 15, borderRadius: 8, marginBottom: 15, color: '#1f2937' },
  
  button: { backgroundColor: '#1f2937', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#eab308', fontWeight: 'bold', fontSize: 16 },
  
  buttonSecondary: { backgroundColor: '#eab308', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonTextSecondary: { color: '#1f2937', fontWeight: 'bold', fontSize: 16 },

  infoBox: { marginTop: 20, padding: 15, backgroundColor: '#fef3c7', borderRadius: 8, borderWidth: 1, borderColor: '#fde68a' },
  infoText: { color: '#92400e', fontSize: 13, lineHeight: 20 }
});