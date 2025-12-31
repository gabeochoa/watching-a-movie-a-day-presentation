# Wrapboxd Style Guide v2: Scrapbook Edition

A tactile, handmade aesthetic inspired by personal journals, zines, and memory collages. This guide supplements the original editorial style with a warmer, more personal approach.

---

## 🎯 The Core Vibe

**"A lovingly assembled personal scrapbook, not a corporate presentation."**

This deck feels like something you'd find in someone's bedroom—pages torn from magazines, polaroids taped to kraft paper, handwritten notes in the margins. It's nostalgic, intimate, and distinctly *not* algorithmically generated.

### Two Modes

| Mode | When to Use | Feel |
|------|-------------|------|
| **Editorial** (v1) | Stats, insights, bold statements | Magazine, Twitter, punchy |
| **Scrapbook** (v2) | Favorites, memories, personal picks | Journal, Pinterest, cozy |

You can mix modes within the same deck—use Editorial for data slides, Scrapbook for "my favorites" sections.

---

## 🔤 Typography

### Extended Font Stack

```css
/* === DISPLAY / HEADLINES === */

/* Bold Impact (from v1) */
--font-display-bold: 'Anton', 'Bebas Neue', 'Oswald', Impact, sans-serif;

/* Elegant Script - for "Wrapped", years, romantic headers */
--font-script: 'Pinyon Script', 'Great Vibes', 'Tangerine', 'Dancing Script', cursive;

/* Pixel/Bitmap - Y2K nostalgia, playful titles */
--font-pixel: 'Press Start 2P', 'VT323', 'Silkscreen', 'Pixelify Sans', monospace;

/* === HANDWRITTEN / ANNOTATIONS === */

/* Casual handwriting - labels, captions */
--font-handwritten: 'Caveat', 'Patrick Hand', 'Kalam', 'Indie Flower', cursive;

/* Marker/Sharpie - bolder handwritten */
--font-marker: 'Permanent Marker', 'Rock Salt', 'Covered By Your Grace', cursive;

/* === VINTAGE / TYPEWRITER === */

/* Library cards, vintage labels */
--font-typewriter: 'Courier Prime', 'Special Elite', 'American Typewriter', monospace;

/* === BODY / UI === */
--font-body: 'Inter', 'SF Pro', -apple-system, system-ui, sans-serif;
```

### Typography Mixing Rules

The scrapbook aesthetic thrives on **intentional contrast**:

```
┌─────────────────────────────────────────┐
│                                         │
│   favourite's [script]                  │
│   WATCHES [bold sans]                   │
│                                         │
│   "this one made me cry" [handwritten]  │
│                                         │
└─────────────────────────────────────────┘
```

**Guidelines:**
1. **Max 3 fonts per slide** — more feels chaotic
2. **Script for emotion** — titles, years, "wrapped"
3. **Bold sans for categories** — "MOVIES", "BOOKS", "ALBUMS"
4. **Handwritten for personal notes** — annotations, captions
5. **Pixel for playful/nostalgic** — use sparingly, high impact

### Title Card Patterns

```css
/* Pattern A: Script + Year */
.title-elegant {
  font-family: var(--font-script);
  font-size: 72px;
}
.title-year {
  font-family: var(--font-pixel);
  font-size: 48px;
  letter-spacing: 0.2em;
}

/* Pattern B: Mixed Case Stacking */
.title-stack {
  display: flex;
  flex-direction: column;
}
.title-stack .line1 { font-family: var(--font-script); }
.title-stack .line2 { font-family: var(--font-display-bold); text-transform: uppercase; }

/* Pattern C: Handwritten Overlay */
.title-with-annotation {
  position: relative;
}
.title-annotation {
  font-family: var(--font-handwritten);
  position: absolute;
  transform: rotate(-5deg);
  color: var(--accent);
}
```

---

## 🎨 Color Palettes

### Palette 1: Kraft & Cream (Library/Journal)

Warm, nostalgic, like aged paper and coffee stains.

