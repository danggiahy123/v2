import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface DeepLinkErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface DeepLinkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class DeepLinkErrorBoundary extends Component<
  DeepLinkErrorBoundaryProps,
  DeepLinkErrorBoundaryState
> {
  constructor(props: DeepLinkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DeepLinkErrorBoundaryState {
    console.error('🚨 [DeepLinkErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 [DeepLinkErrorBoundary] Error details:', {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle-outline" size={64} color="#D32F2F" />
            <Text style={styles.title}>Không thể tải nội dung</Text>
            <Text style={styles.message}>
              Đã xảy ra lỗi khi tải nội dung từ liên kết. Vui lòng thử lại sau.
            </Text>
            <Text style={styles.errorDetail}>
              {this.state.error?.message}
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => {
                this.setState({ hasError: false });
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.buttonText}>Về trang chủ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.retryButton]}
              onPress={() => {
                this.setState({ hasError: false });
              }}
            >
              <Text style={styles.buttonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  errorDetail: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 150,
  },
  retryButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
