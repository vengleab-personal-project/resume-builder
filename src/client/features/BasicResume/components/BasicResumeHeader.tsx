// next/image is the wrong tool here: this element is printed, not served. The
// photo is a user-supplied data/blob URL with no known dimensions, and the
// optimiser's lazy loading would race the print dialog and export a blank box.
/* eslint-disable @next/next/no-img-element */

export type BasicResumeHeaderProps = {
  documentTitle: string;
  nameLabel: string;
  fullName: string;
  address: string;
  phone: string;
  email?: string;
  phoneLabel: string;
  photoUrl?: string;
  photoAlt: string;
  primaryColor: string;
};

/**
 * Title, identity block and photo box, closed by the heavy rule that separates
 * the header from the body in the reference document.
 *
 * The photo frame is drawn whether or not a photo exists: on this format the
 * empty box is the instruction to staple one on, which is exactly how the
 * printed CVs this template mirrors are used.
 */
export const BasicResumeHeader = ({
  documentTitle,
  nameLabel,
  fullName,
  address,
  phone,
  email,
  phoneLabel,
  photoUrl,
  photoAlt,
  primaryColor,
}: BasicResumeHeaderProps) => (
  <header>
    <h1
      className="text-center text-2xl font-bold mb-6"
      style={{ color: primaryColor }}
    >
      {documentTitle}
    </h1>

    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1 space-y-2 text-[15px]">
        <p className="font-bold">
          {nameLabel}
          {fullName ? ` ${fullName}` : ''}
        </p>
        {address && <p>{address}</p>}
        {phone && (
          <p>
            {phoneLabel} {phone}
          </p>
        )}
        {email && <p>{email}</p>}
      </div>

      <div className="h-[132px] w-[104px] shrink-0 border border-black overflow-hidden">
        {photoUrl && <img src={photoUrl} alt={photoAlt} className="h-full w-full object-cover" />}
      </div>
    </div>

    <hr className="mt-4 border-0 border-t-[3px] border-black" />
  </header>
);
