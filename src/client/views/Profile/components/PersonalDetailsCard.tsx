import { Input } from '@/client/components/ui/FormElements';
import type { Translations } from '@/client/hooks/useTranslations';
import type { ProfileField, ProfileFields } from '@/shared/lib/profile';

export type PersonalDetailsCardProps = {
  fields: ProfileFields;
  disabled: boolean;
  labels: Translations['profile'];
  errorMessage: (field: ProfileField) => string | undefined;
  onChange: (field: ProfileField, value: string) => void;
};

type TextField = Exclude<ProfileField, 'photoUrl'>;

const FIELDS: { field: TextField; label: keyof Translations['profile']; type?: string; wide?: boolean }[] = [
  { field: 'fullName', label: 'fullName' },
  { field: 'title', label: 'jobTitle' },
  { field: 'email', label: 'email', type: 'email' },
  { field: 'phone', label: 'phone', type: 'tel' },
  { field: 'address', label: 'address', wide: true },
  { field: 'linkedin', label: 'linkedin' },
  { field: 'website', label: 'website' },
];

export const PersonalDetailsCard = ({
  fields,
  disabled,
  labels,
  errorMessage,
  onChange,
}: PersonalDetailsCardProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
    {FIELDS.map(({ field, label, type, wide }) => {
      const error = errorMessage(field);
      return (
        <div key={field} className={wide ? 'sm:col-span-2' : undefined}>
          <Input
            label={labels[label] as string}
            type={type ?? 'text'}
            value={fields[field]}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={error ? 'border-red-300 focus:border-red-400' : undefined}
            onChange={(event) => onChange(field, event.target.value)}
          />
          {error && <p className="-mt-3 mb-4 text-xs text-red-600">{error}</p>}
        </div>
      );
    })}
  </div>
);
