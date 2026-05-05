import Image from 'next/image';
import Card from '@/components/ui/Card';

interface CuratedOptionCardProps {
  imageUrl: string;
  name: string;
  price: number;
  tier: 'good' | 'better' | 'best';
  upgradeDifference?: number;
  description?: string;
  onSelect?: () => void;
  selected?: boolean;
}

export default function CuratedOptionCard({
  imageUrl,
  name,
  price,
  tier,
  upgradeDifference,
  description,
  onSelect,
  selected = false,
}: CuratedOptionCardProps) {
  const tierConfig = {
    good: {
      label: 'Good',
      color: 'text-neutral-700',
      badge: 'bg-neutral-100 text-neutral-700',
    },
    better: {
      label: 'Better',
      color: 'text-brass-700',
      badge: 'bg-brass-100 text-brass-700',
    },
    best: {
      label: 'Best',
      color: 'text-brass-800',
      badge: 'bg-brass-200 text-brass-900',
    },
  };

  const config = tierConfig[tier];

  return (
    <Card
      hover
      onClick={onSelect}
      className={`transition-all ${selected ? 'ring-2 ring-brass-500' : ''}`}
    >
      {/* Tier Badge */}
      <div className="flex justify-between items-start mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
          {config.label}
        </span>
        {selected && (
          <svg className="w-6 h-6 text-brass-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {/* Image */}
      <div className="relative w-full aspect-square bg-neutral-100 rounded-button overflow-hidden mb-4">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div>
        <h4 className="font-semibold text-neutral-900 mb-1">{name}</h4>
        {description && (
          <p className="text-sm text-neutral-600 mb-3">{description}</p>
        )}
        
        <div className="flex justify-between items-end">
          <div>
            <div className="text-2xl font-bold text-neutral-900">
              ${price.toLocaleString()}
            </div>
            {upgradeDifference !== undefined && upgradeDifference !== 0 && (
              <div className={`text-sm ${upgradeDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {upgradeDifference > 0 ? '+' : ''}${Math.abs(upgradeDifference).toLocaleString()} {upgradeDifference > 0 ? 'upgrade' : 'savings'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
