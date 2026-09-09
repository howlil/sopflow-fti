interface WorkflowStoryProps {
  stages: ReadonlyArray<{ step: string; title: string }>
}

export function WorkflowStory({ stages }: WorkflowStoryProps) {
  return (
    <section id="alur" aria-labelledby="workflow-title" className="bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="workflow-title" className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            Tahapan pengelolaan SOP.
          </h2>
          <p className="mt-3 text-sm leading-6 text-secondary-foreground sm:text-base">
            SOP disusun, ditinjau, disetujui, ditandatangani secara elektronik, lalu tersedia pada arsip publik.
          </p>
        </div>

        <div className="mt-8">
          <ol className="grid border-y border-border sm:grid-cols-5" aria-label="Tahapan pengelolaan SOP">
            {stages.map((stage, index) => (
              <li key={stage.step} className={`flex items-start gap-3 py-4 sm:block sm:min-h-[112px] sm:p-4 ${index < stages.length - 1 ? 'border-b border-border sm:border-b-0 sm:border-r' : ''}`}>
                <div className="flex items-start gap-3 sm:block">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {stage.step}
                  </span>
                  <span className="text-sm font-medium text-foreground sm:mt-3 sm:block">{stage.title}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
