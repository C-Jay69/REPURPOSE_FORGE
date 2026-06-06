# RepurposeAI Design Direction

## Brand
- Name: RepurposeAI
- Tagline: "One input. Infinite reach."
- Vibe: Magical yet trustworthy. Cinematic. Zero bloat.

## Colors
```
--bg-primary: #0A0A0F        (near-black base)
--bg-secondary: #0F0F1A      (card/panel bg)
--bg-elevated: #14141F       (elevated surfaces)
--border: #1E1E2E            (subtle borders)
--accent-1: #7C3AED          (violet primary)
--accent-2: #A855F7          (purple glow)
--accent-3: #EC4899          (pink highlight)
--text-primary: #F8F8FF      (white-ish)
--text-secondary: #94949F    (muted text)
--text-muted: #3D3D52        (very muted)
--success: #10B981           (green)
--warning: #F59E0B           (amber)
```

## Typography
- Headlines: Poppins, weight 700–900, tight letter-spacing
- Body: Poppins, weight 400–500
- Code/Output: DM Mono, weight 400
- Scale: 12/14/16/18/24/32/48/64px

## Layout
- Max content width: 1200px
- Sidebar dashboard: 240px fixed left, full-height
- Grid-breaking hero with diagonal/angled elements
- Generous negative space

## Effects
- Glow: box-shadow with accent colors at low opacity
- Gradient mesh background on hero
- Noise texture overlay (subtle, 3% opacity)
- Glowing orbs/blobs in hero section
- Border gradients on cards

## Motion
- Page transitions: fade + slide up (200ms)
- Cards: hover lift with glow intensify
- Buttons: scale 0.97 on press
- Outputs: staggered reveal on generation

## Components Style
- Buttons: rounded-xl, gradient fill for primary, border for secondary
- Cards: bg-secondary, border, subtle inner glow on hover
- Inputs: bg-elevated, border-border, focus ring accent
- Badges: tiny pill shapes
- Tabs: underline style, accent color active

## Anti-patterns to avoid
- Pure white backgrounds
- Generic rounded card grids
- Overused blue/green color schemes
- Heavy drop shadows
