import { useState } from 'react';
import { BeverageType, OriginType, ApplicationData } from '@/lib/validation/types';
import type { ImageType } from '@/types/database';

export interface ImageUpload {
  file: File;
  imageType: ImageType;
  preview: string;
}

interface UseApplicationFormProps {
  applicationId?: number;
  initialData?: ApplicationData;
  onSuccess: () => void;
  onClose: () => void;
}

export function useApplicationForm({
  applicationId,
  initialData,
  onSuccess,
  onClose,
}: UseApplicationFormProps) {
  const isEditMode = !!applicationId && !!initialData;

  const [ttbId, setTtbId] = useState(initialData?.ttbId || '');
  const [beverageType, setBeverageType] = useState<BeverageType | ''>(initialData?.beverageType || '');
  const [originType, setOriginType] = useState<OriginType | ''>(initialData?.originType || '');
  const [brandName, setBrandName] = useState(initialData?.brandName || '');
  const [fancifulName, setFancifulName] = useState(initialData?.fancifulName || '');
  const [producerName, setProducerName] = useState(initialData?.producerName || '');
  const [producerCity, setProducerCity] = useState(initialData?.producerAddress?.city || '');
  const [producerState, setProducerState] = useState(initialData?.producerAddress?.state || '');
  const [appellation, setAppellation] = useState(initialData?.appellation || '');
  const [varietal, setVarietal] = useState(initialData?.varietal || '');
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
    // Images are only required when creating, not when editing
    if (!isEditMode && images.length === 0) {
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
      const url = isEditMode ? `/api/applications/${applicationId}` : '/api/applications';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} application`);
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

  return {
    // State
    ttbId,
    beverageType,
    originType,
    brandName,
    fancifulName,
    producerName,
    producerCity,
    producerState,
    appellation,
    varietal,
    images,
    errors,
    isSubmitting,
    isEditMode,
    // Setters
    setTtbId,
    setBeverageType,
    setOriginType,
    setBrandName,
    setFancifulName,
    setProducerName,
    setProducerCity,
    setProducerState,
    setAppellation,
    setVarietal,
    // Handlers
    handleImageAdd,
    handleImageRemove,
    handleImageTypeChange,
    handleSubmit,
    // Helper
    clearFancifulName: () => setFancifulName(''),
  };
}
