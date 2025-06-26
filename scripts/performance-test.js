/**
 * 🚀 PERFORMANCE TEST SCRIPT
 * 
 * Script để test performance của video loading và tìm bottlenecks
 * Sử dụng để debug vấn đề video render chậm hơn 10s
 */

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

// Test movie IDs (thay bằng ID thực tế)
const TEST_MOVIE_IDS = [
  '675a1b70f5b9c2ad1b1f8e12', // Example movie ID
  '675a1b70f5b9c2ad1b1f8e13', // Example movie ID
  '675a1b70f5b9c2ad1b1f8e14'  // Example movie ID
];

/**
 * 🎬 Test Movie Detail API Performance
 */
async function testMovieDetailAPI(movieId) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🎬 Testing Movie Detail API for: ${movieId}`);
    console.log(`Start time: ${new Date(startTime).toISOString()}`);
    
    const response = await fetch(`${API_BASE_URL}/api/movies/${movieId}/detail-with-interactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`📊 API Response Time: ${responseTime}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const jsonStartTime = Date.now();
      const data = await response.json();
      const jsonEndTime = Date.now();
      
      console.log(`📋 JSON Parse Time: ${jsonEndTime - jsonStartTime}ms`);
      console.log(`📄 Response Size: ~${JSON.stringify(data).length} chars`);
      
      if (data.status === 'success' && data.data.movie) {
        const movie = data.data.movie;
        console.log(`✅ Movie: ${movie.movie_title}`);
        console.log(`🎭 Type: ${movie.movie_type}`);
        console.log(`🆓 Free: ${movie.is_free}`);
        console.log(`📹 Has Episodes: ${!!movie.episodes?.length} (${movie.episodes?.length || 0})`);
        console.log(`🎥 Has Video URL: ${!!(movie.uri || movie.video_url)}`);
        
        if (movie.episodes?.length > 0) {
          const firstEpisode = movie.episodes[0];
          console.log(`📺 First Episode URL: ${firstEpisode.uri || firstEpisode.video_url || 'N/A'}`);
        }
      }
    }
    
    return {
      movieId,
      responseTime,
      success: response.ok,
      status: response.status
    };
    
  } catch (error) {
    const errorTime = Date.now();
    console.error(`❌ Error testing ${movieId}:`, error.message);
    return {
      movieId,
      responseTime: errorTime - startTime,
      success: false,
      error: error.message
    };
  }
}

/**
 * 🎥 Test Video Stream API Performance
 */
async function testVideoStreamAPI(videoId) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🎥 Testing Video Stream API for: ${videoId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/video-url/${videoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`📊 Video API Response Time: ${responseTime}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'success' && data.data.video) {
        const video = data.data.video;
        console.log(`✅ Video Stream URL Available`);
        console.log(`🔗 HLS URI: ${video.uri ? 'Available' : 'N/A'}`);
        console.log(`🔗 Fallback URI: ${video.fallbackUri ? 'Available' : 'N/A'}`);
        console.log(`⏱️ Duration: ${video.duration || 'N/A'}s`);
        console.log(`📐 Size: ${video.size ? `${(video.size / 1024 / 1024).toFixed(2)}MB` : 'N/A'}`);
      }
    }
    
    return {
      videoId,
      responseTime,
      success: response.ok,
      status: response.status
    };
    
  } catch (error) {
    const errorTime = Date.now();
    console.error(`❌ Video Stream Error for ${videoId}:`, error.message);
    return {
      videoId,
      responseTime: errorTime - startTime,
      success: false,
      error: error.message
    };
  }
}

/**
 * 🌐 Test Network Latency
 */
