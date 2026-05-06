if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ─────────────────────────────────────────────
// Generador de paletas — motor OKLCH + UI
// ─────────────────────────────────────────────

// ── color math ──────────────────────────────
function oklchToRgb(L, C, h) {
  const hr = h * Math.PI / 180;
  const a = Math.cos(hr) * C;
  const b = Math.sin(hr) * C;
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const lc = l_ ** 3, mc = m_ ** 3, sc = s_ ** 3;
  let r =  4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  let g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  let bl = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc;
  const toSrgb = v => v <= 0.0031308 ? 12.92*v : 1.055*Math.pow(v, 1/2.4) - 0.055;
  r = toSrgb(r); g = toSrgb(g); bl = toSrgb(bl);
  return [r, g, bl];
}

function clamp01(v) { return Math.min(1, Math.max(0, v)); }

function oklchToHexClamped(L, C, h) {
  let rgb = oklchToRgb(L, C, h);
  let chroma = C;
  let tries = 0;
  while ((rgb[0] < 0 || rgb[0] > 1 || rgb[1] < 0 || rgb[1] > 1 || rgb[2] < 0 || rgb[2] > 1) && tries < 30) {
    chroma *= 0.9;
    rgb = oklchToRgb(L, chroma, h);
    tries++;
  }
  const [r, g, b] = rgb.map(v => clamp01(v));
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0,2),16),
    parseInt(h.slice(2,4),16),
    parseInt(h.slice(4,6),16),
  ];
}

