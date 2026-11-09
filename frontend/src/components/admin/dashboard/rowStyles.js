const ROW_BASE =
  "items-center rounded-[14px] [&+&]:mt-0.5 motion-safe:transition-[background] motion-safe:duration-[120ms]";

const TABLE_COLUMNS = {
  visits: "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_104px_76px]",
  people: "grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)_72px_124px_76px]",
};

const TRUNCATE = "overflow-hidden text-ellipsis whitespace-nowrap";

const WRAP = "whitespace-normal overflow-visible [text-overflow:clip]";

const TEXT_STRONG = `${TRUNCATE} text-[14px] font-semibold text-ink`;

const CELL_STRONG = `${TRUNCATE} text-[13.5px] font-medium text-ink`;

const SUBTLE = "text-[12.5px] text-ink-light";

const STACK = "flex min-w-0 flex-col";

const TOOLS = "flex items-center justify-end gap-0.5";

const LAYOUTS = {
  compact: {
    row: "flex gap-4 p-3 hover:bg-surface-hover",
    main: "flex-1",
    cell: "",
    date: "text-right max-[760px]:hidden",
    pill: "",
    tools: "",
    textSpan: TRUNCATE,
    cellStrong: CELL_STRONG,
    cellSpan: TRUNCATE,
  },
  table: {
    row: "grid gap-4 p-3 hover:bg-surface-hover max-[760px]:flex max-[760px]:flex-wrap max-[760px]:gap-x-3 max-[760px]:gap-y-2",
    main: "max-[760px]:flex-[1_1_100%]",
    cell: "max-[760px]:flex-[1_1_40%] max-[760px]:pl-[50px] max-[768px]:hidden",
    date: "max-[768px]:flex-[1_1_100%] max-[768px]:pl-[50px]",
    pill: "max-[760px]:ml-[50px]",
    tools: "max-[768px]:ml-auto",
    textSpan: TRUNCATE,
    cellStrong: CELL_STRONG,
    cellSpan: TRUNCATE,
  },
  cards: {
    row: "flex flex-wrap gap-x-2 gap-y-2.5 border border-line bg-surface p-4 rounded-[16px] hover:border-[rgba(201,146,42,0.45)]",
    main: "flex-[1_1_100%] min-w-0",
    cell: "flex-[1_1_100%] min-w-0 pl-[52px]",
    date: "flex-[1_1_100%] min-w-0 pl-[52px]",
    pill: "",
    tools: "ml-auto",
    textSpan: WRAP,
    cellStrong: `${WRAP} text-[13.5px] font-medium text-ink`,
    cellSpan: WRAP,
  },
};

export const LIST_LAYOUTS = {
  compact: "flex flex-col px-2.5 pt-2 pb-2.5",
  table: "flex flex-col px-2.5 pt-2 pb-2.5",
  cards:
    "grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] flex-col gap-3 px-4 pt-1 pb-4",
};

export default function rowStyles(layout, columns) {
  const parts = LAYOUTS[layout];
  const rowColumns = layout === "table" ? TABLE_COLUMNS[columns] : "";
  return {
    row: `${ROW_BASE} ${parts.row} ${rowColumns}`,
    main: `flex min-w-0 items-center gap-3 ${parts.main}`,
    text: STACK,
    textStrong: TEXT_STRONG,
    textSpan: `${SUBTLE} ${parts.textSpan}`,
    cell: `${STACK} ${parts.cell}`,
    date: `${STACK} ${parts.date}`,
    cellStrong: parts.cellStrong,
    cellSpan: `${SUBTLE} ${parts.cellSpan}`,
    pill: parts.pill,
    tools: `${TOOLS} ${parts.tools}`,
  };
}
