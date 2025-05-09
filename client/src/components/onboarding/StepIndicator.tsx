import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  step: number;
  title: string;
  status: 'completed' | 'current' | 'pending';
  onClick: () => void;
}

export function StepIndicator({ step, title, status, onClick }: StepIndicatorProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn(
        status === 'completed' && 'bg-primary text-white',
        status === 'current' && 'bg-primary-light text-white',
        status === 'pending' && 'bg-background-lighter text-gray-300'
      )}
    >
      {step}. {title}
    </Button>
  );
}
