export const SERIF = "font-['Cormorant_Garamond',serif]";

export const CARD =
  "rounded-[20px] border border-line bg-surface [box-shadow:var(--shadow-soft)]";

export const CARD_HEAD =
  "flex items-center justify-between gap-3 px-[22px] pt-5 pb-1.5";

export const CARD_TITLE = `m-0 ${SERIF} text-[23px] font-bold`;

export const EYEBROW =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark";

export const LEAD = "m-0 text-[14.5px] leading-[1.55] text-ink-light";

export const FORM = "flex flex-col gap-[18px]";

export const FIELD = "flex flex-col gap-[7px]";

export const FIELD_LABEL =
  "text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-mid";

export const FIELD_HINT =
  "not-italic ml-1 font-medium normal-case tracking-normal text-ink-faint";

export const NOTE = "text-[12.5px] text-ink-faint";

export const INPUT_SKIN =
  "rounded-[12px] border-[1.5px] border-line bg-surface-2 text-[14px] text-ink focus:border-gold focus:bg-surface focus:[box-shadow:0_0_0_3px_rgba(201,146,42,0.12)]";

export const INPUT = `${INPUT_SKIN} w-full px-3.5 py-[11px]`;

export const BARE_INPUT =
  "w-full [border:none] bg-transparent px-0 py-2.5 text-[14px] [box-shadow:none]";

export const ERROR =
  "mt-4 mb-0 rounded-[12px] bg-red-light px-3.5 py-2.5 text-[13.5px] text-red";

export const EMPTY_LINE = "px-3 py-7 text-center text-[14px] text-ink-faint";

export const LINK_BUTTON =
  "inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold-dark hover:text-ink max-[768px]:min-h-10 max-[768px]:px-1";

export const TOOLBAR =
  "flex flex-wrap items-center justify-between gap-3 px-[18px] pt-4 pb-1.5";

export const SEGMENTED =
  "inline-flex flex-wrap gap-0.5 rounded-[13px] bg-surface-2 p-1 max-[768px]:grid max-[768px]:w-full";

export const SEGMENT =
  "inline-flex items-center gap-[7px] rounded-[10px] px-[13px] py-[7px] text-[13px] font-medium text-ink-light hover:text-ink aria-selected:bg-surface aria-selected:text-ink aria-selected:[box-shadow:var(--shadow-soft)] max-[768px]:min-h-[38px] max-[768px]:flex-col max-[768px]:justify-center max-[768px]:gap-0.5 max-[768px]:px-0.5 max-[768px]:text-[12.5px] motion-safe:transition-[background,color] motion-safe:duration-150";

export const SEGMENT_COUNT =
  "min-w-5 rounded-[999px] bg-gold-light px-1.5 py-px text-[11px] font-bold text-gold-dark lining-nums";

export const STAT =
  "flex flex-col gap-1 rounded-[20px] border border-line bg-surface px-[22px] py-5 [box-shadow:var(--shadow-soft)]";

export const STAT_LABEL = "text-[13px] font-medium text-ink-light";

export const STAT_VALUE = `${SERIF} text-[44px] font-bold leading-[1.05] lining-nums`;

export const STAT_NOTE = "text-[12px] text-ink-faint";
