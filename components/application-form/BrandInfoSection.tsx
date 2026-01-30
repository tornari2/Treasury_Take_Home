import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BeverageType } from '@/lib/validation/types';

interface BrandInfoSectionProps {
  brandName: string;
  fancifulName: string;
  beverageType: BeverageType | '';
  errors: Record<string, string>;
  onBrandNameChange: (value: string) => void;
  onFancifulNameChange: (value: string) => void;
}

export function BrandInfoSection({
  brandName,
  fancifulName,
  beverageType,
  errors,
  onBrandNameChange,
  onFancifulNameChange,
}: BrandInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Brand Information</h3>

      <div className="space-y-2">
        <Label htmlFor="brandName">
          Brand Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="brandName"
          value={brandName}
          onChange={(e) => onBrandNameChange(e.target.value)}
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
            onChange={(e) => onFancifulNameChange(e.target.value)}
            placeholder="Enter fanciful name"
          />
        </div>
      )}
    </div>
  );
}
