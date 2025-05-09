import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface WorkflowCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  iconBgColor: string;
  linkText: string;
  linkPath: string;
  className?: string;
}

export function WorkflowCard({
  title,
  description,
  icon,
  iconBgColor,
  linkText,
  linkPath,
  className
}: WorkflowCardProps) {
  const [, navigate] = useLocation();
  
  const handleClick = () => {
    navigate(linkPath);
  };
  
  return (
    <div 
      className={cn("bg-background-card rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer", className)}
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            {icon}
          </div>
        </div>
        <p className="text-gray-400 mb-6">{description}</p>
        <div className="text-primary hover:text-primary-light font-medium flex items-center">
          <span>{linkText}</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