function rgbToHsl(r, g, b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h, s, l=(max+min)/2;
  if (max===min) { h=0; s=0; }
  else {
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d + (g<b?6:0); break;
      case g: h=(b-r)/d + 2; break;
      default: h=(r-g)/d + 4;
    }
    h /= 6;
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function relLum([r, g, b]) {
  const f = v => {
    v /= 255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  };
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
}
function contrastRatio(hexA, hexB) {
  const a = relLum(hexToRgb(hexA));
  const b = relLum(hexToRgb(hexB));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

// ── armonías (8 colores) ─────────────────────
// fondo · fondo-alt · superficie · borde · principal · acento · muted · texto

const ROLES = ['fondo', 'fondo-alt', 'superficie', 'borde', 'principal', 'acento', 'muted', 'texto'];

function normHue(h) {
  let v = h % 360;
  if (v < 0) v += 360;
  return v;
}

function harmonyAnaloga(baseHue) {
  const hues = [
    baseHue - 30, baseHue - 18, baseHue - 8, baseHue,
    baseHue + 10, baseHue + 22, baseHue + 34, baseHue + 48,
  ].map(normHue);
  return [
    { L: 0.97, C: 0.014, h: hues[0] },
    { L: 0.92, C: 0.030, h: hues[1] },
    { L: 0.87, C: 0.055, h: hues[2] },
    { L: 0.76, C: 0.070, h: hues[3] },
    { L: 0.62, C: 0.160, h: hues[4] },
    { L: 0.52, C: 0.180, h: hues[5] },
    { L: 0.40, C: 0.090, h: hues[6] },
    { L: 0.22, C: 0.055, h: hues[7] },
  ];
}

function harmonyComplementaria(baseHue) {
  const comp = normHue(baseHue + 180);
  return [
    { L: 0.97, C: 0.018, h: baseHue },
    { L: 0.91, C: 0.035, h: baseHue },
    { L: 0.85, C: 0.060, h: baseHue },
    { L: 0.74, C: 0.075, h: comp },
    { L: 0.62, C: 0.170, h: baseHue },
    { L: 0.60, C: 0.180, h: comp },
    { L: 0.40, C: 0.095, h: baseHue },
    { L: 0.20, C: 0.050, h: baseHue },
  ];
}

function harmonySplit(baseHue) {
  const a = normHue(baseHue + 150);
  const b = normHue(baseHue + 210);
  return [
    { L: 0.97, C: 0.016, h: baseHue },
    { L: 0.91, C: 0.030, h: baseHue },
    { L: 0.84, C: 0.058, h: baseHue },
    { L: 0.74, C: 0.075, h: a },
    { L: 0.62, C: 0.170, h: baseHue },
    { L: 0.64, C: 0.160, h: a },
    { L: 0.42, C: 0.150, h: b },
    { L: 0.24, C: 0.065, h: baseHue },
  ];
}

function harmonyTriada(baseHue) {
  const a = normHue(baseHue + 120);
  const b = normHue(baseHue + 240);
  return [
    { L: 0.97, C: 0.016, h: baseHue },
    { L: 0.91, C: 0.030, h: a },
    { L: 0.84, C: 0.055, h: baseHue },
    { L: 0.74, C: 0.070, h: b },
    { L: 0.62, C: 0.170, h: baseHue },
    { L: 0.64, C: 0.160, h: a },
    { L: 0.36, C: 0.140, h: b },
    { L: 0.22, C: 0.065, h: baseHue },
  ];
}

function harmonyTetrada(baseHue) {
  const h2 = normHue(baseHue + 90);
  const h3 = normHue(baseHue + 180);
  const h4 = normHue(baseHue + 270);
  return [
    { L: 0.97, C: 0.016, h: baseHue },
    { L: 0.90, C: 0.030, h: h2 },
    { L: 0.84, C: 0.055, h: baseHue },
    { L: 0.74, C: 0.078, h: h3 },
    { L: 0.62, C: 0.160, h: h2 },
    { L: 0.58, C: 0.170, h: h3 },
    { L: 0.40, C: 0.130, h: h4 },
    { L: 0.24, C: 0.055, h: baseHue },
  ];
}

function harmonyMono(baseHue) {
  return [
    { L: 0.97, C: 0.010, h: baseHue },
    { L: 0.92, C: 0.022, h: baseHue },
    { L: 0.84, C: 0.048, h: baseHue },
    { L: 0.72, C: 0.078, h: baseHue },
    { L: 0.60, C: 0.120, h: baseHue },
    { L: 0.48, C: 0.140, h: baseHue },
    { L: 0.34, C: 0.100, h: baseHue },
    { L: 0.20, C: 0.055, h: baseHue },
  ];
}

const HARMONIES = {
  analoga:        { fn: harmonyAnaloga,        label: 'análoga' },
  complementaria: { fn: harmonyComplementaria, label: 'complementaria' },
  split:          { fn: harmonySplit,          label: 'split-complementaria' },
  triada:         { fn: harmonyTriada,         label: 'triádica' },
  tetrada:        { fn: harmonyTetrada,        label: 'tetrádica' },
  mono:           { fn: harmonyMono,           label: 'monocromática' },
};

// ── estado ──────────────────────────────────
const state = {
  hue: 32,
  harmony: 'analoga',
  locks: [false, false, false, false, false, false, false, false],
  current: [],
  fmt: 'css',
  visibleCount: 5,
  variations: Array(8).fill(null).map(() => ({ dL: 0, dC: 0, dH: 0 })),
};

function randomizeVariations() {
  state.variations = Array(8).fill(null).map(() => ({
    dL: (Math.random() - 0.5) * 0.10,
    dC: (Math.random() - 0.5) * 0.040,
    dH: (Math.random() - 0.5) * 14,
  }));
}

function generate(newVariation = false) {
  if (newVariation) randomizeVariations();
  const fn = HARMONIES[state.harmony].fn;
  const base = fn(state.hue);
  const next = base.map((c, i) => {
    const v = state.variations[i];
    const L = Math.max(0.10, Math.min(0.97, c.L + v.dL));
    const C = Math.max(0.004, c.C + v.dC);
    const h = normHue(c.h + v.dH);
    return { L, C, h, hex: oklchToHexClamped(L, C, h) };
  });
  state.current = next.map((c, i) => state.locks[i] && state.current[i] ? state.current[i] : c);
  render();
}

// ── render ──────────────────────────────────
const $palette     = document.getElementById('palette');
const $hue         = document.getElementById('hue');
const $hueReadout  = document.getElementById('hue-readout');
const $exportBody  = document.getElementById('export-body');
const $exportMeta  = document.getElementById('export-meta');
const $contrast    = document.getElementById('contrast-grid');
const $toast       = document.getElementById('toast');

function textOnFor(hex) {
  const L = relLum(hexToRgb(hex));
  return L > 0.5 ? '#16140f' : '#fbfaf6';
}

const SVG_LOCKED   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>`;
const SVG_UNLOCKED = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-1"/></svg>`;
const ADD_CARD_HTML = `<div class="swatch-add" id="btn-add-color"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg><span>Agregar</span></div>`;

function swatchHTML(c, i) {
  const fg = textOnFor(c.hex);
  const [r, g, b] = hexToRgb(c.hex);
  const [hh, ss, ll] = rgbToHsl(r, g, b);
  const locked = state.locks[i];
  return `
    <div class="swatch${locked ? ' locked' : ''}" data-i="${i}" style="background:${c.hex};color:${fg}">
      <div class="top-row">
        <span class="role">${String(i+1).padStart(2,'0')} · ${ROLES[i]}</span>
        <button class="lock" data-lock="${i}" aria-label="bloquear">${locked ? SVG_LOCKED : SVG_UNLOCKED}</button>
      </div>
      <div class="bottom">
        <span class="hex">${c.hex.toUpperCase()}</span>
        <span class="meta">oklch(${(c.L*100).toFixed(0)}% ${c.C.toFixed(3)} ${Math.round(c.h)})<br/>rgb ${r} ${g} ${b} · hsl ${hh} ${ss}% ${ll}%</span>
      </div>
      <div class="copied">copiado</div>
    </div>`;
}

function bindSwatchEvents() {
  $palette.querySelectorAll('.swatch').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.lock')) return;
      copyHex(+el.dataset.i, el);
    });
  });
  $palette.querySelectorAll('.lock').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const i = +el.dataset.lock;
      state.locks[i] = !state.locks[i];
      render();
    });
  });
}

