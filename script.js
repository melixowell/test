const NS = "http://www.w3.org/2000/svg";

function node(tag, attrs = {}, text = "") {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  return el;
}

function onView(svg, draw) {
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      draw(svg);
      io.disconnect();
    },
    { threshold: 0.24 }
  );
  io.observe(svg);
}

function animateAttr(el, attr, to, delay = 0, duration = 900) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      el.style.transition = `${attr} ${duration}ms cubic-bezier(.2,.8,.2,1)`;
      el.setAttribute(attr, to);
    }, delay);
  });
}

function drawComparisonBars(svg) {
  const data = [
    ["Топ-10% к нижним 10%", 100, "14.8×", "red"],
    ["Женская зарплата к мужской", 69.6, "69.6%", "blue"],
    ["Сельская зарплата к московской", 30, "30%", "gold"],
    ["Работающие по специальности", 20, "20%", "red"],
  ];

  const x0 = 330;
  const full = 610;

  data.forEach((d, i) => {
    const y = 44 + i * 90;
    svg.append(node("text", { x: 18, y: y + 22, class: "label" }, d[0]));

    const track = node("rect", { x: x0, y, width: full, height: 38, class: "track", rx: 2 });
    const fill = node("rect", { x: x0, y, width: 0, height: 38, class: d[3], rx: 2 });
    const valX = x0 + (full * d[1]) / 100;
    const value = node("text", { x: valX + 10, y: y + 24, class: "label" }, d[2]);

    svg.append(track);
    svg.append(fill);
    svg.append(value);
    animateAttr(fill, "width", (full * d[1]) / 100, i * 150, 950);
  });

  svg.append(node("text", { x: 18, y: 405, class: "note" }, "Визуальный язык NYT: нейтральный трек + окрашенная доля для мгновенного сравнения."));
}

function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function drawMobilityFlow(svg) {
  const r = rand(2025);
  const leftX = 120;
  const splitX = 410;
  const rightX = 900;

  const bands = [
    ["Богатый взрослый", 88, 0.31, 0.14],
    ["Выше среднего", 176, 0.27, 0.23],
    ["Средний класс", 264, 0.22, 0.27],
    ["Ниже среднего", 352, 0.13, 0.21],
    ["Бедный взрослый", 440, 0.07, 0.15],
  ];

  svg.append(node("text", { x: 22, y: 46, class: "label" }, "Старт: семьи со средним доходом"));
  svg.append(node("rect", { x: leftX - 22, y: 70, width: 250, height: 390, class: "track" }));

  bands.forEach((b) => {
    svg.append(node("line", { x1: splitX, y1: b[1], x2: rightX - 34, y2: b[1], class: "grid" }));
    svg.append(node("text", { x: rightX - 8, y: b[1] + 5, class: "label", "text-anchor": "end" }, b[0]));
  });

  const dots = [];
  const push = (count, band, cls, offsetDelay) => {
    for (let i = 0; i < count; i += 1) {
      const sx = leftX + r() * 210;
      const sy = 86 + r() * 360;
      const tx = splitX + 15 + r() * (rightX - splitX - 80);
      const ty = band[1] + (r() - 0.5) * 44;
      dots.push({ sx, sy, tx, ty, cls, d: i * 7 + offsetDelay });
    }
  };

  const base = 300;
  bands.forEach((b) => {
    push(Math.round(base * b[2]), b, "gold", 0);
    push(Math.round(base * b[3]), b, "blue", 450);
  });

  dots.forEach((p) => {
    const dot = node("rect", { x: p.sx, y: p.sy, width: 4.4, height: 4.4, class: p.cls, opacity: 0.9 });
    svg.append(dot);
    requestAnimationFrame(() => {
      setTimeout(() => {
        dot.style.transition = "all 1280ms cubic-bezier(.18,.83,.43,1)";
        dot.setAttribute("x", p.tx);
        dot.setAttribute("y", p.ty);
      }, p.d);
    });
  });

  svg.append(node("text", { x: 22, y: 522, class: "note" }, "Желтые: траектории с образовательным преимуществом; синие: базовая траектория."));
}

function drawCurvePanel(svg, cfg) {
  const { x, y, w, h, title, s1Name, s2Name, c1, c2, base1, base2, accel, delay } = cfg;

  svg.append(node("rect", { x, y, width: w, height: h, fill: "transparent", stroke: "#d7ccb5" }));
  svg.append(node("text", { x: x + 6, y: y - 10, class: "label" }, title));

  for (let i = 0; i <= 5; i += 1) {
    const gy = y + (h / 5) * i;
    svg.append(node("line", { x1: x, y1: gy, x2: x + w, y2: gy, class: "grid" }));
  }

  const p1 = [];
  const p2 = [];
  for (let p = 0; p <= 90; p += 2) {
    const t = p / 90;
    const xx = x + t * w;
    const v1 = base1 + Math.pow(t, 1.38) * 24;
    const v2 = base2 + Math.pow(t, 1.34) * (24 - accel);
    const y1 = y + h - ((v1 - 33) / 36) * h;
    const y2 = y + h - ((v2 - 33) / 36) * h;
    p1.push([xx, y1]);
    p2.push([xx, y2]);
  }

  p1.forEach((pt, i) => {
    const d1 = node("circle", { cx: pt[0], cy: pt[1], r: 2.4, fill: c1, opacity: 0 });
    const d2 = node("circle", { cx: p2[i][0], cy: p2[i][1], r: 2.4, fill: c2, opacity: 0 });
    svg.append(d1);
    svg.append(d2);

    requestAnimationFrame(() => {
      setTimeout(() => {
        d1.style.transition = "opacity 420ms ease";
        d2.style.transition = "opacity 420ms ease";
        d1.setAttribute("opacity", 0.95);
        d2.setAttribute("opacity", 0.95);
      }, delay + i * 22);
    });
  });

  svg.append(node("text", { x: x + 14, y: y + 34, class: "label", fill: c1 }, s1Name));
  svg.append(node("text", { x: x + 14, y: y + h - 14, class: "label", fill: c2 }, s2Name));
}

