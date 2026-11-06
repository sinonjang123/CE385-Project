import type { Product, StoreOffer } from "../types/models";
import { dateTime, money, storeClass, storeMark } from "../utils/format";
import { storeLink } from "../utils/storeLinks";

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
      {link.label} <span>↗</span>
    </a>
  );
}

export default function ComparePage({ product, offers, onBack }: { product: Product; offers: StoreOffer[]; onBack: () => void }) {
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);
  const lowest = sortedOffers[0];
  const stats = priceStats(sortedOffers);
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
          <h1>{product.name}</h1><p>{product.description}</p>
          <div className="compare-summary"><span>ราคาดีที่สุด</span><strong>{lowest ? money(lowest.price) : "ยังไม่มีราคา"}</strong><span>จาก {lowest?.store ?? "—"}</span><span className="save-badge">{lowest ? `ประหยัด ${money(lowest.original_price - lowest.price)}` : "เพิ่มข้อเสนอในแอดมิน"}</span></div>
        </div>
      </section>
      <section className="offers-section">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> PRICE CHECK</div><h2>เทียบราคาทุกร้าน</h2><p>{sortedOffers.length} ข้อเสนอ · ตรวจสอบล่าสุดในวันนี้</p></div></div>
        <div className="offer-list">
          {sortedOffers.length ? sortedOffers.map((offer, index) => (
            <article className={`offer-row ${index === 0 ? "best-offer" : ""}`} key={offer.id}>
              <div className="offer-rank">{index === 0 ? "BEST" : `0${index + 1}`}</div>
              <div className={`store-logo store-${storeClass(offer.store)}`}>{storeMark(offer.store)}</div>
              <div className="offer-store-copy"><strong>{offer.store}</strong><span>{offer.shipping_info} <i>·</i> {offer.updated_at} อัปเดต</span></div>
              <div className="offer-prices"><strong>{money(offer.price)}</strong><del>{money(offer.original_price)}</del></div>
              <OfferLink offer={offer} productName={product.name} primary={index === 0} />
            </article>
          )) : <div className="no-results">ยังไม่มีข้อเสนอสำหรับสินค้านี้ เพิ่มข้อมูลได้จากหน้าจัดการระบบ</div>}
        </div>
        {sortedOffers.length > 0 && <p className="offer-link-note">ปุ่ม "ค้นหาใน…" จะเปิดหน้าค้นหาสินค้าบนเว็บร้านค้า ราคาที่แสดงบน find THIS เป็นข้อมูลจำลอง โปรดตรวจสอบราคาจริงที่ร้านค้า</p>}
      </section>
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
      <button className="back-link" onClick={onBack}>← กลับไปดูสินค้าทั้งหมด</button>
    </main>
  );
}
