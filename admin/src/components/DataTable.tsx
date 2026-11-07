import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AdminData, AppUser, Product, StoreOffer } from "../types/models";
import { categories, dateTime, initials, money, storeClass, stores } from "../utils/format";
import type { DataKind, RecordToEdit } from "../types/admin";
import Icon from "./Icon";

type Row = AppUser | Product | StoreOffer;
type Column<T> = { key: string; label: string; render: (row: T) => ReactNode };
type FilterOption = { value: string; label: string };
type FilterDef<T> = { key: string; label: string; options: FilterOption[]; matches: (row: T, value: string) => boolean };

/** Offer status shown in the table and used by the status filter. Stock first: an out-of-stock offer is "หมด". */
export function offerStatus(offer: StoreOffer): "out" | "promo-ended" | "promo" | "normal" {
  if (!offer.in_stock) return "out";
  if (offer.promo_ended) return "promo-ended";
  if (offer.promo_ends_at) return "promo";
  return "normal";
}

function OfferStatusChip({ offer }: { offer: StoreOffer }) {
  const status = offerStatus(offer);
  const label = status === "out" ? "สินค้าหมด"
    : status === "promo-ended" ? "หมดโปรโมชั่น"
    : status === "promo" ? `โปรถึง ${offer.promo_ends_at}`
    : "พร้อมขาย";
  return <span className={`offer-status offer-status-${status}`}><i />{label}</span>;
}

const productCategories = categories.filter((item) => item !== "ทั้งหมด");
const withCounts = <T,>(values: string[], rows: T[], matches: (row: T, value: string) => boolean): FilterOption[] =>
  values.map((value) => ({ value, label: `${value} (${rows.filter((row) => matches(row, value)).length})` }));

