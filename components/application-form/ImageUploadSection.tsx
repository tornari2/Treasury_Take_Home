'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ImageType } from '@/types/database';
import { X } from 'lucide-react';

interface ImageUpload {
  file: File;
  imageType: ImageType;
  preview: string;
}

interface ImageUploadSectionProps {
  images: ImageUpload[];
  errors: Record<string, string>;
  isEditMode: boolean;
  onImageAdd: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: (index: number) => void;
  onImageTypeChange: (index: number, imageType: ImageType) => void;
}

export function ImageUploadSection({
  images,
  errors,
  isEditMode,
  onImageAdd,
  onImageRemove,
  onImageTypeChange,
}: ImageUploadSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Label Images</h3>

      <div className="space-y-2">
        <Label htmlFor="images">
          Upload Images <span className="text-red-500">*</span>
        </Label>
        <Input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={onImageAdd}
          className="cursor-pointer"
        />
        {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}
      </div>

      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((image, index) => (
            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
              <img
                src={image.preview}
                alt={`Preview ${index + 1}`}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">{image.file.name}</p>
                <Select
                  value={image.imageType}
                  onValueChange={(value) => onImageTypeChange(index, value as ImageType)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front">Front</SelectItem>
                    <SelectItem value="back">Back</SelectItem>
                    <SelectItem value="side">Side</SelectItem>
                    <SelectItem value="neck">Neck</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onImageRemove(index)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
