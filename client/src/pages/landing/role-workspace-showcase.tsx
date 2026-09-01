import { useState } from 'react'
import { cn } from '@/utils/cn'

export type LandingRoleId = 'penyusun' | 'pj-penyusun' | 'evaluator' | 'pj-evaluator' | 'kepala-opd'

export interface LandingRoleProfile {
  id: LandingRoleId
  label: string
  responsibility: string
  output: string
}

interface RoleWorkspaceShowcaseProps {
  roles: LandingRoleProfile[]
}

export function RoleWorkspaceShowcase({ roles }: RoleWorkspaceShowcaseProps) {
  const [activeRoleId, setActiveRoleId] = useState<LandingRoleId>(roles[0].id)
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0]

  return (
    <section id="peran" className="scroll-mt-20 bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Peran pengguna</p>
          <h2 className="mt-4 text-[clamp(2.5rem,4.8vw,3.9rem)] font-semibold leading-[1] tracking-[-0.045em] text-slate-950">
            Lima peran dalam pengelolaan SOP.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-secondary-foreground sm:text-base sm:leading-7">
            Setiap peran memiliki tugas dan kewenangan yang berbeda pada proses penyusunan, evaluasi, dan pengesahan SOP.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto pb-2" role="tablist" aria-label="Peran pengguna">
          <div className="mx-auto flex min-w-max w-fit gap-1.5 rounded-[18px] border border-slate-200/80 bg-[#f8fbff] p-1.5 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.3)]">
            {roles.map((role) => (
              <button
                key={role.id}
                id={`role-tab-${role.id}`}
                type="button"
                role="tab"
                aria-selected={activeRoleId === role.id}
                aria-controls="role-workspace-panel"
                onClick={() => setActiveRoleId(role.id)}
                className={cn(
                  'shrink-0 rounded-[12px] px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none',
                  activeRoleId === role.id
                    ? 'bg-primary text-white shadow-[0_10px_24px_-18px_rgba(29,78,216,0.75)]'
                    : 'text-secondary-foreground hover:bg-white hover:text-foreground',
                )}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div
          id="role-workspace-panel"
          role="tabpanel"
          aria-labelledby={`role-tab-${activeRoleId}`}
          className="mt-8 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_30px_80px_-52px_rgba(15,23,42,0.32)] sm:p-8"
        >
          <div className="rounded-[20px] bg-[#f8fbff] p-6 lg:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{activeRole.label}</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[0.62fr_0.38fr] lg:gap-8">
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Tugas utama</h3>
                <p className="mt-4 text-base leading-7 text-secondary-foreground">{activeRole.responsibility}</p>
              </div>
              <div className="border-t border-blue-100 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Hasil utama</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{activeRole.output}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
