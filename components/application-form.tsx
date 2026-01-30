'use client';

import { Button } from '@/components/ui/button';
import { ApplicationData } from '@/lib/validation/types';
import { BasicInfoSection } from './application-form/BasicInfoSection';
import { BrandInfoSection } from './application-form/BrandInfoSection';
import { ProducerInfoSection } from './application-form/ProducerInfoSection';
import { WineInfoSection } from './application-form/WineInfoSection';
import { ImageUploadSection } from './application-form/ImageUploadSection';
import { useApplicationForm } from './application-form/useApplicationForm';

interface ApplicationFormProps {
  onSuccess: () => void;
  onClose: () => void;
  applicationId?: number;
  initialData?: ApplicationData;
}

export function ApplicationForm({ onSuccess, onClose, applicationId, initialData }: ApplicationFormProps) {
  const {
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
    handleImageAdd,
    handleImageRemove,
    handleImageTypeChange,
    handleSubmit,
    clearFancifulName,
  } = useApplicationForm({
    applicationId,
    initialData,
    onSuccess,
    onClose,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicInfoSection
        ttbId={ttbId}
        beverageType={beverageType}
        originType={originType}
        errors={errors}
        onTtbIdChange={setTtbId}
        onBeverageTypeChange={setBeverageType}
        onOriginTypeChange={setOriginType}
        onFancifulNameClear={clearFancifulName}
      />

      <BrandInfoSection
        brandName={brandName}
        fancifulName={fancifulName}
        beverageType={beverageType}
        errors={errors}
        onBrandNameChange={setBrandName}
        onFancifulNameChange={setFancifulName}
      />

      <ProducerInfoSection
        producerName={producerName}
        producerCity={producerCity}
        producerState={producerState}
        originType={originType}
        errors={errors}
        onProducerNameChange={setProducerName}
        onProducerCityChange={setProducerCity}
        onProducerStateChange={setProducerState}
      />

      <WineInfoSection
        appellation={appellation}
        varietal={varietal}
        beverageType={beverageType}
        onAppellationChange={setAppellation}
        onVarietalChange={setVarietal}
      />

      <ImageUploadSection
        images={images}
        errors={errors}
        isEditMode={isEditMode}
        onImageAdd={handleImageAdd}
        onImageRemove={handleImageRemove}
        onImageTypeChange={handleImageTypeChange}
      />

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
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Application'
              : 'Create Application'}
        </Button>
      </div>
    </form>
  );
}
