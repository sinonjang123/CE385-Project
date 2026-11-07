import { useEffect, useState } from "react";
import { ZodError } from "zod";
import { getPriceHistory } from "../api/member.api";
import FavoriteButton from "../components/FavoriteButton";
import PriceHistoryChart from "../components/PriceHistoryChart";
import type { PriceHistory, Product, StoreOffer } from "../types/models";
import { apiErrorMessage } from "../utils/errors";
import { dateTime, money, storeClass, storeMark } from "../utils/format";
import { storeLink } from "../utils/storeLinks";
import Icon from "../components/Icon";
import OfferStatusBadge from "../components/OfferStatusBadge";
import { sortOffersForDisplay } from "../utils/offers";

function priceStats(offers: StoreOffer[]) {
  if (!offers.length) return null;
  const prices = offers.map((offer) => offer.price);
  const discounts = offers.map((offer) => offer.original_price > offer.price ? (offer.original_price - offer.price) / offer.original_price : 0);
  return {
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    maxDiscountPercent: Math.round(Math.max(...discounts) * 100),
    latestUpdate: offers.map((offer) => offer.updated_at).sort().at(-1) ?? "",
  };
}

function OfferLink({ offer, productName, primary }: { offer: StoreOffer; productName: string; primary: boolean }) {
  const link = storeLink(offer, productName);
  return (
    <a
      className={`button ${primary ? "button-dark" : "button-outline"}`}
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      title={link.kind === "search" ? `เปิดหน้าค้นหา "${productName}" บน ${offer.store}` : undefined}
    >
      {link.label} <span><Icon name="external" /></span>
    </a>
  );
}

function PriceHistorySection({ productId, isMember, onLogin }: { productId: string; isMember: boolean; onLogin: () => void }) {
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setHistory(null);
    setError("");
    if (!isMember) return;
    let active = true;
    getPriceHistory(productId).then((loaded) => {
      if (active) setHistory(loaded);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof ZodError ? "ข้อมูลประวัติราคาจากเซิร์ฟเวอร์ไม่ถูกต้อง" : apiErrorMessage(reason, "โหลดประวัติราคาไม่สำเร็จ"));
    });
    return () => { active = false; };
  }, [productId, isMember]);

  return (
    <section className="history-section">
      <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> MEMBERS ONLY</div><h2>ประวัติราคา</h2><p>ดูแนวโน้มราคาย้อนหลังของแต่ละร้าน (ข้อมูลจำลอง)</p></div></div>
      {!isMember ? (
        <div className="history-locked">
          <span aria-hidden="true"><Icon name="lock" /></span>
          <div><strong>สำหรับสมาชิกเท่านั้น</strong><p>เข้าสู่ระบบหรือสมัครสมาชิกฟรี เพื่อดูกราฟประวัติราคา บันทึกรายการโปรด และดูประวัติการค้นหา</p></div>
          <button type="button" className="button button-dark" onClick={onLogin}>เข้าสู่ระบบ / สมัครสมาชิก</button>
        </div>
      ) : error ? (
        <p className="history-empty" role="alert">{error}</p>
      ) : history ? (
        <PriceHistoryChart history={history} />
      ) : (
        <p className="history-empty" aria-live="polite">กำลังโหลดประวัติราคา...</p>
      )}
    </section>
  );
}

