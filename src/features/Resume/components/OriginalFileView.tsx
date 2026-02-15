import { FileText } from 'lucide-react'

type OriginalFileViewProps = {
  originalFileUrl?: string | null
  noPdfTitle: string
  noPdfDescription: string
}

export const OriginalFileView = ({
  originalFileUrl,
  noPdfTitle,
  noPdfDescription,
}: OriginalFileViewProps) => (
  <div className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-hidden print:hidden relative">
    {originalFileUrl ? (
      <iframe
        src={originalFileUrl}
        className="w-full h-full flex-1 border-none"
        title="Original PDF"
      />
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 bg-slate-50">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
          <FileText size={40} />
        </div>
        <div className="max-w-xs">
          <h3 className="text-lg font-bold text-slate-800 mb-2">{noPdfTitle}</h3>
          <p className="text-sm text-slate-500">{noPdfDescription}</p>
        </div>
      </div>
    )}
  </div>
)
