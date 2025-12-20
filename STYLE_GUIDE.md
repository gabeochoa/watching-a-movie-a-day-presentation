# Wrapboxd "Gen Z Deck" Style Guide

Based on analysis of the reference presentation (~400 slides) showing a modern, editorial, internet-native design language.

---

## 🎯 The Core Vibe

**"More like a modern editorial/social collage than a business report."**

This deck doesn't look like slides—it looks like a magazine that swallowed Twitter, had a baby with a zine, and went viral. It's confident, opinionated, and culturally fluent.

---

## 🔤 Typography

### Primary Approach
- **Type IS the design** — headlines do the heavy lifting, charts support the story
- **Bold, condensed sans-serif** for impact headlines (Impact, Oswald, Bebas Neue, Anton, or similar)
- **ALL CAPS** for punch ("HELL EVERYWHERE", "BRAINROT", "BIG & BOLD")
- **Mixed case** for conversational moments ("this WIMBLEDON stat blew my mind")

### Hierarchy
1. **Hero headlines**: 72-120pt, bold, often full-width
2. **Section titles**: 36-48pt, caps, high contrast
3. **Body/insight text**: 16-24pt, clean sans (Inter, SF Pro, Helvetica Neue)
4. **Data labels**: 12-14pt, muted color

### Type Treatments
- **Strikethrough** for emphasis/contrast (~~old way~~ → new way)
- **Highlight markers** (yellow, green, pink backgrounds behind key phrases)
- **Underlines** as accent elements
- **Tight line-height** (1.0-1.1 for headlines)

### Font Pairing Recommendation
```css
/* Display/Headlines */
font-family: 'Anton', 'Bebas Neue', 'Oswald', Impact, sans-serif;

/* Body/UI */
font-family: 'Inter', 'SF Pro', -apple-system, system-ui, sans-serif;

/* Monospace/Data */
font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
```

---

## 🎨 Color System

### Core Palette
| Role | Light Mode | Dark Mode | Usage |
|------|-----------|-----------|-------|
| Background | `#FFFFFF` | `#000000` / `#0A0A0A` | Primary surface |
| Text | `#000000` | `#FFFFFF` | Headlines, body |
| Muted | `#666666` | `#888888` | Secondary text |
| Accent | `#FF3B30` | `#FF453A` | Key emphasis |
| Highlight Yellow | `#FFEB3B` | `#FFD60A` | Marker effect |
| Highlight Green | `#4ADE80` | `#30D158` | Positive/growth |
| Highlight Pink | `#FF6B9D` | `#FF375F` | Fun callouts |

### Color Rules
1. **High contrast always** — black on white, white on black, no muddy grays
2. **One accent per slide** — pick your moment, don't rainbow
3. **Highlight sparingly** — marker effect on 1-3 words max
4. **Photos/screenshots provide color** — keep UI elements neutral

### Chart Colors
```javascript
const chartPalette = {
  primary: '#FF3B30',     // Your main metric
  secondary: '#FFD60A',   // Supporting data
  tertiary: '#4ADE80',    // Comparison/positive
  neutral: '#666666',     // Everything else (intentionally muted)
  background: '#0A0A0A',  // Dark mode default
};
```

---

## 📐 Layout Patterns

### Slide Structures (from the reference deck)

