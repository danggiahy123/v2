import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import GenreGrid from '../components/genre/GenreGrid';
import { useRouter } from 'expo-router';
import ViewAllModal from '../components/ui/ViewAllModal';

const GenresScreen = () => {
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('https://backend-app-lou3.onrender.com/api/genres?type=parent')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setGenres(data.data.genres);
      })
      .catch(err => console.error('Error fetching genres:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleGenrePress = (item: any) => {
    setSelectedCategory(item._id);
    setSelectedTitle(item.genre_name);
    setViewAllModalVisible(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Đang tải danh mục...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 40, paddingHorizontal: 10 }}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>Tất cả danh mục</Text>
      <GenreGrid genres={genres} onGenrePress={handleGenrePress} />
      <ViewAllModal
        visible={viewAllModalVisible}
        onClose={() => setViewAllModalVisible(false)}
        category={selectedCategory}
        title={selectedTitle}
      />
    </View>
  );
};

export default GenresScreen; 