```css
:root {
  /* Backgrounds */
  --bg-cream: #F5F0E6;
  --bg-kraft: #C4A77D;
  --bg-manila: #E8DCC4;
  --bg-paper: #FAF8F5;
  --bg-charcoal: #2C2C2C;
  
  /* Text */
  --text-sepia: #5C4033;
  --text-ink: #1A1A1A;
  --text-pencil: #4A4A4A;
  
  /* Accents */
  --accent-dusty-rose: #D4A5A5;
  --accent-terracotta: #C67B5C;
  --accent-forest: #4A6741;
  --accent-mustard: #D4A84B;
  
  /* Decorative */
  --tape-yellow: rgba(255, 235, 150, 0.7);
  --stamp-red: #8B0000;
  --ink-blue: #1E3A5F;
}
```

### Palette 2: Pastel Dream (Coquette/Soft)

Soft, feminine, Pinterest-core aesthetic.

```css
:root {
  /* Backgrounds */
  --bg-blush: #FDF2F8;
  --bg-cloud: #F8FAFC;
  --bg-lavender-mist: #F5F3FF;
  
  /* Text */
  --text-soft-black: #374151;
  --text-muted: #6B7280;
  
  /* Accents */
  --accent-pink: #F9A8D4;
  --accent-rose: #FDA4AF;
  --accent-lavender: #C4B5FD;
  --accent-mint: #A7F3D0;
  --accent-baby-blue: #BAE6FD;
  --accent-peach: #FED7AA;
  
  /* Decorative */
  --ribbon-pink: #FBCFE8;
  --bow-red: #E11D48;
  --sparkle: #FFD700;
}
```

### Palette 3: Sage & Stone (Natural Journal)

Earthy, organic, cozy.

```css
:root {
  /* Backgrounds */
  --bg-sage: #D4E5D2;
  --bg-stone: #E7E5E4;
  --bg-olive: #A3B899;
  --bg-warm-white: #FAFAF9;
  
  /* Text */
  --text-charcoal: #374151;
  --text-forest: #1F2937;
  
  /* Accents */
  --accent-terracotta: #C67B5C;
  --accent-rust: #9A3412;
  --accent-gold: #B45309;
  --accent-sage-dark: #4D7C4D;
  
  /* Decorative */
  --dried-flower: #D4A574;
  --pressed-leaf: #6B8E23;
}
```

### Palette 4: Coral Pop (K-pop/Energetic)

Bright, playful, maximalist.

```css
:root {
  /* Backgrounds */
  --bg-coral: #FFF0ED;
  --bg-hot-pink: #FDF2F8;
  --bg-electric: #F0F9FF;
  
  /* Text */
  --text-dark: #18181B;
  
  /* Accents */
  --accent-coral: #FF6B6B;
  --accent-yellow: #FFE066;
  --accent-blue: #4ECDC4;
  --accent-purple: #A855F7;
  --accent-green: #22C55E;
  
  /* Confetti colors */
  --confetti-1: #FF6B6B;
  --confetti-2: #4ECDC4;
  --confetti-3: #FFE066;
  --confetti-4: #A855F7;
  --confetti-5: #45B7D1;
}
```

### Dark Mode: Midnight Journal

```css
:root {
  --bg-midnight: #0F0F0F;
  --bg-charcoal: #1A1A1A;
  --bg-slate: #1E293B;
  
  --text-cream: #F5F0E6;
  --text-muted: #9CA3AF;
  
  --accent-gold: #FFD700;
  --accent-rose: #F43F5E;
  --accent-teal: #2DD4BF;
}
```

---

## 📐 Layout Patterns

### 1. Open Journal Spread

Two-page layout with visible binding, like an open notebook.

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   ○                 │                 ○   │
│   ○   LEFT PAGE     │   RIGHT PAGE    ○   │  ← binder rings
│   ○                 │                 ○   │
│   ○   [content]     │   [content]     ○   │
│   ○                 │                 ○   │
│                     │                     │
├─────────────────────┼─────────────────────┤
│  [tab: BOOKS]       │              [tab]  │  ← navigation tabs
└─────────────────────┴─────────────────────┘
```

```css
.journal-spread {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  background: var(--bg-cream);
  position: relative;
}

