import { useEffect, useRef, useState } from "react";
import { getUserView } from "../api/admin.api";
import type { Product, StoreOffer, UserView } from "../types/models";
import { apiErrorMessage, isUnauthorized } from "../utils/errors";
import { initials, money } from "../utils/format";
import Icon from "./Icon";

const dateTime = (value: string) => new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

/**
 * "View as User": a read-only look at one member's account (profile, favorites, recent searches).
 * Nothing here can change the user's data, and no session is created for them.
 * The backend checks admin rights and writes an audit log entry for every view.
 */
export default function ViewAsUserModal({ userId, products, offers, onClose, onUnauthorized }: {
  userId: string;
  products: Product[];
  offers: StoreOffer[];
  onClose: () => void;
  onUnauthorized: () => void;
}) {
  const [view, setView] = useState<UserView | null>(null);
  const [error, setError] = useState("");
  // One request per opened modal: StrictMode re-runs effects in dev, and each request is an audited view.
  const request = useRef<{ userId: string; promise: Promise<UserView> } | null>(null);

  useEffect(() => {
    let active = true;
    if (request.current?.userId !== userId) request.current = { userId, promise: getUserView(userId) };
    request.current.promise.then((result) => {
      if (active) setView(result);
    }).catch((reason: unknown) => {
      if (!active) return;
      if (isUnauthorized(reason)) onUnauthorized();
      setError(apiErrorMessage(reason, "โหลดข้อมูลผู้ใช้ไม่สำเร็จ"));
    });
    return () => { active = false; };
  }, [userId, onUnauthorized]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const lowestPrice = (productId: string) => {
    const prices = offers.filter((offer) => offer.product_id === productId).map((offer) => offer.price);
    return prices.length ? Math.min(...prices) : null;
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="record-modal view-as-modal" role="dialog" aria-modal="true" aria-labelledby="view-as-title">
        <div className="modal-heading">
          <div>
            <span className="view-as-badge"><Icon name="eye" /> VIEW AS USER · อ่านอย่างเดียว</span>
            <h2 id="view-as-title">มุมมองของผู้ใช้</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="view-as-body">
          {error ? (
            <p className="view-as-error" role="alert">{error}</p>
          ) : !view ? (
            <p className="view-as-loading">กำลังโหลดข้อมูล...</p>
          ) : (
            <>
              <div className="view-as-profile">
                {view.user.avatar_url
                  ? <img className="view-as-avatar" src={view.user.avatar_url} alt="" />
                  : <span className="view-as-avatar">{initials(view.user.display_name) || "U"}</span>}
                <div>
                  <strong>{view.user.display_name}</strong>
                  <span>{view.user.email}</span>
                </div>
                <span className={`status-chip ${view.user.status}`}><i />{view.user.status === "active" ? "ใช้งาน" : "รอยืนยัน"}</span>
              </div>
              <dl className="view-as-meta">
                <div><dt>สมัครเมื่อ</dt><dd>{view.user.created_at}</dd></div>
                <div><dt>รายการโปรด</dt><dd>{view.favorites.length} รายการ</dd></div>
                <div><dt>ค้นหาล่าสุด</dt><dd>{view.searches.length} คำ</dd></div>
              </dl>

              <h3 className="view-as-heading"><Icon name="heart" /> รายการโปรด</h3>
              {view.favorites.length === 0 ? <p className="view-as-empty">ยังไม่มีรายการโปรด</p> : (
                <ul className="view-as-list">
                  {view.favorites.map((favorite) => {
                    const product = products.find((item) => item.id === favorite.product_id);
                    const price = lowestPrice(favorite.product_id);
                    return (
                      <li key={favorite.product_id}>
                        <span className="mini-product">{product?.emoji ?? "📦"}</span>
                        <div><strong>{product?.name ?? `สินค้า #${favorite.product_id} (ถูกลบแล้ว)`}</strong><span>บันทึกเมื่อ {dateTime(favorite.created_at)}</span></div>
                        {price !== null && <b>{money(price)}</b>}
                      </li>
                    );
                  })}
                </ul>
              )}

              <h3 className="view-as-heading"><Icon name="search" /> ค้นหาล่าสุด</h3>
              {view.searches.length === 0 ? <p className="view-as-empty">ยังไม่มีประวัติการค้นหา</p> : (
                <div className="view-as-chips">
                  {view.searches.map((search) => <span key={search.id} title={dateTime(search.searched_at)}>{search.keyword}</span>)}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <span><Icon name="lock" /> แก้ไขข้อมูลแทนผู้ใช้ไม่ได้ · การเปิดดูครั้งนี้ถูกบันทึกใน audit log</span>
          <button type="button" className="button button-dark" onClick={onClose}>ปิด</button>
        </div>
      </section>
    </div>
  );
}
