import { useAuth } from '@/api/auth'
import { LoginForm } from '@/pages/login/components/LoginForm'
import { LoginHero } from '@/pages/login/components/LoginHero'
import { ProcessInvitationActivation } from '@/pages/login/components/ProcessInvitationActivation'

export function LoginPage() {
  const { login, isLoggingIn } = useAuth()
  const inviteToken =
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('invite')

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <main className="grid min-h-screen w-full lg:min-h-screen lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
        <LoginHero />

        <section className="flex min-h-[560px] items-center bg-surface px-6 py-10 sm:px-10 lg:min-h-screen lg:px-16 lg:py-12 xl:px-20">
          {inviteToken ? (
            <ProcessInvitationActivation token={inviteToken} />
          ) : (
            <LoginForm isSubmitting={isLoggingIn} onSubmitLogin={login} />
          )}
        </section>
      </main>
    </div>
  )
}
