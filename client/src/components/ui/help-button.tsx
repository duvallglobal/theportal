import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/use-onboarding';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HelpCircle } from 'lucide-react';

export function HelpButton() {
  const { tooltips, showTooltip, isTooltipCompleted } = useOnboarding();
  const [open, setOpen] = useState(false);

  // Show only active tooltips that aren't completed
  const activeTooltips = tooltips.filter(tooltip => !isTooltipCompleted(tooltip.id));
  
  if (activeTooltips.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          size="icon" 
          variant="outline" 
          className="fixed bottom-4 right-4 rounded-full w-12 h-12 bg-primary text-primary-foreground shadow-lg"
        >
          <HelpCircle className="h-6 w-6" />
          {activeTooltips.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {activeTooltips.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {activeTooltips.map(tooltip => (
          <DropdownMenuItem
            key={tooltip.id}
            onClick={() => {
              showTooltip(tooltip.id);
              setOpen(false);
            }}
            className="cursor-pointer"
          >
            <span className="flex-1">{tooltip.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}