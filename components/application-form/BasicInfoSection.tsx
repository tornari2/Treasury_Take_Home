import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BeverageType, OriginType } from '@/lib/validation/types';

interface BasicInfoSectionProps {
  ttbId: string;
  beverageType: BeverageType | '';
  originType: OriginType | '';
  errors: Record<string, string>;
  onTtbIdChange: (value: string) => void;
  onBeverageTypeChange: (value: BeverageType) => void;
  onOriginTypeChange: (value: OriginType) => void;
  onFancifulNameClear: () => void;
}

export function BasicInfoSection({
  ttbId,
  beverageType,
  originType,
  errors,
  onTtbIdChange,
  onBeverageTypeChange,
  onOriginTypeChange,
  onFancifulNameClear,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>

      <div className="space-y-2">
        <Label htmlFor="ttbId">TTB ID (Optional)</Label>
        <Input
          id="ttbId"
          value={ttbId}
          onChange={(e) => onTtbIdChange(e.target.value)}
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
              onBeverageTypeChange(value as BeverageType);
              // Clear fanciful name when switching to wine
              if (value === BeverageType.WINE) {
                onFancifulNameClear();
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
          <Select value={originType} onValueChange={(value) => onOriginTypeChange(value as OriginType)}>
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
  );
}
