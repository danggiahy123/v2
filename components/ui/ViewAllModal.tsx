import React from 'react';
import { Modal, View, StyleSheet, StatusBar } from 'react-native';
import { MovieList } from '../movie';

interface ViewAllModalProps {
  visible: boolean;
  onClose: () => void;
  category: string;
  title: string;
  customMovies?: any[];
}

export default function ViewAllModal({ visible, onClose, category, title, customMovies }: ViewAllModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <MovieList
          category={category}
          title={title}
          onClose={onClose}
          showAll={true}
          customMovies={customMovies}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
}); 