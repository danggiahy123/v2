import axios from 'axios';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

async function testGenreAPI() {
  try {
    console.log('🧪 Testing Genre API...\n');

    // Test 1: Get all parent genres
    console.log('1. Testing GET /api/genres?type=parent');
    const genresResponse = await axios.get(`${API_BASE_URL}/api/genres?type=parent`);
    console.log('✅ Success:', genresResponse.data.status);
    console.log('📊 Total genres:', genresResponse.data.data.total);
    console.log('🎭 Genres found:');
    genresResponse.data.data.genres.forEach((genre, index) => {
      console.log(`   ${index + 1}. ${genre.genre_name} (ID: ${genre._id})`);
    });
    console.log('');

    // Test 2: Find action genre
    const actionGenre = genresResponse.data.data.genres.find(
      genre => genre.genre_name.toLowerCase().includes('hành động')
    );

    if (actionGenre) {
      console.log('2. Testing GET /api/genres/{id}/movies for Action genre');
      console.log(`🎯 Found Action genre: ${actionGenre.genre_name} (ID: ${actionGenre._id})`);
      
      const moviesResponse = await axios.get(`${API_BASE_URL}/api/genres/${actionGenre._id}/movies`);
      console.log('✅ Success:', moviesResponse.data.status);
      console.log('📽️ Movies found:', moviesResponse.data.data.movies.length);
      console.log('🎬 Sample movies:');
      moviesResponse.data.data.movies.slice(0, 3).forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title} (${movie.movieType || 'Unknown type'})`);
      });
    } else {
      console.log('❌ No Action genre found');
    }

    console.log('\n🎉 Genre API test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Genre API:', error.response?.data || error.message);
  }
}

testGenreAPI(); 