import type { Product, StoreOffer } from "../types/models";
import { money, storeClass, storeMark } from "../utils/format";

export default function ComparePage({ product, offers, onBack }: { product: Product; offers: StoreOffer[]; onBack: () => void }) {
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);
  const lowest = sortedOffers[0];
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
              {offer.product_url.startsWith("http") ? <a className={`button ${index === 0 ? "button-dark" : "button-outline"}`} href={offer.product_url} target="_blank" rel="noreferrer">ไปที่ร้าน <span>↗</span></a> : <button className="button button-outline" disabled title="ลิงก์ร้านค้าจะเพิ่มเมื่อเชื่อมข้อมูลจริง">ข้อมูลตัวอย่าง</button>}
            </article>
          )) : <div className="no-results">ยังไม่มีข้อเสนอสำหรับสินค้านี้ เพิ่มข้อมูลได้จากหน้าจัดการระบบ</div>}
        </div>
      </section>
      <section className="specs-panel"><div><div className="eyebrow"><span className="eyebrow-dot" /> PRODUCT DETAILS</div><h2>ข้อมูลสินค้า</h2></div><ul>{product.specs.map((spec) => <li key={spec}><span>✓</span>{spec}</li>)}</ul></section>
      <button className="back-link" onClick={onBack}>← กลับไปดูสินค้าทั้งหมด</button>
    </main>
  );
}
