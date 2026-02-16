type SummarySectionProps = {
  summary: string
  title: string
}

export const SummarySection = ({ summary, title }: SummarySectionProps) => (
  <section className="mb-10 pt-4 border-t border-slate-100">
    <h2 className="text-lg font-bold uppercase tracking-[0.2em] mb-4 text-slate-800">
      {title}
    </h2>
    <div 
      className="text-sm leading-7 text-slate-600 prose prose-sm max-w-none break-words overflow-wrap-anywhere"
      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      dangerouslySetInnerHTML={{ __html: summary }}
    />
  </section>
)
