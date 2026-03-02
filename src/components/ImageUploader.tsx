import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  images: File[];
  onChange: (files: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 5,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
  className,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file count
    if (images.length + files.length > maxImages) {
      alert(`Chỉ được upload tối đa ${maxImages} ảnh`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        alert(`File ${file.name} không đúng định dạng. Chỉ chấp nhận JPG/PNG.`);
        continue;
      }

      // Check file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        alert(`File ${file.name} quá lớn (${sizeMB.toFixed(2)}MB). Tối đa ${maxSizeMB}MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChange([...images, ...validFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((file, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={URL.createObjectURL(file)}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {(file.size / 1024).toFixed(0)} KB
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">Thêm ảnh</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
        <span>
          {images.length}/{maxImages} ảnh • JPG/PNG • Tối đa {maxSizeMB}MB/ảnh
        </span>
      </div>
    </div>
  );
};

// Component to display existing images (from URL)
interface ImageGalleryProps {
  images: Array<{ imageUrl: string; imageType?: string }>;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, className }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {images.map((image, index) => (
        <div key={index} className="relative group aspect-square">
          <img
            src={image.imageUrl}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(image.imageUrl, '_blank')}
          />
          {image.imageType && (
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {image.imageType === 'CUSTOMER_PROOF' ? 'Khách hàng' : 'Nhân viên'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
