const NS = "http://www.w3.org/2000/svg";
const tooltip = document.getElementById("tooltip");

function node(tag, attrs = {}, text = "") {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  return el;
}

function showTip(text, x, y) {
  tooltip.textContent = text;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.add("show");
}
function hideTip() { tooltip.classList.remove("show"); }

function onView(svg, draw) {
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    draw(svg);
    io.disconnect();
  }, { threshold: 0.2 });
  io.observe(svg);
}

function ease(t) { return 1 - Math.pow(1 - t, 3); }
function animateNumber({ from = 0, to = 1, duration = 900, delay = 0, update }) {
  const start = performance.now() + delay;
  function tick(now) {
    if (now < start) return requestAnimationFrame(tick);
    const p = Math.min(1, (now - start) / duration);
    const v = from + (to - from) * ease(p);
    update(v);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function drawComparisonBars(svg) {
  svg.innerHTML = "";
  const data = [
    ["Топ-10% к нижним 10%", 100, "14.8×", "red", "Неравенство верхнего и нижнего децилей дохода"],
    ["Женская зарплата к мужской", 69.6, "69.6%", "blue", "Средняя зарплата женщин составляет ~69.6% мужской"],
    ["Сельская зарплата к московской", 30, "30%", "gold", "Сельский доход близок к трети московского"],
    ["Работающие по специальности", 20, "20%", "red", "Только каждый пятый работает строго по диплому"],
  ];

  const x0 = 330;
  const full = 610;
  data.forEach((d, i) => {
    const y = 44 + i * 90;
    svg.append(node("text", { x: 18, y: y + 22, class: "label" }, d[0]));

    const track = node("rect", { x: x0, y, width: full, height: 38, class: "track", rx: 2 });
    const fill = node("rect", { x: x0, y, width: 0, height: 38, class: d[3], rx: 2 });
    const value = node("text", { x: x0 + 10, y: y + 24, class: "label" }, d[2]);

    [track, fill].forEach((el) => {
      el.addEventListener("mousemove", (e) => showTip(d[4], e.clientX, e.clientY));
      el.addEventListener("mouseleave", hideTip);
    });

    svg.append(track);
    svg.append(fill);
    svg.append(value);

    animateNumber({
      from: 0,
      to: (full * d[1]) / 100,
      duration: 1000,
      delay: i * 120,
      update: (w) => {
        fill.setAttribute("width", w);
        value.setAttribute("x", x0 + w + 10);
      },
    });
  });

  svg.append(node("text", { x: 18, y: 405, class: "note" }, "Наведите на полосу, чтобы увидеть объяснение индикатора."));
}

function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function drawMobilityFlow(svg) {
  svg.innerHTML = "";
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

  const legendA = node("g", { style: "cursor:pointer" });
  legendA.append(node("rect", { x: 22, y: 518, width: 13, height: 13, class: "gold" }));
  legendA.append(node("text", { x: 42, y: 529, class: "axis" }, "Образовательный ускоритель"));
  const legendB = node("g", { style: "cursor:pointer" });
  legendB.append(node("rect", { x: 250, y: 518, width: 13, height: 13, class: "blue" }));
  legendB.append(node("text", { x: 270, y: 529, class: "axis" }, "Базовая траектория"));
  svg.append(legendA); svg.append(legendB);

  const dots = [];
  const push = (count, band, cls, offsetDelay, group) => {
    for (let i = 0; i < count; i += 1) {
      const sx = leftX + r() * 210;
      const sy = 86 + r() * 360;
      const tx = splitX + 15 + r() * (rightX - splitX - 80);
      const ty = band[1] + (r() - 0.5) * 44;
      dots.push({ sx, sy, tx, ty, cls, d: i * 6 + offsetDelay, group });
    }
  };

  const base = 300;
  bands.forEach((b) => {
    push(Math.round(base * b[2]), b, "gold", 0, "gold");
    push(Math.round(base * b[3]), b, "blue", 420, "blue");
  });

  const rendered = dots.map((p) => {
    const dot = node("rect", { x: p.sx, y: p.sy, width: 4.3, height: 4.3, class: p.cls, opacity: 0.9 });
    svg.append(dot);
    animateNumber({ from: 0, to: 1, duration: 1450, delay: p.d, update: (t) => {
      dot.setAttribute("x", p.sx + (p.tx - p.sx) * ease(t));
      dot.setAttribute("y", p.sy + (p.ty - p.sy) * ease(t));
    }});
    return { dot, group: p.group };
  });

  let goldOn = true;
  let blueOn = true;
  function refreshOpacity() {
    rendered.forEach((item) => {
      const visible = (item.group === "gold" && goldOn) || (item.group === "blue" && blueOn);
      item.dot.style.opacity = visible ? 0.9 : 0.08;
    });
  }
  legendA.addEventListener("click", () => { goldOn = !goldOn; refreshOpacity(); });
  legendB.addEventListener("click", () => { blueOn = !blueOn; refreshOpacity(); });
}

function makeCurvePath(points) {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i += 1) {
    const p = points[i];
    const prev = points[i - 1];
    const cx = (prev[0] + p[0]) / 2;
    d += ` Q ${cx} ${prev[1]} ${p[0]} ${p[1]}`;
  }
  return d;
}

function drawCurvePanel(svg, cfg) {
  const { x, y, w, h, title, s1Name, s2Name, c1, c2, base1, base2, accel, delay } = cfg;
  svg.append(node("rect", { x, y, width: w, height: h, fill: "transparent", stroke: "#d7ccb5" }));
  svg.append(node("text", { x: x + 6, y: y - 10, class: "label" }, title));

  for (let i = 0; i <= 5; i += 1) {
    const gy = y + (h / 5) * i;
    svg.append(node("line", { x1: x, y1: gy, x2: x + w, y2: gy, class: "grid" }));
  }

  const p1 = [], p2 = [];
  for (let p = 0; p <= 90; p += 2) {
    const t = p / 90;
    const xx = x + t * w;
    const v1 = base1 + Math.pow(t, 1.38) * 24;
    const v2 = base2 + Math.pow(t, 1.34) * (24 - accel);
    p1.push([xx, y + h - ((v1 - 33) / 36) * h]);
    p2.push([xx, y + h - ((v2 - 33) / 36) * h]);
  }

  const path1 = node("path", { d: makeCurvePath(p1), fill: "none", stroke: c1, "stroke-width": 2, opacity: 0.4 });
  const path2 = node("path", { d: makeCurvePath(p2), fill: "none", stroke: c2, "stroke-width": 2, opacity: 0.4 });
  svg.append(path1); svg.append(path2);

  p1.forEach((pt, i) => {
    const d1 = node("circle", { cx: pt[0], cy: pt[1], r: 2.5, fill: c1, opacity: 0 });
    const d2 = node("circle", { cx: p2[i][0], cy: p2[i][1], r: 2.5, fill: c2, opacity: 0 });
    [d1, d2].forEach((dot) => {
      dot.addEventListener("mousemove", (e) => showTip("Ранг дохода в этой точке траектории", e.clientX, e.clientY));
      dot.addEventListener("mouseleave", hideTip);
    });
    svg.append(d1); svg.append(d2);

    animateNumber({ from: 0, to: 0.95, duration: 500, delay: delay + i * 18, update: (o) => {
      d1.setAttribute("opacity", o);
      d2.setAttribute("opacity", o);
    }});
  });

  svg.append(node("text", { x: x + 14, y: y + 34, class: "label", fill: c1 }, s1Name));
  svg.append(node("text", { x: x + 14, y: y + h - 14, class: "label", fill: c2 }, s2Name));
}

function drawDualCurve(svg) {
  svg.innerHTML = "";
  drawCurvePanel(svg, {
    x: 35, y: 70, w: 430, h: 320, title: "Мужчины: доход детей vs доход родителей",
    s1Name: "Мужчины (город)", s2Name: "Мужчины (село)", c1: "#721e1e", c2: "#41a9c9",
    base1: 40, base2: 33.8, accel: 8, delay: 120,
  });
  drawCurvePanel(svg, {
    x: 515, y: 70, w: 430, h: 320, title: "Женщины: доход детей vs доход родителей",
    s1Name: "Женщины (город)", s2Name: "Женщины (село)", c1: "#e2d797", c2: "#41a9c9",
    base1: 35.8, base2: 35.2, accel: 2, delay: 400,
  });
  svg.append(node("text", { x: 35, y: 432, class: "axis" }, "Доходный перцентиль родителей →"));
  svg.append(node("text", { x: 35, y: 452, class: "axis" }, "Ранг дохода детей ↑"));
}

function getHeatColor(v, min, max) {
  const t = (v - min) / (max - min);
  const c1 = [226, 215, 151];
  const c2 = [114, 30, 30];
  const mix = c1.map((c, i) => Math.round(c + (c2[i] - c) * t));
  return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
}

function drawRussiaMap(svg) {
  const panel = document.getElementById("regionPanel");
  const regions = [
    { n: "Санкт-Петербург", x: 120, y: 130, w: 90, h: 55, income: 85, rent: 35, idx: 72, sector: "финансы/услуги" },
    { n: "Москва", x: 220, y: 170, w: 90, h: 60, income: 100, rent: 45, idx: 83, sector: "финансы/IT" },
    { n: "Московская область", x: 320, y: 170, w: 90, h: 60, income: 75, rent: 30, idx: 64, sector: "логистика/услуги" },
    { n: "Татарстан", x: 420, y: 220, w: 95, h: 65, income: 70, rent: 20, idx: 61, sector: "индустрия/нефть" },
    { n: "ХМАО", x: 520, y: 140, w: 110, h: 80, income: 95, rent: 28, idx: 77, sector: "нефть/газ" },
    { n: "Новосибирская обл.", x: 640, y: 220, w: 110, h: 75, income: 63, rent: 18, idx: 57, sector: "наука/логистика" },
    { n: "Красноярский край", x: 760, y: 180, w: 120, h: 90, income: 67, rent: 19, idx: 59, sector: "промышленность" },
    { n: "Приморский край", x: 860, y: 250, w: 95, h: 75, income: 60, rent: 20, idx: 54, sector: "логистика/порт" },
    { n: "Сельская местность", x: 260, y: 300, w: 150, h: 95, income: 30, rent: 12, idx: 33, sector: "агро/бюджет" },
  ];

  const incomes = regions.map((r) => r.income);
  const min = Math.min(...incomes);
  const max = Math.max(...incomes);

  svg.innerHTML = "";
  svg.append(node("text", { x: 20, y: 30, class: "label" }, "Доходы по регионам (кликните для деталей)"));

  regions.forEach((r) => {
    const fill = getHeatColor(r.income, min, max);
    const rect = node("rect", { x: r.x, y: r.y, width: r.w, height: r.h, fill, class: "map-region", rx: 6 });
    svg.append(rect);
    svg.append(node("text", { x: r.x + 6, y: r.y + 18, class: "axis", fill: "#2a1e1e" }, r.n));

    rect.addEventListener("mousemove", (e) => showTip(`${r.n}: ${r.income}k ₽`, e.clientX, e.clientY));
    rect.addEventListener("mouseleave", hideTip);
    rect.addEventListener("click", () => {
      svg.querySelectorAll('.map-region').forEach((m) => m.classList.remove('active'));
      rect.classList.add('active');
      panel.innerHTML = `
        <h3>${r.n}</h3>
        <p><strong>Средний доход:</strong> ${r.income} тыс. ₽/мес.</p>
        <p><strong>Средняя аренда:</strong> ${r.rent} тыс. ₽/мес.</p>
        <p><strong>Индекс возможностей:</strong> ${r.idx}/100</p>
        <p><strong>Профиль:</strong> ${r.sector}</p>
      `;
    });
  });

  for (let i = 0; i <= 5; i += 1) {
    const val = min + ((max - min) * i) / 5;
    const sw = node("rect", { x: 22 + i * 36, y: 430, width: 36, height: 14, fill: getHeatColor(val, min, max), class: "legend-swatch" });
    svg.append(sw);
  }
  svg.append(node("text", { x: 22, y: 460, class: "axis" }, `${min}k`));
  svg.append(node("text", { x: 202, y: 460, class: "axis" }, `${max}k`));
}

function runCalculator() {
  const base = 53100;
  const gender = document.getElementById('calcGender').value === 'female' ? 0.696 : 1;
  const edu = parseFloat(document.getElementById('calcEdu').value);
  const sector = parseFloat(document.getElementById('calcSector').value);
  const region = parseFloat(document.getElementById('calcRegion').value);
  const years = parseInt(document.getElementById('calcUpskill').value, 10);
  const relocate = document.getElementById('calcRelocate').checked ? 1.2 : 1;
  const upskill = Math.pow(1.12, years);

  const estimate = Math.round(base * gender * edu * sector * region * relocate * upskill);
  const result = document.getElementById('calcResult');
  result.textContent = `Оценка дохода: ${estimate.toLocaleString('ru-RU')} ₽/мес.`;
}

onView(document.getElementById('comparisonBars'), drawComparisonBars);
onView(document.getElementById('mobilityFlow'), drawMobilityFlow);
onView(document.getElementById('dualCurve'), drawDualCurve);
onView(document.getElementById('russiaMap'), drawRussiaMap);

document.getElementById('replayBars').addEventListener('click', () => drawComparisonBars(document.getElementById('comparisonBars')));
document.getElementById('replayFlow').addEventListener('click', () => drawMobilityFlow(document.getElementById('mobilityFlow')));

['calcGender','calcEdu','calcSector','calcRegion','calcUpskill','calcRelocate'].forEach((id) => {
  document.getElementById(id).addEventListener('input', runCalculator);
});
runCalculator();
