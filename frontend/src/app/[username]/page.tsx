'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { VideoList } from '@/components/video-list';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function UserVideosPage() {
  const params = useParams();
  const username = params.username as string;
  const [userId, setUserId] = useState<string | undefined>();

  // Extract first and last name from URL-friendly username
  const [firstName, lastName] = username.split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/user-by-name`, {
          params: { firstName, lastName }
        });
        setUserId(response.data.userId);
      } catch (error) {
        console.error('Failed to fetch user ID:', error);
      }
    };

    fetchUserId();
  }, [firstName, lastName]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              Videos by {firstName} {lastName}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <VideoList showAll userId={userId} username={username} />
      </main>
    </div>
  );
} 