function bindAddCard() {
  document.getElementById('btn-add-color')?.addEventListener('click', () => {
    if (state.visibleCount < state.current.length) {
      state.visibleCount++;
      render();
    }
  });
}

function render() {
  const existing = $palette.querySelectorAll('.swatch');
  const cols = state.visibleCount + (state.visibleCount < state.current.length ? 1 : 0);
  $palette.style.setProperty('--palette-cols', cols);

  if (existing.length !== state.visibleCount) {
    // Rebuild: primera vez o al agregar color
    $palette.innerHTML = state.current.slice(0, state.visibleCount).map((c, i) => swatchHTML(c, i)).join('') +
      (state.visibleCount < state.current.length ? ADD_CARD_HTML : '');
    bindSwatchEvents();
    bindAddCard();
    $palette.querySelectorAll('.swatch').forEach((el, i) => {
      el.style.animationDelay = `${i * 48}ms`;
      el.classList.add('entering');
    });
  } else {
    // Actualización suave en el lugar
    existing.forEach((el, i) => {
      const c = state.current[i];
      const fg = textOnFor(c.hex);
      const [r, g, b] = hexToRgb(c.hex);
      const [hh, ss, ll] = rgbToHsl(r, g, b);
      const locked = state.locks[i];
      el.style.background = c.hex;
      el.style.color = fg;
      el.classList.toggle('locked', locked);
      el.querySelector('.hex').textContent = c.hex.toUpperCase();
      el.querySelector('.lock').innerHTML = locked ? SVG_LOCKED : SVG_UNLOCKED;
    });
    // Sincronizar tarjeta +
    const hasAdd = !!$palette.querySelector('.swatch-add');
    const needsAdd = state.visibleCount < state.current.length;
    if (needsAdd && !hasAdd) {
      $palette.insertAdjacentHTML('beforeend', ADD_CARD_HTML);
      bindAddCard();
    } else if (!needsAdd && hasAdd) {
      $palette.querySelector('.swatch-add').remove();
    }
  }

  renderPreview();
  renderExport();
  renderContrast();
  $hueReadout.textContent = `${state.hue}°`;
  $hue.style.setProperty('--thumb-color', oklchToHexClamped(0.64, 0.24, state.hue));
}

function renderPreview() {
  const c = state.current;
  if (!c.length) return;
  const [bg, bgAlt, surface, border, primary, accent, muted, text] = c.map(x => x.hex);
  const $pv = document.getElementById('preview');
  $pv.style.background = bg;
  $pv.style.color = text;

  const card1 = document.getElementById('pv-card-1');
  card1.style.background = primary;
  card1.style.color = textOnFor(primary);

  const card2 = document.getElementById('pv-card-2');
  card2.style.background = surface;
  card2.style.color = text;

  const tag = document.getElementById('pv-tag-1');
  tag.style.background = accent;
  tag.style.color = textOnFor(accent);

  const btn = document.getElementById('pv-btn-solid');
  btn.style.background = accent;
  btn.style.color = textOnFor(accent);

  document.getElementById('pv-eyebrow').style.color = primary;
}

