import { initials } from "../utils/format";

/** Profile picture if one is set, otherwise the user's initials. */
export default function Avatar({ name, src, className }: { name: string; src?: string | null; className: string }) {
  return (
    <span className={`${className} avatar`}>
      {src ? <img src={src} alt="" /> : initials(name) || "?"}
    </span>
  );
}
