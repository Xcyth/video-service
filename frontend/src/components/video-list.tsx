'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useInView } from 'react-intersection-observer';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Video {
  id: string;
  title: string;
  description: string;
  filename: string;
  size: number;
  createdAt: string;
  videoUrl: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
  };
}

interface VideoListProps {
  userId?: string;
  showAll?: boolean;
  username?: string;
}

interface GroupedVideos {
  [userId: string]: {
    user: Video['user'];
    videos: Video[];
  };
}

export function VideoList({ userId, showAll = false, username }: VideoListProps) {
  const { token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const { ref, inView } = useInView();
  const router = useRouter();

  const fetchVideos = useCallback(async (pageNum: number, isNewSearch = false) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/media/videos`, {
        params: {
          page: pageNum,
          search,
          userId,
          limit: 9,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log('API Response:', response.data);
      
      const { videos: newVideos, pagination } = response.data;
      if (!Array.isArray(newVideos)) {
        console.error('Unexpected videos format:', newVideos);
        setVideos([]);
        setHasMore(false);
        return;
      }

      setVideos(prev => isNewSearch ? newVideos : [...prev, ...newVideos]);
      setHasMore(pagination.hasNextPage);
    } catch (error) {
      toast.error('Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  }, [search, token, userId]);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchVideos(1, true);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search, fetchVideos]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage(prev => prev + 1);
      fetchVideos(page + 1);
    }
  }, [inView, hasMore, isLoading, fetchVideos, page]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const groupedVideos = videos.reduce<GroupedVideos>((groups, video) => {
    if (!groups[video.user.id]) {
      groups[video.user.id] = {
        user: video.user,
        videos: []
      };
    }
    groups[video.user.id].videos.push(video);
    return groups;
  }, {});

  const handleSeeAll = (firstName: string, lastName: string) => {
    const username = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;
    router.push(`/${username}`);
  };

  // If we're on a user's page, show only their videos in a grid
  if (username) {
    const userVideos = videos;
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <video
                src={`${API_URL}${video.videoUrl}`}
                className="w-full aspect-video object-cover"
                controls
              />
              <CardHeader className="space-y-1 p-4">
                <CardTitle className="text-lg">{video.title}</CardTitle>
                {video.description && (
                  <p className="text-sm text-muted-foreground">
                    {video.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  {formatDate(video.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        {isLoading && (
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        )}
        <div ref={ref} className="h-1" />
      </div>
    );
  }

  // Home page layout with grouped videos
  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>

      <div className="space-y-12">
        {Object.values(groupedVideos).map(({ user, videos: userVideos }) => (
          <div key={user.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={user.profilePictureUrl ? `${API_URL}${user.profilePictureUrl}` : undefined}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <AvatarFallback>
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {userVideos.length} video{userVideos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {!showAll && userVideos.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeeAll(user.firstName, user.lastName)}
                >
                  See All Videos
                </Button>
              )}
            </div>
            
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-6" style={{ minWidth: 'min-content' }}>
                {(showAll ? userVideos : userVideos.slice(0, 5)).map((video) => (
                  <Card key={video.id} className="w-[300px] flex-shrink-0">
                    <video
                      src={`${API_URL}${video.videoUrl}`}
                      className="w-full aspect-video object-cover"
                      controls
                    />
                    <CardHeader className="space-y-1 p-4">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      {video.description && (
                        <p className="text-sm text-muted-foreground">
                          {video.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(video.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <Separator className="mt-8" />
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-4 text-muted-foreground">
          Loading...
        </div>
      )}

      {showAll && <div ref={ref} className="h-1" />}
    </div>
  );
} 