function renderExport() {
  const c = state.current;
  const fmt = state.fmt;
  let out = '';
  if (fmt === 'css') {
    out = `:root {\n${c.map((x,i)=>`  --color-${ROLES[i]}: ${x.hex};`).join('\n')}\n}`;
  } else if (fmt === 'hex') {
    out = c.map(x => x.hex.toUpperCase()).join('\n');
  } else if (fmt === 'oklch') {
    out = c.map((x,i)=>`--${ROLES[i]}: oklch(${(x.L*100).toFixed(1)}% ${x.C.toFixed(3)} ${x.h.toFixed(1)});`).join('\n');
  } else if (fmt === 'hsl') {
    out = c.map((x,i) => {
      const [r,g,b]=hexToRgb(x.hex);
      const [h,s,l]=rgbToHsl(r,g,b);
      return `--${ROLES[i]}: hsl(${h}, ${s}%, ${l}%);`;
    }).join('\n');
  } else if (fmt === 'tailwind') {
    out = `// tailwind.config.js\ntheme: {\n  extend: {\n    colors: {\n${c.map((x,i)=>`      ${ROLES[i]}: '${x.hex}',`).join('\n')}\n    }\n  }\n}`;
  }
  $exportBody.textContent = out;
  $exportMeta.textContent = `8 colores · armonía ${HARMONIES[state.harmony].label}`;
}

function renderContrast() {
  const c = state.current;
  if (!c.length) return;
  const base = c[0].hex;
  const existing = $contrast.querySelectorAll('.cc-cell');

  if (existing.length !== c.length) {
    $contrast.innerHTML = c.map((x, i) => {
      const ratio = contrastRatio(base, x.hex);
      const aa = ratio >= 4.5, aaa = ratio >= 7, aaLarge = ratio >= 3;
      const fg = textOnFor(x.hex);
      return `
        <div class="cc-cell" style="background:${x.hex};color:${fg}">
          <div>
            <div class="cc-ratio">${ratio.toFixed(2)}</div>
            <div class="mono" style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.7">vs ${ROLES[i]}</div>
          </div>
          <div class="cc-tags">
            <span class="cc-tag ${aaLarge?'':'fail'}">AA·L</span>
            <span class="cc-tag ${aa?'':'fail'}">AA</span>
            <span class="cc-tag ${aaa?'':'fail'}">AAA</span>
          </div>
        </div>`;
    }).join('');
    $contrast.querySelectorAll('.cc-cell').forEach((el, i) => {
      el.style.animationDelay = `${i * 40}ms`;
      el.classList.add('entering');
    });
  } else {
    existing.forEach((el, i) => {
      const x = c[i];
      const ratio = contrastRatio(base, x.hex);
      const aa = ratio >= 4.5, aaa = ratio >= 7, aaLarge = ratio >= 3;
      el.style.background = x.hex;
      el.style.color = textOnFor(x.hex);
      el.querySelector('.cc-ratio').textContent = ratio.toFixed(2);
      const tags = el.querySelectorAll('.cc-tag');
      tags[0].className = `cc-tag ${aaLarge ? '' : 'fail'}`;
      tags[1].className = `cc-tag ${aa ? '' : 'fail'}`;
      tags[2].className = `cc-tag ${aaa ? '' : 'fail'}`;
    });
  }
}

// ── interactions ────────────────────────────
function copyText(t) {
  navigator.clipboard?.writeText(t);
  $toast.classList.add('show');
  clearTimeout(window.__t);
  window.__t = setTimeout(() => $toast.classList.remove('show'), 1200);
}
function copyHex(i, el) {
  copyText(state.current[i].hex.toUpperCase());
  el.classList.add('copied-flash');
  setTimeout(() => el.classList.remove('copied-flash'), 700);
}

document.getElementById('harmony-seg').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  document.querySelectorAll('#harmony-seg button').forEach(x => x.classList.remove('is-active'));
  b.classList.add('is-active');
  state.harmony = b.dataset.harmony;
  generate();
});

$hue.addEventListener('input', e => {
  state.hue = +e.target.value;
  generate();
});

