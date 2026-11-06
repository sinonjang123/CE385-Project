/** Minimal line icons (24px grid, 1.75 stroke) sized to the surrounding font size. */
export type IconName = "arrow-right" | "arrow-left" | "arrow-down" | "external" | "search"
  | "grid" | "user" | "box" | "tag" | "chart" | "edit" | "trash" | "filter" | "columns" | "lock" | "eye" | "heart" | "close";

const paths: Record<IconName, string> = {
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  "arrow-down": "M12 5v14M6 13l6 6 6-6",
  external: "M8 16 16 8M9.5 8H16v6.5",
  search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM19.5 19.5 15.8 15.8",
  grid: "M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
  box: "M12 3.5 19.5 7.5v9L12 20.5l-7.5-4v-9L12 3.5ZM4.5 7.5 12 11.5l7.5-4M12 11.5v9",
  tag: "M4 12.6V5a1 1 0 0 1 1-1h7.6L20 11.4 12.4 19 4 12.6ZM8.5 8.5h.01",
  chart: "M5.5 19.5v-8M12 19.5v-15M18.5 19.5v-5",
  edit: "M4.5 19.5h3.8L19 8.8 15.2 5 4.5 15.7v3.8ZM13.4 6.8l3.8 3.8",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12.5h9.2L17.5 7M10 11v5M14 11v5",
  filter: "M4.5 5.5h15l-5.8 6.8v5.4l-3.4 1.8v-7.2L4.5 5.5Z",
  columns: "M4.5 4.5h15v15h-15zM9.5 4.5v15M14.5 4.5v15",
  lock: "M6.5 11h11v8.5h-11zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z",
  heart: "M12 19.5s-7.5-4.4-7.5-9.6A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.3c0 5.2-7.5 9.6-7.5 9.6Z",
  close: "M6.5 6.5l11 11M17.5 6.5l-11 11",
};

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
