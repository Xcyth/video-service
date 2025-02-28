'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileUpload } from './profile-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettings({ open, onOpenChange }: ProfileSettingsProps) {
  const { user, token, updateUser } = useAuth();
  const [bio, setBio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update bio and log user data when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Profile Settings Dialog opened');
      console.log('Current user data:', user);
      if (user) {
        console.log('User profile picture:', user.profilePicture);
        console.log('User profile picture URL:', user.profilePictureUrl);
        setBio(user.bio || '');
      }
    }
  }, [open, user]);

  const handleSuccess = () => {
    console.log('Profile update success');
    // Keep the dialog open to show the updated profile picture
    toast.success('Profile picture updated successfully');
  };

  const handleUpdateBio = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);
      const response = await axios.put(
        `${API_URL}/auth/update-bio`,
        { bio },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Bio update response:', response.data);
      const updatedUser = { ...user, bio };
      console.log('Updating user with new bio:', updatedUser);
      updateUser(updatedUser);
      toast.success('Bio updated successfully');
    } catch (error) {
      console.error('Bio update error:', error);
      toast.error('Failed to update bio');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <ProfileUpload onSuccess={handleSuccess} />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <Button
              onClick={handleUpdateBio}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? 'Updating...' : 'Update Bio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 