document.getElementById('btn-shuffle').addEventListener('click', () => {
  state.hue = Math.floor(Math.random() * 360);
  $hue.value = state.hue;
  generate(true);
});

document.getElementById('btn-regen').addEventListener('click', () => {
  const $r = document.getElementById('btn-regen');
  $r.classList.remove('spinning');
  void $r.querySelector('.ic').offsetWidth;
  $r.classList.add('spinning');
  $r.querySelector('.ic').addEventListener('animationend', () => $r.classList.remove('spinning'), { once: true });
  state.hue = (state.hue + 30 + Math.floor(Math.random()*60)) % 360;
  $hue.value = state.hue;
  generate(true);
});

document.getElementById('export-tabs').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  document.querySelectorAll('#export-tabs button').forEach(x => x.classList.remove('is-active'));
  b.classList.add('is-active');
  state.fmt = b.dataset.fmt;
  renderExport();
});

document.getElementById('btn-copy-export').addEventListener('click', () => {
  copyText($exportBody.textContent);
});

document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea')) return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (e.repeat) return;
    state.hue = Math.floor(Math.random() * 360);
    $hue.value = state.hue;
    generate(true);
  } else if (e.key.toLowerCase() === 'c') {
    copyText(state.current.map(x => x.hex.toUpperCase()).join('\n'));
  } else if (e.key.toLowerCase() === 'l') {
    state.locks[4] = !state.locks[4];
    render();
  }
});

// ── AI color assistant ───────────────────────

const AI_PROFILES = [
  { keywords: ['océano','mar','agua','playa','náutico','marinero','surf','vela','buceo'], hue: 210, harmony: 'analoga',        desc: 'Azules oceánicos — profundidad, calma y confianza.' },
  { keywords: ['cielo','nube','aire','viento','clima','atmosfera'], hue: 200, harmony: 'analoga',                              desc: 'Azules aéreos — libertad y frescura.' },
  { keywords: ['naturaleza','bosque','plantas','ecológico','orgánico','verde','campo','jardín','flor','árbol','hoja'], hue: 138, harmony: 'analoga', desc: 'Verdes naturales — crecimiento y sostenibilidad.' },
  { keywords: ['tecnología','tech','startup','digital','app','software','ia','inteligencia','código','dev','web','saas'], hue: 252, harmony: 'complementaria', desc: 'Azul-violeta tecnológico — innovación y precisión.' },
  { keywords: ['fuego','energía','urgente','deporte','dinámico','rápido','acción','fitness','gym','running'], hue: 18, harmony: 'split', desc: 'Rojos y naranjas vibrantes — energía y acción.' },
  { keywords: ['lujo','elegante','premium','exclusivo','sofisticado','alta gama','dorado','joyería','reloj','perfume'], hue: 48, harmony: 'mono', desc: 'Dorados cálidos — elegancia y exclusividad.' },
  { keywords: ['comida','restaurante','cocina','gastronomía','café','calidez','acogedor','bar','food','menú'], hue: 35, harmony: 'analoga', desc: 'Tonos cálidos y apetitosos — hospitalidad y confort.' },
  { keywords: ['salud','bienestar','médico','clínica','hospital','cuidado','farmacia','spa','wellness','yoga','meditación'], hue: 168, harmony: 'analoga', desc: 'Verdes y azules suaves — limpieza y confianza.' },
  { keywords: ['arte','creativo','diseño','artista','galería','museo','estudio','ilustración','pintura','escultura'], hue: 290, harmony: 'triada', desc: 'Triádica creativa — originalidad y expresión artística.' },
  { keywords: ['noche','oscuro','misterioso','club','lounge','música electrónica','dj'], hue: 268, harmony: 'mono', desc: 'Púrpuras profundos — misterio y atmósfera nocturna.' },
  { keywords: ['amor','romance','boda','flores','delicado','femenino','rosa','pink','nupcial'], hue: 344, harmony: 'analoga', desc: 'Rosas y magentas — romance y delicadeza.' },
  { keywords: ['minimalista','limpio','simple','blanco','neutro','moderno','editorial','sans'], hue: 220, harmony: 'mono', desc: 'Monocromático frío — claridad y simplicidad.' },
  { keywords: ['finanzas','banco','inversión','dinero','corporativo','profesional','negocio','empresa','b2b'], hue: 224, harmony: 'complementaria', desc: 'Azul corporativo — confianza y estabilidad.' },
  { keywords: ['moda','fashion','ropa','tienda','boutique','estilo','tendencia','lifestyle','streetwear'], hue: 318, harmony: 'split', desc: 'Vibrante y moderno — estilo y tendencia.' },
  { keywords: ['educación','escuela','universidad','aprendizaje','niños','infantil','juegos','kids'], hue: 198, harmony: 'tetrada', desc: 'Tetrádica alegre — creatividad y aprendizaje.' },
  { keywords: ['sostenible','eco','reciclaje','medio ambiente','solar','renovable','ecologia'], hue: 118, harmony: 'split', desc: 'Verde y tierra — sostenibilidad ambiental.' },
  { keywords: ['fotografía','foto','cámara','visual','imagen','portafolio','portfolio'], hue: 36, harmony: 'mono', desc: 'Neutros cálidos — elegancia visual y foco en el contenido.' },
  { keywords: ['música','sonido','audio','podcast','radio','festival','concierto','banda'], hue: 278, harmony: 'triada', desc: 'Vibrante y expresiva — energía y creatividad musical.' },
  { keywords: ['viaje','turismo','aventura','explorar','mochilero','hotel','destino','trips'], hue: 178, harmony: 'analoga', desc: 'Turquesas tropicales — aventura y descubrimiento.' },
  { keywords: ['infantil','bebé','juguetes','guardería','colegio','colorido','kawaii'], hue: 48, harmony: 'tetrada', desc: 'Tetrádica vivaz — alegría y diversidad.' },
  { keywords: ['inmobiliaria','arquitectura','construcción','hogar','casa','interior','deco'], hue: 42, harmony: 'analoga', desc: 'Neutros cálidos y tierra — solidez y hogar.' },
  { keywords: ['ciencia','investigación','laboratorio','datos','análisis','gráficos','estadística'], hue: 240, harmony: 'split', desc: 'Azules y contrastes analíticos — rigor y claridad.' },
];

