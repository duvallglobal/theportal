import React, { useState, useEffect, useRef } from 'react';
import { 
  useFloating, 
  autoUpdate, 
  offset, 
  flip, 
  shift, 
  arrow,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingArrow,
  Placement
} from '@floating-ui/react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/use-onboarding';
import { X } from 'lucide-react';

interface OnboardingTooltipProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OnboardingTooltip({ open, onOpenChange }: OnboardingTooltipProps) {
  const { activeTooltip, dismissTooltip, completeTooltip } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);
  
  // Control the tooltip visibility
  useEffect(() => {
    if (activeTooltip) {
      setIsOpen(true);
      if (onOpenChange) onOpenChange(true);
    } else {
      setIsOpen(false);
      if (onOpenChange) onOpenChange(false);
    }
  }, [activeTooltip, onOpenChange]);
  
  // Control from parent if needed
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);
  
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      if (onOpenChange) onOpenChange(open);
      if (!open && activeTooltip) dismissTooltip();
    },
    placement: (activeTooltip?.placement as Placement) || 'bottom',
    // Make sure the tooltip stays connected to its target
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      flip({
        fallbackAxisSideDirection: 'end',
      }),
      shift(),
      arrow({ element: arrowRef }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  useEffect(() => {
    if (!activeTooltip) return;

    // Select the target element based on selector or ID
    const targetSelector = activeTooltip.targetSelector || 
                           (activeTooltip.targetElementId ? `#${activeTooltip.targetElementId}` : null);
    
    if (!targetSelector) return;
    
    const element = document.querySelector(targetSelector);
    if (element) {
      refs.setReference(element);
    }
  }, [activeTooltip, refs]);

  // Don't render if there's no active tooltip
  if (!activeTooltip) return null;

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={`z-50 max-w-sm rounded bg-popover p-4 shadow-md border border-border animate-in fade-in-0 zoom-in-95`}
      {...getFloatingProps()}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-foreground">{activeTooltip.title}</h3>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6"
          onClick={() => dismissTooltip()}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mb-4 text-sm text-muted-foreground">{activeTooltip.content}</div>
      
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          onClick={() => {
            completeTooltip(activeTooltip.id, activeTooltip.requiredStep);
          }}
          className="text-xs"
        >
          Got it
        </Button>
      </div>
      
      <FloatingArrow ref={arrowRef} context={context} className="fill-popover" />
    </div>
  );
}

export function OnboardingTooltipContainer() {
  return <OnboardingTooltip />;
}