import { useMemo, useState, type PointerEvent } from "react";
import type { PriceHistory, StoreName } from "../types/models";
import { money } from "../utils/format";

// Fixed order + colors per store (validated for color-vision deficiency with the dataviz palette checker).
const storeOrder: StoreName[] = ["Shopee", "Lazada", "Amazon"];
const seriesClass: Record<StoreName, string> = { Shopee: "series-shopee", Lazada: "series-lazada", Amazon: "series-amazon" };

const width = 720;
const height = 260;
const margin = { top: 16, right: 78, bottom: 30, left: 62 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });

function niceTicks(min: number, max: number, count = 4): number[] {
  const rawStep = (max - min) / count || 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rawStep) ?? rawStep;
  const ticks: number[] = [];
  for (let value = Math.floor(min / step) * step; value <= max + step / 2; value += step) ticks.push(value);
  return ticks;
}

export default function PriceHistoryChart({ history }: { history: PriceHistory }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const series = useMemo(
    () => storeOrder.flatMap((store) => history.series.filter((item) => item.store === store)),
    [history.series],
  );
  const dates = series[0]?.points.map((point) => point.date) ?? [];
  const allPrices = series.flatMap((item) => item.points.map((point) => point.price));

  if (!series.length || !dates.length || !allPrices.length) {
    return <p className="history-empty">ยังไม่มีข้อมูลประวัติราคาสำหรับสินค้านี้</p>;
  }

  const ticks = niceTicks(Math.min(...allPrices), Math.max(...allPrices));
  const yMin = ticks[0] ?? 0;
  const yMax = ticks[ticks.length - 1] ?? 1;
  const x = (index: number) => margin.left + (dates.length === 1 ? plotWidth / 2 : (index / (dates.length - 1)) * plotWidth);
  const y = (price: number) => margin.top + plotHeight - ((price - yMin) / (yMax - yMin || 1)) * plotHeight;

  // Lowest point across all stores in the period: the headline for members.
  const lowest = series
    .flatMap((item) => item.points.map((point) => ({ ...point, store: item.store })))
    .reduce((best, point) => point.price < best.price ? point : best);

  // End-of-line labels, nudged apart so they never overlap.
  const endLabels = series
    .map((item) => ({ store: item.store, y: y(item.points[item.points.length - 1]?.price ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let index = 1; index < endLabels.length; index += 1) {
    const previous = endLabels[index - 1];
    const current = endLabels[index];
    if (previous && current && current.y - previous.y < 13) current.y = previous.y + 13;
  }

  function track(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const svgX = ((event.clientX - box.left) / box.width) * width;
    const index = Math.round(((svgX - margin.left) / plotWidth) * (dates.length - 1));
    setHoverIndex(Math.min(dates.length - 1, Math.max(0, index)));
  }

  const hoverDate = hoverIndex === null ? null : dates[hoverIndex];
  const labelEvery = Math.ceil(dates.length / 6);

  return (
    <div className="history-chart">
      <div className="history-toolbar">
        <p className="history-headline">
          ราคาต่ำสุดใน {history.days} วัน <strong>{money(lowest.price)}</strong> <span>ที่ {lowest.store} · {shortDate(lowest.date)}</span>
        </p>
        <button type="button" className="history-toggle" onClick={() => setShowTable((value) => !value)} aria-pressed={showTable}>
          {showTable ? "ดูเป็นกราฟ" : "ดูเป็นตาราง"}
        </button>
      </div>

      <ul className="history-legend" aria-label="คำอธิบายสี">
        {series.map((item) => <li key={item.store}><i className={seriesClass[item.store]} />{item.store}</li>)}
      </ul>

      {showTable ? (
        <div className="history-table-scroll">
          <table className="history-table">
            <caption className="sr-only">ประวัติราคาจำลองรายวัน</caption>
            <thead><tr><th scope="col">วันที่</th>{series.map((item) => <th scope="col" key={item.store}>{item.store}</th>)}</tr></thead>
            <tbody>
              {[...dates].reverse().map((date) => (
                <tr key={date}>
                  <th scope="row">{shortDate(date)}</th>
                  {series.map((item) => <td key={item.store}>{money(item.points.find((point) => point.date === date)?.price ?? 0)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="history-plot">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`กราฟประวัติราคาจำลอง ${history.days} วัน ของ ${series.map((item) => item.store).join(", ")}`}>
            {ticks.map((tick) => (
              <g key={tick} className="history-grid">
                <line x1={margin.left} x2={margin.left + plotWidth} y1={y(tick)} y2={y(tick)} />
                <text x={margin.left - 10} y={y(tick)} dy="0.32em" textAnchor="end">{money(tick)}</text>
              </g>
            ))}
            {dates.map((date, index) => (index % labelEvery === 0 || index === dates.length - 1) && (
              <text key={date} className="history-axis-label" x={x(index)} y={height - 8} textAnchor="middle">{shortDate(date)}</text>
            ))}

            {series.map((item) => (
              <polyline
                key={item.store}
                className={`history-line ${seriesClass[item.store]}`}
                points={item.points.map((point, index) => `${x(index)},${y(point.price)}`).join(" ")}
              />
            ))}
            {endLabels.map((label) => (
              <text key={label.store} className="history-end-label" x={margin.left + plotWidth + 10} y={label.y} dy="0.32em">{label.store}</text>
            ))}

            {hoverIndex !== null && (
              <g className="history-hover">
                <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={margin.top} y2={margin.top + plotHeight} />
                {series.map((item) => {
                  const point = item.points[hoverIndex];
                  return point ? <circle key={item.store} className={seriesClass[item.store]} cx={x(hoverIndex)} cy={y(point.price)} r={4.5} /> : null;
                })}
              </g>
            )}
            <rect
              className="history-hit"
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              onPointerMove={track}
              onPointerDown={track}
              onPointerLeave={() => setHoverIndex(null)}
            />
          </svg>

          {hoverIndex !== null && hoverDate && (
            <div
              className={`history-tooltip ${x(hoverIndex) > width / 2 ? "flip" : ""}`}
              style={{ left: `${(x(hoverIndex) / width) * 100}%` }}
              role="status"
            >
              <strong>{shortDate(hoverDate)}</strong>
              {series.map((item) => (
                <span key={item.store}><i className={seriesClass[item.store]} />{item.store}<b>{money(item.points[hoverIndex]?.price ?? 0)}</b></span>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="history-note">ข้อมูลจำลองเพื่อสาธิตฟีเจอร์ ไม่ใช่ราคาย้อนหลังจริงจากร้านค้า</p>
    </div>
  );
}