const AI_REFINEMENTS = [
  { re: /más (oscuro|dark|profundo|serio)/i,      act: p => ({ hue: p.hue, harmony: 'mono',          note: 'Apliqué tonos más oscuros y profundos.' }) },
  { re: /más (claro|luminoso|light|suave)/i,      act: p => ({ hue: p.hue, harmony: p.harmony,        note: 'Ajusté luminosidad hacia tonos más claros.' }) },
  { re: /más (cálido|warm|naranja|tierra)/i,      act: p => ({ hue: normHue(p.hue - 40), harmony: p.harmony, note: 'Desplacé el matiz hacia tonos más cálidos.' }) },
  { re: /más (frío|cool|azul|fresco)/i,           act: p => ({ hue: normHue(p.hue + 40), harmony: p.harmony, note: 'Desplacé el matiz hacia tonos más fríos.' }) },
  { re: /más (vibrante|saturado|intenso|vivo)/i,  act: p => ({ hue: p.hue, harmony: 'split',          note: 'Aumenté la vibración con split-complementaria.' }) },
  { re: /más (suave|pastel|tenue)/i,              act: p => ({ hue: p.hue, harmony: 'mono',            note: 'Suavicé la paleta con tonos pastel.' }) },
  { re: /(otra|diferente|cambia|varía|prueba)/i,  act: p => ({ hue: normHue(p.hue + 55 + Math.floor(Math.random()*50)), harmony: p.harmony, note: 'Probé una variación de matiz diferente.' }) },
];

let aiLastProfile = null;
let aiReady = false;

function aiDetect(text) {
  const low = text.toLowerCase();
  let best = null, top = 0;
  for (const p of AI_PROFILES) {
    const score = p.keywords.filter(k => low.includes(k)).length;
    if (score > top) { top = score; best = p; }
  }
  return top > 0 ? best : null;
}

function aiApply(hue, harmony, desc, note) {
  state.hue = hue;
  state.harmony = harmony;
  document.getElementById('hue').value = hue;
  document.querySelectorAll('#harmony-seg button').forEach(b =>
    b.classList.toggle('is-active', b.dataset.harmony === harmony)
  );
  state.locks = state.locks.map(() => false);
  generate(true);

  const chips = state.current.map(c =>
    `<div class="ai-chip" style="background:${c.hex}" title="${c.hex}"></div>`
  ).join('');

  const body = [desc, note].filter(Boolean).join('\n') +
    `\n\nArmonía <strong>${HARMONIES[harmony].label}</strong> · matiz ${hue}°`;
  aiAddMsg('bot', body, chips);
  setTimeout(() => aiAddMsg('bot', '¿Querés ajustar algo?\n(más oscuro · más cálido · más vibrante · otra variación…)'), 650);
}

