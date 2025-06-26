



// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { useAppSelector } from '../../store/hooks';
// import { rentalService } from '../../services/rentalService';
// import { RentalInfo } from '../../types/rental';

// export default function RentalHistoryScreen() {
//   const router = useRouter();
//   const auth = useAppSelector(state => state.auth);
//   const userId = auth.userId;

//   const [rentals, setRentals] = useState<RentalInfo[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

//   const loadRentalsCallback = useCallback(async () => {
//     if (!userId) return;

//     try {
//       setIsLoading(true);
//       const response = await rentalService.getRentalHistory(userId, {
//         status: filter === 'all' ? undefined : filter,
//         limit: 50,
//       });

//       setRentals(response.data.rentals);
//     } catch (error) {
//       console.error('Error loading rental history:', error);
//       Alert.alert('Lỗi', 'Không thể tải lịch sử thuê phim');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [userId, filter]);

//   useEffect(() => {
//     if (userId) {
//       loadRentalsCallback();
//     }
//   }, [userId, loadRentalsCallback]);

//   const loadRentals = async () => {
//     if (!userId) return;

//     try {
//       setIsLoading(true);
//       const response = await rentalService.getRentalHistory(userId, {
//         status: filter === 'all' ? undefined : filter,
//         limit: 50,
//       });

//       setRentals(response.data.rentals);
//     } catch (error) {
//       console.error('Error loading rental history:', error);
//       Alert.alert('Lỗi', 'Không thể tải lịch sử thuê phim');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await loadRentals();
//     setRefreshing(false);
//   };

//   const handleCancelRental = async (rental: RentalInfo) => {
//     if (!userId) return;

//     const canCancel = rentalService.canCancelRental(rental);
//     if (!canCancel) {
//       Alert.alert('Không thể hủy', 'Chỉ có thể hủy rental trong vòng 24h đầu');
//       return;
//     }

//     Alert.alert(
//       'Xác nhận hủy rental',
//       'Bạn có chắc muốn hủy rental này? Hành động này không thể hoàn tác.',
//       [
//         { text: 'Hủy bỏ', style: 'cancel' },
//         {
//           text: 'Xác nhận',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await rentalService.cancelRental(rental._id, { userId });
//               Alert.alert('Thành công', 'Đã hủy rental thành công');
//               loadRentals();
//             } catch {
//               Alert.alert('Lỗi', 'Không thể hủy rental');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const renderRentalItem = (rental: RentalInfo) => {
//     const timeInfo = rental.status === 'active' && rental.endTime
//       ? rentalService.formatRemainingTime(new Date(rental.endTime).getTime() - Date.now())
//       : null;

//     const canCancel = rental.status === 'active' && rentalService.canCancelRental(rental);

//     return (
//       <TouchableOpacity
//         key={rental._id}
//         style={styles.rentalItem}
//         onPress={() => router.push(`/movie/${rental.movieId._id}`)}
//       >
//         <Image source={{ uri: rental.movieId.poster }} style={styles.moviePoster} />
        
//         <View style={styles.rentalInfo}>
//           <Text style={styles.movieTitle} numberOfLines={2}>
//             {rental.movieId.title}
//           </Text>
          
//           <View style={styles.rentalDetails}>
//             <Text style={styles.rentalType}>
//               {rental.rentalType === '48h' ? 'Thuê 48 giờ' : 'Thuê 30 ngày'}
//             </Text>
//             <Text style={styles.rentalAmount}>
//               {rentalService.formatPrice(rental.paymentId.amount)}
//             </Text>
//           </View>
          
//           <View style={styles.statusRow}>
//             <View style={[styles.statusBadge, styles[`status${rental.status}`]]}>
//               <Text style={styles.statusText}>
//                 {rental.status === 'active' ? 'Đang thuê' : 
//                  rental.status === 'expired' ? 'Hết hạn' : 'Đã hủy'}
//               </Text>
//             </View>
            
//             {timeInfo && rental.status === 'active' && (
//               <Text style={[
//                 styles.timeRemaining,
//                 timeInfo.isExpiring && styles.timeExpiring
//               ]}>
//                 Còn {timeInfo.formatted}
//               </Text>
//             )}
//           </View>
          
//           <Text style={styles.rentalDate}>
//             Thuê từ: {new Date(rental.startTime).toLocaleDateString('vi-VN')}
//           </Text>
//         </View>
        
//         <View style={styles.actionButtons}>
//           {canCancel && (
//             <TouchableOpacity
//               style={styles.cancelButton}
//               onPress={() => handleCancelRental(rental)}
//             >
//               <Ionicons name="close-circle" size={20} color="#FF6B6B" />
//             </TouchableOpacity>
//           )}
          
