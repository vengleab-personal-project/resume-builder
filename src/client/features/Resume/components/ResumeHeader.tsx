type ResumeHeaderProps = {
  name: string
  title?: string
  photoUrl?: string
  primaryColor: string
  namePlaceholder: string
}

export const ResumeHeader = ({
  name,
  title,
  photoUrl,
  primaryColor,
  namePlaceholder,
}: ResumeHeaderProps) => (
  <header
    className="w-full h-40 shrink-0 relative print:h-40"
    style={{ 
      backgroundColor: primaryColor,
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',
      colorAdjust: 'exact',
    } as React.CSSProperties}
  >
    <div className="flex w-full h-full items-center">
      {/* Left Spacer for Sidebar width */}
      <div className="w-[32%] shrink-0 h-full relative">
        {/* Photo Container - Absolute positioned to overlap */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/6 w-40 h-40 z-20">
          <div className="w-full h-full rounded-full bg-white p-1.5 shadow-lg">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-400 uppercase">
                {name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Content (Name/Title) */}
      <div className="flex-1 px-8 text-white z-10">
        <h1 className="text-4xl font-extrabold uppercase tracking-wide mb-2">
          {name || namePlaceholder}
        </h1>
        {title && (
          <p className="text-xl font-medium opacity-90">
            {title}
          </p>
        )}
      </div>
    </div>
  </header>
)
