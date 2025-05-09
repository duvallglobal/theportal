import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { CloudUpload, Image, Video, X } from 'lucide-react';

// Simplified schema to match the user's requirement:
// upload, tag, platform, submit with preview
const contentUploadSchema = z.object({
  platform: z.string().min(1, { message: 'Platform is required' }),
  tags: z.string().optional(),
});

type ContentUploadFormValues = z.infer<typeof contentUploadSchema>;

interface ContentUploaderProps {
  onUploadSuccess?: () => void;
}

export function ContentUploader({ onUploadSuccess }: ContentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<ContentUploadFormValues>({
    resolver: zodResolver(contentUploadSchema),
    defaultValues: {
      platform: 'OnlyFans',
      tags: '',
    },
  });

  // Generate previews for uploaded files
  useEffect(() => {
    // Clean up existing preview URLs
    const urlsToRevoke = previewUrls;
    
    // Create new preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);
    
    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      // Revoke old URLs
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
      // Revoke new URLs on unmount
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  // Handle drag and drop
  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const newFiles = Array.from(event.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  };

  // Remove a file from the list
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    // Also remove preview URL
    URL.revokeObjectURL(previewUrls[index]);
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
  };

  // Submit form
  const onSubmit = async (data: ContentUploadFormValues) => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a FormData instance to send files
      const formData = new FormData();
      
      // Append form data (only platform and tags as per user request)
      formData.append('platform', data.platform);
      formData.append('tags', data.tags || '');
      
      // Append all files
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);

      // Make the API request
      await apiRequest('POST', '/api/content/upload', formData);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Upload successful",
        description: "Your content has been uploaded successfully.",
      });

      // Reset form
      form.reset();
      setFiles([]);
      
      // Call the onUploadSuccess callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your content.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Upload New Content</h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* File Upload Area */}
        <div className="mb-6">
          <Label className="block text-white font-medium mb-2">Content Files</Label>
          <div 
            className={cn(
              "border-2 border-dashed border-gray-600 rounded-lg p-6 text-center",
              dragActive && "border-primary bg-primary bg-opacity-5",
              files.length > 0 && "border-green-500 bg-green-500 bg-opacity-5"
            )}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="mb-4 text-gray-400">
              <CloudUpload className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-white font-medium mb-2">Drag & Drop Files Here</h3>
            <p className="text-gray-400 text-sm mb-4">or</p>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <p className="text-gray-500 text-xs mt-4">Max file size: 100MB. Supported formats: JPG, PNG, MP4, MOV</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,video/mp4,video/quicktime"
              multiple
              className="hidden"
            />
          </div>
        </div>
        
        {/* File Previews */}
        {files.length > 0 && (
          <div className="mb-6">
            <Label className="block text-white font-medium mb-2">Preview ({files.length} files)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={previewUrls[index]} 
                      alt={file.name} 
                      className="rounded-lg object-cover w-full aspect-square"
                    />
                  ) : (
                    <div className="rounded-lg bg-background-lighter w-full aspect-square flex items-center justify-center">
                      <Video className="h-10 w-10 text-purple-400" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <p className="text-xs text-gray-400 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Platform Selection */}
        <div className="mb-6">
          <Label htmlFor="platform" className="block text-white font-medium mb-2">Platform</Label>
          <Select 
            onValueChange={(value) => form.setValue('platform', value)} 
            defaultValue={form.getValues('platform')}
          >
            <SelectTrigger className="w-full bg-background-lighter text-gray-300 rounded-lg">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OnlyFans">OnlyFans</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="Twitter">Twitter/X</SelectItem>
              <SelectItem value="Reddit">Reddit</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.platform && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.platform.message}</p>
          )}
        </div>
        
        {/* Tags */}
        <div className="mb-6">
          <Label htmlFor="tags" className="block text-white font-medium mb-2">Tags</Label>
          <Input 
            id="tags"
            type="text" 
            placeholder="Enter tags separated by commas..."
            className="w-full bg-background-lighter text-gray-300 rounded-lg"
            {...form.register('tags')}
          />
        </div>
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-6">
            <div className="w-full bg-background-lighter h-2 rounded-full">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-center mt-2 text-sm">Uploading... {uploadProgress}%</p>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? 'Uploading...' : 'Upload Content'}
          </Button>
        </div>
      </form>
    </div>
  );
}