//           <TouchableOpacity style={styles.viewButton}>
//             <Ionicons name="chevron-forward" size={20} color="#007AFF" />
//           </TouchableOpacity>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderFilterTabs = () => (
//     <View style={styles.filterContainer}>
//       {[
//         { key: 'all', label: 'Tất cả' },
//         { key: 'active', label: 'Đang thuê' },
//         { key: 'expired', label: 'Hết hạn' },
//       ].map((tab) => (
//         <TouchableOpacity
//           key={tab.key}
//           style={[styles.filterTab, filter === tab.key && styles.activeFilterTab]}
//           onPress={() => setFilter(tab.key as 'all' | 'active' | 'expired')}
//         >
//           <Text style={[styles.filterText, filter === tab.key && styles.activeFilterText]}>
//             {tab.label}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="film-outline" size={64} color="#666" />
//       <Text style={styles.emptyTitle}>Chưa có lịch sử thuê phim</Text>
//       <Text style={styles.emptySubtitle}>
//         Khi bạn thuê phim, lịch sử sẽ hiển thị ở đây
//       </Text>
//       <TouchableOpacity
//         style={styles.exploreButton}
//         onPress={() => router.push('/(tabs)/' as any)}
//       >
//         <Text style={styles.exploreButtonText}>Khám phá phim</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (!userId) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor="#000" />
//         <View style={styles.header}>
//           <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Lịch sử thuê phim</Text>
//         </View>
        
//         <View style={styles.notLoggedInContainer}>
//           <Ionicons name="person-outline" size={64} color="#666" />
//           <Text style={styles.notLoggedInTitle}>Chưa đăng nhập</Text>
//           <Text style={styles.notLoggedInSubtitle}>
//             Vui lòng đăng nhập để xem lịch sử thuê phim
//           </Text>
//           <TouchableOpacity
//             style={styles.loginButton}
//             onPress={() => router.push('/(auth)/login')}
//           >
//             <Text style={styles.loginButtonText}>Đăng nhập</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#000" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Lịch sử thuê phim</Text>
//       </View>

//       {/* Filter Tabs */}
//       {renderFilterTabs()}

//       {/* Content */}
//       <ScrollView
//         style={styles.content}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             tintColor="#007AFF"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {isLoading ? (
//           <View style={styles.loadingContainer}>
//             <Text style={styles.loadingText}>Đang tải...</Text>
//           </View>
//         ) : rentals.length === 0 ? (
//           renderEmptyState()
//         ) : (
//           <View style={styles.rentalsList}>
//             {rentals.map(renderRentalItem)}
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 0.5,
//     borderBottomColor: '#333',
//   },
//   backButton: {
//     marginRight: 15,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   filterContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#1a1a1a',
//     margin: 20,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   filterTab: {
//     flex: 1,
//     paddingVertical: 12,
//     alignItems: 'center',
//   },
//   activeFilterTab: {
//     backgroundColor: '#007AFF',
//   },
//   filterText: {
//     fontSize: 14,
//     color: '#aaa',
//     fontWeight: '500',
//   },
//   activeFilterText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   content: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#aaa',
//   },
//   rentalsList: {
//     padding: 20,
//     paddingTop: 0,
//   },
//   rentalItem: {
//     flexDirection: 'row',
//     backgroundColor: '#1a1a1a',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     alignItems: 'center',
//   },
//   moviePoster: {
//     width: 60,
//     height: 90,
//     borderRadius: 8,
//     marginRight: 15,
//   },
//   rentalInfo: {
//     flex: 1,
//   },
//   movieTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   rentalDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   rentalType: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '500',
//   },
//   rentalAmount: {
//     fontSize: 14,
//     color: '#4CAF50',
//     fontWeight: 'bold',
//   },
//   statusRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginRight: 10,
//   },
//   statusactive: {
//     backgroundColor: '#4CAF50',
//   },
//   statusexpired: {
//     backgroundColor: '#666',
//   },
//   statuscancelled: {
//     backgroundColor: '#FF6B6B',
//   },
//   statusText: {
//     fontSize: 12,
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   timeRemaining: {
//     fontSize: 12,
//     color: '#FFA500',
//     fontWeight: '500',
//   },
//   timeExpiring: {
//     color: '#FF6B6B',
//   },
//   rentalDate: {
//     fontSize: 12,
//     color: '#888',
//   },
//   actionButtons: {
//     alignItems: 'center',
//   },
//   cancelButton: {
//     padding: 8,
//     marginBottom: 5,
//   },
//   viewButton: {
//     padding: 8,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   emptySubtitle: {
//     fontSize: 16,
//     color: '#888',
//     textAlign: 'center',
//     marginBottom: 30,
//     lineHeight: 22,
//   },
//   exploreButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 30,
//     paddingVertical: 15,
//     borderRadius: 25,
//   },
//   exploreButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   notLoggedInContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   notLoggedInTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   notLoggedInSubtitle: {
//     fontSize: 16,
//     color: '#888',
//     textAlign: 'center',
//     marginBottom: 30,
//     lineHeight: 22,
//   },
//   loginButton: {
//     backgroundColor: '#4CAF50',
//     paddingHorizontal: 30,
//     paddingVertical: 15,
//     borderRadius: 25,
//   },
//   loginButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// }); 