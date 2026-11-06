import { useState } from "react";
import type { CatalogData } from "../types/models";
import { money, storeClass, storeMark } from "../utils/format";
import Icon from "../components/Icon";

const retailerReferences = [
  { name: "Shopee", url: "https://shopee.co.th/", description: "ตลาดออนไลน์และร้านค้าหลากหลายหมวดหมู่" },
  { name: "Lazada", url: "https://www.lazada.co.th/", description: "ตลาดออนไลน์และร้านค้าแบรนด์ชั้นนำ" },
  { name: "Amazon", url: "https://www.amazon.com/", description: "ตลาดออนไลน์และร้านค้าจากต่างประเทศ" },
] as const;

export default function PriceSourcesPage({ data, onCompare }: { data: CatalogData; onCompare: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const storesWithOffers = retailerReferences.filter((store) => data.offers.some((offer) => offer.store === store.name));
  return (
    <main className="sources-page">
      <div className="breadcrumbs"><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>หน้าแรก</button><span>/</span><span>แหล่งอ้างอิงราคา</span></div>
      <section className="sources-intro">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> PRICE SOURCES</div>
          <h1>ราคาจากหลายร้าน<br />ในหน้าเดียว</h1>
          <p>ดูราคาอ้างอิงจาก Shopee, Lazada และ Amazon<br className="desktop-break" /> ในที่เดียว</p>
        </div>
        <div className="sources-count"><strong>{storesWithOffers.length.toString().padStart(2, "0")}</strong><span>แหล่งราคา<br />ในตัวอย่างนี้</span></div>
      </section>
      <div className="source-disclaimer"><span>ⓘ</span><p><strong>กำลังใช้ Mock API</strong> ราคาและรายการสินค้าเป็นข้อมูลจำลองสำหรับทดสอบการทำงาน ไม่ได้ดึงจาก Shopee, Lazada หรือ Amazon จริง และไม่ควรใช้เป็นราคาอ้างอิงเพื่อซื้อสินค้า</p></div>
      <label className="table-search source-search"><span><Icon name="search" /></span><input aria-label="ค้นหาสินค้าและร้านค้า" placeholder="ค้นหาสินค้าหรือร้านค้า..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="retailer-grid">
        {storesWithOffers.map((store) => {
          const storeOffers = data.offers.filter((offer) => {
            const product = data.products.find((item) => item.id === offer.product_id);
            return offer.store === store.name && `${product?.name ?? ""} ${store.name}`.toLowerCase().includes(query.trim().toLowerCase());
          }).sort((a, b) => a.price - b.price);
          return (
            <section className="retailer-card" key={store.name}>
              <div className="retailer-header">
                <div className={`store-logo store-${storeClass(store.name)}`}>{storeMark(store.name)}</div>
                <div><h2>{store.name}</h2><p>{store.description}</p></div>
                <a className="retailer-visit" href={store.url} target="_blank" rel="noreferrer">เว็บไซต์ร้าน <Icon name="external" /></a>
              </div>
              {storeOffers.length ? <div className="retailer-offers">{storeOffers.map((offer) => {
                const product = data.products.find((item) => item.id === offer.product_id);
                if (!product) return null;
                return <button className="retailer-offer" key={offer.id} onClick={() => onCompare(product.id)}><span className="retailer-product-icon">{product.emoji}</span><span className="retailer-product-name">{product.name}<small>{offer.shipping_info} · อัปเดต {offer.updated_at}</small></span><strong>{money(offer.price)}</strong><span className="retailer-arrow"><Icon name="arrow-right" /></span></button>;
              })}</div> : <p className="retailer-empty">ไม่มีรายการสินค้าที่ตรงกับคำค้น</p>}
              <div className="retailer-footer">{storeOffers.length} ราคาอ้างอิง <span>ข้อมูลจำลอง</span></div>
            </section>
          );
        })}
      </div>
      <div className="source-bottom-note">ร้านค้าที่แสดงเป็นแหล่งอ้างอิงเท่านั้น find THIS ไม่ได้เป็นผู้ขายสินค้า · โปรดตรวจสอบราคาและเงื่อนไขกับร้านค้าก่อนสั่งซื้อ</div>
    </main>
  );
}