#### 1. Hero Statement Slide
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│         HELL EVERYWHERE                 │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```
- Black background, white text
- One statement, centered or left-aligned
- No charts, no clutter — just the point

#### 2. Screenshot Evidence Slide
```
┌─────────────────────────────────────────┐
│  Bold headline here                     │
│  ┌─────────────────────────────────┐    │
│  │     [Screenshot/Tweet/UI]       │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│  ↑ "this is what I'm talking about"    │
└─────────────────────────────────────────┘
```
- Embedded social posts, headlines, UIs as "proof"
- Informal caption below ("this blew my mind")

#### 3. Mixed Media Collage
```
┌─────────────────────────────────────────┐
│  ┌────┐  ┌──────────┐  ┌────┐          │
│  │ 📷 │  │ HEADLINE │  │ 📱 │          │
│  └────┘  │ + stats  │  └────┘          │
│          └──────────┘                   │
│  [tweet]              [news clipping]   │
└─────────────────────────────────────────┘
```
- Multiple sources, layered
- Photos, screenshots, text blocks coexisting

#### 4. Big Number + Context
```
┌─────────────────────────────────────────┐
│                                         │
│              42%                        │
│         ─────────                       │
│    of people who watched                │
│    more than 100 films                  │
│    rated them ★★★★ or higher           │
│                                         │
└─────────────────────────────────────────┘
```
- Single stat dominates
- Context in smaller text below
- No chart needed — the number IS the visual

#### 5. Chart + Annotation Slide
```
┌─────────────────────────────────────────┐
│  THE POINT (big headline)               │
│  ┌─────────────────────────────────┐    │
│  │      [Simplified Chart]         │    │
│  │           ↑                     │    │
│  │     "this spike is wild"        │    │
│  └─────────────────────────────────┘    │
│  Key insight: one sentence takeaway     │
└─────────────────────────────────────────┘
```
- Chart supports headline, not vice versa
- Hand-drawn-style annotations (arrows, circles)
- Takeaway text is prominent

### Layout Rules
1. **Asymmetry > symmetry** — off-center feels intentional
2. **Overlap is okay** — elements can break containers
3. **Generous negative space** — let things breathe
4. **Full-bleed images** — photos go edge-to-edge
5. **No "PowerPoint template" feel** — avoid perfectly centered grids

---

## 📊 Chart Styling

### General Principles
1. **Charts are supporting actors** — the headline is the star
2. **Simplify ruthlessly** — fewer gridlines, fewer labels
3. **Highlight ONE thing** — accent color on the key data point
4. **Annotate like a human** — arrows, circles, handwritten-style notes

### Before/After Example

**❌ Default Chart (Business Report)**
- Full gridlines
- Every bar labeled
- "Figure 1: Distribution of Ratings"
- Legend in corner
- Neutral blue color

**✅ Gen Z Style Chart**
- Minimal/no gridlines
- Only highlight bar has a label
- "You're a ★★★★ person" as headline
- Inline annotation on key bar
- Black + one accent color

### D3.js Implementation Notes

```javascript
// Chart Container Styling
const chartStyle = {
  background: '#0A0A0A',
  padding: '24px',
  borderRadius: '16px',
  border: 'none',  // no visible borders
};

// Axis Styling
const axisStyle = {
  tickSize: 0,           // no tick marks
  strokeWidth: 0,        // no axis line
  fontSize: '12px',
  fill: '#666666',       // muted labels
};

// Bar Styling
const barStyle = {
  defaultFill: '#333333',     // muted bars
  highlightFill: '#FF3B30',   // accent for key bar
  borderRadius: '4px',        // slightly rounded
  gap: '4px',                 // space between bars
};