/* Center binding effect */
.journal-spread::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 40px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0,0,0,0.1) 45%, 
    rgba(0,0,0,0.15) 50%, 
    rgba(0,0,0,0.1) 55%, 
    transparent 100%
  );
  pointer-events: none;
}

/* Binder rings */
.binder-rings {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 60px;
  padding: 40px 0;
}

.binder-ring {
  width: 24px;
  height: 24px;
  border: 3px solid #666;
  border-radius: 50%;
  background: linear-gradient(135deg, #888 0%, #ccc 50%, #888 100%);
}

/* Side tabs */
.journal-tabs {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.journal-tab {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 12px 8px;
  background: var(--bg-kraft);
  border-radius: 0 8px 8px 0;
  font-family: var(--font-typewriter);
  font-size: 12px;
  text-transform: uppercase;
}
```

### 2. Manila Folder

Content presented in a filing folder metaphor.

```
┌─────────────────────────────────────────┐
│         ┌─────────────────────┐         │
│    📎   │                     │         │
│         │    MANILA FOLDER    │         │
│         │                     │         │
│         │    ┌───────────┐    │         │
│         │    │  content  │    │         │
│         │    │   card    │    │         │
│         │    └───────────┘    │         │
│         │                     │         │
│         └─────────────────────┘         │
│              [binder clip]              │
└─────────────────────────────────────────┘
```

```css
.manila-folder {
  background: #E8D4A8;
  border-radius: 0 16px 8px 8px;
  padding: 40px;
  position: relative;
  box-shadow: 
    0 4px 6px rgba(0,0,0,0.1),
    inset 0 2px 4px rgba(255,255,255,0.2);
}

/* Folder tab */
.manila-folder::before {
  content: '';
  position: absolute;
  top: -24px;
  left: 40px;
  width: 120px;
  height: 24px;
  background: #E8D4A8;
  border-radius: 8px 8px 0 0;
}

/* Paper texture overlay */
.manila-folder::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  border-radius: inherit;
}
```

### 3. Polaroid Cluster

Scattered photos with handwritten captions.

```css
.polaroid-cluster {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 40px;
  justify-content: center;
}

.polaroid {
  background: #FEFEFE;
  padding: 12px 12px 48px 12px;
  box-shadow: 
    0 4px 8px rgba(0,0,0,0.15),
    0 1px 3px rgba(0,0,0,0.1);
  position: relative;
  transition: transform 0.2s ease;
}

/* Random rotations */
.polaroid:nth-child(6n+1) { transform: rotate(-4deg); }
.polaroid:nth-child(6n+2) { transform: rotate(2deg); }
.polaroid:nth-child(6n+3) { transform: rotate(-2deg); }
.polaroid:nth-child(6n+4) { transform: rotate(5deg); }
.polaroid:nth-child(6n+5) { transform: rotate(-1deg); }
.polaroid:nth-child(6n+6) { transform: rotate(3deg); }

.polaroid:hover {
  transform: rotate(0deg) scale(1.05);
  z-index: 10;
}

.polaroid img {
  width: 200px;
  height: 200px;
  object-fit: cover;
}

.polaroid-caption {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  font-family: var(--font-handwritten);
  font-size: 16px;
  color: #333;
  text-align: center;
}
```

### 4. Library Card

Vintage checkout card with stats.

```css
.library-card {
  background: #FFF8E7;
  border: 2px solid #D4A574;
  padding: 24px;
  font-family: var(--font-typewriter);
  max-width: 400px;
  position: relative;
}

.library-card-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  border-bottom: 1px solid #D4A574;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.library-card-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.library-card-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #666;
}

.library-card-value {
  font-size: 14px;
  font-family: var(--font-handwritten);
  color: #333;
}

