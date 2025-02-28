'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ProfileUploadProps {
  onSuccess?: () => void;
}

export function ProfileUpload({ onSuccess }: ProfileUploadProps) {
  const { token, user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const getProfilePictureUrl = () => {
    if (!user) {
      console.log('No user found');
      return undefined;
    }

    console.log('Current user:', user);
    console.log('Profile picture URL from user:', user.profilePictureUrl);
    console.log('Profile picture from user:', user.profilePicture);

    if (!user.profilePictureUrl && !user.profilePicture) {
      console.log('No profile picture URL or filename found');
      return undefined;
    }

    // If we have a full URL, use it directly
    if (user.profilePictureUrl?.startsWith('http')) {
      console.log('Using full URL:', user.profilePictureUrl);
      return user.profilePictureUrl;
    }

    // If we have a relative URL, construct the full URL
    const relativeUrl = user.profilePictureUrl || `/media/profile-pictures/${user.profilePicture}`;
    const fullUrl = `${API_URL}${relativeUrl}`;
    console.log('Constructed full URL:', fullUrl);
    return fullUrl;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post(
        `${API_URL}/media/upload/profile-picture`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Upload response:', response.data);

      // Update user with new profile picture
      if (user) {
        const updatedUser = {
          ...user,
          profilePicture: response.data.profilePicture,
          profilePictureUrl: response.data.profilePictureUrl
        };
        console.log('Updating user with:', updatedUser);
        updateUser(updatedUser);
      }

      toast.success('Profile picture updated successfully');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  }, [token, user, updateUser, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="w-20 h-20">
          <AvatarImage
            src={getProfilePictureUrl()}
            alt={user?.firstName}
          />
          <AvatarFallback className="text-lg">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Upload a new profile picture
          </p>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {isDragActive
                ? 'Drop the image here...'
                : 'Drag & drop an image here, or click to select'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG or PNG, max 5MB
            </p>
          </>
        )}
      </div>
    </div>
  );
} 