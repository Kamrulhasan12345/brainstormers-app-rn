import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { pushTokenService } from '@/services/push-token-management';

export function PushTokenDebug() {
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<string>('No token info');
  const [userTokens, setUserTokens] = useState<any[]>([]);

  const handleGetTokenInfo = async () => {
    try {
      const currentToken = pushTokenService.getCurrentToken();
      if (currentToken) {
        setTokenInfo(`Current token: ${currentToken.substring(0, 50)}...`);
      } else {
        setTokenInfo('No current token available');
      }

      // Also fetch all user tokens
      if (user) {
        const tokens = await pushTokenService.getUserTokens(user.id);
        setUserTokens(tokens);
      }
    } catch (error) {
      setTokenInfo(`Error: ${error}`);
    }
  };

  const handleTestRegistration = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      await pushTokenService.registerPushToken(user.id);
      Alert.alert('Success', 'Push token registered successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to register token: ${error}`);
    }
  };

  const handleTestCurrentDeviceCleanup = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      await pushTokenService.deactivateCurrentDeviceToken(user.id);
      Alert.alert('Success', 'Current device token deactivated successfully');
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to deactivate current device token: ${error}`
      );
    }
  };

  const handleTestAllTokensCleanup = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      await pushTokenService.deactivateAllUserTokens(user.id);
      Alert.alert('Success', 'All user tokens deactivated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to deactivate all tokens: ${error}`);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Token Debug</Text>
      <Text style={styles.user}>
        User: {user.full_name} ({user.role})
      </Text>
      <Text style={styles.tokenInfo}>{tokenInfo}</Text>

      {userTokens.length > 0 && (
        <View style={styles.tokensContainer}>
          <Text style={styles.tokensTitle}>
            All User Tokens ({userTokens.length}):
          </Text>
          {userTokens.map((token, index) => (
            <View key={token.id} style={styles.tokenItem}>
              <Text style={styles.tokenText}>
                {index + 1}. {token.platform} - {token.token.substring(0, 20)}
                ...
              </Text>
              <Text style={styles.tokenDate}>
                Last active: {new Date(token.last_active).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleGetTokenInfo}>
        <Text style={styles.buttonText}>Get Token Info</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleTestRegistration}>
        <Text style={styles.buttonText}>Test Registration</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleTestCurrentDeviceCleanup}
      >
        <Text style={styles.buttonText}>Test Current Device Cleanup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleTestAllTokensCleanup}
      >
        <Text style={styles.buttonText}>Test All Tokens Cleanup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  user: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tokenInfo: {
    fontSize: 12,
    color: '#333',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  tokensContainer: {
    backgroundColor: '#e8e8e8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  tokensTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  tokenItem: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  tokenText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  tokenDate: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
});