function useTableConfig(kind: DataKind, data: AdminData) {
  return useMemo(() => {
    const productById = new Map(data.products.map((product) => [product.id, product]));
    if (kind === "users") {
      const columns: Column<AppUser>[] = [
        { key: "name", label: "ชื่อผู้ใช้", render: (user) => <div className="table-primary"><span className="user-avatar">{initials(user.display_name)}</span><strong>{user.display_name}</strong></div> },
        { key: "email", label: "อีเมล", render: (user) => user.email },
        { key: "role", label: "บทบาท", render: (user) => <span className={`role-chip ${user.role}`}>{user.role === "admin" ? "Admin" : "User"}</span> },
        { key: "status", label: "สถานะ", render: (user) => <span className={`status-chip ${user.status}`}><i />{user.status === "active" ? "ใช้งาน" : "รอยืนยัน"}</span> },
        { key: "created_at", label: "วันที่สมัคร", render: (user) => user.created_at },
      ];
      const roleMatches = (user: AppUser, value: string) => user.role === value;
      const statusMatches = (user: AppUser, value: string) => user.status === value;
      const filters: FilterDef<AppUser>[] = [
        { key: "role", label: "บทบาท", matches: roleMatches, options: [{ value: "admin", label: `Admin (${data.users.filter((user) => roleMatches(user, "admin")).length})` }, { value: "user", label: `User (${data.users.filter((user) => roleMatches(user, "user")).length})` }] },
        { key: "status", label: "สถานะ", matches: statusMatches, options: [{ value: "active", label: `ใช้งาน (${data.users.filter((user) => statusMatches(user, "active")).length})` }, { value: "pending", label: `รอยืนยัน (${data.users.filter((user) => statusMatches(user, "pending")).length})` }] },
      ];
      return { rows: data.users as Row[], columns: columns as Column<Row>[], filters: filters as FilterDef<Row>[] };
    }
    if (kind === "products") {
      const columns: Column<Product>[] = [
        { key: "name", label: "สินค้า", render: (product) => <div className="table-primary"><span className="table-product-emoji">{product.emoji}</span><strong>{product.name}</strong></div> },
        { key: "brand", label: "แบรนด์", render: (product) => product.brand },
        { key: "category", label: "หมวดหมู่", render: (product) => <span className="category-pill">{product.category}</span> },
        { key: "specs", label: "สเปก", render: (product) => `${product.specs.length} รายการ` },
        { key: "created_at", label: "วันที่สร้าง", render: (product) => product.created_at },
      ];
      const categoryMatches = (product: Product, value: string) => product.category === value;
      const brandMatches = (product: Product, value: string) => product.brand === value;
      const brands = [...new Set(data.products.map((product) => product.brand))].sort();
      const filters: FilterDef<Product>[] = [
        { key: "category", label: "หมวดหมู่", matches: categoryMatches, options: withCounts(productCategories, data.products, categoryMatches) },
        { key: "brand", label: "แบรนด์", matches: brandMatches, options: withCounts(brands, data.products, brandMatches) },
      ];
      return { rows: data.products as Row[], columns: columns as Column<Row>[], filters: filters as FilterDef<Row>[] };
    }
    const columns: Column<StoreOffer>[] = [
      { key: "product", label: "สินค้า", render: (offer) => { const name = productById.get(offer.product_id)?.name ?? offer.product_id; return <span className="truncate-cell" title={name}>{name}</span>; } },
      { key: "category", label: "หมวดหมู่", render: (offer) => <span className="category-pill">{productById.get(offer.product_id)?.category ?? "—"}</span> },
      { key: "store", label: "ร้านค้า", render: (offer) => <span className={`store-pill store-pill-${storeClass(offer.store)}`}>{offer.store}</span> },
      { key: "price", label: "ราคา", render: (offer) => money(offer.price) },
      { key: "original_price", label: "ราคาปกติ", render: (offer) => money(offer.original_price) },
      { key: "status", label: "สถานะ", render: (offer) => <OfferStatusChip offer={offer} /> },
      { key: "shipping_info", label: "การจัดส่ง", render: (offer) => offer.shipping_info },
      { key: "updated_at", label: "อัปเดต", render: (offer) => dateTime(offer.updated_at) },
    ];
    const categoryMatches = (offer: StoreOffer, value: string) => productById.get(offer.product_id)?.category === value;
    const storeMatches = (offer: StoreOffer, value: string) => offer.store === value;
    const statusMatches = (offer: StoreOffer, value: string) => offerStatus(offer) === value;
    const statusOptions: Array<[string, string]> = [["normal", "พร้อมขาย"], ["promo", "มีโปรโมชั่น"], ["promo-ended", "หมดโปรโมชั่น"], ["out", "สินค้าหมด"]];
    const filters: FilterDef<StoreOffer>[] = [
      { key: "category", label: "หมวดหมู่", matches: categoryMatches, options: withCounts(productCategories, data.offers, categoryMatches) },
      { key: "store", label: "ร้านค้า", matches: storeMatches, options: withCounts(stores, data.offers, storeMatches) },
      { key: "status", label: "สถานะ", matches: statusMatches, options: statusOptions.map(([value, label]) => ({ value, label: `${label} (${data.offers.filter((offer) => statusMatches(offer, value)).length})` })) },
    ];
    return { rows: data.offers as Row[], columns: columns as Column<Row>[], filters: filters as FilterDef<Row>[] };
  }, [kind, data]);
}

// Hidden columns are a per-browser convenience only; the table works the same if storage is unavailable.
const hiddenColumnsKey = (kind: DataKind) => `find-this-admin-hidden-columns-${kind}`;
function readHiddenColumns(kind: DataKind): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(hiddenColumnsKey(kind)) ?? "[]");
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
function saveHiddenColumns(kind: DataKind, hidden: string[]) {
  try { localStorage.setItem(hiddenColumnsKey(kind), JSON.stringify(hidden)); } catch { /* storage unavailable: keep in memory only */ }
}