function aiAddMsg(role, html, chipsHtml = '') {
  const $m = document.getElementById('ai-messages');
  const wrap = document.createElement('div');
  wrap.className = `ai-msg ${role}`;
  const avatarBot  = `<div class="ai-avatar">✦</div>`;
  const avatarUser = `<div class="ai-avatar">yo</div>`;
  wrap.innerHTML = `
    ${role === 'bot' ? avatarBot : ''}
    <div class="ai-bubble">${html}${chipsHtml ? `<div class="ai-chip-row">${chipsHtml}</div>` : ''}</div>
    ${role === 'user' ? avatarUser : ''}
  `;
  $m.appendChild(wrap);
  $m.scrollTop = $m.scrollHeight;
}

function aiTyping(on) {
  if (on) {
    const $m = document.getElementById('ai-messages');
    const d = document.createElement('div');
    d.className = 'ai-msg bot'; d.id = 'ai-typing';
    d.innerHTML = `<div class="ai-avatar">✦</div><div class="ai-bubble" style="padding:11px 14px;"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    $m.appendChild(d);
    $m.scrollTop = $m.scrollHeight;
  } else {
    document.getElementById('ai-typing')?.remove();
  }
}

function aiHandle(text) {
  if (!text.trim()) return;
  const $send = document.getElementById('ai-send');
  $send.disabled = true;
  aiAddMsg('user', text.replace(/</g,'&lt;'));
  aiTyping(true);

  setTimeout(() => {
    aiTyping(false);
    $send.disabled = false;

    if (aiLastProfile) {
      for (const r of AI_REFINEMENTS) {
        if (r.re.test(text)) {
          const adj = r.act(aiLastProfile);
          aiLastProfile = { ...aiLastProfile, hue: adj.hue, harmony: adj.harmony };
          aiApply(adj.hue, adj.harmony, '', adj.note);
          return;
        }
      }
    }

    const profile = aiDetect(text);
    if (profile) {
      aiLastProfile = profile;
      aiApply(profile.hue, profile.harmony, profile.desc, '');
    } else {
      aiAddMsg('bot', 'Cuéntame más 🙂\n¿Cuál es el sector, el tono que buscás o la audiencia?\n\nEjemplos: <em>startup de salud</em>, <em>restaurante elegante</em>, <em>blog de viajes</em>…');
    }
  }, 550 + Math.random() * 450);
}

// widget controls
const $aiFab   = document.getElementById('ai-fab');
const $aiPanel = document.getElementById('ai-panel');
const $aiInput = document.getElementById('ai-input');
const $aiSend  = document.getElementById('ai-send');
let aiOpen = false;

function aiToggle(force) {
  aiOpen = force !== undefined ? force : !aiOpen;
  $aiPanel.classList.toggle('hidden', !aiOpen);
  $aiFab.classList.toggle('open', aiOpen);
  if (aiOpen && !aiReady) {
    aiReady = true;
    setTimeout(() => aiAddMsg('bot', '¡Hola! Soy tu asistente de color ✦\n\n¿De qué trata tu proyecto o idea? Describímelo y adapto la paleta para vos.'), 180);
    setTimeout(() => $aiInput.focus(), 300);
  }
}

$aiFab.addEventListener('click', () => aiToggle());
document.getElementById('ai-close').addEventListener('click', () => aiToggle(false));

$aiSend.addEventListener('click', () => {
  const v = $aiInput.value.trim();
  if (!v) return;
  $aiInput.value = '';
  $aiInput.style.height = 'auto';
  aiHandle(v);
});

$aiInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $aiSend.click(); }
});

$aiInput.addEventListener('input', () => {
  $aiInput.style.height = 'auto';
  $aiInput.style.height = Math.min($aiInput.scrollHeight, 80) + 'px';
});

// boot
generate(true);

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.07 });
document.querySelectorAll('.lower, .contrast-strip, footer.foot').forEach(el => {
  el.classList.add('reveal');
  revealObs.observe(el);
});
