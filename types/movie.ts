// Movie types based on swagger API documentation

export interface BannerMovie {
  movieId: string;
  title: string;
  poster: string;
  description?: string;
  releaseYear?: number;
  movieType: string;
  producer: string;
  genres: string[];
}

export interface GridMovie {
  movieId: string;
  title: string;
  poster: string;
  movieType: string;
  producer: string;
}

export interface ContinueWatchingItem {
  movieId: string;
  title: string;
  poster: string;
  progress: number;
  lastWatchedAt: string;
}

export interface MovieSection {
  title: string;
  type: 'banner_list' | 'grid' | 'continue_watching';
  movies?: BannerMovie[] | GridMovie[];
  data?: ContinueWatchingItem[];
}

export interface HomeApiResponse {
  status: string;
  data: {
    banner: {
      title: string;
      type: 'banner_list';
      movies: BannerMovie[];
    };
    recommended: {
      title: string;
      type: 'grid';
      movies: GridMovie[];
    };
  };
}

export interface ContinueWatchingResponse {
  status: string;
  data: {
    title: string;
    type: 'continue_watching';
    data: ContinueWatchingItem[];
  };
} 