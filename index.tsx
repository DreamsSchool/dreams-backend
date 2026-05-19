import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ⚠️ IMPORTANT: Replace this with your actual Render URL later
  const PRODUCTION_URL = "https://YOUR-APP-NAME.onrender.com";

  useEffect(() => {
    // Auto-login if session exists
    const checkSession = async () => {
      const role = await AsyncStorage.getItem('role');
      if (role) {
        router.replace(role === 'admin' ? '/admin' : '/inbox');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      return Alert.alert("Error", "Please enter both User ID and Password.");
    }

    setLoading(true);
    // Remove all spaces and convert to lowercase instantly
    const cleanedUsername = username.replace(/\s+/g, '').toLowerCase();

    try {
      const res = await fetch(`${PRODUCTION_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanedUsername, password: password })
      });
      
      if (!res.ok) {
        Alert.alert("Login Failed", "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      // Save session securely
      await AsyncStorage.setItem('role', data.role);
      await AsyncStorage.setItem('class_name', data.class_name);
      await AsyncStorage.setItem('username', cleanedUsername);
      
      // Route based on role
      router.replace(data.role === 'admin' ? '/admin' : '/inbox');
    } catch (e) {
      Alert.alert("Connection Error", "Unable to connect to Dream's server.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Dream's</Text>
        <Text style={styles.subtitle}>School Communicator</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="User ID (Teacher or Child's Name)" 
          value={username} 
          onChangeText={setUsername} 
          autoCapitalize="none" 
          autoCorrect={false}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Password (Mobile Number)" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#1f2937" />
          ) : (
            <Text style={styles.buttonText}>Secure Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f4f4f5', padding: 20 },
  card: { backgroundColor: 'white', padding: 30, borderRadius: 15, elevation: 5, borderTopWidth: 8, borderTopColor: '#eab308' },
  brand: { fontSize: 36, fontWeight: '900', color: '#1f2937', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 15, borderRadius: 8, marginBottom: 15, color: '#1f2937' },
  button: { backgroundColor: '#eab308', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#1f2937', fontWeight: 'bold', fontSize: 16 }
});