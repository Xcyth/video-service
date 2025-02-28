'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Upload, Settings, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { VideoList } from '@/components/video-list';
import { VideoUpload } from '@/components/video-upload';
import { ProfileSettings } from '@/components/profile-settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HomePage() {
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setRefreshKey(prev => prev + 1);
  };

  const getProfilePictureUrl = () => {
    if (!user?.profilePictureUrl && !user?.profilePicture) return undefined;
    return user.profilePictureUrl?.startsWith('http')
      ? user.profilePictureUrl
      : `${API_URL}${user.profilePictureUrl || `/media/profile-pictures/${user.profilePicture}`}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Video Platform</h1>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUpload(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push('/login')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={getProfilePictureUrl()}
                    alt={user.firstName}
                  />
                  <AvatarFallback className="text-2xl">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {user.firstName} {user.lastName}
                      </h2>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                  {user.bio ? (
                    <p className="text-sm text-muted-foreground">{user.bio}</p>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setShowSettings(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Add a bio
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-8">
          {user && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Videos</h2>
              <VideoList userId={user.id} showAll />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Videos</h2>
            <VideoList key={refreshKey} />
          </div>
        </div>
      </main>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
          </DialogHeader>
          <VideoUpload onSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>

      <ProfileSettings open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
