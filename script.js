const NS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, text = "") {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text) node.textContent = text;
  return node;
}

function observeAndRun(svg, draw) {
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        draw();
        io.disconnect();
      }
    },
    { threshold: 0.25 }
  );
  io.observe(svg);
}

function animateWidth(rect, w, delay = 0, duration = 1000) {
  rect.setAttribute("width", 0);
  requestAnimationFrame(() => {
    setTimeout(() => {
      rect.style.transition = `width ${duration}ms cubic-bezier(.2,.8,.2,1)`;
      rect.setAttribute("width", w);
    }, delay);
  });
}

function drawComparisonBars() {
  const svg = document.getElementById("comparisonBars");
  const data = [
    { title: "Топ-10% к нижним 10%", left: "14.8×", v: 100, color: "fill-red" },
    { title: "Женская зарплата к мужской", left: "69.6%", v: 69.6, color: "fill-blue" },
    { title: "Сельский доход к московскому", left: "30%", v: 30, color: "fill-gold" },
    { title: "Доля доходов >100k", left: "11.2%", v: 11.2, color: "fill-red" },
  ];

  const startX = 280;
  const maxW = 620;
  data.forEach((d, i) => {
    const y = 45 + i * 88;
    svg.append(el("text", { x: 18, y: y + 24, class: "label-text" }, d.title));
    const track = el("rect", { x: startX, y, width: maxW, height: 36, rx: 2, class: "track" });
    const fill = el("rect", { x: startX, y, width: maxW * (d.v / 100), height: 36, rx: 2, class: d.color });
    const lab = el("text", { x: startX + maxW * (d.v / 100) + 10, y: y + 24, class: "label-text" }, d.left);
    svg.append(track);
    svg.append(fill);
    svg.append(lab);
    animateWidth(fill, maxW * (d.v / 100), i * 150);
  });

  svg.append(el("text", { x: 18, y: 390, class: "small-note" }, "Серый фон = 100% шкалы; цвет = фактическая доля/соотношение."));
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function drawMobilityFlow() {
  const svg = document.getElementById("mobilityFlow");
  const rnd = seededRandom(42);

  const originX = 120;
  const splitX = 420;
  const endX = 860;

  const rows = [
    { name: "Богатый взрослый", y: 90, elite: 0.30, regular: 0.16 },
    { name: "Выше среднего", y: 180, elite: 0.27, regular: 0.24 },
    { name: "Средний класс", y: 270, elite: 0.21, regular: 0.25 },
    { name: "Ниже среднего", y: 360, elite: 0.14, regular: 0.20 },
    { name: "Бедный взрослый", y: 450, elite: 0.08, regular: 0.15 },
  ];

  svg.append(el("text", { x: 18, y: 48, class: "label-text" }, "Старт: семьи со средним доходом"));
  svg.append(el("rect", { x: originX - 20, y: 75, width: 230, height: 395, class: "track", rx: 2 }));

  rows.forEach((r) => {
    svg.append(el("text", { x: endX - 10, y: r.y + 6, class: "label-text", "text-anchor": "end" }, r.name));
    svg.append(el("line", { x1: splitX, y1: r.y, x2: endX - 35, y2: r.y, class: "grid" }));
  });

  const dots = [];
  function pushDots(n, type, row, color) {
    for (let i = 0; i < n; i += 1) {
      const sx = originX + rnd() * 200;
      const sy = 95 + rnd() * 350;
      const tx = splitX + rnd() * (endX - splitX - 50);
      const ty = row.y + (rnd() - 0.5) * 44;
      dots.push({ sx, sy, tx, ty, color, delay: i * 8 + (type === "elite" ? 0 : 450) });
    }
  }

  const total = 320;
  rows.forEach((r) => {
    pushDots(Math.round(total * r.elite), "elite", r, "fill-gold");
    pushDots(Math.round(total * r.regular), "regular", r, "fill-blue");
  });

  dots.forEach((d) => {
    const c = el("rect", { x: d.sx, y: d.sy, width: 5, height: 5, class: d.color, opacity: 0.9 });
    svg.append(c);
    requestAnimationFrame(() => {
      setTimeout(() => {
        c.style.transition = "all 1300ms cubic-bezier(.17,.84,.44,1)";
        c.setAttribute("x", d.tx);
        c.setAttribute("y", d.ty);
      }, d.delay);
    });
  });

  svg.append(el("text", { x: 18, y: 515, class: "small-note" }, "Желтые точки: престижные вузы; синие: прочие траектории. Модельный визуальный сценарий по данным 2024–2025."));
}

function addPanelFrame(svg, x, y, w, h, title) {
  svg.append(el("rect", { x, y, width: w, height: h, fill: "transparent", stroke: "#d6ccb4" }));
  svg.append(el("text", { x: x + 8, y: y - 10, class: "label-text" }, title));
  for (let i = 0; i <= 5; i += 1) {
    const gy = y + (h / 5) * i;
    svg.append(el("line", { x1: x, y1: gy, x2: x + w, y2: gy, class: "grid" }));
  }
}

function drawCurvePanel(svg, cfg) {
  const { x, y, w, h, aColor, bColor, aName, bName, baseA, baseB, gapGrow, delay } = cfg;
  const pointsA = [];
  const pointsB = [];

  for (let i = 0; i <= 90; i += 2) {
    const t = i / 90;
    const xx = x + (i / 90) * w;
    const a = baseA + Math.pow(t, 1.4) * 24;
    const b = baseB + Math.pow(t, 1.35) * (24 - gapGrow);
    const ay = y + h - ((a - 35) / 35) * h;
    const by = y + h - ((b - 35) / 35) * h;
    pointsA.push([xx, ay]);
    pointsB.push([xx, by]);
  }

  pointsA.forEach(([px, py], i) => {
    const ca = el("circle", { cx: px, cy: py, r: 2.2, fill: aColor, opacity: 0 });
    const cb = el("circle", { cx: pointsB[i][0], cy: pointsB[i][1], r: 2.2, fill: bColor, opacity: 0 });
    svg.append(ca);
    svg.append(cb);
    requestAnimationFrame(() => {
      setTimeout(() => {
        ca.style.transition = "opacity 450ms ease";
        cb.style.transition = "opacity 450ms ease";
        ca.setAttribute("opacity", 0.95);
        cb.setAttribute("opacity", 0.95);
      }, delay + i * 25);
    });
  });

  svg.append(el("text", { x: x + 15, y: y + 35, class: "label-text", fill: aColor }, aName));
  svg.append(el("text", { x: x + 15, y: y + h - 16, class: "label-text", fill: bColor }, bName));
}

function drawDualCurve() {
  const svg = document.getElementById("dualCurve");
  const panelY = 70;
  const panelH = 320;

  addPanelFrame(svg, 35, panelY, 430, panelH, "Мужчины: доход детей vs доход родителей");
  addPanelFrame(svg, 515, panelY, 430, panelH, "Женщины: доход детей vs доход родителей");

  drawCurvePanel(svg, {
    x: 35, y: panelY, w: 430, h: panelH,
    aColor: "#721e1e", bColor: "#4ba9c9",
    aName: "Мужчины (город)", bName: "Мужчины (село)",
    baseA: 41, baseB: 34, gapGrow: 8, delay: 150,
  });

  drawCurvePanel(svg, {
    x: 515, y: panelY, w: 430, h: panelH,
    aColor: "#e2d797", bColor: "#4ba9c9",
    aName: "Женщины (город)", bName: "Женщины (село)",
    baseA: 36, baseB: 35, gapGrow: 1, delay: 450,
  });

  svg.append(el("text", { x: 35, y: 430, class: "small-note" }, "Ось X: перцентиль дохода родителей (10-й ... 90-й)."));
  svg.append(el("text", { x: 35, y: 448, class: "small-note" }, "Ось Y: условный ранг индивидуального дохода детей во взрослом возрасте."));
}

observeAndRun(document.getElementById("comparisonBars"), drawComparisonBars);
observeAndRun(document.getElementById("mobilityFlow"), drawMobilityFlow);
observeAndRun(document.getElementById("dualCurve"), drawDualCurve);
