/**
 * Rasterises the decorative bits of the on-screen resume preview (lucide icons,
 * the circular header avatar, the timeline dots) into PNGs that docx can embed.
 *
 * The preview draws these with SVG/CSS, which .docx has no equivalent for, so the
 * export paints them onto a canvas at 4x and ships the bitmap instead. Everything
 * here is browser-only - `generateResumeDocx` already runs client-side.
 */

/** [tag, attributes] pairs, copied from lucide-react's `__iconNode` for each icon. */
type IconNode = readonly (readonly [string, Record<string, string>])[];

const ICON_NODES: Record<string, IconNode> = {
  phone: [
    ['path', { d: 'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384' }],
  ],
  mail: [
    ['path', { d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7' }],
    ['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2' }],
  ],
  mapPin: [
    ['path', { d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' }],
    ['circle', { cx: '12', cy: '10', r: '3' }],
  ],
  linkedin: [
    ['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' }],
    ['rect', { width: '4', height: '12', x: '2', y: '9' }],
    ['circle', { cx: '4', cy: '4', r: '2' }],
  ],
  globe: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }],
    ['path', { d: 'M2 12h20' }],
  ],
  briefcase: [
    ['path', { d: 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' }],
    ['rect', { width: '20', height: '14', x: '2', y: '6', rx: '2' }],
  ],
  graduationCap: [
    ['path', { d: 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z' }],
    ['path', { d: 'M22 10v6' }],
    ['path', { d: 'M6 12.5V16a6 3 0 0 0 12 0v-3.5' }],
  ],
  externalLink: [
    ['path', { d: 'M15 3h6v6' }],
    ['path', { d: 'M10 14 21 3' }],
    ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }],
  ],
};

export type IconName = keyof typeof ICON_NODES;

/** A rasterised asset, sized in CSS pixels so it can be handed straight to ImageRun. */
export type PngAsset = {
  readonly data: string;
  readonly width: number;
  readonly height: number;
};

/** Oversampling factor - keeps the bitmaps sharp when Word scales them for print. */
const SCALE = 4;

const SLATE_100 = '#f1f5f9';
const SLATE_400 = '#94a3b8';

const attrsToString = (attrs: Record<string, string>) =>
  Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

/** Rebuilds the `<svg>` lucide-react would have rendered, at `size` CSS pixels. */
const iconSvg = (name: IconName, size: number, color: string, filled: boolean) => {
  const body = ICON_NODES[name].map(([tag, attrs]) => `<${tag} ${attrsToString(attrs)} />`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size * SCALE}" height="${size * SCALE}" viewBox="0 0 24 24"` +
    ` fill="${filled ? color : 'none'}" stroke="${color}" stroke-width="2"` +
    ` stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
  );
};

const loadImage = (src: string, crossOrigin = false): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * SCALE);
  canvas.height = Math.round(height * SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.scale(SCALE, SCALE);
  return { canvas, ctx };
};

const toPng = (canvas: HTMLCanvasElement, width: number, height: number): PngAsset => ({
  data: canvas.toDataURL('image/png').split(',')[1],
  width,
  height,
});

/** A bare lucide icon, stroked in `color` - the preview's contact rows and link glyphs. */
export const renderIcon = async (
  name: IconName,
  size: number,
  color: string,
  filled = false
): Promise<PngAsset> => {
  const svg = iconSvg(name, size, color, filled);
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const { canvas, ctx } = createCanvas(size, size);
  ctx.drawImage(img, 0, 0, size, size);
  return toPng(canvas, size, size);
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const BADGE_ICON = 20;
const BADGE_PADDING = 4; // p-1
const BADGE_BORDER = 1; // border border-slate-100

/** Outer size of MainSectionHeading's icon chip, which sets the heading's row height. */
export const HEADING_BADGE_SIZE = BADGE_ICON + 2 * BADGE_PADDING + 2 * BADGE_BORDER;

/**
 * MainSectionHeading's icon chip: `p-1 rounded bg-white border border-slate-100`
 * around a 20px lucide icon.
 */
export const renderIconBadge = async (name: IconName, color: string): Promise<PngAsset> => {
  const BOX = HEADING_BADGE_SIZE;
  const svg = iconSvg(name, BADGE_ICON, color, false);
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const { canvas, ctx } = createCanvas(BOX, BOX);

  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, 0, 0, BOX, BOX, 4); // rounded = 0.25rem
  ctx.fill();
  ctx.strokeStyle = SLATE_100;
  ctx.lineWidth = BADGE_BORDER;
  roundedRect(ctx, BADGE_BORDER / 2, BADGE_BORDER / 2, BOX - BADGE_BORDER, BOX - BADGE_BORDER, 4);
  ctx.stroke();

  ctx.drawImage(img, BADGE_BORDER + BADGE_PADDING, BADGE_BORDER + BADGE_PADDING, BADGE_ICON, BADGE_ICON);
  return toPng(canvas, BOX, BOX);
};

export const DOT_SIZE = 12; // timeline dot `w-3 h-3`

/**
 * The Experience/Education timeline dot: a 12px white disc ringed in the accent colour.
 * Painted on opaque white so it masks the timeline rule running behind it, the way the
 * preview's `bg-white z-10` does.
 */
export const renderTimelineDot = async (color: string): Promise<PngAsset> => {
  const RING = 2;
  const { canvas, ctx } = createCanvas(DOT_SIZE, DOT_SIZE);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, DOT_SIZE, DOT_SIZE);
  ctx.beginPath();
  ctx.arc(DOT_SIZE / 2, DOT_SIZE / 2, DOT_SIZE / 2 - RING / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = RING;
  ctx.strokeStyle = color;
  ctx.stroke();

  return toPng(canvas, DOT_SIZE, DOT_SIZE);
};

/**
 * A flat colour swatch, stretched by Word to whatever size the caller asks for. Used
 * for the sidebar's background band, which the preview paints with a `print:fixed`
 * element so it covers every page regardless of how far the content reaches.
 */
export const renderSwatch = async (color: string): Promise<PngAsset> => {
  const { canvas, ctx } = createCanvas(8, 8);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 8, 8);
  return toPng(canvas, 8, 8);
};

/** Padding around the avatar so its `shadow-lg` has room on the bitmap. */
export const AVATAR_SHADOW_PAD = 16;

const paintAvatar = async (
  photoUrl: string | undefined,
  initial: string,
  fontFamily: string
): Promise<PngAsset> => {
  const SIZE = 160; // w-40 h-40
  const RING = 6; // p-1.5
  const PAD = AVATAR_SHADOW_PAD;
  const TOTAL = SIZE + 2 * PAD;
  const centre = PAD + SIZE / 2;
  const innerRadius = SIZE / 2 - RING;

  const { canvas, ctx } = createCanvas(TOTAL, TOTAL);

  // shadow-lg, approximated with a single canvas shadow.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centre, centre, SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  let photo: HTMLImageElement | null = null;
  if (photoUrl) {
    try {
      photo = await loadImage(photoUrl, !photoUrl.startsWith('data:'));
    } catch {
      photo = null;
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(centre, centre, innerRadius, 0, Math.PI * 2);
  ctx.clip();

  if (photo) {
    // object-cover: scale to fill the disc, then centre-crop the overflow.
    const cover = Math.max((innerRadius * 2) / photo.width, (innerRadius * 2) / photo.height);
    const drawWidth = photo.width * cover;
    const drawHeight = photo.height * cover;
    ctx.drawImage(photo, centre - drawWidth / 2, centre - drawHeight / 2, drawWidth, drawHeight);
  } else {
    ctx.fillStyle = SLATE_100;
    ctx.fillRect(centre - innerRadius, centre - innerRadius, innerRadius * 2, innerRadius * 2);
    ctx.fillStyle = SLATE_400;
    ctx.font = `bold 36px ${fontFamily}`; // text-4xl font-bold
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((initial || '?').toUpperCase(), centre, centre);
  }
  ctx.restore();

  return toPng(canvas, TOTAL, TOTAL);
};

/**
 * ResumeHeader's avatar: a 160px white disc (`p-1.5` ring + `shadow-lg`) holding either
 * the uploaded photo cropped like `object-cover`, or the slate-100 initial placeholder.
 */
export const renderAvatar = async (
  photoUrl: string | undefined,
  initial: string,
  fontFamily: string
): Promise<PngAsset> => {
  try {
    return await paintAvatar(photoUrl, initial, fontFamily);
  } catch {
    // A cross-origin photo taints the canvas and toDataURL throws - fall back to the initial.
    return paintAvatar(undefined, initial, fontFamily);
  }
};
