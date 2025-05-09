import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface OnboardingProgressCardProps {
  completedSteps: number;
  totalSteps: number;
  className?: string;
}

export function OnboardingProgressCard({ 
  completedSteps, 
  totalSteps,
  className = ""
}: OnboardingProgressCardProps) {
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  return (
    <div className={`bg-background-card rounded-xl shadow-md p-6 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <h3 className="text-lg font-semibold text-white">Complete your onboarding</h3>
          <p className="text-gray-400 mt-1">{completedSteps} of {totalSteps} steps completed</p>
          <div className="w-full md:w-80 h-2 bg-background-lighter rounded-full mt-3">
            <div 
              className="h-2 bg-primary rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        <Button asChild>
          <Link href="/onboarding">
            Continue Onboarding
          </Link>
        </Button>
      </div>
    </div>
  );
}
