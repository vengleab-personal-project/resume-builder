import type { BasicResumeData } from '@/shared/types/basic-resume';
import { BasicFieldRow } from './BasicFieldRow';
import { BasicPairListEditor, type BasicPairEntry } from './BasicPairListEditor';

export type BasicResumeEditorLabels = {
  sections: Record<
    'personal' | 'positionSought' | 'education' | 'experience' | 'languages' | 'interests' | 'personalStatement',
    string
  >;
  personal: Record<
    'nationality' | 'gender' | 'dateOfBirth' | 'placeOfBirth' | 'maritalStatus' | 'health',
    string
  >;
  editor: {
    identity: string;
    fullName: string;
    positionSought: string;
    address: string;
    phone: string;
    email: string;
    year: string;
    detail: string;
    languageName: string;
    languageSkills: string;
    add: string;
    remove: string;
    statementHint: string;
    interestsHint: string;
  };
};

export type BasicResumeFieldsProps = {
  data: BasicResumeData;
  labels: BasicResumeEditorLabels;
  onScalarChange: (path: string, value: string) => void;
  onPairChange: (
    list: 'education' | 'experience' | 'languages',
    id: string,
    field: 'left' | 'right',
    value: string
  ) => void;
  onPairAdd: (list: 'education' | 'experience' | 'languages') => void;
  onPairRemove: (list: 'education' | 'experience' | 'languages', id: string) => void;
};

const toEducationPairs = (data: BasicResumeData): BasicPairEntry[] =>
  data.education.map((entry) => ({ id: entry.id, left: entry.year, right: entry.detail }));

const toExperiencePairs = (data: BasicResumeData): BasicPairEntry[] =>
  data.experience.map((entry) => ({ id: entry.id, left: entry.year, right: entry.detail }));

const toLanguagePairs = (data: BasicResumeData): BasicPairEntry[] =>
  data.languages.map((entry) => ({ id: entry.id, left: entry.name, right: entry.skills }));

export const BasicResumeFields = ({
  data,
  labels,
  onScalarChange,
  onPairChange,
  onPairAdd,
  onPairRemove,
}: BasicResumeFieldsProps) => {
  const { editor } = labels;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">{editor.identity}</h3>
        <BasicFieldRow
          label={editor.fullName}
          value={data.fullName}
          onChange={(value) => onScalarChange('fullName', value)}
        />
        <BasicFieldRow
          label={editor.positionSought}
          value={data.positionSought}
          onChange={(value) => onScalarChange('positionSought', value)}
        />
        <BasicFieldRow
          label={editor.phone}
          value={data.contact.phone}
          onChange={(value) => onScalarChange('contact.phone', value)}
        />
        <BasicFieldRow
          label={editor.address}
          value={data.contact.address}
          onChange={(value) => onScalarChange('contact.address', value)}
        />
        <BasicFieldRow
          label={editor.email}
          value={data.contact.email ?? ''}
          onChange={(value) => onScalarChange('contact.email', value)}
        />
      </section>

      {/* Gender, marital status and health are here with no asterisk and no
          required marker: they are conventional on this CV format and they are
          sensitive personal data. Leaving one blank is a complete answer. */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">{labels.sections.personal}</h3>
        {(
          [
            'dateOfBirth',
            'placeOfBirth',
            'nationality',
            'gender',
            'maritalStatus',
            'health',
          ] as const
        ).map((field) => (
          <BasicFieldRow
            key={field}
            label={labels.personal[field]}
            value={data.personal[field]}
            onChange={(value) => onScalarChange(`personal.${field}`, value)}
          />
        ))}
      </section>

      <BasicPairListEditor
        heading={labels.sections.education}
        entries={toEducationPairs(data)}
        leftLabel={editor.year}
        rightLabel={editor.detail}
        addLabel={editor.add}
        removeLabel={editor.remove}
        onChange={(id, field, value) => onPairChange('education', id, field, value)}
        onAdd={() => onPairAdd('education')}
        onRemove={(id) => onPairRemove('education', id)}
      />

      <BasicPairListEditor
        heading={labels.sections.experience}
        entries={toExperiencePairs(data)}
        leftLabel={editor.year}
        rightLabel={editor.detail}
        addLabel={editor.add}
        removeLabel={editor.remove}
        onChange={(id, field, value) => onPairChange('experience', id, field, value)}
        onAdd={() => onPairAdd('experience')}
        onRemove={(id) => onPairRemove('experience', id)}
      />

      <BasicPairListEditor
        heading={labels.sections.languages}
        entries={toLanguagePairs(data)}
        leftLabel={editor.languageName}
        rightLabel={editor.languageSkills}
        addLabel={editor.add}
        removeLabel={editor.remove}
        onChange={(id, field, value) => onPairChange('languages', id, field, value)}
        onAdd={() => onPairAdd('languages')}
        onRemove={(id) => onPairRemove('languages', id)}
      />

      {/* These two sections are a single field each, so the field's own label is
          the section heading -- printing both would just say the same word
          twice. */}
      <section className="space-y-3">
        <BasicFieldRow
          label={labels.sections.interests}
          value={data.interests.join(', ')}
          placeholder={editor.interestsHint}
          onChange={(value) => onScalarChange('interests', value)}
        />
      </section>

      <section className="space-y-3">
        <BasicFieldRow
          label={labels.sections.personalStatement}
          value={data.personalStatement}
          placeholder={editor.statementHint}
          multiline
          onChange={(value) => onScalarChange('personalStatement', value)}
        />
      </section>
    </div>
  );
};
