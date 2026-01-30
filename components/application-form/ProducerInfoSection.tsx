import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { OriginType } from '@/lib/validation/types';

interface ProducerInfoSectionProps {
  producerName: string;
  producerCity: string;
  producerState: string;
  originType: OriginType | '';
  errors: Record<string, string>;
  onProducerNameChange: (value: string) => void;
  onProducerCityChange: (value: string) => void;
  onProducerStateChange: (value: string) => void;
}

export function ProducerInfoSection({
  producerName,
  producerCity,
  producerState,
  originType,
  errors,
  onProducerNameChange,
  onProducerCityChange,
  onProducerStateChange,
}: ProducerInfoSectionProps) {
  const labelPrefix = originType === OriginType.IMPORTED ? 'Importer' : 'Producer';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{labelPrefix} Information</h3>

      <div className="space-y-2">
        <Label htmlFor="producerName">
          {labelPrefix} Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="producerName"
          value={producerName}
          onChange={(e) => onProducerNameChange(e.target.value)}
          placeholder={`Enter ${labelPrefix.toLowerCase()} name`}
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
            onChange={(e) => onProducerCityChange(e.target.value)}
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
            onChange={(e) => onProducerStateChange(e.target.value)}
            placeholder="Enter state"
          />
          {errors.producerState && <p className="text-sm text-red-500">{errors.producerState}</p>}
        </div>
      </div>
    </div>
  );
}
