# ColorLab — Generador de Paletas de Colores

ColorLab es un generador de paletas de colores armónicas basado en el espacio de color **OKLCH**. Creá paletas profesionales para diseño web, UI y branding con 6 tipos de armonía, previsualización en vivo, verificación de contraste WCAG 2.1 y exportación multi-formato.

---

## ✨ Features

- **6 tipos de armonía** — Análoga, Complementaria, Split, Triádica, Tetrádica, Monocromática
- **8 roles por paleta** — fondo, fondo-alt, superficie, borde, principal, acento, muted, texto
- **Espacio de color OKLCH** — Motor matemático propio (sin librerías), con gamut clamping a sRGB
- **Previsualización en vivo** — Mockup de UI realista (tipografía, botones, cards) estilizado con la paleta activa
- **5 formatos de exportación** — Variables CSS (`:root`), HEX, OKLCH, HSL, Tailwind CSS
- **Verificador de contraste WCAG 2.1** — Ratios de contraste por color con badges AA/AAA
- **Bloqueo de colores** — Fijá swatches individuales para que persistan al regenerar
- **Atajos de teclado** — `Espacio` = aleatorio, `C` = copiar HEX, `L` = bloquear color principal
- **Asistente de color IA** — Describí tu proyecto en lenguaje natural (ej: "startup de salud", "restaurante elegante") y recibí una armonía sugerida. Soporta comandos de refinamiento ("más oscuro", "más vibrante")
- **Responsive** — Adaptado a todos los tamaños de pantalla
- **SEO optimizado** — Open Graph, Twitter Cards, JSON-LD, canonical URL

---

## 🚀 Cómo usar

ColorLab es una aplicación **100% cliente, sin dependencias, sin build**.

```bash
# Opción 1 — Servir con cualquier servidor estático
python -m http.server 8080

# Opción 2 — Servir con npx
npx serve .

# Opción 3 — Abrí index.html directamente en el navegador
```

No requiere `npm install`, ni Node.js, ni ningún paso de compilación.

---

## 🏗️ Stack

| Capa             | Tecnología                                           |
| ---------------- | ---------------------------------------------------- |
| **Frontend**     | HTML5, CSS3, JavaScript (ES6+) vanilla               |
| **Build**        | No usa — se sirve directamente                       |
| **Dependencias** | Cero dependencias externas                           |
| **Tipografías**  | Inter Tight, JetBrains Mono, Fraunces (Google Fonts) |
| **Color**        | OKLCH — implementación matemática propia             |
| **Hosting**      | Sitio estático en cualquier servidor                 |

---

## 📁 Estructura del proyecto

```
ColorLab/
├── index.html        # Documento HTML principal con SEO y structured data
├── script.js         # Toda la lógica: motor OKLCH, armonías, UI, export, IA
├── style.css         # Estilos completos con glassmorphism, animaciones, responsive
├── img/
│   ├── favicon.svg
│   ├── favicon-16.png
│   ├── favicon-32.png
│   ├── favicon-256.png
│   └── favicon-512.png
└── README.md
```

---

## 🎨 Armonías disponibles

Cada armonía genera 8 colores con roles semánticos asignados:

| Armonía            | Descripción                                         |
| ------------------ | --------------------------------------------------- |
| **Análoga**        | Colores adyacentes en el círculo cromático (±30°)   |
| **Complementaria** | Colores opuestos (180°) con split tonal             |
| **Split**          | Complementario dividido (±150°)                     |
| **Triádica**       | Tres colores equidistantes (120°)                   |
| **Tetrádica**      | Cuatro colores en dos pares complementarios (90°)   |
| **Monocromática**  | Variaciones de luminosidad y croma de un mismo tono |

---

## 🔬 Motor de color

Implementación matemática propia del espacio OKLCH con:

- Conversión **OKLCH → sRGB lineal → sRGB gamma**
- **Gamut clamping** iterativo (reducción de croma para colores fuera de gama)
- Cálculo de **luminancia relativa** (WCAG)
- Cálculo de **ratio de contraste** (WCAG 2.1)

Todo en ≈80 líneas de JavaScript vanilla, sin dependencias.

---

## 📝 Licencia

[Fabricio Varela]