// Annotation Layer
const annotationStyle = {
  fontFamily: "'Caveat', cursive",  // handwritten feel
  fontSize: '16px',
  fill: '#FFD60A',                  // highlight color
  arrowStroke: '#FFD60A',
};
```

### Chart Type Recommendations

| Instead of... | Use... | Why |
|---------------|--------|-----|
| Pie chart | Horizontal bar chart or big number | Pies are corporate; bars are scannable |
| Line chart | Area chart with fill or single-line with dot annotations | More visual weight |
| Scatter plot | Same, but with annotation callouts on outliers | Stories > data dumps |
| Complex multi-series | Small multiples (one chart per series) | Simpler = clearer |

---

## 🧩 Mixed Media Elements

### What to Include
- **Embedded tweets/posts** — screenshot style, with engagement metrics visible
- **News headlines** — cropped clippings with publication logos
- **App screenshots** — showing real interfaces
- **Photos** — candid, editorial, not stock
- **Icons/emoji** — sparingly, for personality
- **"Sticker" elements** — labels like "KEY INSIGHT", "WHY IT MATTERS"

### Treatment
- **Drop shadows** on floating elements (subtle, 0 2px 8px rgba(0,0,0,0.3))
- **Slight rotation** on some elements (±2-3°) for casual feel
- **Grain/noise overlay** on photos (optional, for texture)
- **Rounded corners** on screenshots (8-16px)

### Example "Sticker" Labels
```html
<span class="sticker sticker-yellow">KEY TAKEAWAY</span>
<span class="sticker sticker-red">HOLY SHIT</span>
<span class="sticker sticker-green">+47% YOY</span>
```

```css
.sticker {
  font-family: 'Anton', sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 4px;
  transform: rotate(-2deg);
  display: inline-block;
}
.sticker-yellow { background: #FFD60A; color: #000; }
.sticker-red { background: #FF3B30; color: #FFF; }
.sticker-green { background: #30D158; color: #000; }
```

---

## ✍️ Voice & Copy

### Headlines
- **Punchy, not formal**: "HELL EVERYWHERE" not "An Analysis of Challenges"
- **Opinionated**: "I'M NOT SURE IF ANYTHING HAS BEEN AS BOLD AS BRAT"
- **Personal**: "this WIMBLEDON stat blew my mind"
- **Internet-native**: Reference memes, cultural moments, casual tone

### Annotations
- First person okay: "my favorite part is..."
- Conversational asides: "(yes, really)"
- Emotion: "damn", "wild", "obsessed"

### What to Avoid
- Corporate buzzwords: "leverage", "synergy", "actionable insights"
- Passive voice: "It was determined that..."
- Hedging: "It appears that perhaps..."
- Generic: "Key Findings" → "Here's the point"

### Example Transformations
| ❌ Corporate | ✅ Gen Z |
|-------------|---------|
| "Rating Distribution Analysis" | "You're a ★★★★ person" |
| "Key Takeaways" | "THE POINT" |
| "Year-over-Year Growth" | "up 47% (wild)" |
| "Methodology" | "how we did this" |
| "Recommendations" | "what you should do now" |

---

## 🎬 Animation & Interactivity (Web)

### Principles
- **Subtle, purposeful motion** — not flashy transitions
- **Stagger reveals** — elements appear in sequence, not all at once
- **Hover states that reward** — extra info, color change, slight scale

### CSS Examples
```css
/* Staggered fade-in */
.chart-bar {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.4s ease forwards;
}
.chart-bar:nth-child(1) { animation-delay: 0.1s; }
.chart-bar:nth-child(2) { animation-delay: 0.15s; }
.chart-bar:nth-child(3) { animation-delay: 0.2s; }

@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}

/* Hover reward */
.stat-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(255, 59, 48, 0.2);
}

/* Number count-up (use JS) */
.big-number {
  font-variant-numeric: tabular-nums;
}
```

---

## 📱 Responsive Considerations

### Mobile First
- Headlines should still be huge (scale with viewport)
- Charts simplify further on mobile
- Single column layout
- Touch-friendly tap targets (44px min)

### Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  .hero-headline { font-size: 48px; }
  .chart { height: 200px; }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .hero-headline { font-size: 72px; }
  .chart { height: 280px; }
}

/* Desktop */
@media (min-width: 1025px) {
  .hero-headline { font-size: 96px; }
  .chart { height: 360px; }
}
```

---

## 🏷️ Component Library Suggestions

### For Wrapboxd Implementation

1. **HeroStat** — big number with context line
2. **AnnotatedChart** — D3 chart with callout overlay
3. **EmbeddedPost** — styled screenshot container
4. **Sticker** — rotated label badge
5. **InsightCard** — headline + supporting stat + annotation
6. **Collage** — grid of mixed media elements
7. **SectionDivider** — bold statement slide

---

## ✅ Quick Checklist for Each "Slide" / Section

- [ ] **Headline is the star** — not the chart
- [ ] **One key insight** — don't cram everything
- [ ] **High contrast** — black/white + one accent
- [ ] **Simplified chart** — fewer elements, more clarity
- [ ] **Annotation present** — what should I notice?
- [ ] **Voice is human** — would I say this out loud?
- [ ] **Layout feels designed** — not auto-generated

---

## 🎯 Summary: The Formula

```
Gen Z Slide = 
  BIG BOLD HEADLINE (the point) 
  + Simplified Visual (the evidence)
  + Human Annotation (the insight)
  + High Contrast (the clarity)
  + Cultural Fluency (the vibe)
```

---

## 📚 Reference Examples from the Deck

### Strong Headlines Observed
- "HELL EVERYWHERE"
- "WE'RE FUCKED"
- "BIG & BOLD"
- "BRAINROT"
- "THIS IS MORE PROVOCATION THAN IMPLEMENTATION"
- "I'M NOT SURE IF ANYTHING HAS BEEN AS BOLD AS BRAT"
- "be weird"
- "lust" / "gluttony" / "greed" / "wrath" (seven deadly sins series)

### Structural Patterns
- Black slide with white text = new section / key statement
- White slide with collage = evidence / examples
- Screenshot-heavy = "here's what I mean"
- Big number = "this is the stat that matters"

### Recurring Visual Motifs
- Yellow highlighter on text
- Embedded tweets with engagement visible
- News headline screenshots
- TikTok/Instagram UI elements
- Marker-style underlines
- Slight rotations on "sticker" elements

---

*This style guide is based on ~400 slides from a reference Gen Z presentation deck. Apply these principles to transform Wrapboxd from "data dashboard" to "editorial experience."*
