import { useState, useEffect } from 'react';
import { ContentUploader } from '@/components/content/ContentUploader';
import { ContentCard, ContentItem } from '@/components/content/ContentCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function ContentUpload() {
  const [showUploader, setShowUploader] = useState(false);
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null);
  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null);
  const { toast } = useToast();

  // Fetch user's uploaded content using React Query
  const { data: userContent, isLoading, isError, error } = useQuery({
    queryKey: ['/api/content'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/content');
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        description: item.description || '',
        status: item.status,
        uploadedAt: new Date(item.uploadDate),
        scheduledDate: item.scheduledDate ? new Date(item.scheduledDate) : undefined,
        thumbnailUrl: item.thumbnailUrl || '/placeholder-image.png', // Fallback image
        fileType: item.fileType,
        url: item.url
      }));
    },
  });

  // Handler for content deletion
  const handleDeleteContent = async () => {
    if (!contentToDelete) return;
    
    try {
      // Delete the content via API
      await apiRequest('DELETE', `/api/content/${contentToDelete.id}`, {});
      
      // Invalidate the content query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      
      toast({
        title: "Content deleted",
        description: "The content has been successfully deleted.",
      });
      
      // Close the dialog
      setContentToDelete(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem deleting the content.",
        variant: "destructive",
      });
    }
  };
  
  // When a file is successfully uploaded, refresh the content list
  const onUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    setShowUploader(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Content Upload</h1>
          <p className="text-gray-400 mt-1">Upload and manage your content for review.</p>
        </div>
        <Button onClick={() => setShowUploader(!showUploader)}>
          {showUploader ? 'Hide Upload Form' : '+ New Upload'}
        </Button>
      </div>

      {/* Content Upload Form (togglable) */}
      {showUploader && <ContentUploader />}

      {/* Uploaded Content */}
      <div className="bg-background-card rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Recent Uploads</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentUploads.map((content) => (
            <ContentCard 
              key={content.id}
              content={content}
              onView={(content) => setViewingContent(content)}
              onEdit={(content) => {
                toast({
                  title: "Edit not implemented",
                  description: "Editing functionality would be implemented in a production app.",
                });
              }}
              onDelete={(content) => setContentToDelete(content)}
            />
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <Button variant="link" className="text-primary">
            View All Uploads
          </Button>
        </div>
      </div>

      {/* Content Viewing Dialog */}
      <Dialog open={!!viewingContent} onOpenChange={(open) => !open && setViewingContent(null)}>
        {viewingContent && (
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{viewingContent.title}</DialogTitle>
              <DialogDescription>{viewingContent.description}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <img 
                src={viewingContent.thumbnailUrl} 
                alt={viewingContent.title} 
                className="w-full h-auto rounded-lg"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingContent(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contentToDelete} onOpenChange={(open) => !open && setContentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the content
              from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContent} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
