interface WorkflowStoryProps {
  stages: ReadonlyArray<{ step: string; title: string }>
}

export function WorkflowStory({ stages }: WorkflowStoryProps) {
  return (
    <section id="alur" className="scroll-mt-20 bg-[#f8fbff] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Alur kerja SOP</p>
          <h2 className="mt-4 text-[clamp(2.5rem,4.8vw,3.9rem)] font-semibold leading-[1] tracking-[-0.045em] text-slate-950">
            Tahapan pengelolaan SOP.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-secondary-foreground sm:text-base sm:leading-7">
            Proses dimulai dari penyusunan dan berakhir ketika SOP telah disahkan serta masuk ke arsip.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto pb-2">
          <ol className="mx-auto flex min-w-[860px] max-w-6xl items-center" aria-label="Tahapan pengelolaan SOP">
            {stages.map((stage, index) => (
              <li key={stage.step} className="flex flex-1 items-center last:flex-none">
                <div className="flex min-w-[94px] flex-col items-center text-center">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-blue-200 bg-white font-mono text-[10px] font-semibold text-primary shadow-[0_10px_24px_-20px_rgba(37,99,235,0.6)]">
                    {stage.step}
                  </span>
                  <span className="mt-2 text-xs font-medium text-secondary-foreground">{stage.title}</span>
                </div>
                {index < stages.length - 1 ? <span className="mx-2 h-px flex-1 bg-blue-200" aria-hidden /> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
