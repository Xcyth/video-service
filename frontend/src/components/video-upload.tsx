'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

interface VideoUploadProps {
  onSuccess: () => void;
}

export function VideoUpload({ onSuccess }: VideoUploadProps) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFile = acceptedFiles[0];
    if (videoFile.type !== 'video/mp4') {
      toast.error('Only MP4 videos are allowed');
      return;
    }
    if (videoFile.size > 6 * 1024 * 1024) {
      toast.error('File size must be less than 6MB');
      return;
    }
    setFile(videoFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
    },
    maxFiles: 1,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!file) {
      toast.error('Please select a video file');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', values.title);
      if (values.description) {
        formData.append('description', values.description);
      }

      await axios.post(`${API_URL}/media/upload/video`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Video uploaded successfully');
      form.reset();
      setFile(null);
      onSuccess();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${file ? 'bg-muted/50' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          {file ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          ) : isDragActive ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Drop the video here...
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Drag & drop a video here, or click to select
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            MP4 only, max 6MB
          </p>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter video title"
                  {...field}
                  disabled={isUploading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter video description"
                  {...field}
                  disabled={isUploading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isUploading || !file}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Video'
          )}
        </Button>
      </form>
    </Form>
  );
} 