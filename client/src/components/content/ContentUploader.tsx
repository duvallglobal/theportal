import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CloudUpload, Image, Video, History, Plus } from 'lucide-react';

const contentUploadSchema = z.object({
  contentType: z.enum(['photo', 'video', 'story', 'other']),
  platform: z.string().min(1, { message: 'Platform is required' }),
  caption: z.string().optional(),
  tags: z.string().optional(),
  scheduled: z.boolean().optional(),
  scheduledDate: z.string().optional(),
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<ContentUploadFormValues>({
    resolver: zodResolver(contentUploadSchema),
    defaultValues: {
      contentType: 'photo',
      platform: 'OnlyFans',
      caption: '',
      tags: '',
      scheduled: false,
    },
  });

  const contentTypeOptions = [
    { value: 'photo', label: 'Photos', icon: <Image className="h-4 w-4 mr-2" /> },
    { value: 'video', label: 'Videos', icon: <Video className="h-4 w-4 mr-2" /> },
    { value: 'story', label: 'Stories', icon: <History className="h-4 w-4 mr-2" /> },
    { value: 'other', label: 'Other', icon: <Plus className="h-4 w-4 mr-2" /> },
  ];

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
      
      // Append form data
      formData.append('contentType', data.contentType);
      formData.append('platform', data.platform);
      formData.append('caption', data.caption || '');
      formData.append('tags', data.tags || '');
      formData.append('scheduled', data.scheduled ? 'true' : 'false');
      
      if (data.scheduled && data.scheduledDate) {
        formData.append('scheduledDate', data.scheduledDate);
      }
      
      // Append all files
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // Simulate progress updates (in a real app, you'd track actual upload progress)
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

  const watchScheduled = form.watch('scheduled');

  return (
    <div className="bg-background-card rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Upload New Content</h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-6">
          <Label className="block text-white font-medium mb-2">Content Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contentTypeOptions.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={option.value}
                  value={option.value}
                  {...form.register('contentType')}
                  className="hidden peer"
                />
                <Label
                  htmlFor={option.value}
                  className={cn(
                    "bg-background-lighter text-gray-300 px-4 py-2 rounded-lg w-full text-center cursor-pointer transition-colors flex justify-center items-center",
                    form.watch('contentType') === option.value && "bg-primary text-white"
                  )}
                >
                  {option.icon} {option.label}
                </Label>
              </div>
            ))}
          </div>
          {form.formState.errors.contentType && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.contentType.message}</p>
          )}
        </div>
        
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
        
        <div className="mb-6">
          <Label className="block text-white font-medium mb-2">Content Files</Label>
          <div 
            className={cn(
              "border-2 border-dashed border-gray-600 rounded-lg p-10 text-center",
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
          
          {/* File preview list */}
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-white font-medium mb-2">Selected Files ({files.length})</h4>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-background-lighter rounded p-2">
                    <div className="flex items-center">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 mr-2 text-blue-400" />
                      ) : (
                        <Video className="h-4 w-4 mr-2 text-purple-400" />
                      )}
                      <span className="text-gray-300 text-sm truncate max-w-xs">{file.name}</span>
                      <span className="text-gray-400 text-xs ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-white"
                    >
                      &times;
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <Label htmlFor="caption" className="block text-white font-medium mb-2">Caption/Description</Label>
          <Textarea 
            id="caption"
            rows={3} 
            placeholder="Enter a caption for your content..."
            className="w-full bg-background-lighter text-gray-300 rounded-lg"
            {...form.register('caption')}
          />
        </div>
        
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
        
        <div className="flex items-center mb-6">
          <Checkbox 
            id="scheduled" 
            className="border-gray-600 bg-background-lighter"
            onCheckedChange={(checked) => form.setValue('scheduled', checked === true)}
          />
          <Label htmlFor="scheduled" className="ml-2 text-white">Schedule for later</Label>
        </div>
        
        {watchScheduled && (
          <div className="mb-6">
            <Label htmlFor="scheduledDate" className="block text-white font-medium mb-2">Schedule Date</Label>
            <Input 
              id="scheduledDate"
              type="datetime-local" 
              className="w-full bg-background-lighter text-gray-300 rounded-lg"
              {...form.register('scheduledDate')}
            />
          </div>
        )}
        
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
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
          >
            Save Draft
          </Button>
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
