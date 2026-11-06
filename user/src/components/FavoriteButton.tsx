/** Heart toggle. Guests are sent to login by the parent; the backend stores favorites per signed-in account. */
export default function FavoriteButton({ active, productName, onToggle, className = "", withLabel = false }: {
  active: boolean;
  productName: string;
  onToggle: () => void;
  className?: string;
  withLabel?: boolean;
}) {
  return (
    <button
      type="button"
      className={`favorite-button ${active ? "active" : ""} ${className}`}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `นำ ${productName} ออกจากรายการโปรด` : `เพิ่ม ${productName} ในรายการโปรด`}
      title={active ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
    >
      <span aria-hidden="true">{active ? "♥" : "♡"}</span>
      {withLabel && <span>{active ? "อยู่ในรายการโปรด" : "เพิ่มในรายการโปรด"}</span>}
    </button>
  );
}