/* Stamp effect */
.library-stamp {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 60px;
  height: 60px;
  border: 3px solid var(--stamp-red);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  text-transform: uppercase;
  color: var(--stamp-red);
  transform: rotate(-15deg);
  opacity: 0.8;
}
```

### 5. Bookshelf Display

Books standing on a shelf (great for reading lists).

```css
.bookshelf {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 40px;
  background: linear-gradient(180deg, 
    var(--bg-charcoal) 0%, 
    var(--bg-charcoal) 85%, 
    #8B4513 85%, 
    #A0522D 100%
  );
}

.book {
  width: 40px;
  min-height: 180px;
  background: var(--accent-dusty-rose);
  border-radius: 2px 4px 4px 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  padding: 8px 4px;
  box-shadow: 
    2px 0 4px rgba(0,0,0,0.2),
    inset -2px 0 4px rgba(0,0,0,0.1);
  position: relative;
}

/* Vary heights */
.book:nth-child(3n+1) { min-height: 200px; }
.book:nth-child(3n+2) { min-height: 170px; }
.book:nth-child(3n+3) { min-height: 190px; }

/* Spine detail */
.book::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: rgba(0,0,0,0.1);
}
```

### 6. Corkboard / Mood Board

Pinned items on a cork surface.

```css
.corkboard {
  background: 
    url("data:image/svg+xml,...") /* cork texture */,
    #C4A35A;
  padding: 40px;
  min-height: 500px;
  position: relative;
}

.pinned-item {
  position: absolute;
  background: white;
  padding: 8px;
  box-shadow: 2px 4px 8px rgba(0,0,0,0.2);
}

/* Push pin */
.pinned-item::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 30% 30%, 
    #FF6B6B 0%, 
    #DC2626 50%, 
    #991B1B 100%
  );
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
```

---

## 🧷 Decorative Elements

### Paper Clips

```css
.paperclip {
  position: absolute;
  width: 20px;
  height: 50px;
  top: -10px;
  right: 20px;
}

/* SVG paperclip */
.paperclip-svg {
  fill: none;
  stroke: #888;
  stroke-width: 2;
}

/* Or use emoji positioned */
.paperclip-emoji::before {
  content: '📎';
  position: absolute;
  font-size: 24px;
  top: -12px;
  right: 16px;
  transform: rotate(15deg);
}
```

### Binder Clips

```css
.binder-clip {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 30px;
  background: #333;
  border-radius: 4px 4px 0 0;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.binder-clip::before,
.binder-clip::after {
  content: '';
  position: absolute;
  bottom: -15px;
  width: 8px;
  height: 20px;
  background: #666;
  border-radius: 0 0 4px 4px;
}

.binder-clip::before { left: 10px; }
.binder-clip::after { right: 10px; }
```

### Washi Tape

```css
.washi-tape {
  position: absolute;
  height: 24px;
  background: repeating-linear-gradient(
    45deg,
    var(--tape-color-1),
    var(--tape-color-1) 4px,
    var(--tape-color-2) 4px,
    var(--tape-color-2) 8px
  );
  opacity: 0.85;
  transform: rotate(-3deg);
}

/* Tape patterns */
.washi-stripes {
  --tape-color-1: #FFB6C1;
  --tape-color-2: #FFC0CB;
}

.washi-dots {
  background: 
    radial-gradient(circle, #FF69B4 2px, transparent 2px),
    #FFDAB9;
  background-size: 12px 12px;
}

.washi-grid {
  background: 
    linear-gradient(var(--tape-color-1) 1px, transparent 1px),
    linear-gradient(90deg, var(--tape-color-1) 1px, transparent 1px),
    var(--tape-color-2);
  background-size: 8px 8px;
}

/* Torn edge effect */
.washi-tape::before,
.washi-tape::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: inherit;
  filter: url(#torn-edge); /* SVG filter for rough edge */
}
```

### Sparkle Stars

```css
.sparkle-container {
  position: relative;
}

.sparkle {
  position: absolute;
  font-size: 16px;
  animation: twinkle 1.5s ease-in-out infinite;
}

.sparkle:nth-child(1) { top: 10%; left: 5%; animation-delay: 0s; }
.sparkle:nth-child(2) { top: 20%; right: 10%; animation-delay: 0.3s; }
.sparkle:nth-child(3) { bottom: 15%; left: 15%; animation-delay: 0.6s; }
.sparkle:nth-child(4) { bottom: 25%; right: 5%; animation-delay: 0.9s; }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* Star characters to use: ✦ ✧ ⭐ ★ ☆ ✨ ✴ ✵ */
```

### Stamps & Postmarks

```css
.postmark {
  position: absolute;
  width: 80px;
  height: 80px;
  border: 3px solid var(--stamp-red);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-typewriter);
  font-size: 10px;
  text-transform: uppercase;
  color: var(--stamp-red);
  transform: rotate(-20deg);
  opacity: 0.7;
}

.postmark::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid var(--stamp-red);
  border-radius: 50%;
}

