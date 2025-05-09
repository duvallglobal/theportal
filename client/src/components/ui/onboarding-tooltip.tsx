import React, { useRef, useEffect, useState } from "react";
import {
  FloatingPortal,
  useFloating,
  useInteractions,
  useDismiss,
  useRole,
  offset,
  arrow,
  autoUpdate,
  shift,
  flip,
  useClick,
} from "@floating-ui/react";
import { OnboardingStep, useOnboarding } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, X, HelpCircle } from "lucide-react";

// Component to render an individual tooltip
export function OnboardingTooltip() {
  const { 
    currentTooltip, 
    isActive, 
    isTooltipVisible, 
    nextStep, 
    prevStep, 
    skipStep, 
    markStepComplete, 
    steps, 
    currentStep 
  } = useOnboarding();
  
  const [, navigate] = useLocation();
  const arrowRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  
  // Setup floating UI
  const { refs, floatingStyles, context } = useFloating({
    open: isTooltipVisible && isActive && !!currentTooltip,
    onOpenChange: () => {},
    middleware: [
      offset(12),
      flip(),
      shift(),
      arrow({ element: arrowRef }),
    ],
    placement: currentTooltip?.placement || "bottom",
    whileElementsMounted: autoUpdate,
  });
  
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);
  
  // Update reference element when the tooltip changes
  useEffect(() => {
    if (!currentTooltip || !isActive) return;
    
    const targetElement = document.querySelector(currentTooltip.target);
    if (targetElement) {
      refs.setReference(targetElement);
    }
  }, [currentTooltip, isActive, refs]);
  
  // Navigation to the correct page if needed
  useEffect(() => {
    if (!currentTooltip || !isActive) return;
    
    const currentPath = window.location.pathname;
    if (currentTooltip.page !== currentPath) {
      navigate(currentTooltip.page);
    }
  }, [currentTooltip, isActive, navigate]);
  
  // Set mounted state for client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || !currentTooltip || !isActive || !isTooltipVisible) {
    return null;
  }
  
  // Calculate progress
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  // Determine if we're at the first or last step
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  
  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className={cn(
          "z-50 max-w-md p-5 rounded-lg shadow-lg bg-card border border-border",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        {...getFloatingProps()}
      >
        {currentTooltip.withArrow && (
          <div
            ref={arrowRef}
            className="absolute z-[-1] h-2 w-2 rotate-45 bg-card border border-border"
          />
        )}
        
        {/* Tooltip Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {currentTooltip.title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={skipStep}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        {/* Tooltip Content */}
        <div className="text-muted-foreground mb-4">
          {currentTooltip.description}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted h-1 mb-4 rounded-full">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Tooltip Footer */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            
            {isLastStep ? (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => markStepComplete(currentTooltip.id)}
              >
                Finish
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => markStepComplete(currentTooltip.id)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </FloatingPortal>
  );
}

// Help button to toggle onboarding
export function OnboardingHelpButton() {
  const { startOnboarding, isActive } = useOnboarding();
  
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full h-9 w-9 fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
      onClick={startOnboarding}
      disabled={isActive}
    >
      <HelpCircle className="h-5 w-5" />
      <span className="sr-only">Help</span>
    </Button>
  );
}

// Component to add spotlight effect to target elements
export function OnboardingSpotlight() {
  const { currentTooltip, isActive, isTooltipVisible } = useOnboarding();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  useEffect(() => {
    if (!currentTooltip || !isActive || !isTooltipVisible) {
      setTargetRect(null);
      return;
    }
    
    const targetElement = document.querySelector(currentTooltip.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
      
      // Add highlight class to target element
      targetElement.classList.add('onboarding-target');
      
      return () => {
        targetElement.classList.remove('onboarding-target');
      };
    }
  }, [currentTooltip, isActive, isTooltipVisible]);
  
  if (!targetRect || !currentTooltip || !isActive || !isTooltipVisible) {
    return null;
  }
  
  const padding = currentTooltip.spotlightPadding || 8;
  
  return (
    <FloatingPortal>
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 pointer-events-none">
        <div
          className="absolute bg-transparent transition-all duration-200"
          style={{
            top: targetRect.top - padding + window.scrollY,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '4px',
          }}
        />
      </div>
    </FloatingPortal>
  );
}