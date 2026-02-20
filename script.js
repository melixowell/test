const NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}, text = "") {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (text) el.textContent = text;
  return el;
}

function animateRect(rect, targetY, targetH, delay = 0) {
  rect.style.transition = "none";
  rect.setAttribute("y", targetY + targetH);
  rect.setAttribute("height", 0);
  requestAnimationFrame(() => {
    setTimeout(() => {
      rect.style.transition = "all 900ms cubic-bezier(.2,.8,.2,1)";
      rect.setAttribute("y", targetY);
      rect.setAttribute("height", targetH);
    }, delay);
  });
}

function observeAndRun(svg, drawFn) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        drawFn();
        io.disconnect();
      }
    },
    { threshold: 0.35 }
  );
  io.observe(svg);
}

function drawIncomeDist() {
  const svg = document.getElementById("incomeDist");
  const data = [
    { label: "до 7к", value: 1 },
    { label: "7–27к", value: 27 },
    { label: "27–45к", value: 26.2 },
    { label: "45–70к", value: 18 },
    { label: "70–100к", value: 16.8 },
    { label: ">100к", value: 11.2 },
  ];

  const w = 920;
  const h = 360;
  const pad = { t: 20, r: 24, b: 72, l: 42 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = 30;
  const step = innerW / data.length;
  const barW = step * 0.62;

  data.forEach((d, i) => {
    const x = pad.l + i * step + (step - barW) / 2;
    const barH = (d.value / max) * innerH;
    const y = pad.t + innerH - barH;

    const rect = svgEl("rect", { class: "bar", x, y, width: barW, height: barH, rx: 6 });
    svg.append(rect);
    animateRect(rect, y, barH, i * 80);

    svg.append(svgEl("text", { class: "tick-label", x: x + barW / 2, y: h - 42, "text-anchor": "middle" }, d.label));
    svg.append(svgEl("text", { class: "value-label", x: x + barW / 2, y: y - 8, "text-anchor": "middle" }, `${d.value}%`));
  });
}

function drawGenderGap() {
  const svg = document.getElementById("genderGap");
  const data = [
    ["IT", 65.5],
    ["Финансы", 72],
    ["Производство", 78],
    ["Здравоохранение", 90],
    ["Образование", 95.3],
    ["Торговля", 85],
  ];

  const w = 560;
  const h = 380;
  const pad = { t: 22, r: 20, b: 44, l: 140 };
  const innerW = w - pad.l - pad.r;
  const step = (h - pad.t - pad.b) / data.length;

  data.forEach(([label, value], i) => {
    const y = pad.t + i * step + 8;
    const barH = step * 0.56;
    const width = (value / 100) * innerW;

    svg.append(svgEl("text", { class: "tick-label", x: 10, y: y + barH * 0.8 }, label));

    const rect = svgEl("rect", {
      class: i < 2 ? "bar" : "bar-alt",
      x: pad.l,
      y,
      width,
      height: barH,
      rx: 6,
    });
    svg.append(rect);
    rect.style.transition = "none";
    rect.setAttribute("width", 0);
    requestAnimationFrame(() => {
      setTimeout(() => {
        rect.style.transition = "width 850ms ease";
        rect.setAttribute("width", width);
      }, i * 100);
    });

    svg.append(
      svgEl(
        "text",
        { class: "value-label", x: pad.l + width + 8, y: y + barH * 0.8 },
        `${value}%`
      )
    );
  });
}

function drawRegions() {
  const svg = document.getElementById("regions");
  const data = [
    ["Москва", 100],
    ["Санкт-Петербург", 85],
    ["ХМАО", 95],
    ["Московская обл.", 75],
    ["Татарстан", 70],
    ["Сельская местность", 30],
  ];

  const w = 920;
  const h = 380;
  const pad = { t: 20, r: 24, b: 78, l: 50 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = 110;
  const step = innerW / data.length;
  const barW = step * 0.58;

  [0, 25, 50, 75, 100].forEach((t) => {
    const y = pad.t + innerH - (t / max) * innerH;
    svg.append(svgEl("line", { class: "grid-line", x1: pad.l, x2: w - pad.r, y1: y, y2: y }));
    svg.append(svgEl("text", { class: "tick-label", x: 8, y: y + 4 }, `${t}к`));
  });

  data.forEach(([label, value], i) => {
    const x = pad.l + i * step + (step - barW) / 2;
    const barH = (value / max) * innerH;
    const y = pad.t + innerH - barH;
    const rect = svgEl("rect", {
      class: label.includes("Сель") ? "bar-alt" : "bar",
      x,
      y,
      width: barW,
      height: barH,
      rx: 6,
    });
    svg.append(rect);
    animateRect(rect, y, barH, i * 70);

    svg.append(svgEl("text", { class: "tick-label", x: x + barW / 2, y: h - 46, "text-anchor": "middle" }, label));
    svg.append(svgEl("text", { class: "value-label", x: x + barW / 2, y: y - 8, "text-anchor": "middle" }, `${value}к`));
  });
}

function drawEducation() {
  const svg = document.getElementById("education");
  const data = [
    ["Без высшего", 1.0],
    ["Бакалавриат", 1.2],
    ["Магистратура", 1.4],
    ["Асп./PhD", 1.6],
  ];

  const w = 560;
  const h = 360;
  const pad = { t: 30, r: 20, b: 58, l: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = 1.8;
  const step = innerW / (data.length - 1);

  const points = data.map(([_, value], i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - (value / max) * innerH;
    return [x, y, value];
  });

  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const path = svgEl("path", { class: "line", d, "stroke-dasharray": 1000, "stroke-dashoffset": 1000 });
  svg.append(path);
  requestAnimationFrame(() => {
    path.style.transition = "stroke-dashoffset 1.1s ease";
    path.setAttribute("stroke-dashoffset", 0);
  });

  points.forEach(([x, y, value], i) => {
    const c = svgEl("circle", { class: "point", cx: x, cy: y, r: 0 });
    svg.append(c);
    requestAnimationFrame(() => {
      setTimeout(() => {
        c.style.transition = "r 400ms ease";
        c.setAttribute("r", 6);
      }, 250 + i * 120);
    });

    svg.append(svgEl("text", { class: "tick-label", x, y: h - 30, "text-anchor": "middle" }, data[i][0]));
    svg.append(svgEl("text", { class: "value-label", x, y: y - 12, "text-anchor": "middle" }, `${value.toFixed(1)}×`));
  });
}

function drawAgeCurve() {
  const svg = document.getElementById("ageCurve");
  const data = [
    ["25–30", 60],
    ["30–35", 85],
    ["35–40", 120],
    ["40–45", 140],
    ["45–50", 130],
    ["50–55", 115],
    ["55–60", 95],
  ];

  const w = 920;
  const h = 360;
  const pad = { t: 26, r: 24, b: 56, l: 48 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = 160;
  const step = innerW / (data.length - 1);

  const points = data.map(([_, value], i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - (value / max) * innerH;
    return [x, y, value];
  });

  [40, 80, 120, 160].forEach((tick) => {
    const y = pad.t + innerH - (tick / max) * innerH;
    svg.append(svgEl("line", { class: "grid-line", x1: pad.l, x2: w - pad.r, y1: y, y2: y }));
    svg.append(svgEl("text", { class: "tick-label", x: 8, y: y + 4 }, `${tick}к`));
  });

  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const path = svgEl("path", { class: "line", d, "stroke-dasharray": 1200, "stroke-dashoffset": 1200 });
  svg.append(path);
  requestAnimationFrame(() => {
    path.style.transition = "stroke-dashoffset 1.3s ease";
    path.setAttribute("stroke-dashoffset", 0);
  });

  points.forEach(([x, y, value], i) => {
    svg.append(svgEl("text", { class: "tick-label", x, y: h - 24, "text-anchor": "middle" }, data[i][0]));
    const dot = svgEl("circle", { class: "point", cx: x, cy: y, r: 0 });
    svg.append(dot);
    requestAnimationFrame(() => {
      setTimeout(() => {
        dot.style.transition = "r 300ms ease";
        dot.setAttribute("r", 6);
      }, 300 + i * 90);
    });
    svg.append(svgEl("text", { class: "value-label", x, y: y - 12, "text-anchor": "middle" }, `${value}к`));
  });
}

observeAndRun(document.getElementById("incomeDist"), drawIncomeDist);
observeAndRun(document.getElementById("genderGap"), drawGenderGap);
observeAndRun(document.getElementById("regions"), drawRegions);
observeAndRun(document.getElementById("education"), drawEducation);
observeAndRun(document.getElementById("ageCurve"), drawAgeCurve);
