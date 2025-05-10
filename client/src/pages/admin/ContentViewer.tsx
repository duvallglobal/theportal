import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  Image, FileText, Video, Package, Search,
  User, Calendar, Filter, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MediaFile {
  id: number;
  title: string;
  description: string | null;
  fileType: string;
  storagePath: string;
  thumbnailPath: string | null;
  scheduledDate: string | null;
  tags: string[] | null;
  clientId: number;
  client: {
    id: number;
    username: string;
    fullName: string;
  };
  createdAt: string;
}

export default function ContentViewer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedContent, setSelectedContent] = useState<MediaFile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch all media files
  const {
    data: mediaFiles = [],
    isLoading,
    error,
  } = useQuery<MediaFile[]>({
    queryKey: ['/api/admin/media-files'],
    staleTime: 60000, // 1 minute
  });

  // Fetch all users for the filter
  const { data: users = [] } = useQuery<{ id: number; username: string; fullName: string }[]>({
    queryKey: ['/api/admin/users'],
    staleTime: 300000, // 5 minutes
  });

  // Apply filters and search
  const filteredContent = mediaFiles.filter((item) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ?? false);

    // Filter by client
    const matchesClient = selectedClient === 'all' || item.clientId.toString() === selectedClient;

    // Filter by file type
    const matchesType = selectedType === 'all' || item.fileType === selectedType;

    return matchesSearch && matchesClient && matchesType;
  });

  // Helper to get file type icon
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleContentClick = (content: MediaFile) => {
    setSelectedContent(content);
    setIsDetailModalOpen(true);
  };

  // Handle any errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading content',
        description: 'There was a problem loading the content. Please refresh the page.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">Content Viewer</h1>
          <p className="text-muted-foreground">View and browse client content</p>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title, description or tags..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-10 w-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-10 w-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="8" x2="21" y1="6" y2="6" />
                  <line x1="8" x2="21" y1="12" y2="12" />
                  <line x1="8" x2="21" y1="18" y2="18" />
                  <line x1="3" x2="3.01" y1="6" y2="6" />
                  <line x1="3" x2="3.01" y1="12" y2="12" />
                  <line x1="3" x2="3.01" y1="18" y2="18" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Content display */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Package className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No content found</h3>
                <p className="text-muted-foreground text-center max-w-md mt-1">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredContent.map((content) => (
                  <div
                    key={content.id}
                    className="flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleContentClick(content)}
                  >
                    <div className="relative h-48 bg-muted flex items-center justify-center">
                      {content.thumbnailPath ? (
                        <img
                          src={content.thumbnailPath}
                          alt={content.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-muted">
                          {getFileTypeIcon(content.fileType)}
                          <span className="ml-2 text-muted-foreground">{content.fileType}</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">{content.fileType}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col p-4">
                      <h3 className="font-medium line-clamp-1" title={content.title}>
                        {content.title}
                      </h3>
                      <div className="flex items-center mt-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3 mr-1" />
                        <span>{content.user.fullName}</span>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(content.createdAt)}</span>
                      </div>
                      {content.tags && content.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {content.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {content.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{content.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {filteredContent.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-center py-4 px-2 hover:bg-muted/50 rounded-md cursor-pointer"
                    onClick={() => handleContentClick(content)}
                  >
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center mr-4">
                      {content.thumbnailPath ? (
                        <img
                          src={content.thumbnailPath}
                          alt={content.title}
                          className="h-full w-full object-cover rounded"
                        />
                      ) : (
                        getFileTypeIcon(content.fileType)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" title={content.title}>
                        {content.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {content.user.fullName}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(content.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Badge variant="secondary">{content.fileType}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content details modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedContent.title}</DialogTitle>
                <DialogDescription>
                  Uploaded by {selectedContent.user.fullName} on{' '}
                  {formatDate(selectedContent.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="preview" className="mt-4">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <div className="flex items-center justify-center bg-muted rounded-lg p-4 min-h-[300px]">
                    {selectedContent.fileType === 'image' ? (
                      <img
                        src={selectedContent.storagePath}
                        alt={selectedContent.title}
                        className="max-h-[500px] rounded-md object-contain"
                      />
                    ) : selectedContent.fileType === 'video' ? (
                      <video
                        src={selectedContent.storagePath}
                        controls
                        className="max-h-[500px] rounded-md"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        {getFileTypeIcon(selectedContent.fileType)}
                        <span className="mt-2 text-muted-foreground">
                          Preview not available for this file type
                        </span>
                        <Button className="mt-4" asChild>
                          <a
                            href={selectedContent.storagePath}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open File
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="details">
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Client Information</h4>
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar>
                            <AvatarFallback>
                              {selectedContent.user.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedContent.user.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              @{selectedContent.user.username}
                            </p>
                          </div>
                        </div>

                        <h4 className="font-medium mb-2">Content Information</h4>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Type:</dt>
                            <dd className="font-medium">{selectedContent.fileType}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Created:</dt>
                            <dd className="font-medium">{formatDate(selectedContent.createdAt)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Scheduled:</dt>
                            <dd className="font-medium">
                              {selectedContent.scheduledDate
                                ? formatDate(selectedContent.scheduledDate)
                                : 'Not scheduled'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-muted-foreground mb-4">
                          {selectedContent.description || 'No description provided'}
                        </p>

                        <h4 className="font-medium mb-2">Tags</h4>
                        {selectedContent.tags && selectedContent.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedContent.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No tags</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  asChild
                  className="mr-auto"
                >
                  <a
                    href={selectedContent.storagePath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Original
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}