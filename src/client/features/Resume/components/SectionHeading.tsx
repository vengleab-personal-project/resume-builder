import { ReactNode } from 'react'

type SidebarSectionHeadingProps = {
  title: string
}

export const SidebarSectionHeading = ({ title }: SidebarSectionHeadingProps) => (
  <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
    {title}
  </h3>
)

type MainSectionHeadingProps = {
  title: string
  icon: ReactNode
  primaryColor: string
}

export const MainSectionHeading = ({ title, icon, primaryColor }: MainSectionHeadingProps) => (
  <h2
    className="text-lg font-bold uppercase tracking-[0.2em] mb-6 border-b-2 pb-2 flex items-center gap-3"
    style={{ borderColor: primaryColor, color: primaryColor }}
  >
    <div className="p-1 rounded bg-white shadow-sm border border-slate-100">
      {icon}
    </div>
    {title}
  </h2>
)
