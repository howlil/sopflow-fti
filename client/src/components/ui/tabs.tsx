import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/utils/cn'

const Tabs = TabsPrimitive.Root

type TabsVisualVariant = 'segmented' | 'line'

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsVisualVariant
}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'segmented', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'max-w-full items-center justify-start overflow-x-auto overscroll-x-contain text-muted-foreground [scrollbar-width:thin]',
      variant === 'segmented'
        ? 'inline-flex h-10 rounded-control bg-surface-muted p-1'
        : 'flex h-10 w-full rounded-none border-b border-border bg-transparent p-0',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: TabsVisualVariant
}

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = 'segmented', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex h-full items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-[color,background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground',
      variant === 'segmented'
        ? 'shrink-0 rounded-md px-3 py-1 data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-surface'
        : 'flex-1 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsVisualVariant }
