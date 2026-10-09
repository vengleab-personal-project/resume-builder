import { printablePageHeightPx } from '@/shared/config/resume-layout';

/**
 * Print pagination, decided by the preview instead of guessed at.
 *
 * The browser's print engine paginates by rules the screen cannot observe (it moves a
 * `break-inside: avoid` block or a heading with `break-after: avoid` to the next page
 * whole), so a marker drawn at "every 285mm of content" ends a page where print does
 * not. Instead this walks the laid-out preview, packs its unbreakable blocks into
 * pages by those same rules, and marks the first block of every page. The print
 * stylesheet then forces a break before each marked block (`data-print-break-before`
 * in globals.css), so the PDF breaks exactly where the preview's markers are.
 *
 * Packing is conservative - the gap above a moved block is counted against the next
 * page - so a page never holds more than really fits, and the browser never needs a
 * break of its own before the forced one.
 */

export const PRINT_BREAK_ATTR = 'data-print-break-before';
/** Marks a container whose children paginate independently (Modern's two columns). */
export const PRINT_COLUMNS_ATTR = 'data-print-columns';

/** Measurement slack, so sub-pixel differences between screen and print never overflow. */
const SAFETY_PX = 2;

type Block = {
  el: HTMLElement;
  bottom: number;
  /** `break-after: avoid` - a heading or entry header that must not end a page. */
  keepWithNext: boolean;
  /** A user-set manual break (`exp.breakPage` -> `print:break-after-page`). */
  breakAfter: boolean;
};

export type PageBreak = {
  /** Where the page ends, in the preview's unscaled px from its top. */
  y: number;
  /** The page that ends here, 1-based. */
  page: number;
};

export type PaginatedFlow = {
  /** Horizontal extent of the column, for drawing its markers. */
  left: number;
  width: number;
  breaks: PageBreak[];
  /** Content height used on the last page - for the "nearly fits" hint. */
  lastPageUsed: number;
};

export type Pagination = {
  flows: PaginatedFlow[];
  pageCount: number;
};

const HEADING = /^H[1-6]$/;
/** The print stylesheet's `#resume-preview li, p, h2, h3 { break-inside: avoid }`. */
const UNBREAKABLE_TAGS = new Set(['LI', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'IMG', 'TABLE']);
const BLOCK_DISPLAYS = ['block', 'flex', 'grid', 'list-item', 'table', 'flow-root'];

const inFlow = (el: Element): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  const style = getComputedStyle(el);
  return style.display !== 'none' && style.position !== 'absolute' && style.position !== 'fixed';
};

const inFlowChildren = (el: HTMLElement) => Array.from(el.children).filter(inFlow);

const isUnbreakable = (el: HTMLElement, style: CSSStyleDeclaration) => {
  if (UNBREAKABLE_TAGS.has(el.tagName)) return true;
  if (el.hasAttribute('data-print-keep')) return true;
  if (style.breakInside === 'avoid' || style.breakInside === 'avoid-page') return true;
  // `#resume-preview aside section { break-inside: avoid }`
  if (el.tagName === 'SECTION' && el.closest('aside')) return true;
  // Side-by-side content (a justify-between row, chips, a grid of cards) cannot break
  // between its children, only through them.
  if (style.display.includes('grid')) return true;
  if (style.display.includes('flex') && !style.flexDirection.startsWith('column')) return true;
  // A block of text lines with no block children: one unit.
  return !inFlowChildren(el).some((child) =>
    BLOCK_DISPLAYS.some((display) => getComputedStyle(child).display.includes(display))
  );
};

/** Leaf-most blocks of a column in document order, descending only into breakable boxes. */
const collectBlocks = (root: HTMLElement, originTop: number, scale: number): Block[] => {
  const blocks: Block[] = [];
  const visit = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) return;
    const style = getComputedStyle(el);
    if (el !== root && isUnbreakable(el, style)) {
      blocks.push({
        el,
        bottom: (rect.bottom - originTop) / scale,
        keepWithNext: HEADING.test(el.tagName) || el.classList.contains('print:break-after-avoid'),
        breakAfter: el.classList.contains('print:break-after-page'),
      });
      return;
    }
    const before = blocks.length;
    inFlowChildren(el).forEach(visit);
    // A manual break on a container (an experience entry) falls after its last block.
    if (blocks.length > before && el.classList.contains('print:break-after-page')) {
      blocks[blocks.length - 1].breakAfter = true;
    }
  };
  visit(root);
  return blocks;
};

