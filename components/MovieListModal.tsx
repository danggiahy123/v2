import React from 'react';
import { Modal } from 'react-native';
import MovieList from './MovieList';

interface MovieListModalProps {
  visible: boolean;
  category: string;
  title: string;
  onClose: () => void;
}

export default function MovieListModal({ visible, category, title, onClose }: MovieListModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <MovieList category={category} title={title} onClose={onClose} />
    </Modal>
  );
} 