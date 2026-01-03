import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function TabsTrigger({
  value: triggerValue,
  className,
  children,
  disabled = false,
}: TabsTriggerProps) {
  const { value, onValueChange } = useTabsContext();
  const isActive = value === triggerValue;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onValueChange(triggerValue)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50",
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ value: contentValue, className, children }: TabsContentProps) {
  const { value } = useTabsContext();

  if (value !== contentValue) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
}

