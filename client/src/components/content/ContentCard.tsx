import { format } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  status: 'approved' | 'processing' | 'scheduled' | 'rejected';
  uploadedAt: Date;
  scheduledDate?: Date;
  thumbnailUrl: string;
}

interface ContentCardProps {
  content: ContentItem;
  onView: (content: ContentItem) => void;
  onEdit: (content: ContentItem) => void;
  onDelete: (content: ContentItem) => void;
  className?: string;
}

const statusStyles = {
  approved: 'bg-green-500 bg-opacity-20 text-green-400',
  processing: 'bg-yellow-500 bg-opacity-20 text-yellow-400',
  scheduled: 'bg-blue-500 bg-opacity-20 text-blue-400',
  rejected: 'bg-red-500 bg-opacity-20 text-red-400',
};

export function ContentCard({ content, onView, onEdit, onDelete, className }: ContentCardProps) {
  return (
    <div className={cn("bg-background-lighter rounded-lg overflow-hidden", className)}>
      <div 
        className="w-full h-48 bg-center bg-cover" 
        style={{ backgroundImage: `url(${content.thumbnailUrl})` }}
      ></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium">{content.title}</h3>
          <span className={cn("text-xs font-medium py-1 px-2 rounded-full", statusStyles[content.status])}>
            {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-3">{content.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">
            {content.status === 'scheduled' && content.scheduledDate 
              ? `Publishes on ${format(content.scheduledDate, 'MMM d, yyyy')}`
              : `Uploaded ${format(content.uploadedAt, 'MMM d, yyyy')}`
            }
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(content)}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(content)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(content)}
                className="text-red-500"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
