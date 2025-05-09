import { useState } from 'react';
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
import { apiRequest } from '@/lib/queryClient';

export default function ContentUpload() {
  const [showUploader, setShowUploader] = useState(false);
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null);
  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null);
  const { toast } = useToast();

  // Example content items (would come from API in a real app)
  const recentUploads: ContentItem[] = [
    {
      id: '1',
      title: 'Profile Update',
      description: 'New profile photos for OnlyFans main page',
      status: 'approved',
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      thumbnailUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400'
    },
    {
      id: '2',
      title: 'Behind the Scenes',
      description: 'Video clip from recent photo shoot',
      status: 'processing',
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      thumbnailUrl: 'https://pixabay.com/get/g89d730ffe5c72442af87a1042028ac4515de07e962264d448254d362ef91bc7cae692807aa27a838d1b331d8b2218ce02a3556c6b2bdac2468a766335be2c294_1280.jpg'
    },
    {
      id: '3',
      title: 'Summer Collection',
      description: 'Set of 12 photos for summer promotion',
      status: 'scheduled',
      uploadedAt: new Date(),
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400'
    }
  ];

  // Handler for content deletion
  const handleDeleteContent = async () => {
    if (!contentToDelete) return;
    
    try {
      // Delete the content via API
      await apiRequest('DELETE', `/api/content/${contentToDelete.id}`, {});
      
      toast({
        title: "Content deleted",
        description: "The content has been successfully deleted.",
      });
      
      // Close the dialog and refresh content
      setContentToDelete(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem deleting the content.",
        variant: "destructive",
      });
    }
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