async function testNetworkLatency() {
  console.log('\n🌐 Testing Network Latency...');
  
  const tests = [];
  
  for (let i = 0; i < 5; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      tests.push({
        test: i + 1,
        latency,
        success: response.ok
      });
      
      console.log(`Test ${i + 1}: ${latency}ms`);
      
    } catch (error) {
      tests.push({
        test: i + 1,
        latency: -1,
        success: false,
        error: error.message
      });
      console.log(`Test ${i + 1}: Error - ${error.message}`);
    }
    
    // Wait 500ms between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const successfulTests = tests.filter(t => t.success);
  if (successfulTests.length > 0) {
    const avgLatency = successfulTests.reduce((sum, t) => sum + t.latency, 0) / successfulTests.length;
    const minLatency = Math.min(...successfulTests.map(t => t.latency));
    const maxLatency = Math.max(...successfulTests.map(t => t.latency));
    
    console.log(`\n📊 Network Latency Summary:`);
    console.log(`Average: ${avgLatency.toFixed(2)}ms`);
    console.log(`Min: ${minLatency}ms`);
    console.log(`Max: ${maxLatency}ms`);
    console.log(`Success Rate: ${successfulTests.length}/5`);
    
    return { avgLatency, minLatency, maxLatency, successRate: successfulTests.length / 5 };
  }
  
  return { avgLatency: -1, minLatency: -1, maxLatency: -1, successRate: 0 };
}

/**
 * 🚀 Main Performance Test
 */
async function runPerformanceTest() {
  console.log('🚀 MOVIE APP PERFORMANCE TEST');
  console.log('=====================================');
  console.log(`Test started at: ${new Date().toISOString()}`);
  console.log(`Testing against: ${API_BASE_URL}`);
  
  // Test network latency first
  const networkStats = await testNetworkLatency();
  
  // Test movie detail APIs
  console.log('\n🎬 TESTING MOVIE DETAIL APIs');
  console.log('=====================================');
  
  const movieResults = [];
  for (const movieId of TEST_MOVIE_IDS) {
    const result = await testMovieDetailAPI(movieId);
    movieResults.push(result);
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test video stream APIs (using same IDs as movie IDs for now)
  console.log('\n🎥 TESTING VIDEO STREAM APIs');
  console.log('=====================================');
  
  const videoResults = [];
  for (const videoId of TEST_MOVIE_IDS) {
    const result = await testVideoStreamAPI(videoId);
    videoResults.push(result);
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Performance Summary
  console.log('\n📊 PERFORMANCE SUMMARY');
  console.log('=====================================');
  
  const successfulMovieTests = movieResults.filter(r => r.success);
  const successfulVideoTests = videoResults.filter(r => r.success);
  
  if (successfulMovieTests.length > 0) {
    const avgMovieTime = successfulMovieTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulMovieTests.length;
    console.log(`📱 Movie Detail API Average: ${avgMovieTime.toFixed(2)}ms`);
  }
  
  if (successfulVideoTests.length > 0) {
    const avgVideoTime = successfulVideoTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulVideoTests.length;
    console.log(`🎥 Video Stream API Average: ${avgVideoTime.toFixed(2)}ms`);
  }
  
  console.log(`🌐 Network Latency Average: ${networkStats.avgLatency.toFixed(2)}ms`);
  
  // Recommendations
  console.log('\n💡 PERFORMANCE RECOMMENDATIONS');
  console.log('=====================================');
  
  if (networkStats.avgLatency > 2000) {
    console.log('⚠️  HIGH NETWORK LATENCY detected (>2s)');
    console.log('   - Consider using CDN or closer server');
    console.log('   - Implement request caching');
  }
  
  const totalAvgTime = (successfulMovieTests.length > 0 ? successfulMovieTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulMovieTests.length : 0) + 
                      (successfulVideoTests.length > 0 ? successfulVideoTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulVideoTests.length : 0);
  
  if (totalAvgTime > 10000) {
    console.log('🚨 SLOW LOADING detected (>10s total)');
    console.log('   - API responses are taking too long');
    console.log('   - Consider API optimization');
    console.log('   - Implement progressive loading');
  }
  
  console.log('\n✅ Performance test completed!');
}

// Run the test
if (typeof module !== 'undefined' && require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = {
  testMovieDetailAPI,
  testVideoStreamAPI,
  testNetworkLatency,
  runPerformanceTest
}; 