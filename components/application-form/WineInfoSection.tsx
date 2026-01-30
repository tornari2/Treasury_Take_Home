import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BeverageType } from '@/lib/validation/types';

interface WineInfoSectionProps {
  appellation: string;
  varietal: string;
  beverageType: BeverageType | '';
  onAppellationChange: (value: string) => void;
  onVarietalChange: (value: string) => void;
}

export function WineInfoSection({
  appellation,
  varietal,
  beverageType,
  onAppellationChange,
  onVarietalChange,
}: WineInfoSectionProps) {
  if (beverageType !== BeverageType.WINE) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Wine-Specific Information (Optional)</h3>

      <div className="space-y-2">
        <Label htmlFor="appellation">Appellation</Label>
        <Input
          id="appellation"
          value={appellation}
          onChange={(e) => onAppellationChange(e.target.value)}
          placeholder="Enter appellation"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="varietal">Varietal</Label>
        <Input
          id="varietal"
          value={varietal}
          onChange={(e) => onVarietalChange(e.target.value)}
          placeholder="e.g., Chardonnay, Cabernet Sauvignon"
        />
      </div>
    </div>
  );
}
