import { useState } from 'react';
import { Camera, CreditCard, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentUploaderProps {
  title: string;
  description: string;
  icon: 'id' | 'camera';
  onFileSelect: (file: File) => void;
  file: File | null;
}

export function DocumentUploader({
  title,
  description,
  icon,
  onFileSelect,
  file
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const uploadedFile = e.dataTransfer.files[0];
      onFileSelect(uploadedFile);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFile = e.target.files[0];
      onFileSelect(uploadedFile);
    }
  };
  
  return (
    <div 
      className={`border-2 border-dashed ${isDragging ? 'border-primary' : 'border-gray-600'} ${file ? 'border-green-500' : ''} rounded-lg p-6 text-center transition-colors`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-4 text-gray-400">
        {icon === 'id' ? (
          <CreditCard className="h-8 w-8 mx-auto" />
        ) : (
          <Camera className="h-8 w-8 mx-auto" />
        )}
      </div>
      <h3 className="text-white font-medium mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      
      <input
        type="file"
        id={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {file ? (
        <div className="flex flex-col items-center">
          <div className="bg-green-500 bg-opacity-20 text-green-400 rounded-full p-2 mb-2">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-400 text-sm font-medium mb-2">File Uploaded</p>
          <p className="text-gray-400 text-xs truncate max-w-full">{file.name}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              const fileInput = document.getElementById(`upload-${title.replace(/\s+/g, '-').toLowerCase()}`) as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          >
            Change
          </Button>
        </div>
      ) : (
        <Button 
          variant="outline"
          onClick={() => {
            const fileInput = document.getElementById(`upload-${title.replace(/\s+/g, '-').toLowerCase()}`) as HTMLInputElement;
            if (fileInput) fileInput.click();
          }}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" /> Upload
        </Button>
      )}
    </div>
  );
}
