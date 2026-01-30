'use client';

import { useState } from 'react';
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
import { BeverageType, OriginType, ApplicationData } from '@/lib/validation/types';
import type { ImageType } from '@/types/database';
import { X } from 'lucide-react';

interface ImageUpload {
  file: File;
  imageType: ImageType;
  preview: string;
}

interface ApplicationFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function ApplicationForm({ onSuccess, onClose }: ApplicationFormProps) {
  const [ttbId, setTtbId] = useState('');
  const [beverageType, setBeverageType] = useState<BeverageType | ''>('');
  const [originType, setOriginType] = useState<OriginType | ''>('');
  const [brandName, setBrandName] = useState('');
  const [fancifulName, setFancifulName] = useState('');
  const [producerName, setProducerName] = useState('');
  const [producerCity, setProducerCity] = useState('');
  const [producerState, setProducerState] = useState('');
  const [appellation, setAppellation] = useState('');
  const [varietal, setVarietal] = useState('');
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageTypes: ImageType[] = ['front', 'back', 'side', 'neck', 'other'];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          images: 'Only image files are allowed',
        }));
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          images: 'Image size must be less than 10MB',
        }));
        return;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      setImages((prev) => {
        const currentIndex = prev.length;
        const imageType = imageTypes[currentIndex % imageTypes.length];
        return [
          ...prev,
          {
            file,
            imageType,
            preview,
          },
        ];
      });
    });

    // Clear file input
    event.target.value = '';
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.images;
      return newErrors;
    });
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleImageTypeChange = (index: number, imageType: ImageType) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages[index].imageType = imageType;
      return newImages;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!beverageType) {
      newErrors.beverageType = 'Beverage type is required';
    }
    if (!originType) {
      newErrors.originType = 'Origin type is required';
    }
    if (!brandName.trim()) {
      newErrors.brandName = 'Brand name is required';
    }
    if (!producerName.trim()) {
      newErrors.producerName =
        originType === OriginType.IMPORTED
          ? 'Importer name is required'
          : 'Producer name is required';
    }
    if (!producerCity.trim()) {
      newErrors.producerCity =
        originType === OriginType.IMPORTED
          ? 'Importer city is required'
          : 'Producer city is required';
    }
    if (!producerState.trim()) {
      newErrors.producerState =
        originType === OriginType.IMPORTED
          ? 'Importer state is required'
          : 'Producer state is required';
    }
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build ApplicationData object
      const applicationData: Omit<ApplicationData, 'id' | 'labelImages'> = {
        ttbId: ttbId.trim() || null,
        beverageType: beverageType as BeverageType,
        originType: originType as OriginType,
        brandName: brandName.trim(),
        fancifulName: beverageType === BeverageType.WINE ? null : fancifulName.trim() || null,
        producerName: producerName.trim(),
        producerAddress: {
          city: producerCity.trim(),
          state: producerState.trim(),
        },
        appellation:
          beverageType === BeverageType.WINE && appellation.trim() ? appellation.trim() : null,
        varietal: beverageType === BeverageType.WINE && varietal.trim() ? varietal.trim() : null,
        vintageDate: null,
        other: null,
      };

      // Create FormData
      const formData = new FormData();
      formData.append('applicationData', JSON.stringify(applicationData));

      // Add images with their types
      images.forEach((image) => {
        formData.append('images', image.file);
        formData.append('imageTypes', image.imageType);
      });

      // Submit to API
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create application');
      }

      // Clean up preview URLs
      images.forEach((image) => URL.revokeObjectURL(image.preview));

      // Success - close dialog and refresh
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create application',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="space-y-2">
          <Label htmlFor="ttbId">TTB ID (Optional)</Label>
          <Input
            id="ttbId"
            value={ttbId}
            onChange={(e) => setTtbId(e.target.value)}
            placeholder="Enter TTB ID"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="beverageType">
              Beverage Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={beverageType}
              onValueChange={(value) => {
                setBeverageType(value as BeverageType);
                // Clear fanciful name when switching to wine
                if (value === BeverageType.WINE) {
                  setFancifulName('');
                }
              }}
            >
              <SelectTrigger id="beverageType">
                <SelectValue placeholder="Select beverage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BeverageType.BEER}>Malt Beverage</SelectItem>
                <SelectItem value={BeverageType.WINE}>Wine</SelectItem>
                <SelectItem value={BeverageType.SPIRITS}>Distilled Spirits</SelectItem>
              </SelectContent>
            </Select>
            {errors.beverageType && <p className="text-sm text-red-500">{errors.beverageType}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="originType">
              Origin Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={originType}
              onValueChange={(value) => setOriginType(value as OriginType)}
            >
              <SelectTrigger id="originType">
                <SelectValue placeholder="Select origin type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OriginType.DOMESTIC}>Domestic</SelectItem>
                <SelectItem value={OriginType.IMPORTED}>Imported</SelectItem>
              </SelectContent>
            </Select>
            {errors.originType && <p className="text-sm text-red-500">{errors.originType}</p>}
          </div>
        </div>
      </div>

      {/* Brand Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Brand Information</h3>

        <div className="space-y-2">
          <Label htmlFor="brandName">
            Brand Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="brandName"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Enter brand name"
          />
          {errors.brandName && <p className="text-sm text-red-500">{errors.brandName}</p>}
        </div>

        {beverageType !== BeverageType.WINE && (
          <div className="space-y-2">
            <Label htmlFor="fancifulName">Fanciful Name (Optional)</Label>
            <Input
              id="fancifulName"
              value={fancifulName}
              onChange={(e) => setFancifulName(e.target.value)}
              placeholder="Enter fanciful name"
            />
          </div>
        )}
      </div>

      {/* Producer/Importer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {originType === OriginType.IMPORTED ? 'Importer Information' : 'Producer Information'}
        </h3>

        <div className="space-y-2">
          <Label htmlFor="producerName">
            {originType === OriginType.IMPORTED ? 'Importer Name' : 'Producer Name'}{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="producerName"
            value={producerName}
            onChange={(e) => setProducerName(e.target.value)}
            placeholder={
              originType === OriginType.IMPORTED ? 'Enter importer name' : 'Enter producer name'
            }
          />
          {errors.producerName && <p className="text-sm text-red-500">{errors.producerName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="producerCity">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="producerCity"
              value={producerCity}
              onChange={(e) => setProducerCity(e.target.value)}
              placeholder="Enter city"
            />
            {errors.producerCity && <p className="text-sm text-red-500">{errors.producerCity}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="producerState">
              State <span className="text-red-500">*</span>
            </Label>
            <Input
              id="producerState"
              value={producerState}
              onChange={(e) => setProducerState(e.target.value)}
              placeholder="Enter state"
            />
            {errors.producerState && <p className="text-sm text-red-500">{errors.producerState}</p>}
          </div>
        </div>
      </div>

      {/* Wine-specific fields */}
      {beverageType === BeverageType.WINE && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Wine-Specific Information (Optional)</h3>

          <div className="space-y-2">
            <Label htmlFor="appellation">Appellation</Label>
            <Input
              id="appellation"
              value={appellation}
              onChange={(e) => setAppellation(e.target.value)}
              placeholder="Enter appellation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="varietal">Varietal</Label>
            <Input
              id="varietal"
              value={varietal}
              onChange={(e) => setVarietal(e.target.value)}
              placeholder="e.g., Chardonnay, Cabernet Sauvignon"
            />
          </div>
        </div>
      )}

      {/* Image Upload */}
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
            onChange={handleImageAdd}
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
                    onValueChange={(value) => handleImageTypeChange(index, value as ImageType)}
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
                  onClick={() => handleImageRemove(index)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Application'}
        </Button>
      </div>
    </form>
  );
}
