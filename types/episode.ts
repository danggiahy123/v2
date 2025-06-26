/**
 * 🎬 EPISODE TYPES
 * 
 * Định nghĩa interface chung cho episodes trong toàn bộ ứng dụng
 */

export interface Episode {
  _id: string;
  episode_number: number;
  episode_title: string;
  episode_description: string;
  uri: string;
  duration: number;
  movie_id: string;
  createdAt: string;
  updatedAt: string;
  is_free?: boolean;
  release_date?: string;
}

// Các trường bắt buộc cho validation
export const REQUIRED_EPISODE_FIELDS = [
  '_id',
  'episode_number',
  'episode_title',
  'episode_description',
  'uri',
  'duration',
  'movie_id',
  'createdAt',
  'updatedAt'
] as const; 