function drawDualCurve(svg) {
  drawCurvePanel(svg, {
    x: 35, y: 70, w: 430, h: 320,
    title: "Мужчины: доход детей vs доход родителей",
    s1Name: "Мужчины (город)", s2Name: "Мужчины (село)",
    c1: "#721e1e", c2: "#41a9c9",
    base1: 40, base2: 33.8, accel: 8, delay: 120,
  });

  drawCurvePanel(svg, {
    x: 515, y: 70, w: 430, h: 320,
    title: "Женщины: доход детей vs доход родителей",
    s1Name: "Женщины (город)", s2Name: "Женщины (село)",
    c1: "#e2d797", c2: "#41a9c9",
    base1: 35.8, base2: 35.2, accel: 2, delay: 420,
  });

  svg.append(node("text", { x: 35, y: 432, class: "axis" }, "Доходный перцентиль родителей →"));
  svg.append(node("text", { x: 35, y: 452, class: "axis" }, "Ранг индивидуального дохода детей во взрослом возрасте ↑"));
}

function drawStackedArea(svg) {
  const x = 70;
  const y = 40;
  const w = 860;
  const h = 390;

  const labels = ["Столица + топ вузы", "Крупные города", "Региональные центры", "Малые города", "Село"];
  const colors = ["#721e1e", "#9e4e4e", "#e2d797", "#8bc5d7", "#41a9c9"];

  // 10..90 перцентиль
  const series = [];
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    const s1 = 2 + 8 * t;
    const s2 = 6 + 16 * t;
    const s3 = 22 + 10 * t;
    const s4 = 28 - 10 * t;
    const s5 = 42 - 24 * t;
    const sum = s1 + s2 + s3 + s4 + s5;
    series.push([s1 / sum, s2 / sum, s3 / sum, s4 / sum, s5 / sum]);
  }

  for (let i = 0; i <= 8; i += 1) {
    const gx = x + (w / 8) * i;
    svg.append(node("line", { x1: gx, y1: y, x2: gx, y2: y + h, class: "grid" }));
    if (i > 0) svg.append(node("text", { x: gx - 10, y: y + h + 20, class: "axis" }, `${i * 10}th`));
  }
  [0.1, 0.3, 0.5, 0.7, 0.9].forEach((v) => {
    const gy = y + h - v * h;
    svg.append(node("line", { x1: x, y1: gy, x2: x + w, y2: gy, class: "grid" }));
    svg.append(node("text", { x: 20, y: gy + 4, class: "axis" }, `${Math.round(v * 100)}%`));
  });

  // stacked paths bottom-up
  const accum = Array(series.length).fill(0);
  labels.forEach((lab, idx) => {
    let dTop = "";
    const topPoints = [];
    const bottomPoints = [];

    series.forEach((row, i) => {
      const xx = x + (w / 8) * i;
      const prev = accum[i];
      const next = prev + row[idx];
      accum[i] = next;
      const yTop = y + h - next * h;
      const yBottom = y + h - prev * h;
      topPoints.push([xx, yTop]);
      bottomPoints.push([xx, yBottom]);
    });

    dTop = `M ${topPoints[0][0]} ${topPoints[0][1]} `;
    for (let i = 1; i < topPoints.length; i += 1) dTop += `L ${topPoints[i][0]} ${topPoints[i][1]} `;
    for (let i = bottomPoints.length - 1; i >= 0; i -= 1) dTop += `L ${bottomPoints[i][0]} ${bottomPoints[i][1]} `;
    dTop += "Z";

    const path = node("path", { d: dTop, fill: colors[idx], opacity: 0 });
    svg.append(path);
    requestAnimationFrame(() => {
      setTimeout(() => {
        path.style.transition = "opacity 700ms ease";
        path.setAttribute("opacity", 0.9);
      }, idx * 220);
    });

    svg.append(node("text", { x: x + 8, y: y + 22 + idx * 18, class: "label", fill: colors[idx] }, lab));
  });

  svg.append(node("text", { x: 70, y: 468, class: "axis" }, "Доходный ранг родителей →"));
}

onView(document.getElementById("comparisonBars"), drawComparisonBars);
onView(document.getElementById("mobilityFlow"), drawMobilityFlow);
onView(document.getElementById("dualCurve"), drawDualCurve);
onView(document.getElementById("stackedArea"), drawStackedArea);
