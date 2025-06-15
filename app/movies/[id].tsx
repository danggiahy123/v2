import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams();

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: 'Chi tiết phim',
                    headerStyle: { backgroundColor: '#000' },
                    headerTintColor: '#fff',
                    headerTransparent: true,
                    headerBlurEffect: 'dark',
                    headerBackground: () => (
                        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    ),
                }}
            />
            <Text style={styles.text}>Movie ID: {id}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 16,
    },
}); 