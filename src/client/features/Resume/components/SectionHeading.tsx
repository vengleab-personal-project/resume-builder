import { ReactNode } from 'react';

const isKhmer = (str?: string) => Boolean(str && /[\u1780-\u17FF\u19E0-\u19FF]/.test(str));

type SidebarSectionHeadingProps = {
  title: string;
};

export const SidebarSectionHeading = ({ title }: SidebarSectionHeadingProps) => {
  const khmer = isKhmer(title);
  return (
    <h3
      className={`text-sm font-bold ${
        khmer ? '' : 'uppercase tracking-[0.15em]'
      } mb-4 border-b-2 border-slate-300 pb-1 text-slate-800`}
    >
      {title}
    </h3>
  );
};

type MainSectionHeadingProps = {
  title: string;
  icon: ReactNode;
  primaryColor: string;
};

export const MainSectionHeading = ({
  title,
  icon,
  primaryColor,
}: MainSectionHeadingProps) => {
  const khmer = isKhmer(title);
  return (
    <h2
      className={`text-lg font-bold ${
        khmer ? '' : 'uppercase tracking-[0.2em]'
      } mb-6 border-b-2 pb-2 flex items-center gap-3`}
      style={{ borderColor: primaryColor, color: primaryColor }}
    >
      <div className="p-1 rounded bg-white shadow-sm border border-slate-100">
        {icon}
      </div>
      {title}
    </h2>
  );
};
