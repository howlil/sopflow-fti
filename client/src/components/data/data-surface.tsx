import * as React from 'react'
import { cn } from '@/utils/cn'

const DataSurfaceRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-testid="data-surface"
    className={cn(
      'overflow-hidden rounded-surface border border-border bg-surface',
      className,
    )}
    {...props}
  />
))
DataSurfaceRoot.displayName = 'DataSurfaceRoot'

const DataSurfaceHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-3 border-b border-border p-card', className)}
    {...props}
  />
))
DataSurfaceHeader.displayName = 'DataSurfaceHeader'

const DataSurfaceTabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('min-w-0 overflow-x-auto overscroll-x-contain', className)}
    {...props}
  />
))
DataSurfaceTabs.displayName = 'DataSurfaceTabs'

const DataSurfaceToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', className)}
    {...props}
  />
))
DataSurfaceToolbar.displayName = 'DataSurfaceToolbar'

const DataSurfaceActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-wrap gap-2 sm:ml-auto sm:justify-end', className)}
    {...props}
  />
))
DataSurfaceActions.displayName = 'DataSurfaceActions'

const DataSurfaceFilterRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-wrap items-center gap-2', className)}
    {...props}
  />
))
DataSurfaceFilterRow.displayName = 'DataSurfaceFilterRow'

export const DataSurface = {
  Root: DataSurfaceRoot,
  Header: DataSurfaceHeader,
  Tabs: DataSurfaceTabs,
  Toolbar: DataSurfaceToolbar,
  Actions: DataSurfaceActions,
  FilterRow: DataSurfaceFilterRow,
}
