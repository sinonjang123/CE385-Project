import type { Category, Product, StoreOffer } from "../types/models";
import { categories, money } from "../utils/format";

export default function HomePage({ products, offers, search, category, onSearch, onCategory, onCompare }: {
  products: Product[];
  offers: StoreOffer[];
  search: string;
  category: Category | "ทั้งหมด";
  onSearch: (value: string) => void;
  onCategory: (value: Category | "ทั้งหมด") => void;
  onCompare: (id: string) => void;
}) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> ช้อปอย่างฉลาดกว่าเดิม</div>
          <h1>ของชิ้นเดียวกัน<br />ราคาไม่เหมือนกัน</h1>
          <p>ค้นหา เทียบราคา แล้วเลือกข้อเสนอที่ใช่<br className="desktop-break" />จากร้านค้าชั้นนำในที่เดียว</p>
          <form className="hero-search" onSubmit={(event) => { event.preventDefault(); document.getElementById("product-list")?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className="search-icon">⌕</span>
            <input aria-label="ค้นหาสินค้า" placeholder="ค้นหาสินค้า เช่น เมาส์ไร้สาย, รองเท้าวิ่ง" value={search} onChange={(event) => onSearch(event.target.value)} />
            <button type="submit" className="button button-dark">ค้นหา <span>↗</span></button>
          </form>
          <div className="popular-searches"><span>กำลังมองหา</span>{["เมาส์ไร้สาย", "โน้ตบุ๊ก", "หูฟัง"].map((item) => <button key={item} onClick={() => onSearch(item)}>{item}</button>)}</div>
        </div>
        <div className="hero-art" aria-label="ภาพประกอบการเปรียบเทียบราคา">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-product-card"><span className="hero-product-emoji">🖱️</span><span className="hero-card-tag">ของที่ใช่<br /><strong>เจอแล้ว!</strong></span></div>
          <div className="price-float float-one"><span className="store-dot shopee-dot" /> Shopee <strong>฿3,290</strong></div>
          <div className="price-float float-two"><span className="store-dot lazada-dot" /> Lazada <strong>฿3,490</strong></div>
          <div className="best-price"><span>ราคาดีที่สุด</span><strong>฿3,290</strong><small>ประหยัด ฿700</small></div>
          <span className="hero-spark spark-one">✳</span><span className="hero-spark spark-two">✳</span>
        </div>
        <div className="hero-bottom-note"><span>01 / 03</span><span>ราคาอัปเดตจากหลายร้านค้า</span><span>↓</span></div>
      </section>

      <section className="product-section" id="product-list">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-dot" /> FIND YOUR DEAL</div><h2>สินค้าแนะนำ</h2><p>ตัวเลือกยอดนิยมที่กำลังเป็นที่สนใจ</p></div>
          <span className="result-count">{products.length.toString().padStart(2, "0")} รายการ <span>↗</span></span>
        </div>
        <div className="category-row" aria-label="เลือกหมวดหมู่สินค้า">
          {categories.map((item) => <button className={`category-chip ${category === item ? "active" : ""}`} key={item} onClick={() => onCategory(item)}>{item === "ทั้งหมด" ? "ทั้งหมด" : <>{item}<span>↗</span></>}</button>)}
        </div>
        {products.length ? (
          <div className="product-grid">
            {products.map((product, index) => {
              const productOffers = offers.filter((offer) => offer.product_id === product.id);
              const lowPrice = Math.min(...productOffers.map((offer) => offer.price));
              return (
                <article className="product-card" key={product.id}>
                  <button className={`product-visual visual-${index % 6}`} onClick={() => onCompare(product.id)} aria-label={`ดูราคา ${product.name}`}>
                    <span className="product-category">{product.category}</span>
                    {product.image_url && <img className="product-image" src={product.image_url} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling?.removeAttribute("hidden"); }} />}
                    <span className="product-emoji" hidden={Boolean(product.image_url)}>{product.emoji}</span>
                    <span className="visual-caption">find THIS<br /><strong>SELECTION</strong></span>
                  </button>
                  <div className="product-info">
                    <div className="product-brand">{product.brand} <span>·</span> {product.category}</div>
                    <button className="product-name" onClick={() => onCompare(product.id)}>{product.name}</button>
                    <div className="product-price-row"><span>เริ่มต้นที่</span><strong>{Number.isFinite(lowPrice) ? money(lowPrice) : "ยังไม่มีราคา"}</strong></div>
                    <button className="compare-link" onClick={() => onCompare(product.id)}>เทียบราคา {productOffers.length} ร้าน <span>↗</span></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="no-results">ไม่พบสินค้าที่ตรงกับการค้นหา ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</div>}
        <div className="catalog-footer"><span>แสดง {products.length} รายการ</span><span>เรียงตาม <strong>แนะนำสำหรับคุณ ↓</strong></span></div>
      </section>
      <HowItWorks />
      <footer className="site-footer"><span className="brand-mark small-mark">f.</span><span>find THIS · เทียบให้ชัวร์ ก่อนช้อป</span><span>© 2026 find THIS</span></footer>
    </main>
  );
}
function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">
      <div className="how-heading"><div className="eyebrow"><span className="eyebrow-dot" /> EASY AS 1, 2, 3</div><h2>ช้อปให้คุ้ม<br />แค่ 3 ขั้นตอน</h2><p>ไม่ต้องเปิดหลายแท็บ<br />เรารวบรวมไว้ให้แล้ว</p></div>
      <div className="how-steps">{[["01", "ค้นหาสินค้า", "พิมพ์ชื่อหรือเลือกหมวดหมู่สินค้าที่กำลังมองหา"], ["02", "เทียบราคา", "ดูราคาและค่าส่งจากร้านค้าต่าง ๆ ได้ในหน้าเดียว"], ["03", "ไปซื้อที่ร้าน", "เลือกร้านที่คุ้มที่สุด แล้วกดไปซื้อได้ทันที"]].map(([number, title, copy]) => <article className="how-step" key={number}><span>{number}</span><div className="step-arrow">↗</div><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>
  );
}
