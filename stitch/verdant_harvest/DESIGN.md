# Design System Document: High-End Nutrition & Wellness Editorial

## 1. Overview & Creative North Star: "The Clinical Editorial"
This design system moves away from the "utility-first" look of standard health apps and embraces a high-end, editorial aesthetic. Our Creative North Star is **The Clinical Editorial**—a fusion of rigorous nutritional science and the airy, aspirational layout of a luxury wellness magazine.

To break the "template" feel, we reject rigid grids in favor of **intentional asymmetry**. We treat white space not as "empty room," but as a structural element that allows high-quality food photography to breathe. By utilizing oversized typography scales and layered tonal surfaces, we create a digital experience that feels curated, professional, and calm.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
Our palette is rooted in a "Fresh-Organic" spectrum. We use greens for growth, blues for clinical trust, and ambers for vital energy.

### Surface Hierarchy & Nesting
We eliminate the "box-inside-a-box" look. Depth is created through **Tonal Layering**:
*   **Base Layer:** `surface` (#f8f9fa) for global backgrounds.
*   **Secondary Sections:** Use `surface-container-low` (#f3f4f5) to differentiate large content blocks.
*   **Interactive Cards:** Use `surface-container-lowest` (#ffffff) to make elements "pop" forward naturally.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts or the spacing scale. If a section needs to end, change the background token from `surface` to `surface-container`.

### The "Glass & Gradient" Rule
To add "soul" to the minimalist UI:
*   **Floating Navigation:** Use `surface` at 80% opacity with a `20px` backdrop-blur to create a "frosted glass" effect.
*   **Signature Gradients:** Use a subtle linear gradient from `primary` (#006e2f) to `primary_container` (#22c55e) for Hero CTAs and progress visualizations to avoid a flat, synthetic feel.

---

## 3. Typography: Authoritative Clarity
We pair **Plus Jakarta Sans** (Headlines) with **Manrope** (Body) to balance modern geometry with high readability.

*   **Display & Headlines (Plus Jakarta Sans):** These are our "Editorial Voice." Use `display-lg` (3.5rem) for hero sections with tight letter-spacing (-0.02em) to convey confidence.
*   **Body & Titles (Manrope):** These provide "Clinical Trust." `body-lg` (1rem) is the standard for nutritional information, ensuring a sophisticated, easy-to-read pace.
*   **Visual Hierarchy:** Always maintain a high contrast between display sizes and body sizes. A `display-md` headline should often be followed by a `body-md` description to create a sense of vast, open luxury.

---

## 4. Elevation & Depth: Tonal Stacking
Traditional drop shadows are too "heavy" for a wellness platform. We achieve lift through light and translucency.

*   **The Layering Principle:** Instead of shadows, stack surface tiers. Place a `surface-container-lowest` (#ffffff) card on a `surface-container` (#edeeef) background. This creates a soft "lift" that mimics natural paper layering.
*   **Ambient Shadows:** If a floating element (like a FAB or Modal) requires a shadow, use a diffuse spread: `0px 20px 40px rgba(25, 28, 29, 0.04)`. The shadow must be tinted with the `on_surface` color, never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., input fields), use the `outline_variant` (#bccbb9) at **20% opacity**. It should be felt, not seen.

---

## 5. Components: Minimalist Primitives

### Buttons
*   **Primary:** Linear gradient (`primary` to `primary_container`), `md` (0.75rem) roundedness. No border.
*   **Secondary:** `surface_container_high` background with `on_surface` text.
*   **Tertiary:** Ghost style. No background, `primary` text, bold weight.

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Execution:** Separate list items using `spacing-4` (1.4rem) or by alternating background tones (`surface` to `surface_container_low`). Cards should use the `xl` (1.5rem) roundedness scale for a soft, organic feel.

### Input Fields
*   **Style:** Minimalist. No bottom line or full box. Use a `surface_container_highest` background with a subtle `md` corner radius. Use `label-md` for floating labels that shift to `primary` on focus.

### Additional Nutrition-Specific Components
*   **The Macro-Glass:** A glassmorphic card for daily tracking. Use backdrop-blur and `surface_variant` at 40% opacity to overlay nutrient stats onto high-quality food photography.
*   **Tonal Chips:** Use `secondary_fixed` (#dce1ff) for dietary tags (e.g., "Vegan," "High Protein") to differentiate them from action-oriented green buttons.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Oversized Spacing:** When in doubt, increase the margin. Use `spacing-16` (5.5rem) between major editorial sections.
*   **Embrace Asymmetry:** Align text to the left while placing images with a slight offset to the right to create a "magazine" feel.
*   **High-Quality Imagery:** Use photography with natural lighting and high "on-white" or "on-wood" contrast.

### Don't:
*   **Don't use 100% Opaque Borders:** This shatters the "Organic" feel and makes the app look like a legacy enterprise tool.
*   **Don't Overcrowd:** If a screen feels busy, remove elements rather than shrinking them.
*   **Don't use Standard Shadows:** Avoid the "floating box" look of 2014 Material Design. Stick to Tonal Layering.
*   **Don't use Dividers:** If you feel the need for a line, use a `1.4rem` gap of empty space instead. Empty space is your strongest separator.