/* Wavy cancellation lines */
.postmark::after {
  content: '';
  position: absolute;
  right: -60px;
  width: 60px;
  height: 30px;
  background: repeating-linear-gradient(
    0deg,
    var(--stamp-red) 0px,
    var(--stamp-red) 2px,
    transparent 2px,
    transparent 6px
  );
  opacity: 0.5;
}
```

### Ribbons & Bows

```css
.ribbon-corner {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 80px;
  height: 80px;
  overflow: hidden;
}

.ribbon-corner::before {
  content: 'FAV';
  position: absolute;
  top: 20px;
  right: -25px;
  width: 100px;
  background: var(--bow-red);
  color: white;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 0;
  transform: rotate(45deg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Bow emoji decoration */
.with-bow::after {
  content: '🎀';
  position: absolute;
  top: -12px;
  right: -12px;
  font-size: 24px;
}
```

### Confetti Scatter

```css
.confetti-bg {
  position: relative;
  overflow: hidden;
}

.confetti-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle, var(--confetti-1) 3px, transparent 3px),
    radial-gradient(circle, var(--confetti-2) 2px, transparent 2px),
    radial-gradient(circle, var(--confetti-3) 4px, transparent 4px),
    radial-gradient(circle, var(--confetti-4) 2px, transparent 2px),
    radial-gradient(circle, var(--confetti-5) 3px, transparent 3px);
  background-size: 
    120px 80px,
    90px 100px,
    70px 120px,
    110px 70px,
    80px 90px;
  background-position:
    0 0,
    40px 30px,
    20px 60px,
    60px 10px,
    10px 40px;
  opacity: 0.6;
  pointer-events: none;
}
```

---

## 🖼️ Photo Treatments

### Polaroid Frame

```css
.photo-polaroid {
  background: #FEFEFE;
  padding: 12px 12px 48px 12px;
  box-shadow: 
    0 4px 8px rgba(0,0,0,0.15),
    0 1px 3px rgba(0,0,0,0.1);
}

.photo-polaroid img {
  display: block;
  width: 100%;
}

.photo-polaroid .caption {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-handwritten);
  font-size: 14px;
  color: #333;
}

/* Date in corner */
.photo-polaroid .date {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-family: var(--font-typewriter);
  font-size: 10px;
  color: #666;
}
```

### Film Strip

```css
.filmstrip {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: #1A1A1A;
  position: relative;
}

/* Sprocket holes */
.filmstrip::before,
.filmstrip::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 20px;
  background: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 8px,
    #333 8px,
    #333 16px,
    transparent 16px,
    transparent 24px
  );
}

.filmstrip::before { left: 0; }
.filmstrip::after { right: 0; }

.filmstrip img {
  width: 150px;
  height: 100px;
  object-fit: cover;
}
```

### Photo Stack

```css
.photo-stack {
  position: relative;
  width: 250px;
  height: 200px;
}