/** Shared table used by the Users, Products and Offers admin pages. */
export default function DataTable({ kind, data, onEdit, onDelete, onViewAsUser }: {
  kind: DataKind;
  data: AdminData;
  onEdit: (kind: DataKind, record: RecordToEdit) => void;
  onDelete: (kind: DataKind, id: string) => void;
  onViewAsUser: (userId: string) => void;
}) {
  const { rows, columns, filters } = useTableConfig(kind, data);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [openPanel, setOpenPanel] = useState<"filters" | "columns" | null>(null);
  const [hidden, setHidden] = useState<string[]>(() => readHiddenColumns(kind));
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close the open menu on an outside click or Escape.
  useEffect(() => {
    if (!openPanel) return;
    const onPointerDown = (event: PointerEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) setOpenPanel(null);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenPanel(null); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openPanel]);

  const visibleColumns = columns.filter((column) => !hidden.includes(column.key));
  const appliedFilters = filters.filter((filter) => activeFilters[filter.key]);
  const search = query.trim().toLowerCase();
  // Offers only store product_id, so the product name and category are added to what the search looks at.
  const searchText = (row: Row) => {
    const product = kind === "offers" ? data.products.find((item) => item.id === (row as StoreOffer).product_id) : undefined;
    return `${JSON.stringify(row)} ${product?.name ?? ""} ${product?.category ?? ""}`.toLowerCase();
  };
  const filtered = rows.filter((row) => (!search || searchText(row).includes(search))
    && appliedFilters.every((filter) => filter.matches(row, activeFilters[filter.key] ?? "")));

  function setFilter(key: string, value: string) {
    setActiveFilters((current) => ({ ...current, [key]: current[key] === value ? "" : value }));
  }

  function toggleColumn(key: string) {
    const next = hidden.includes(key) ? hidden.filter((item) => item !== key) : [...hidden, key];
    if (next.length >= columns.length) return; // keep at least one column visible
    setHidden(next);
    saveHiddenColumns(kind, next);
  }

  function resetColumns() {
    setHidden([]);
    saveHiddenColumns(kind, []);
  }

  const optionLabel = (filter: FilterDef<Row>, value: string) => filter.options.find((option) => option.value === value)?.label.replace(/ \(\d+\)$/, "") ?? value;
  const placeholder = kind === "offers" ? "ค้นหาจากสินค้า ร้านค้า หรือ URL" : kind === "products" ? "ค้นหาจากชื่อสินค้า แบรนด์ หรือหมวดหมู่" : "ค้นหาจากชื่อหรืออีเมล";

  return (
    <section className="admin-table-panel">
      <div className="table-toolbar" ref={toolbarRef}>
        <label className="table-search"><span><Icon name="search" /></span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} /></label>
        <div className="toolbar-menu">
          <button className={`button button-outline filter-button ${appliedFilters.length ? "is-active" : ""}`} aria-expanded={openPanel === "filters"} onClick={() => setOpenPanel(openPanel === "filters" ? null : "filters")}>
            <Icon name="filter" /> <span>ตัวกรอง</span>{appliedFilters.length > 0 && <b className="filter-count">{appliedFilters.length}</b>}
          </button>
          {openPanel === "filters" && (
            <div className="toolbar-popover filter-popover" role="dialog" aria-label="ตัวกรอง">
              {filters.map((filter) => (
                <fieldset className="filter-group" key={filter.key}>
                  <legend>{filter.label}</legend>
                  <div className="filter-chips">
                    <button className={`filter-chip ${!activeFilters[filter.key] ? "active" : ""}`} onClick={() => setActiveFilters((current) => ({ ...current, [filter.key]: "" }))}>ทั้งหมด</button>
                    {filter.options.map((option) => (
                      <button key={option.value} className={`filter-chip ${activeFilters[filter.key] === option.value ? "active" : ""}`} aria-pressed={activeFilters[filter.key] === option.value} onClick={() => setFilter(filter.key, option.value)}>{option.label}</button>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div className="popover-footer"><button onClick={() => setActiveFilters({})} disabled={!appliedFilters.length}>ล้างตัวกรอง</button><button className="button button-dark" onClick={() => setOpenPanel(null)}>เสร็จ</button></div>
            </div>
          )}
        </div>
        <div className="toolbar-menu columns-menu">
          <button className="button button-outline columns-button" aria-expanded={openPanel === "columns"} onClick={() => setOpenPanel(openPanel === "columns" ? null : "columns")}>
            <Icon name="columns" /> คอลัมน์{hidden.length > 0 && <b className="filter-count">{visibleColumns.length}/{columns.length}</b>}
          </button>
          {openPanel === "columns" && (
            <div className="toolbar-popover columns-popover" role="dialog" aria-label="เลือกคอลัมน์">
              <p className="popover-title">แสดงคอลัมน์</p>
              {columns.map((column) => {
                const visible = !hidden.includes(column.key);
                return (
                  <label className="column-option" key={column.key}>
                    <input type="checkbox" checked={visible} disabled={visible && visibleColumns.length === 1} onChange={() => toggleColumn(column.key)} />
                    {column.label}
                  </label>
                );
              })}
              <div className="popover-footer"><button onClick={resetColumns} disabled={!hidden.length}>แสดงทั้งหมด</button></div>
            </div>
          )}
        </div>
      </div>
      {appliedFilters.length > 0 && (
        <div className="active-filters" aria-label="ตัวกรองที่ใช้อยู่">
          {appliedFilters.map((filter) => (
            <button key={filter.key} className="active-filter-tag" onClick={() => setActiveFilters((current) => ({ ...current, [filter.key]: "" }))} aria-label={`ลบตัวกรอง ${filter.label}`}>
              {filter.label}: <strong>{optionLabel(filter, activeFilters[filter.key] ?? "")}</strong> <span>×</span>
            </button>
          ))}
          <button className="clear-filters" onClick={() => setActiveFilters({})}>ล้างทั้งหมด</button>
        </div>
      )}
      <div className="table-scroll"><table>
        <thead><tr><th><input type="checkbox" aria-label="เลือกทั้งหมด" /></th>{visibleColumns.map((column) => <th key={column.key}>{column.label}</th>)}<th></th></tr></thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id} className={kind === "offers" && !(row as StoreOffer).in_stock ? "row-muted" : undefined}>
              <td><input type="checkbox" aria-label={`เลือก ${row.id}`} /></td>
              {visibleColumns.map((column) => <td key={column.key}>{column.render(row)}</td>)}
              <td><RowActions onEdit={() => onEdit(kind, row)} onDelete={() => onDelete(kind, row.id)} onView={kind === "users" && (row as AppUser).role === "user" ? () => onViewAsUser(row.id) : undefined} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {filtered.length === 0 && <div className="table-empty">ไม่พบข้อมูลที่ตรงกับการค้นหาหรือตัวกรอง</div>}
      <div className="table-footer"><span>แสดง {filtered.length} จาก {rows.length} รายการ</span><div><button disabled><Icon name="arrow-left" /> ก่อนหน้า</button><button className="current-page">1</button><button disabled>ถัดไป <Icon name="arrow-right" /></button></div></div>
    </section>
  );
}

function RowActions({ onEdit, onDelete, onView }: { onEdit: () => void; onDelete: () => void; onView?: () => void }) {
  return <div className="row-actions">{onView && <button className="view-as-action" title="View as User — ดูในมุมมองผู้ใช้ (อ่านอย่างเดียว)" aria-label="View as User" onClick={onView}><Icon name="eye" /></button>}<button title="แก้ไข" onClick={onEdit}><Icon name="edit" /></button><button title="ลบ" onClick={onDelete}><Icon name="trash" /></button></div>;
}