export default function ComparePage({ product, offers, onBack, isMember, isFavorite, onToggleFavorite, onLogin }: {
  product: Product;
  offers: StoreOffer[];
  onBack: () => void;
  isMember: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onLogin: () => void;
}) {
  const sortedOffers = sortOffersForDisplay(offers);
  const inStockOffers = sortedOffers.filter((offer) => offer.in_stock);
  // The best price only comes from stores that still have the product.
  const lowest = inStockOffers[0];
  const stats = priceStats(inStockOffers);
  return (
    <main className="compare-page">
      <div className="breadcrumbs"><button onClick={onBack}>สินค้าทั้งหมด</button><span>/</span><span>{product.category}</span><span>/</span><span>{product.name}</span></div>
      <section className="compare-intro">
        <div className={`compare-product-art visual-${product.id.charCodeAt(product.id.length - 1) % 6}`}>
          {product.image_url && <img className="compare-product-image" src={product.image_url} alt={product.name} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling?.removeAttribute("hidden"); }} />}
          <span hidden={Boolean(product.image_url)}>{product.emoji}</span>
          <small>find THIS PICK</small>
        </div>
        <div className="compare-product-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> {product.brand} · {product.category}</div>
          <h1>{product.name}</h1>
          <FavoriteButton className="compare-favorite" active={isFavorite} productName={product.name} onToggle={onToggleFavorite} withLabel />
          <p>{product.description}</p>
          <div className="compare-summary"><span>ราคาดีที่สุด</span><strong>{lowest ? money(lowest.price) : sortedOffers.length ? "สินค้าหมด" : "ยังไม่มีราคา"}</strong><span>จาก {lowest?.store ?? "—"}</span><span className="save-badge">{lowest ? (lowest.original_price > lowest.price ? `ประหยัด ${money(lowest.original_price - lowest.price)}` : "ราคาปกติ") : sortedOffers.length ? "ทุกร้านสินค้าหมด" : "เพิ่มข้อเสนอในแอดมิน"}</span></div>
        </div>
      </section>
      <section className="offers-section">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> PRICE CHECK</div><h2>เทียบราคาทุกร้าน</h2><p>{sortedOffers.length} ข้อเสนอ · ตรวจสอบล่าสุดในวันนี้</p></div></div>
        <div className="offer-list">
          {sortedOffers.length ? sortedOffers.map((offer, index) => {
            const isBest = offer === lowest;
            return (
            <article className={`offer-row ${isBest ? "best-offer" : ""} ${offer.in_stock ? "" : "out-of-stock"}`} key={offer.id}>
              <div className="offer-rank">{isBest ? "BEST" : offer.in_stock ? `0${index + 1}` : "—"}</div>
              <div className={`store-logo store-${storeClass(offer.store)}`}>{storeMark(offer.store)}</div>
              <div className="offer-store-copy"><strong>{offer.store}</strong><span>{offer.shipping_info} <i>·</i> อัปเดต {dateTime(offer.updated_at)}</span><OfferStatusBadge offer={offer} /></div>
              <div className="offer-prices"><strong>{money(offer.price)}</strong>{offer.original_price > offer.price && <del>{money(offer.original_price)}</del>}</div>
              <OfferLink offer={offer} productName={product.name} primary={isBest} />
            </article>
            );
          }) : <div className="no-results">ยังไม่มีข้อเสนอสำหรับสินค้านี้ เพิ่มข้อมูลได้จากหน้าจัดการระบบ</div>}
        </div>
        {sortedOffers.length > 0 && <p className="offer-link-note">ปุ่ม "ค้นหาใน…" จะเปิดหน้าค้นหาสินค้าบนเว็บร้านค้า ราคาที่แสดงบน find THIS เป็นข้อมูลจำลอง โปรดตรวจสอบราคาจริงที่ร้านค้า</p>}
      </section>
      <PriceHistorySection productId={product.id} isMember={isMember} onLogin={onLogin} />
      <section className="specs-panel">
        <div><div className="eyebrow"><span className="eyebrow-dot" /> PRODUCT DETAILS</div><h2>ข้อมูลสินค้า</h2></div>
        <div className="product-details">
          {product.description && <p className="product-details-description">{product.description}</p>}
          <dl className="product-facts">
            <div><dt>แบรนด์</dt><dd>{product.brand || "—"}</dd></div>
            <div><dt>หมวดหมู่</dt><dd>{product.category}</dd></div>
            {stats && <>
              <div><dt>ราคาต่ำสุด</dt><dd>{money(stats.lowest)}</dd></div>
              <div><dt>ราคาสูงสุด</dt><dd>{money(stats.highest)}</dd></div>
              <div><dt>ราคาเฉลี่ย</dt><dd>{money(stats.average)}</dd></div>
              <div><dt>ส่วนต่างราคาระหว่างร้าน</dt><dd>{money(stats.highest - stats.lowest)}</dd></div>
              <div><dt>ส่วนลดสูงสุดจากราคาปกติ</dt><dd>{stats.maxDiscountPercent > 0 ? `${stats.maxDiscountPercent}%` : "—"}</dd></div>
              <div><dt>จำนวนร้านที่มีราคา</dt><dd>{sortedOffers.length} ร้าน</dd></div>
              <div><dt>อัปเดตราคาล่าสุด</dt><dd>{dateTime(stats.latestUpdate)}</dd></div>
            </>}
          </dl>
          {product.specs.length > 0 && <>
            <h3>คุณสมบัติเด่น</h3>
            <ul>{product.specs.map((spec) => <li key={spec}><span>✓</span>{spec}</li>)}</ul>
          </>}
        </div>
      </section>
      <button className="back-link" onClick={onBack}><span className="back-icon"><Icon name="arrow-left" /></span> กลับไปดูสินค้าทั้งหมด</button>
    </main>
  );
}