.photo-stack img {
  position: absolute;
  width: 200px;
  height: 150px;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.photo-stack img:nth-child(1) {
  transform: rotate(-8deg);
  z-index: 1;
}

.photo-stack img:nth-child(2) {
  transform: rotate(4deg) translate(20px, 10px);
  z-index: 2;
}

.photo-stack img:nth-child(3) {
  transform: rotate(-2deg) translate(40px, 5px);
  z-index: 3;
}
```

### Taped Photo

```css
.photo-taped {
  position: relative;
  padding: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Tape strips */
.photo-taped::before {
  content: '';
  position: absolute;
  top: -12px;
  left: 20%;
  width: 60px;
  height: 24px;
  background: rgba(255, 235, 150, 0.7);
  transform: rotate(-5deg);
}

.photo-taped::after {
  content: '';
  position: absolute;
  bottom: -12px;
  right: 20%;
  width: 50px;
  height: 24px;
  background: rgba(255, 235, 150, 0.7);
  transform: rotate(3deg);
}
```

---

## 🎨 Background Textures

### Paper Grain

```css
.paper-texture {
  background-color: var(--bg-cream);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-blend-mode: multiply;
}

/* Alternative: using pseudo-element for more control */
.paper-texture-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.04;
  background: url('path/to/noise.png');
  pointer-events: none;
}
```

### Dot Grid

```css
.dot-grid {
  background-image: radial-gradient(
    circle,
    #ccc 1px,
    transparent 1px
  );
  background-size: 20px 20px;
  background-color: var(--bg-paper);
}
```

### Graph Paper

```css
.graph-paper {
  background-color: var(--bg-paper);
  background-image:
    linear-gradient(#E5E7EB 1px, transparent 1px),
    linear-gradient(90deg, #E5E7EB 1px, transparent 1px);
  background-size: 20px 20px;
}

/* With thicker major lines */
.graph-paper-major {
  background-image:
    linear-gradient(#E5E7EB 1px, transparent 1px),
    linear-gradient(90deg, #E5E7EB 1px, transparent 1px),
    linear-gradient(#D1D5DB 1px, transparent 1px),
    linear-gradient(90deg, #D1D5DB 1px, transparent 1px);
  background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
}
```

### Lined Paper

```css
.lined-paper {
  background-color: var(--bg-paper);
  background-image: 
    linear-gradient(#E5E7EB 1px, transparent 1px);
  background-size: 100% 28px;
  background-position: 0 20px;
}

/* With red margin line */
.lined-paper-margin::before {
  content: '';
  position: absolute;
  left: 60px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #FECACA;
}
```

### Kraft Paper

```css
.kraft-paper {
  background: 
    linear-gradient(45deg, #C4A77D 25%, transparent 25%),
    linear-gradient(-45deg, #C4A77D 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #B89B6B 75%),
    linear-gradient(-45deg, transparent 75%, #B89B6B 75%);
  background-size: 4px 4px;
  background-color: #C4A77D;
}
```

### Torn Paper Edge

```css
.torn-edge {
  position: relative;
}

.torn-edge::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: inherit;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20'%3E%3Cpath d='M0,20 Q5,15 10,18 T20,16 T30,19 T40,15 T50,18 T60,16 T70,19 T80,15 T90,18 T100,16 L100,20 Z' fill='white'/%3E%3C/svg%3E");
  mask-size: 100px 20px;
  mask-repeat: repeat-x;
}
```

---

## ✍️ Voice & Copy

### Extended Tone Guide

| Context | Style | Example |
|---------|-------|---------|
| **Title cards** | Elegant, personal | "Rai's Media Wrapped 20(25)" |
| **Section headers** | Mix formal + casual | "favourite's **watches**" |
| **Stats** | Celebratory, proud | "168 movies watched!" |
| **Annotations** | Handwritten feel | "this one made me cry →" |
| **Captions** | Intimate, memory-like | "the year where I thrive (a lot!)" |
| **Lists** | Casual, personal | "the ones I enjoyed so much" |

### Annotation Phrases

**Positive markers:**
- "☆ recommended to watch !!!"
- "this one 💛"
- "best read ever"
- "give me that~"
- "obsessed"

**Casual asides:**
- "(yes, really)"
- "(a lot!)"
- "& many more..."
- "honorable mentions !"

**Memory markers:**
- "the year where I..."
- "these are the ones that shaped my year"
- "and the ones I enjoyed so much"
- "for the highs and lows and moments between"

### Emoji Usage

Scrapbook style embraces emoji more freely than editorial:

| Purpose | Emoji Options |
|---------|--------------|
| Favorites marker | ⭐ ★ ☆ 💛 ❤️ |
| Sparkle/magic | ✨ ✦ ✧ 💫 |
| Arrows/pointers | → ← ↑ ↓ ➜ ➤ |
| Hearts | 💕 💗 💖 🩷 🤍 |
| Decorative | 🎀 🌸 🦋 🌙 ☁️ |
| Categories | 📚 🎬 🎵 📺 🎮 |

---

## 🎬 Animation Suggestions

### Page Turn Effect

```css
.page {
  transform-origin: left center;
  transition: transform 0.6s ease;
}

.page.turning {
  transform: rotateY(-180deg);
}
```

### Staggered Photo Reveal

```css
.polaroid {
  opacity: 0;
  transform: translateY(30px) rotate(-5deg);
  animation: dropIn 0.5s ease forwards;
}

.polaroid:nth-child(1) { animation-delay: 0.1s; }
.polaroid:nth-child(2) { animation-delay: 0.2s; }
.polaroid:nth-child(3) { animation-delay: 0.3s; }

@keyframes dropIn {
  to {
    opacity: 1;
    transform: translateY(0) rotate(var(--rotation, -3deg));
  }
}
```

### Tape Peel (on hover)

```css
.washi-tape {
  transform-origin: left center;
  transition: transform 0.3s ease;
}

.photo-taped:hover .washi-tape {
  transform: rotate(-15deg) translateY(-5px);
}
```

### Sparkle Burst

```css
@keyframes sparkleBurst {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}
```

---

## ✅ Scrapbook Style Checklist

For each slide/section, verify:

- [ ] **Texture present** — paper grain, dots, or subtle pattern
- [ ] **At least one tactile element** — clip, tape, pin, or frame
- [ ] **Typography mixing** — 2-3 complementary fonts
- [ ] **Photos feel physical** — polaroid, taped, or stacked
- [ ] **Handwritten touch** — at least one annotation or caption
- [ ] **Warm palette** — avoid pure black/white unless intentional
- [ ] **Slight rotations** — nothing perfectly aligned
- [ ] **Personal voice** — would someone write this in their journal?

---

## 🆚 Quick Reference: v1 vs v2

| Aspect | v1 Editorial | v2 Scrapbook |
|--------|-------------|--------------|
| **Backgrounds** | Solid black/white | Textured paper, kraft |
| **Typography** | Bold sans only | Script + handwritten + sans |
| **Colors** | High contrast, bold | Warm neutrals, pastels |
| **Photos** | Screenshots, embeds | Polaroids, film strips |
| **Decorations** | Sticker labels | Clips, tape, stamps, stars |
| **Layout** | Magazine editorial | Journal spread, corkboard |
| **Voice** | Punchy, internet-native | Personal, nostalgic |
| **Alignment** | Intentional asymmetry | "Messy" organic scatter |

---

## 📚 Implementation Priority

1. **Phase 1: Foundations**
   - Add font imports (script, handwritten, pixel)
   - Create CSS variables for new palettes
   - Build paper texture backgrounds

2. **Phase 2: Layout Components**
   - Journal spread layout
   - Polaroid component
   - Library card component

3. **Phase 3: Decorative**
   - Clip/tape SVGs
   - Sparkle animations
   - Ribbon/bow elements

4. **Phase 4: Polish**
   - Photo treatment classes
   - Torn edge effects
   - Staggered animations

---

*This style guide (v2) is designed to complement the original editorial style (v1). Use v1 for bold data statements, v2 for personal favorites and memories. Mix both for a dynamic, emotionally resonant presentation.*

