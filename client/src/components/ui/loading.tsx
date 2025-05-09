import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "muted";
  withText?: boolean;
  text?: string;
};

const sizeClasses = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-3",
  lg: "h-8 w-8 border-4",
  xl: "h-12 w-12 border-4",
};

const variantClasses = {
  default: "border-muted-foreground border-t-transparent",
  primary: "border-primary border-t-transparent",
  secondary: "border-secondary border-t-transparent",
  muted: "border-muted border-t-transparent",
};

// Elegant circular spinner component
export function LoadingSpinner({
  className,
  size = "md",
  variant = "primary",
  withText = false,
  text = "Loading",
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {withText && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Full page loading spinner with overlay
export function FullPageLoading({
  variant = "primary",
  text,
}: Omit<LoadingSpinnerProps, "size" | "className">) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="xl" variant={variant} />
        {text && <p className="text-muted-foreground text-sm">{text}</p>}
      </div>
    </div>
  );
}

// Inline Lucide icon spinner (good for buttons)
export function ButtonSpinner({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  
  return <Loader2 className={cn("animate-spin", className)} size={sizeMap[size]} />;
}

// Section loader for content areas
export function SectionLoader({
  height = "h-40",
  variant = "primary",
  text,
}: {
  height?: string;
  variant?: LoadingSpinnerProps["variant"];
  text?: string;
}) {
  return (
    <div className={cn("w-full flex flex-col items-center justify-center", height)}>
      <LoadingSpinner size="lg" variant={variant} />
      {text && <p className="mt-3 text-muted-foreground text-sm">{text}</p>}
    </div>
  );
}

// Animated skeleton loader for content placeholders
export function SkeletonLoader({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "card" | "text" | "image";
}) {
  const variantMap = {
    default: "h-4 w-full",
    card: "h-[150px] w-full rounded-lg",
    text: "h-4 w-3/4",
    image: "aspect-video w-full rounded-lg",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-muted/60 rounded",
        variantMap[variant],
        className
      )}
    />
  );
}

// Data table loading state
export function TableLoader({
  rowCount = 5,
  columnCount = 4,
  showHeader = true,
}: {
  rowCount?: number;
  columnCount?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex gap-4 p-4 border-b">
          {Array.from({ length: columnCount }).map((_, i) => (
            <SkeletonLoader key={`header-${i}`} className="h-5 w-28" />
          ))}
        </div>
      )}
      <div className="flex flex-col">
        {Array.from({ length: rowCount }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex gap-4 p-4 border-b">
            {Array.from({ length: columnCount }).map((_, colIdx) => (
              <SkeletonLoader
                key={`cell-${rowIdx}-${colIdx}`}
                className={`h-5 ${colIdx === 0 ? "w-12" : "w-28"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Content card skeleton
export function CardLoader() {
  return (
    <div className="border rounded-lg p-4 space-y-4 shadow-sm animate-pulse">
      <SkeletonLoader className="h-5 w-3/4" />
      <SkeletonLoader className="h-4 w-full" />
      <SkeletonLoader className="h-4 w-1/2" />
      <div className="pt-2">
        <SkeletonLoader className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

// Dots loading animation (like typing indicator)
export function DotsLoader() {
  return (
    <div className="flex space-x-1 items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
    </div>
  );
}

// Progress bar loader
export function ProgressLoader({ 
  progress = 0,
  height = "h-1",
  className
}: { 
  progress: number;
  height?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full bg-muted rounded-full overflow-hidden", height, className)}>
      <div 
        className="bg-primary h-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
}

// Form submit button with loading state
export function LoadingButton({
  isLoading = false,
  disabled = false,
  loadingText = "Processing...",
  children,
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  variant?: "default" | "primary" | "secondary" | "ghost" | "link" | "destructive";
}) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 px-4 py-2",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <ButtonSpinner className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}