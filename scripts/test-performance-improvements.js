/**
 * 🚀 TEST PERFORMANCE IMPROVEMENTS
 * 
 * Script để test các cải tiến performance đã implement:
 * 1. Rental API caching (5 phút TTL)
 * 2. Reduced auto-refresh interval (30s → 5 phút)
 * 3. Backend optimizations (skip movie verification, async recordAccess)
 * 4. VideoPlayer memoization
 */

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

// Test data - thay bằng real data từ app
const TEST_DATA = {
  userId: '684f9b3e1876450d6bc28307',
  movieId: '683d8ef0602b36157f1c7ae5',
  episodeId: '683d8ef0602b36157f1c7ae5'
};

/**
 * 🎫 Test Rental Status API Performance
 */
async function testRentalStatusPerformance() {
  console.log('\n🎫 TESTING RENTAL STATUS API PERFORMANCE');
  console.log('==========================================');
  
  const results = [];
  
  // Test 5 consecutive calls để check caching
  for (let i = 1; i <= 5; i++) {
    const startTime = Date.now();
    
    try {
      console.log(`\n📞 Call ${i}/5 - Testing rental status API...`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/rentals/status/${TEST_DATA.movieId}?userId=${TEST_DATA.userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️  Response Time: ${responseTime}ms`);
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Has Access: ${data.data?.hasAccess}`);
        console.log(`⏰ Remaining Time: ${data.data?.remainingHours}h`);
      }
      
      results.push({
        call: i,
        responseTime,
        success: response.ok,
        status: response.status
      });
      
      // Wait 1 second between calls
      if (i < 5) {
        console.log('⏳ Waiting 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      const errorTime = Date.now();
      console.error(`❌ Error on call ${i}:`, error.message);
      results.push({
        call: i,
        responseTime: errorTime - startTime,
        success: false,
        error: error.message
      });
    }
  }
  
  // Analysis
  console.log('\n📊 RENTAL API PERFORMANCE ANALYSIS');
  console.log('=====================================');
  
  const successfulCalls = results.filter(r => r.success);
  if (successfulCalls.length > 0) {
    const avgTime = successfulCalls.reduce((sum, r) => sum + r.responseTime, 0) / successfulCalls.length;
    const minTime = Math.min(...successfulCalls.map(r => r.responseTime));
    const maxTime = Math.max(...successfulCalls.map(r => r.responseTime));
    
    console.log(`📈 Average Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`⚡ Fastest Response: ${minTime}ms`);
    console.log(`🐌 Slowest Response: ${maxTime}ms`);
    console.log(`✅ Success Rate: ${successfulCalls.length}/5`);
    
    // Performance improvement indicators
    if (avgTime < 300) {
      console.log('🎉 EXCELLENT: Average response time < 300ms');
    } else if (avgTime < 500) {
      console.log('✅ GOOD: Average response time < 500ms');
    } else if (avgTime < 1000) {
      console.log('⚠️  ACCEPTABLE: Average response time < 1s');
    } else {
      console.log('🚨 NEEDS IMPROVEMENT: Average response time > 1s');
    }
    
    // Check for caching effectiveness
    const laterCalls = successfulCalls.slice(1); // Skip first call
    if (laterCalls.length > 0) {
      const laterAvg = laterCalls.reduce((sum, r) => sum + r.responseTime, 0) / laterCalls.length;
      const firstCallTime = successfulCalls[0].responseTime;
      
      if (laterAvg < firstCallTime * 0.8) {
        console.log('🎯 CACHING EFFECTIVE: Later calls are faster');
      } else {
        console.log('⚠️  CACHING MAY NOT BE WORKING: No speed improvement in later calls');
      }
    }
  }
  
  return results;
}

/**
 * 🎬 Test Movie Detail API Performance
 */
async function testMovieDetailPerformance() {
  console.log('\n🎬 TESTING MOVIE DETAIL API PERFORMANCE');
  console.log('=========================================');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/movies/${TEST_DATA.movieId}/detail-with-interactions?userId=${TEST_DATA.userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️  Movie Detail Response Time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status}`);
    
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
        console.log(`📹 Episodes: ${movie.episodes?.length || 0}`);
      }
    }
    
    return {
      responseTime,
      success: response.ok,
      status: response.status
    };
    
  } catch (error) {
    console.error(`❌ Movie Detail Error:`, error.message);
    return {
      responseTime: Date.now() - startTime,
      success: false,
      error: error.message
    };
  }
}

/**
 * 📱 Test Combined Loading Simulation
 */
