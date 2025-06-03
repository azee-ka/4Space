import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import API_BASE_URL from '../../utils/apiUrl';

export default function RegisterScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [isOrgRegister, setIsOrgRegister] = useState(false);

  // Shared
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [loading, setLoading] = useState(false);

  // Individual
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Organization
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');

  const handleRegisterSubmit = async () => {
    setLoading(true);
    setRegisterError('');
    try {
      let data;
      if (!isOrgRegister) {
        data = {
          type: 'individual',
          username,
          password,
          email,
          first_name: capitalize(firstName),
          last_name: capitalize(lastName),
        };
      } else {
        data = {
          type: 'organization',
          username,
          password,
          email,
          org_name: orgName,
          org_type: orgType,
        };
      }
      const response = await axios.post(`${API_BASE_URL}api/register/`, data);
      await login(response.data);
      router.replace('/(tabs)/timeline');
    } catch (error) {
      setRegisterError(
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.switchRow}>
          <TouchableOpacity onPress={() => setIsOrgRegister(false)} style={[styles.switchBtn, !isOrgRegister && styles.activeSwitchBtn]}>
            <Text style={styles.switchText}>Individual</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsOrgRegister(true)} style={[styles.switchBtn, isOrgRegister && styles.activeSwitchBtn]}>
            <Text style={styles.switchText}>Organization</Text>
          </TouchableOpacity>
        </View>
        {!isOrgRegister ? (
          <>
            {/* Name Row */}
            <View style={styles.inputRow}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="#bbb"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor="#bbb"
                style={[styles.input, { flex: 1 }]}
              />
            </View>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#bbb"
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#bbb"
              style={styles.input}
              autoCapitalize="none"
            />
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
          </>
        ) : (
          <>
            <TextInput
              value={orgName}
              onChangeText={setOrgName}
              placeholder="Organization Name"
              placeholderTextColor="#bbb"
              style={styles.input}
            />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#bbb"
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#bbb"
              style={styles.input}
              autoCapitalize="none"
            />
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
            <TextInput
              value={orgType}
              onChangeText={setOrgType}
              placeholder="Organization Type (School, Company, etc)"
              placeholderTextColor="#bbb"
              style={styles.input}
            />
          </>
        )}
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Account</Text>}
        </TouchableOpacity>
        {registerError ? <Text style={styles.error}>{registerError}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8
  },
  card: {
    width: 360,
    maxWidth: '95%',
    backgroundColor: '#19191d',
    borderRadius: 12,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#222',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start'
  },
  switchRow: {
    flexDirection: 'row',
    marginBottom: 18
  },
  switchBtn: {
    flex: 1,
    backgroundColor: '#19191d',
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: 'center',
    marginHorizontal: 2
  },
  activeSwitchBtn: {
    backgroundColor: '#19dee8'
  },
  switchText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0
  },
  input: {
    backgroundColor: '#222',
    color: 'white',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 0,      // No vertical padding
    fontSize: 16,
    marginBottom: 10,
    height: 48               // Control vertical sizing consistently
    // No width/flex by default!
  },
  inputGroup: {
    position: 'relative',
    marginBottom: 10
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 6,
    padding: 6
  },
  link: {
    color: '#1de0fc',
    marginTop: 4,
    fontSize: 14,
    textAlign: 'left'
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: '#19dee8',
    borderRadius: 8,
    padding: 13,
    alignItems: 'center'
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17
  },
  error: {
    marginTop: 16,
    color: 'red',
    textAlign: 'center'
  }
});
