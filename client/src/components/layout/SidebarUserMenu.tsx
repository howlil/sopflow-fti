import { useNavigate } from '@tanstack/react-router'
import { CircleUserRound, LogOut } from 'lucide-react'
import { useAuth } from '@/api/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppRole } from '@/hooks/useAppRole'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/utils/constants'
import { getMeRoute } from '@/utils/role-routing'

export interface SidebarUserMenuProps {
  collapsed?: boolean
  onNavigate?: () => void
  className?: string
}

export function SidebarUserMenu({
  collapsed = false,
  onNavigate,
  className,
}: SidebarUserMenuProps) {
  const navigate = useNavigate()
  const { role, getRoleLabel, getRoleNip, getRoleDisplayName } = useAppRole()
  const { logout } = useAuth()
  const displayName = getRoleDisplayName()
  const roleLabel = role ? getRoleLabel(role) : ''
  const nip = getRoleNip()
  const meRoute = getMeRoute(role)

  const handleLogout = async () => {
    await logout()
    onNavigate?.()
    navigate({
      to: ROUTES.HOME,
      search: { denied: undefined, redirect: undefined },
    })
  }

  return (
    <div className={cn('shrink-0 border-t border-border p-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Menu profil ${displayName}`}
            title={collapsed ? displayName : undefined}
            className={cn(
              'flex min-h-11 w-full items-center rounded-control text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
            )}
          >
            <CircleUserRound
              className="h-8 w-8 shrink-0 text-secondary-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
            <span className={cn('min-w-0 flex-1', collapsed && 'sr-only')}>
              <span
                className={cn(
                  'block truncate text-ui-body font-medium text-foreground',
                  collapsed && 'sr-only',
                )}
              >
                {displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {roleLabel}
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={collapsed ? 'right' : 'top'}
          align="start"
          className="w-56"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
              {nip ? (
                <p className="text-xs text-muted-foreground">NIP. {nip}</p>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {meRoute ? (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => {
                onNavigate?.()
                navigate({ to: meRoute })
              }}
            >
              Profil Saya
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            className="cursor-pointer text-danger focus:bg-danger-subtle focus:text-danger-foreground"
            onSelect={() => void handleLogout()}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" aria-hidden />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
