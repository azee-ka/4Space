import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import API_BASE_URL from '../../utils/apiUrl'; // Use your API base url

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async () => {
  setLoading(true);
  setLoginError('');
  try {
    const response = await axios.post(
      `${API_BASE_URL}api/login/`,
      { username, password }, // JS object -> JSON body
      { headers: { 'Content-Type': 'application/json' } }
    );
    await login(response.data);
    router.replace('/(tabs)/');
  } catch (error) {
    setLoginError(
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      'Login failed'
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <View style={styles.inputGroup}>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor="#bbb"
            style={styles.input}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputGroup}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#bbb"
            style={styles.input}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={22} color="#bbb" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.link}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleLoginSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Login</Text>}
        </TouchableOpacity>
        {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 8 },
  card: { width: 360, maxWidth: '95%', backgroundColor: '#19191d', borderRadius: 12, padding: 24, alignItems: 'stretch', shadowColor: '#222', shadowOpacity: 0.2, shadowRadius: 10 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 24, alignSelf: 'flex-start' },
  inputGroup: { position: 'relative', marginBottom: 18 },
  input: { backgroundColor: '#222', color: 'white', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, width: '100%' },
  eyeBtn: { position: 'absolute', right: 10, top: 4, padding: 6 },
  link: { color: '#1de0fc', marginTop: 6, fontSize: 14, textAlign: 'left' },
  submitBtn: { marginTop: 18, backgroundColor: '#19dee8', borderRadius: 8, padding: 13, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
  error: { marginTop: 16, color: 'red', textAlign: 'center' },
});