async function testCombinedLoadingPerformance() {
  console.log('\n📱 TESTING COMBINED LOADING PERFORMANCE');
  console.log('========================================');
  console.log('Simulating real app behavior: Movie Detail + Rental Status');
  
  const totalStartTime = Date.now();
  
  try {
    console.log('🔄 Starting parallel API calls...');
    
    // Simulate parallel calls like the real app
    const [movieDetailResult, rentalStatusResult] = await Promise.all([
      testMovieDetailPerformance(),
      fetch(`${API_BASE_URL}/api/rentals/status/${TEST_DATA.movieId}?userId=${TEST_DATA.userId}`)
        .then(async (response) => {
          const responseTime = Date.now() - totalStartTime;
          const data = response.ok ? await response.json() : null;
          return { responseTime, success: response.ok, data };
        })
        .catch(error => ({ responseTime: Date.now() - totalStartTime, success: false, error: error.message }))
    ]);
    
    const totalEndTime = Date.now();
    const totalTime = totalEndTime - totalStartTime;
    
    console.log('\n📊 COMBINED LOADING RESULTS');
    console.log('============================');
    console.log(`⏱️  Total Loading Time: ${totalTime}ms`);
    console.log(`🎬 Movie Detail: ${movieDetailResult.responseTime}ms`);
    console.log(`🎫 Rental Status: ${rentalStatusResult.responseTime}ms`);
    
    // Performance assessment
    if (totalTime < 3000) {
      console.log('🎉 EXCELLENT: Total loading time < 3 seconds');
    } else if (totalTime < 5000) {
      console.log('✅ GOOD: Total loading time < 5 seconds');
    } else if (totalTime < 8000) {
      console.log('⚠️  ACCEPTABLE: Total loading time < 8 seconds');
    } else {
      console.log('🚨 NEEDS IMPROVEMENT: Total loading time > 8 seconds');
    }
    
    return {
      totalTime,
      movieDetailTime: movieDetailResult.responseTime,
      rentalStatusTime: rentalStatusResult.responseTime,
      success: movieDetailResult.success && rentalStatusResult.success
    };
    
  } catch (error) {
    const errorTime = Date.now() - totalStartTime;
    console.error(`❌ Combined Loading Error:`, error.message);
    return {
      totalTime: errorTime,
      success: false,
      error: error.message
    };
  }
}

/**
 * 🚀 Main Performance Test Suite
 */
async function runPerformanceTestSuite() {
  console.log('🚀 MOVIE APP PERFORMANCE TEST SUITE');
  console.log('====================================');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Testing against: ${API_BASE_URL}`);
  console.log(`Test Data: userId=${TEST_DATA.userId}, movieId=${TEST_DATA.movieId}`);
  
  const results = {
    timestamp: Date.now(),
    rentalStatus: null,
    movieDetail: null,
    combinedLoading: null
  };
  
  try {
    // Test 1: Rental Status Performance
    results.rentalStatus = await testRentalStatusPerformance();
    
    // Wait 2 seconds
    console.log('\n⏳ Waiting 2 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Movie Detail Performance  
    results.movieDetail = await testMovieDetailPerformance();
    
    // Wait 2 seconds
    console.log('\n⏳ Waiting 2 seconds before final test...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Combined Loading Performance
    results.combinedLoading = await testCombinedLoadingPerformance();
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
  
  // Final Summary
  console.log('\n🏁 FINAL PERFORMANCE SUMMARY');
  console.log('============================');
  
  if (results.rentalStatus) {
    const successfulRentalCalls = results.rentalStatus.filter(r => r.success);
    if (successfulRentalCalls.length > 0) {
      const avgRentalTime = successfulRentalCalls.reduce((sum, r) => sum + r.responseTime, 0) / successfulRentalCalls.length;
      console.log(`🎫 Rental API Average: ${avgRentalTime.toFixed(2)}ms`);
    }
  }
  
  if (results.movieDetail && results.movieDetail.success) {
    console.log(`🎬 Movie Detail API: ${results.movieDetail.responseTime}ms`);
  }
  
  if (results.combinedLoading && results.combinedLoading.success) {
    console.log(`📱 Combined Loading: ${results.combinedLoading.totalTime}ms`);
  }
  
  console.log('\n💡 OPTIMIZATION STATUS');
  console.log('======================');
  console.log('✅ Rental API caching implemented (5min TTL)');
  console.log('✅ Auto-refresh interval reduced (30s → 5min)');
  console.log('✅ Backend optimizations applied');
  console.log('✅ VideoPlayer memoization added');
  
  console.log('\n🎯 NEXT STEPS');
  console.log('=============');
  console.log('1. Monitor real app performance with these changes');
  console.log('2. Consider implementing React Query for advanced caching');
  console.log('3. Add progressive loading for better UX');
  console.log('4. Implement video preloading for instant playback');
  
  console.log('\n✅ Performance test suite completed!');
  
  return results;
}

// Run the test
if (typeof module !== 'undefined' && require.main === module) {
  runPerformanceTestSuite().catch(console.error);
}

module.exports = {
  testRentalStatusPerformance,
  testMovieDetailPerformance,
  testCombinedLoadingPerformance,
  runPerformanceTestSuite
}; 