/**
 * Packs blocks into pages. Returns the page breaks and, for each break, the block that
 * starts the next page (`null` where a block taller than a page has to split itself).
 */
const paginateFlow = (blocks: Block[]) => {
  const breaks: (PageBreak & { start: HTMLElement | null })[] = [];
  let page = 0;
  let pageEnd = printablePageHeightPx(0);
  let firstOnPage = 0;

  const newPage = (start: number, startEl: HTMLElement | null) => {
    breaks.push({ y: start, page: page + 1, start: startEl });
    page += 1;
    pageEnd = start + printablePageHeightPx(page);
  };

  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];

    // A manual break ends the page after the previous block, whatever space is left.
    if (i > firstOnPage && blocks[i - 1].breakAfter) {
      newPage(blocks[i - 1].bottom, null);
      firstOnPage = i;
    }

    if (block.bottom <= pageEnd - SAFETY_PX) {
      i += 1;
      continue;
    }

    if (i === firstOnPage) {
      // Taller than a whole page: nothing to move, it splits where it must.
      while (block.bottom > pageEnd - SAFETY_PX) newPage(pageEnd, null);
      firstOnPage = i + 1;
      i += 1;
      continue;
    }

    // Take any headings/entry headers that lead into this block along with it, unless
    // that would empty the page.
    let start = i;
    while (start - 1 > firstOnPage && blocks[start - 1].keepWithNext) start -= 1;

    newPage(blocks[start - 1].bottom, blocks[start].el);
    firstOnPage = start;
    i = start;
  }

  const lastStart = breaks.at(-1)?.y ?? 0;
  const contentBottom = blocks.reduce((max, block) => Math.max(max, block.bottom), 0);
  return { breaks, pageCount: page + 1, lastPageUsed: contentBottom - lastStart };
};

/**
 * The element that should carry the forced break: the outermost box that starts at the
 * block's top, so a section's own border or padding moves with its first line.
 */
const breakTarget = (el: HTMLElement, flowRoot: HTMLElement) => {
  let target = el;
  while (target.parentElement && target.parentElement !== flowRoot) {
    const parent = target.parentElement;
    if (inFlowChildren(parent)[0] !== target) break;
    target = parent;
  }
  return target;
};

/**
 * Paginates the printable resume (`#resume-preview`) as it is laid out on screen and
 * marks the blocks print must start a new page at. `container` is the unscaled frame
 * the preview is measured from.
 */
export const paginateResume = (container: HTMLElement): Pagination | null => {
  const root = container.querySelector<HTMLElement>('#resume-preview');
  if (!root) return null;

  const box = container.getBoundingClientRect();
  // The preview is scaled to fit its panel; measure in the page's own px.
  const scale = container.offsetHeight ? box.height / container.offsetHeight : 1;
  // A hidden panel (editor view on a small screen) cannot be measured. Leave print to
  // paginate on its own rather than forcing breaks from a stale layout.
  if (!scale || !box.width) {
    clearPrintBreaks(container);
    return null;
  }

  const columns = root.querySelector<HTMLElement>(`[${PRINT_COLUMNS_ATTR}]`);
  const flowRoots = columns ? inFlowChildren(columns) : [root];

  clearPrintBreaks(container);

  let pageCount = 1;
  const flows = flowRoots.map((flowRoot) => {
    const rect = flowRoot.getBoundingClientRect();
    const result = paginateFlow(collectBlocks(flowRoot, box.top, scale));
    // The value is the page the block starts - only for reading the DOM when debugging.
    result.breaks.forEach(({ start, page }) => {
      if (start) breakTarget(start, flowRoot).setAttribute(PRINT_BREAK_ATTR, String(page + 1));
    });
    pageCount = Math.max(pageCount, result.pageCount);
    return {
      left: (rect.left - box.left) / scale,
      width: rect.width / scale,
      breaks: result.breaks.map(({ y, page }) => ({ y, page })),
      lastPageUsed: result.lastPageUsed,
    };
  });

  return { flows, pageCount };
};

export const clearPrintBreaks = (container: HTMLElement) => {
  container.querySelectorAll(`[${PRINT_BREAK_ATTR}]`).forEach((el) => el.removeAttribute(PRINT_BREAK_ATTR));
};
