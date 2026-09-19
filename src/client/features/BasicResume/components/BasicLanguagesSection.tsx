export type BasicLanguageRow = {
  id: string;
  name: string;
  skills: string;
};

export type BasicLanguagesSectionProps = {
  languages: BasicLanguageRow[];
};

/**
 * Languages, as the language name and whatever the user said they can do with
 * it — spoken words, not a proficiency scale. "Speak, listen, read and
 * translate" is how this is written on the reference CV, and turning it into
 * B2/C1 would be inventing a claim the user did not make.
 */
export const BasicLanguagesSection = ({ languages }: BasicLanguagesSectionProps) => (
  <div className="pl-10 text-[15px]">
    {languages.map((language) => (
      <div key={language.id} className="flex gap-2 leading-8 break-inside-avoid">
        <span className="w-32 shrink-0">{language.name}</span>
        <span className="min-w-0 flex-1">{language.skills}</span>
      </div>
    ))}
  </div>
);
