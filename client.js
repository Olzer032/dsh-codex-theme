/**
 * Codex theme for the Harness Web UI.
 *
 * Two things ship here:
 *
 *   1. A `--dsw-*` alias-token override layer installed through
 *      `ctx.theme.overrideTokens` —the supported third-party theme extension
 *      point. A layer composes over the *active* theme, so the user keeps their
 *      own light/dark/system preference and still gets Codex styling in both
 *      palettes; unloading the plugin removes the layer and restores the stock
 *      look.
 *   2. One Settings —General row that turns the layer on and off, persisted in
 *      the same `localStorage` shape the conversation-width preference uses.
 *
 * Values come from OpenAI's own design tokens (`openai/apps-sdk-ui`,
 * `variables-{primitive,semantic,components}.css`) and from the Codex CLI's
 * committed style guide (`codex-rs/tui/src/style.rs`, `codex-rs/tui/styles.md`):
 *
 *   - The neutral ramp is TRUE-NEUTRAL gray (#0d0d0d .. #ffffff). Codex does not
 *     tint its neutrals blue; the stock palette does, and that bias is the single
 *     most visible difference to remove.
 *   - Blue is FUNCTIONAL only —focus ring, link, active state. It is never a
 *     decorative fill, so the "brand" fill of primary controls becomes the
 *     near-black / near-white solid instead of an accent color.
 *   - Dark chat surface #212121, elevated #303030, secondary #181818.
 *   - Code blocks recess BELOW the surface (#fcfcfc / #101010).
 *   - The user turn is a 5-8% alpha wash, not a saturated bubble.
 *   - Radii are structural: 24px composer, 12px panels, 8px controls, 4px chips.
 *   - Syntax highlighting uses Codex's warm five-color palette, and the
 *     `--shiki-token-*` variables are overridable the same way: the presenter
 *     writes every token onto `body` as an inline custom property, which wins
 *     over the stylesheet's `:root` and `body[data-ds-dark-theme]` declarations
 *     that the highlighted spans inherit.
 *
 * No literal color is written outside these palette tables, no other plugin's DOM
 * or hashed class names are targeted, and no Harness Client package is imported.
 */
window.__ModuleLoader__.load({
  id: 'dsh-codex-theme',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Layer identity; also the override source name shown by inspection. */
    const SOURCE = 'dsh-codex-theme';
    /** Where the on/off preference lives, mirroring the width-preference style. */
    const PREF_KEY = 'dsh.codex-theme.enabled';
    /** Where the selected chrome palette lives. */
    const PRESET_KEY = 'dsh.codex-theme.preset';
    /** Where a hand-tuned palette is stored (only meaningful for `CUSTOM_PRESET`). */
    const CUSTOM_KEY = 'dsh.codex-theme.custom';
    /** The measured-from-Codex palette, used when nothing is stored. */
    const DEFAULT_PRESET = 'codex';
    /** Preset id reserved for the user's own parameters. */
    const CUSTOM_PRESET = 'custom';

    /**
     * Codex surface ramp, per palette.
     *
     * Light values are **measured from the running Codex desktop app** by
     * sampling the captured window (`codex-ui-reference/MEASURED-UI.md`), not
     * inferred from the embedded stylesheet. Two of them corrected an earlier
     * guess: the sidebar is a solid `#F3F3F3` (not a near-white tint), and body
     * text is `#1A1C1F` (not `#0d0d0d`). Both differences are visible.
     */
    const PALETTE = {
      light: {
        bgBase: '#ffffff',
        // Measured: the sidebar column is a real grey, clearly separated from
        // the white conversation surface.
        bgSecondary: '#f3f3f3',
        bgTertiary: '#ebebeb',
        bgElevated: '#ffffff',
        bgRecessed: '#fcfcfc',
        // Measured body text. Notably lighter than the #0d0d0d first assumed.
        text: '#1a1c1f',
        textSecondary: '#6e7072',
        textMuted: '#8f9194',
        border: 'rgba(26, 28, 31, 0.10)',
        borderSubtle: 'rgba(26, 28, 31, 0.05)',
        borderStrong: 'rgba(26, 28, 31, 0.15)',
        accent: '#0169cc',
        accentHover: '#0169cc',
        solid: '#181818',
        solidHover: '#0d0d0d',
        onSolid: '#ffffff',
        // Measured: the user bubble and the sidebar share one surface colour
        // rather than being a translucent wash over white. Kept as its own entry
        // because `wash` also backs translucent roles (skeleton, hover tints)
        // that must stay see-through.
        bubble: '#f3f3f4',
        bubbleStrong: '#ececee',
        wash: 'rgba(26, 28, 31, 0.05)',
        washStrong: 'rgba(26, 28, 31, 0.08)',
        hover: 'rgba(26, 28, 31, 0.04)',
        active: 'rgba(26, 28, 31, 0.07)',
        // Measured: the code block sits *below* the white page (#F2F2F2), the
        // mirror of dark mode where it is raised above the page. Codex keeps the
        // code surface distinct from body text in both palettes, but flips the
        // direction.
        codeBg: '#f2f2f2',
        codeBanner: '#e8e8e8',
        inlineCode: '#f3f3f3',
        // The send disc: near-black, so the harness's hard-coded white glyph
        // reads at 17:1. Codex likewise uses a solid neutral here rather than an
        // accent fill.
        sendFill: '#1a1c1f',
        sendHover: '#000000',
        success: '#008635',
        warn: '#c0660d',
        error: '#e02e2a',
        tooltipBg: '#181818',
        tooltipLabel: '#ffffff',
      },
      dark: {
        // Measured from the running app in dark mode. Note the inversion
        // against light mode: the conversation surface (#181818) is DARKER than
        // the sidebar (#202020), where light mode has the sidebar darker. The
        // binary stylesheet alone suggested #212121 for the surface, which is
        // wrong by a visible margin.
        bgBase: '#181818',
        bgSecondary: '#202020',
        bgTertiary: '#262626',
        bgElevated: '#2d2d2d',
        bgRecessed: '#101010',
        text: '#ffffff',
        textSecondary: '#b4b4b4',
        textMuted: '#8f8f8f',
        border: 'rgba(255, 255, 255, 0.12)',
        borderSubtle: 'rgba(255, 255, 255, 0.07)',
        borderStrong: 'rgba(255, 255, 255, 0.20)',
        accent: '#339cff',
        accentHover: '#63a8f8',
        solid: '#f3f3f3',
        solidHover: '#ffffff',
        onSolid: '#0d0d0d',
        // Measured bubble surface, a step above the conversation background.
        bubble: '#222222',
        bubbleStrong: '#2a2a2a',
        wash: 'rgba(255, 255, 255, 0.08)',
        washStrong: 'rgba(255, 255, 255, 0.12)',
        hover: 'rgba(255, 255, 255, 0.06)',
        active: 'rgba(255, 255, 255, 0.10)',
        // Measured from a real code block in dark mode: the block is *raised*
        // above the page (#2A2A2A on #181818), not recessed below it. The
        // earlier #101010 came from the binary stylesheet's light-mode token and
        // pointed the wrong way in this palette.
        codeBg: '#2a2a2a',
        codeBanner: '#333333',
        inlineCode: '#333333',
        // The send disc. Codex paints #8B8B8B with a *darker* arrow, but the
        // Harness hard-codes `color: #fff` for this glyph and its SVG inherits
        // via `currentColor`, so the arrow cannot be recoloured without styling
        // the host's own class. Darkening the disc to #6b6b6b keeps it neutral
        // and lifts white-on-grey to 5.33:1 (WCAG asks 3:1 for UI glyphs) —        // the honest trade-off over reaching into another plugin's CSS.
        sendFill: '#6b6b6b',
        sendHover: '#7d7d7d',
        success: '#40c977',
        warn: '#ffe48c',
        error: '#ff7b72',
        tooltipBg: '#2d2d2d',
        tooltipLabel: '#ffffff',
      },
    };

    /** Codex's warm five-color syntax palette, per palette. */
    /**
     * Syntax highlighting.
     *
     * The dark values are **measured from a real code block** rendered by the
     * Codex desktop app, not inferred. Two corrections came out of that:
     *
     *   - `string` is a warm yellow (#F9DC78), not the green assumed earlier;
     *     `constant` is a warm orange (#F1A275). Sampling a JSON block produced
     *     only yellow/orange hues, no green at all.
     *   - That also means the palette is *theme-driven* (shiki), not a fixed
     *     five-colour set. The values below pin the two hues that were actually
     *     observed and keep a coherent family for the rest.
     *
     * Light values stay on the warm palette the binary stylesheet documented,
     * since no light-mode code block was captured.
     */
    const SYNTAX = {
      light: {
        constant: '#c0660d',
        string: '#008635',
        keyword: '#e04c91',
        fn: '#8046d9',
        param: '#0169cc',
        comment: '#8f8f8f',
        punctuation: '#5d5d5d',
        link: '#0169cc',
      },
      dark: {
        // Measured: warm orange for values/numbers.
        constant: '#f1a275',
        // Measured: warm yellow for keys and string literals.
        string: '#f9dc78',
        keyword: '#f1a275',
        fn: '#f9dc78',
        param: '#b8c4d0',
        comment: '#7a7a7a',
        punctuation: '#a8a8a8',
        link: '#66b5ff',
      },
    };

    /**
     * Chrome (UI) theme presets.
     *
     * Codex does not ship a list of named UI themes: its appearance panel exposes
     * Theme (light/dark/system) plus four *parameters* — accent, surface, ink,
     * contrast — and derives every CSS variable from them. The defaults were read
     * out of `app-theme-ba8a03c4ed77.js` in the Codex asar:
     *
     *   dark:  { accent:'#339cff', contrast:60, ink:'#ffffff', surface:'#181818',
     *            semantic:{ diffAdded:'#40c977', diffRemoved:'#fa423e', skill:'#ad7bf9' } }
     *   light: { accent:'#339cff', contrast:45, ink:'#1a1c1f', surface:'#ffffff',
     *            semantic:{ diffAdded:'#00a240', diffRemoved:'#ba2623', skill:'#924ff7' } }
     *
     * So "presets" here are curated *parameter sets* in Codex's own model rather
     * than invented palettes: `codex` is the shipped default, and the others vary
     * exactly the four knobs the app itself varies. Each preset therefore stays
     * reproducible inside Codex's own appearance panel — a user could type the
     * same numbers there and get the same result.
     */
    const THEME_PRESETS = {
      codex: {
        // The shipped default, verbatim from the asar.
        light: { accent: '#339cff', ink: '#1a1c1f', surface: '#ffffff', contrast: 45 },
        dark: { accent: '#339cff', ink: '#ffffff', surface: '#181818', contrast: 60 },
      },
      codexDim: {
        // Softer contrast target: the same surfaces, less separation.
        light: { accent: '#339cff', ink: '#22242a', surface: '#f7f7f8', contrast: 22 },
        dark: { accent: '#6fb6ff', ink: '#e8e9ea', surface: '#202124', contrast: 30 },
      },
      codexHighContrast: {
        // Accessibility-oriented: maximum separation, saturated accent.
        light: { accent: '#0169cc', ink: '#000000', surface: '#ffffff', contrast: 78 },
        dark: { accent: '#4da3ff', ink: '#ffffff', surface: '#0d0d0f', contrast: 88 },
      },
      codexSlate: {
        // Cooler neutrals — the surface pulls toward blue-grey.
        light: { accent: '#3b6fd4', ink: '#1c2430', surface: '#f4f6f9', contrast: 50 },
        dark: { accent: '#5ea0f0', ink: '#eef2f7', surface: '#1a1f27', contrast: 62 },
      },
      codexWarm: {
        // Warm neutrals — the surface pulls toward sand.
        light: { accent: '#c2703a', ink: '#241d16', surface: '#faf7f2', contrast: 48 },
        dark: { accent: '#e0a06a', ink: '#f5efe7', surface: '#1f1b17', contrast: 58 },
      },
    };

    /** Display order of the chrome theme presets. */
    const THEME_ORDER = ['codex', 'codexDim', 'codexHighContrast', 'codexSlate', 'codexWarm'];

    /**
     * Parse a hex colour into linear-ready RGB components.
     * @param hex - `#rrggbb`.
     * @returns `{ r, g, b }` in 0..255.
     */
    function hexToRgb(hex) {
      const h = hex.replace('#', '');
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
      };
    }

    /** Format RGB back to `#rrggbb`. */
    function rgbToHex({ r, g, b }) {
      const clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));
      return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
    }

    /**
     * Mix two colours, mirroring Codex's `color-mix` usage with a simple linear
     * blend so the result can be computed in JS and handed to the token layer.
     * @param a - base colour.
     * @param b - colour mixed in.
     * @param weight - 0..1 share of `b`.
     */
    function mixHex(a, b, weight) {
      const x = hexToRgb(a);
      const y = hexToRgb(b);
      return rgbToHex({
        r: x.r + (y.r - x.r) * weight,
        g: x.g + (y.g - x.g) * weight,
        b: x.b + (y.b - x.b) * weight,
      });
    }

    /**
     * Derive the full surface ramp from one preset's four parameters.
     *
     * Codex computes its variables from `{ accent, surface, ink, contrast }`; this
     * reproduces the same idea with plain blending so the rest of the token table
     * keeps its existing shape. Contrast scales how far each derived surface
     * moves away from the base, which is what the real `contrast` knob does.
     *
     * @param mode - `'light'` or `'dark'`.
     * @param preset - one THEME_PRESETS entry.
     * @returns a PALETTE-shaped record.
     */
    function paletteFromPreset(mode, preset) {
      // The default preset is the *measured* palette, pixel-sampled from the
      // running app; deriving it from four parameters would replace those values
      // with approximations and lose the calibration. Only the variant presets,
      // which exist precisely to move the parameters, go through derivation.
      if (preset === THEME_PRESETS.codex) return PALETTE[mode];

      const p = preset[mode];
      const dark = mode === 'dark';
      const base = PALETTE[mode];
      // Contrast 0..100 mapped to a 0..1 push toward the ink for raised surfaces.
      const k = Math.min(100, Math.max(0, p.contrast)) / 100;
      const towardInk = (w) => mixHex(p.surface, p.ink, w);
      return {
        ...base,
        bgBase: p.surface,
        // Sidebar takes a small step toward the ink; on dark that makes it
        // lighter, on light darker — matching the measured direction flip.
        bgSecondary: towardInk(dark ? 0.04 + k * 0.05 : 0.02 + k * 0.035),
        bgTertiary: towardInk(dark ? 0.07 + k * 0.06 : 0.035 + k * 0.05),
        bgElevated: towardInk(dark ? 0.10 + k * 0.08 : 0),
        bgRecessed: dark ? mixHex(p.surface, '#000000', 0.2) : mixHex(p.surface, p.ink, 0.03),
        text: p.ink,
        textSecondary: mixHex(p.ink, p.surface, 0.32),
        textMuted: mixHex(p.ink, p.surface, 0.46),
        accent: p.accent,
        bubble: towardInk(dark ? 0.06 : 0.035),
        bubbleStrong: towardInk(dark ? 0.10 : 0.06),
        codeBg: dark ? mixHex(p.surface, p.ink, 0.07) : mixHex(p.surface, p.ink, 0.05),
        codeBanner: dark ? mixHex(p.surface, p.ink, 0.11) : mixHex(p.surface, p.ink, 0.09),
        inlineCode: dark ? mixHex(p.surface, p.ink, 0.11) : mixHex(p.surface, p.ink, 0.05),
      };
    }

    /**
     * Syntax highlighting.
     *
    /**
     * Build a `{ light, dark }` token pair. The theme service rejects a bare
     * string for exactly the right reason: a single value goes illegible when
     * the user switches color scheme, so every override is spelled per palette.
     */
    /**
     * The palette the token tables read from.
     *
     * Codex derives every UI variable from four parameters, so the effective
     * palette depends on the selected preset. The token tables below are written
     * once against `pair(...)`; switching preset swaps this record and rebuilds
     * the layer, which keeps the tables declarative instead of taking a palette
     * argument on ninety-odd lines.
     */
    let ACTIVE_PALETTE = PALETTE;

    /** Pick one field from the active palette, per colour scheme. */
    const pair = (pick) => ({
      light: pick(ACTIVE_PALETTE.light),
      dark: pick(ACTIVE_PALETTE.dark),
    });
    const pairOf = (table, key) => ({ light: table.light[key], dark: table.dark[key] });

    /** Static neutral steps that in-conversation cards use as their own fill.
     *
     * `ui-deliverables` (edited-files and delivered-file cards), `ui-plan` and
     * `ui-schedule` each define a local variable from these steps
     * (`--changes-fill`, `--deliverable-fill`, `--plan-card-fill`,
     * `--card-fill`), so overriding the steps re-tints all of them at once.
     *
     * They need overriding because those cards are *static* by design: they read
     * `--dsw-static-neutral-50` (#fafafa) on light and `-850` (#212123) on dark
     * regardless of theme. Against this theme's chat surface (#ffffff light,
     * #212121 dark) that is a 1-step difference on light and effectively zero on
     * dark, so the cards dissolved into the transcript. Pulling the light step
     * down and the dark step up restores a clear card edge without touching any
     * component rule.
     *
     * The static steps themselves are mode-invariant (one declaration, no dark
     * block), and components pick a different step per mode. That is why this
     * table gives each step a per-palette pair rather than a single value: the
     * light palette reads `-50`/`-100`, the dark palette reads `-850`/`-800`, so
     * each value only has to be right for the mode that actually consumes it.
     */
    const STATIC_SURFACE_TOKENS = {
      // Light: a real step below the #ffffff chat surface.
      '--dsw-static-neutral-50': { light: '#f4f4f4', dark: '#2c2c2e' },
      '--dsw-static-neutral-100': { light: '#ebebeb', dark: '#363638' },
      // Dark: clearly above the #212121 chat surface.
      '--dsw-static-neutral-850': { light: '#f0f0f0', dark: '#2c2c2e' },
      '--dsw-static-neutral-800': { light: '#e8e8e8', dark: '#363638' },
    };

    /*
     * Deliberately NOT implemented: Codex's 430 body weight and its thin font
     * stack.
     *
     * Codex renders body copy at `font-weight: 430` on a plain system stack and
     * ships no brand typeface. Both facts were confirmed in its embedded design
     * system, and both are unreachable from a theme layer here:
     *
     *   1. The Harness declares weight tokens
     *      (`--dsw-font-markdown-base-font-weight` and friends) but no component
     *      ever reads them —a scan of every client bundle finds zero
     *      `var(--dsw-font-markdown-base-font-weight)` consumers, while the chat
     *      renderer hard-codes `font-weight: 400/500/600`. Overriding the tokens
     *      is therefore invisible.
     *   2. The font stack is written to `body.style` as an *inline* custom
     *      property by ui-layout's theme presenter
     *      (`body.style.setProperty('--dsh-font-family-text', —`), so any
     *      stylesheet rule loses to it, and the user's own font choice in
     *      Settings wins outright.
     *
     * Implementing either would need hashed-class CSS overrides that break on
     * every Harness upgrade, so the honest choice is to leave them out rather
     * than ship tokens that look like a feature and change nothing.
     */

    /**
     * Alias tokens the Harness UI paints with.
     *
     * A function rather than a constant: the values come from `ACTIVE_PALETTE`,
     * which the selected preset swaps before each rebuild.
     */
    const colorTokens = () => ({
      // Surfaces ---------------------------------------------------------
      '--dsw-alias-bg-base': pair((c) => c.bgBase),
      '--dsw-alias-bg-layer-1': pair((c) => c.bgSecondary),
      '--dsw-alias-bg-layer-2': pair((c) => c.bgTertiary),
      '--dsw-alias-bg-layer-3': pair((c) => c.bgTertiary),
      '--dsw-alias-bg-overlay': pair((c) => c.bgElevated),
      '--dsw-alias-bg-module-platform': pair((c) => c.bgTertiary),
      '--dsw-alias-bg-multi-select': pair((c) => c.bgTertiary),
      '--dsw-alias-bg-document-preview': pair((c) => c.bgRecessed),
      '--dsw-alias-bg-skeleton': pair((c) => c.wash),

      // Sidebar ----------------------------------------------------------
      '--dsw-specific-sidebar-fill': pair((c) => c.bgSecondary),
      '--dsw-specific-sidebar-nav-item-active': pair((c) => c.washStrong),
      '--dsw-specific-sidebar-nav-item-active-accent': pair((c) => c.washStrong),
      '--dsw-specific-sidebar-nav-item-hover': pair((c) => c.hover),

      // Chat surfaces ----------------------------------------------------
      // The user turn is a solid measured surface, not a translucent wash; the
      // composer and popovers become elevated surfaces.
      '--dsw-specific-bubble': pair((c) => c.bubble),
      '--dsw-specific-bubble-highlight': pair((c) => c.bubbleStrong),
      '--dsw-specific-input-major': pair((c) => c.bgElevated),
      '--dsw-specific-login-input': pair((c) => c.bgBase),
      '--dsw-specific-selector': pair((c) => c.bgTertiary),
      '--dsw-specific-tip': pair((c) => c.bgTertiary),
      '--dsw-specific-menu': pair((c) => c.bgElevated),

      // Text -------------------------------------------------------------
      '--dsw-alias-label-primary': pair((c) => c.text),
      '--dsw-alias-label-primary-dimmed': pair((c) => c.text),
      '--dsw-alias-label-primary-bluish': pair((c) => c.text),
      '--dsw-alias-label-primary-foreground': pair((c) => c.onSolid),
      // "Inverted" means opposite the text color: the sidebar version badge
      // paints this as text over `label-primary`, so it must flip per palette.
      '--dsw-alias-label-primary-inverted': pair((c) => (c === PALETTE.dark ? '#0d0d0d' : '#ffffff')),
      '--dsw-alias-label-secondary': pair((c) => c.textSecondary),
      '--dsw-alias-label-tertiary': pair((c) => c.textMuted),
      '--dsw-alias-label-caption': pair((c) => c.textMuted),
      '--dsw-alias-label-dimmed': pair((c) => c.textMuted),
      '--dsw-alias-label-document-preview': pair((c) => c.textSecondary),
      '--dsw-alias-menu-icon': pair((c) => c.textSecondary),

      // Borders: hairlines, never heavy outlines ------------------------
      '--dsw-alias-border-l1': pair((c) => c.borderSubtle),
      '--dsw-alias-border-l2': pair((c) => c.border),
      '--dsw-alias-border-l2-darkmode-thin': pair((c) => c.borderSubtle),
      '--dsw-alias-border-l3': pair((c) => c.border),
      '--dsw-alias-border-l4': pair((c) => c.borderStrong),
      '--dsw-alias-border-inverted': pair((c) => c.borderSubtle),
      '--dsw-alias-border-inverted2': pair((c) => c.border),

      // Accent + brand ---------------------------------------------------
      '--dsw-alias-brand-primary': pair((c) => c.accent),
      '--dsw-alias-brand-primary-invert': pair((c) => c.accent),
      '--dsw-alias-brand-text': pair((c) => c.text),
      '--dsw-alias-link': pair((c) => c.accent),
      // The "business" accent backs the switch track when it is on, plus a
      // handful of selected-state fills. Codex renders those in neutral ink
      // rather than blue —blue is reserved for links, focus, and the effort
      // slider —so this token takes the solid control colour.
      //
      // The focus ring does NOT depend on it: focus.css resolves the ring from
      // `--dsw-focus-ring-color` and only falls back to this token, so pinning
      // that variable below keeps rings blue while the switch goes neutral.
      '--dsw-alias-state-business-primary': pair((c) => c.solid),
      '--dsw-alias-state-business-tertiary': pair((c) => c.washStrong),

      // Buttons + interaction --------------------------------------------
      '--dsw-alias-button-primary-fill': pair((c) => c.solid),
      '--dsw-alias-button-primary-hover': pair((c) => c.solidHover),
      '--dsw-alias-button-primary-dimmed': pair((c) => c.washStrong),
      '--dsw-alias-button-contrast-fill': pair((c) => c.solid),
      '--dsw-alias-button-elevated-fill': pair((c) => c.bgElevated),
      '--dsw-alias-button-floating-fill': pair((c) => c.bgElevated),
      '--dsw-alias-button-floating-hover': pair((c) => c.hover),
      '--dsw-alias-button-ghost-active-fill': pair((c) => c.washStrong),
      '--dsw-alias-button-ghost-active-hover': pair((c) => c.active),
      '--dsw-alias-button-ghost-active-border': pair((c) => c.borderStrong),
      // The send button. Codex renders it as a neutral disc, never an accent
      // fill: measured `#8B8B8B` in dark mode with a darker arrow inside. The
      // Harness paints this control from `button-info-fill`, so that token —not
      // `brand-primary` —is what decides the button's colour.
      '--dsw-alias-button-info-fill': pair((c) => c.sendFill),
      '--dsw-alias-button-info-hover': pair((c) => c.sendHover),
      '--dsw-alias-interactive-bg-hover': pair((c) => c.hover),
      '--dsw-alias-interactive-bg-hover-solid': pair((c) => c.bgTertiary),
      '--dsw-alias-interactive-bg-active': pair((c) => c.active),
      '--dsw-alias-interactive-bg-hover-accent': pair((c) => c.active),
      '--dsw-alias-interactive-bg-hover-danger': pair((c) => c.hover),

      // States -----------------------------------------------------------
      '--dsw-alias-state-error-primary': pair((c) => c.error),
      '--dsw-alias-state-error-secondary': pair((c) => c.error),
      '--dsw-alias-state-success-primary': pair((c) => c.success),
      '--dsw-alias-state-success-secondary': pair((c) => c.success),
      '--dsw-alias-state-success-tertiary': pair((c) => c.washStrong),
      '--dsw-alias-state-warn-primary': pair((c) => c.warn),
      '--dsw-alias-state-warn-secondary': pair((c) => c.warn),
      '--dsw-alias-state-warn-label': pair((c) => c.warn),
      '--dsw-alias-state-warn-tertiary': pair((c) => c.washStrong),
      '--dsw-alias-state-idle-primary': pair((c) => c.textMuted),
      '--dsw-alias-switch-thumb': pair((c) => (c === PALETTE.dark ? '#afafaf' : '#ffffff')),

      // Markdown + code: recessed below the surface ----------------------
      '--dsw-alias-markdown-code-block': pair((c) => c.codeBg),
      '--dsw-alias-markdown-code-block-banner': pair((c) => c.codeBanner),
      '--dsw-alias-markdown-inline-code': pair((c) => c.inlineCode),
      '--dsw-alias-markdown-code-segment-selected': pair((c) => c.bgElevated),
      '--dsw-alias-markdown-code-segment-unselected': pair((c) => c.bgTertiary),
      '--dsw-alias-markdown-citation': pair((c) => c.bgTertiary),
      '--dsw-alias-markdown-tag': pair((c) => c.bgTertiary),
      '--dsw-alias-markdown-placeholder': pair((c) => c.bgTertiary),
      '--dsw-alias-turn-trigger-bg': pair((c) => c.wash),
      '--dsw-alias-turn-trigger-bg-hover': pair((c) => c.washStrong),

      // Overlays ----------------------------------------------------------
      '--dsw-alias-tooltip-bg': pair((c) => c.tooltipBg),
      '--dsw-alias-toast-bg': pair((c) => c.tooltipBg),
      '--dsw-alias-toast-label': pair((c) => c.tooltipLabel),
      '--dsw-alias-menu-group-header-fill': pair((c) => c.bgSecondary),

      // Scrollbars: thin and quiet ---------------------------------------
      '--dsw-alias-scrollbar-bg-l1': pair((c) => c.border),
      '--dsw-alias-scrollbar-bg-l2': pair((c) => c.border),
      '--dsw-alias-scrollbar-hover-l1': pair((c) => c.borderStrong),
      '--dsw-alias-scrollbar-hover-l2': pair((c) => c.borderStrong),

      // Diff fills ---------------------------------------------------------
      // The marker colour is measured: Codex paints the added-count glyph in a
      // saturated #00A240, not a washed-out green. The translucent *fills* stay
      // soft on purpose —a full-strength green block behind a line of text
      // would be unreadable, and the measured glyph colour is a foreground,
      // not a surface.
      '--dsw-alias-code-diff-added': pair(() => 'rgba(0, 162, 64, 0.12)'),
      '--dsw-alias-code-diff-deleted': pair(() => 'rgba(224, 46, 42, 0.12)'),
      '--dsw-alias-file-diff-added-bg': pair(() => 'rgba(0, 162, 64, 0.12)'),
      '--dsw-alias-file-diff-added-gutter': pair(() => 'rgba(0, 162, 64, 0.18)'),
      '--dsw-alias-file-diff-added-marker': pair(() => '#00a240'),
      '--dsw-alias-file-diff-deleted-bg': pair(() => 'rgba(224, 46, 42, 0.12)'),
      '--dsw-alias-file-diff-deleted-gutter': pair(() => 'rgba(224, 46, 42, 0.18)'),
      '--dsw-alias-file-diff-deleted-marker': pair(() => '#e02e2a'),
    });

    /**
     * Syntax highlighting. These are not `--dsw-*` tokens, but the override
     * layer is name-agnostic: the only validation is that each value is a
     * `{ light, dark }` pair, and the presenter applies every entry to `body`
     * as an inline custom property. Shiki's highlighted spans read these as
     * `var(--shiki-token-*)`, so an inline value on `body` wins over the
     * stylesheet's `:root` / `body[data-ds-dark-theme]` declarations that the
     * spans would otherwise inherit.
     */
    /**
     * Project one syntax palette onto the shiki token names.
     * @param palette - a `{ light, dark }` record of role colours.
     * @returns the `--shiki-*` token map for that palette.
     */
    function syntaxTokensFor(palette) {
      return {
        '--shiki-token-constant': pairOf(palette, 'constant'),
        '--shiki-token-string': pairOf(palette, 'string'),
        '--shiki-token-string-expression': pairOf(palette, 'string'),
        '--shiki-token-keyword': pairOf(palette, 'keyword'),
        '--shiki-token-function': pairOf(palette, 'fn'),
        '--shiki-token-parameter': pairOf(palette, 'param'),
        '--shiki-token-comment': pairOf(palette, 'comment'),
        '--shiki-token-punctuation': pairOf(palette, 'punctuation'),
        '--shiki-token-link': pairOf(palette, 'link'),
      };
    }

    /**
     * Codex radii are structural rather than universal: 4px chips, 8px controls,
     * 12px panels and menus, 24px composer. Re-mapping the shared scale keeps
     * every component on that rhythm without touching a single component rule.
     */
    /**
     * The focus ring, pinned to the accent blue.
     *
     * `focus.css` resolves the ring from `--dsw-focus-ring-color`, falling back
     * to `--dsw-alias-state-business-primary`. Since that fallback now carries
     * the neutral control colour (so switches read as ink rather than blue),
     * this variable has to be stated explicitly or every focus ring in the UI
     * would turn grey too, losing a state indicator that must stay obvious.
     */
    const FOCUS_TOKENS = {
      '--dsw-focus-ring-color': pair((c) => c.accent),
    };

    const RADIUS_TOKENS = {
      '--dsw-radius-xs': pair(() => '4px'),
      '--dsw-radius-sm': pair(() => '8px'),
      '--dsw-radius-md': pair(() => '10px'),
      '--dsw-radius-lg': pair(() => '12px'),
      '--dsw-radius-xl': pair(() => '16px'),
      '--dsw-radius-panel': pair(() => '24px'),
    };

    /**
     * Compose the full override layer for one chrome theme preset.
     *
     * The preset supplies Codex's four appearance parameters (accent, surface,
     * ink, contrast); `paletteFromPreset` turns them into the surface ramp the
     * token tables read, and the code-highlight palette follows the accent so the
     * two stay coherent.
     * @param presetId - a key of THEME_PRESETS.
     * @returns the token map to hand to `overrideTokens`.
     */
    function buildTokens(presetId) {
      // `presetFor` resolves the reserved `custom` id from stored parameters;
      // named presets resolve from the table.
      const preset = presetFor(presetId ?? preset);
      // Swap the palette the token tables read from, then evaluate them.
      ACTIVE_PALETTE = {
        light: paletteFromPreset('light', preset),
        dark: paletteFromPreset('dark', preset),
      };
      return {
        ...colorTokens(),
        ...STATIC_SURFACE_TOKENS,
        ...syntaxTokensFor(SYNTAX),
        ...FOCUS_TOKENS,
        ...RADIUS_TOKENS,
      };
    }

    // ---------------------------------------------------------------------
    // Preferences: an on/off flag plus the selected syntax palette.
    // ---------------------------------------------------------------------

    /** Read the stored preference; a missing or unreadable value means on. */
    function readEnabled() {
      try {
        const raw = window.localStorage.getItem(PREF_KEY);
        return raw === null ? true : raw === '1';
      } catch {
        return true;
      }
    }

    /**
     * Validate one mode's parameter set. Colors must be `#rrggbb` and contrast an
     * integer 0–100, matching what Codex's own appearance panel accepts.
     * @param value - candidate `{ accent, ink, surface, contrast }`.
     * @returns the cleaned record, or null when anything is out of range.
     */
    function normalizeParams(value) {
      if (!value || typeof value !== 'object') return null;
      const ok = (c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c.trim());
      if (!ok(value.accent) || !ok(value.ink) || !ok(value.surface)) return null;
      const contrast = Number(value.contrast);
      if (!Number.isFinite(contrast)) return null;
      return {
        accent: value.accent.trim().toLowerCase(),
        ink: value.ink.trim().toLowerCase(),
        surface: value.surface.trim().toLowerCase(),
        contrast: Math.min(100, Math.max(0, Math.round(contrast))),
      };
    }

    /**
     * Read the stored custom parameters, falling back to the default preset's
     * values so the editor always opens on something valid.
     * @returns `{ light, dark }` parameter records.
     */
    function readCustom() {
      const fallback = {
        light: { ...THEME_PRESETS.codex.light },
        dark: { ...THEME_PRESETS.codex.dark },
      };
      try {
        const raw = window.localStorage.getItem(CUSTOM_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        const light = normalizeParams(parsed && parsed.light);
        const dark = normalizeParams(parsed && parsed.dark);
        return { light: light ?? fallback.light, dark: dark ?? fallback.dark };
      } catch {
        return fallback;
      }
    }

    /** Read the stored palette id, falling back to the measured default. */
    function readPreset() {
      try {
        const raw = window.localStorage.getItem(PRESET_KEY);
        if (raw === CUSTOM_PRESET) return CUSTOM_PRESET;
        return raw && THEME_PRESETS[raw] ? raw : DEFAULT_PRESET;
      } catch {
        return DEFAULT_PRESET;
      }
    }

    let enabled = readEnabled();
    let preset = readPreset();
    let custom = readCustom();
    const listeners = new Set();

    /** The preset object for an id, materialising `custom` from stored params. */
    function presetFor(id) {
      if (id === CUSTOM_PRESET) return custom;
      return THEME_PRESETS[id] ?? THEME_PRESETS.codex;
    }

    /** Write the preference and notify the plugin body and the row. */
    function setEnabled(next) {
      enabled = next;
      try {
        window.localStorage.setItem(PREF_KEY, next ? '1' : '0');
      } catch {
        /* A blocked storage keeps the in-memory value; the row still works. */
      }
      for (const fn of [...listeners]) fn();
    }

    /** Switch the chrome palette and rebuild the override layer. */
    function setPreset(next) {
      if (next !== CUSTOM_PRESET && !THEME_PRESETS[next]) return;
      if (next === preset) return;
      preset = next;
      try {
        window.localStorage.setItem(PRESET_KEY, next);
      } catch {
        /* Same reasoning as setEnabled. */
      }
      for (const fn of [...listeners]) fn();
    }

    /**
     * Update one mode of the custom palette.
     *
     * The selection switches to `custom` automatically: tuning a value while the
     * plugin is still on a named preset would otherwise appear to do nothing.
     * @param mode - `'light'` or `'dark'`.
     * @param patch - partial parameter record; invalid fields are ignored.
     */
    function setCustomMode(mode, patch) {
      const next = normalizeParams({ ...custom[mode], ...patch });
      if (!next) return;
      custom = { ...custom, [mode]: next };
      try {
        window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
        window.localStorage.setItem(PRESET_KEY, CUSTOM_PRESET);
      } catch {
        /* Keep the in-memory value. */
      }
      preset = CUSTOM_PRESET;
      for (const fn of [...listeners]) fn();
    }

    /**
     * Discard the custom parameters and return to the measured preset.
     *
     * Lives at module scope because it has to write the module-level `custom`;
     * the panel's reset button calls this rather than mutating a render-local
     * binding.
     */
    function resetCustom() {
      custom = {
        light: { ...THEME_PRESETS.codex.light },
        dark: { ...THEME_PRESETS.codex.dark },
      };
      try {
        window.localStorage.removeItem(CUSTOM_KEY);
      } catch {
        /* Keep the in-memory value. */
      }
      setPreset(DEFAULT_PRESET);
    }

    function subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }

    // ---------------------------------------------------------------------
    // Palette catalogue
    // ---------------------------------------------------------------------

    /**
     * Display order of the chrome theme presets. `custom` sits last: it is the
     * editor rather than a canned palette, so it reads as the escape hatch after
     * the curated options.
     */
    const PRESET_ORDER = [...THEME_ORDER, CUSTOM_PRESET];

    /**
     * Display names for the chrome presets, shared by every locale. These are
     * parameter variants of Codex's own appearance model, so the names describe
     * the tuning rather than borrowing another project's palette name.
     */
    const PRESET_NAMES = {
      codexDim: 'Codex Dim',
      codexHighContrast: 'Codex High Contrast',
      codexSlate: 'Codex Slate',
      codexWarm: 'Codex Warm',
    };

    /** Build one locale's dictionary: shared preset names plus that locale's copy. */
    function localeDict(base) {
      const dict = { ...base };
      for (const [id, name] of Object.entries(PRESET_NAMES)) dict[`preset.${id}`] = name;
      return dict;
    }

    const FALLBACK_TEXT = localeDict({
      title: 'Codex 主题',
      description: '用 OpenAI Codex 的配色、圆角与代码高亮替换当前外观。',
      presetLabel: '界面配色',
      'preset.codex': 'Codex（实测）',
      'preset.custom': '自定义',
      'preview.item1': '新聊天',
      'preview.item2': '最近会话',
      'preview.sample': '你好！我是 Codex',
      'preview.action': '发送',
      customHeading: '自定义参数',
      customHint: '改动任意一项会自动切到「自定义」。取值与 Codex 外观面板一致。',
      'custom.mode.light': '浅色',
      'custom.mode.dark': '深色',
      'custom.accent': '强调色',
      'custom.surface': '背景',
      'custom.ink': '前景',
      'custom.contrast': '对比度',
      customReset: '恢复为实测值',
      panelNote:
        'Codex 的界面配色由「强调色 / 背景 / 前景 / 对比度」四个参数生成，没有固定的配色列表。默认项是逐像素实测值；其余选项在同样的参数模型里调节这四档，因此都能在 Codex 自身的外观面板里复现。',
    });
    const ZH = FALLBACK_TEXT;
    const EN = localeDict({
      title: 'Codex theme',
      description: "Replace the look with OpenAI Codex's palette, radii, and syntax highlighting.",
      presetLabel: 'Interface palette',
      'preset.codex': 'Codex (measured)',
      'preset.custom': 'Custom',
      'preview.item1': 'New chat',
      'preview.item2': 'Recent',
      'preview.sample': 'Hi, I am Codex',
      'preview.action': 'Send',
      customHeading: 'Custom parameters',
      customHint:
        'Changing any value switches to Custom. The ranges match Codex’s own appearance panel.',
      'custom.mode.light': 'Light',
      'custom.mode.dark': 'Dark',
      'custom.accent': 'Accent',
      'custom.surface': 'Background',
      'custom.ink': 'Foreground',
      'custom.contrast': 'Contrast',
      customReset: 'Reset to measured values',
      panelNote:
        "Codex derives its interface colours from four parameters — accent, surface, ink, and contrast — rather than shipping fixed palettes. The default is pixel-measured; the other options tune those same four knobs, so each one is reproducible inside Codex's own appearance panel.",
    });

    /**
     * The toggle switch, shared by both places that render one.
     *
     * It has to live in its own constant rather than inside ROW_CSS: the settings
     * panel renders PANEL_CSS, and when the switch rules existed only in ROW_CSS
     * the panel's switch fell back to a naked browser button — invisible as a
     * switch. Both sheets now interpolate this block.
     */
    const SWITCH_CSS = `
.ct-switch{box-sizing:border-box;flex:none;width:36px;height:20px;padding:2px;
  border:0;border-radius:999px;corner-shape:round;cursor:pointer;
  background:var(--dsw-alias-border-l4);transition:background .1s}
.ct-switch[aria-checked="true"]{background:var(--dsw-alias-brand-primary)}
.ct-switch:focus-visible{outline:var(--dsw-focus-ring-width) solid
  var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.ct-thumb{display:block;width:16px;height:16px;border-radius:999px;
  corner-shape:round;background:var(--dsw-alias-switch-thumb);
  transition:transform .1s}
.ct-switch[aria-checked="true"] .ct-thumb{transform:translateX(16px)}
`;

    /**
     * Panel-page styles. Separate from ROW_CSS because the panel is a full page
     * with its own rhythm, while the row is a single line in a list.
     */
    const PANEL_CSS = `
${SWITCH_CSS}
.ct-panel{flex-direction:column;gap:24px;display:flex;padding:4px 0 24px}
.ct-panelBlock{flex-direction:column;gap:10px;display:flex;padding-bottom:20px;
  border-bottom:.5px solid var(--dsw-alias-border-l2)}
.ct-panelBlock:last-child{border-bottom:none;padding-bottom:0}
.ct-panelRow{align-items:center;gap:16px;display:flex}
.ct-panelRowText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.ct-panelTitle{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.ct-panelDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.ct-panelHeading{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;font-weight:500}
/* Swatch grid: two columns so nine presets stay scannable without a long scroll. */
.ct-swatches{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;display:grid}
.ct-swatch{align-items:center;gap:10px;display:flex;font:inherit;
  padding:8px 10px;border:.5px solid var(--dsw-alias-border-l3);
  border-radius:var(--dsw-radius-md);background:0 0;cursor:pointer;
  color:var(--dsw-alias-label-primary);text-align:left;min-width:0}
.ct-swatch:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ct-swatch:focus-visible{outline:var(--dsw-focus-ring-width) solid
  var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.ct-swatchOn{border-color:var(--dsw-alias-brand-primary);
  background:var(--dsw-alias-interactive-bg-hover)}
.ct-swatchDots{gap:3px;display:inline-flex;flex:none}
.ct-dot{width:10px;height:10px;border-radius:999px;corner-shape:round;display:block}
.ct-swatchName{font-size:12px;line-height:18px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
/* Preview of the selected chrome preset: a miniature layout painted with that
   preset's own surface / ink / accent. Inline colours, because the card must
   show the *candidate* palette rather than the active one. */
.ct-preview{display:flex;height:132px;border-radius:var(--dsw-radius-md);
  corner-shape:round;overflow:hidden;border:.5px solid var(--dsw-alias-border-l3);
  font-size:11px;line-height:16px}
.ct-previewSide{flex:none;width:104px;flex-direction:column;gap:2px;
  padding:8px 6px;display:flex}
.ct-previewItem{display:block;padding:3px 6px;border-radius:5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ct-previewItemOn{font-weight:500}
.ct-previewMain{flex:1;flex-direction:column;justify-content:center;
  align-items:flex-end;gap:10px;min-width:0;padding:10px 12px;display:flex}
.ct-previewBubble{padding:4px 9px;border-radius:9px;max-width:100%;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
.ct-previewButton{align-self:center;padding:4px 14px;border-radius:8px;
  corner-shape:round;font-size:11px;display:block}
/* Custom-parameter editor. Two stacked groups (light, dark), each a small grid
   of label + control + current value, matching the density of Codex's own
   appearance rows. */
.ct-custom{flex-direction:column;gap:12px;display:flex;padding:12px;
  border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2)}
.ct-customGroup{flex-direction:column;gap:6px;display:flex}
.ct-customGroupTitle{color:var(--dsw-alias-label-primary);font-size:12px;
  line-height:18px;font-weight:500;margin-bottom:2px}
.ct-field{align-items:center;gap:8px;display:flex;min-width:0}
.ct-fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;
  line-height:18px;flex:none;width:56px}
.ct-colorInput{flex:none;width:28px;height:22px;padding:0;cursor:pointer;
  border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);
  background:0 0;appearance:none;-webkit-appearance:none}
.ct-colorInput::-webkit-color-swatch-wrapper{padding:2px}
.ct-colorInput::-webkit-color-swatch{border:none;border-radius:2px}
.ct-contrast{flex:1;min-width:72px;height:20px;margin:0;cursor:pointer;
  accent-color:var(--dsw-alias-brand-primary);appearance:auto;-webkit-appearance:auto}
.ct-fieldValue{color:var(--dsw-alias-label-tertiary);flex:none;
  font-family:var(--ds-font-family-code);font-size:11px;line-height:16px}
.ct-customReset{align-self:flex-start;font:inherit;font-size:12px;line-height:18px;
  padding:4px 10px;border:.5px solid var(--dsw-alias-border-l3);
  border-radius:var(--dsw-radius-sm);background:0 0;cursor:pointer;
  color:var(--dsw-alias-label-primary)}
.ct-customReset:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ct-panelNote{padding-bottom:0}
`;

    /** Row-local styles, rendered as an element so unmount removes them. */
    const ROW_CSS = `
${SWITCH_CSS}
.ct-row{align-items:center;gap:8px;padding:16px 0;display:flex;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.ct-rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}
.ct-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}
.ct-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}
/* Syntax-palette picker inside the row. Kept to the same 14px rhythm as the
   title, with the select styled from theme tokens so it follows light/dark. */
.ct-preset{align-items:center;gap:8px;display:flex;margin-top:2px}
.ct-presetLabel{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;flex:none}
.ct-select{font:inherit;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);
  background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l3);
  border-radius:var(--dsw-radius-sm);padding:2px 6px;cursor:pointer;min-width:0}
.ct-select:focus-visible{outline:var(--dsw-focus-ring-width) solid
  var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
`;

    /**
     * The Settings to General row. The slot owner projects no label and passes no
     * props for this seat, so the row draws its own text and control.
     * @param props - composed slot props; only `t` is used when localized.
     * @returns the row element tree.
     */
    function CodexThemeRow(props) {
      const t = typeof props.t === 'function' ? props.t : null;
      // Re-render when the preference changes from anywhere. `t` reads the
      // active locale at call time, and the shell re-renders settings rows on a
      // locale switch, so no locale subscription is needed here.
      const on = useEnabled();
      const current = usePreset();

      const text = (key) => (t ? t(key) : FALLBACK_TEXT[key]);

      return h(
        'div',
        { className: 'ct-row' },
        h('style', { key: 'css' }, ROW_CSS),
        h(
          'div',
          { className: 'ct-rowText', key: 'text' },
          h('div', { className: 'ct-title' }, text('title')),
          h('div', { className: 'ct-desc' }, text('description')),
          // The palette picker only shows while the theme is on: offering a
          // syntax choice for an inactive override would be a dead control.
          on
            ? h(
                'label',
                { className: 'ct-preset', key: 'preset' },
                h('span', { className: 'ct-presetLabel' }, text('presetLabel')),
                h(
                  'select',
                  {
                    className: 'ct-select',
                    value: current,
                    'aria-label': text('presetLabel'),
                    onChange: (event) => setPreset(event.target.value),
                  },
                  PRESET_ORDER.map((id) =>
                    h('option', { key: id, value: id }, text(`preset.${id}`)),
                  ),
                ),
              )
            : null,
        ),
        h(
          'button',
          {
            key: 'switch',
            type: 'button',
            role: 'switch',
            className: 'ct-switch',
            'aria-checked': on,
            'aria-label': text('title'),
            onClick: () => setEnabled(!on),
          },
          h('span', { className: 'ct-thumb' }),
        ),
      );
    }

    /**
     * Subscribe to the on/off preference so toggling it re-renders a component.
     * @returns the current value, kept fresh by an effect subscription.
     */
    function useEnabled() {
      const [value, setValue] = React.useState(enabled);
      React.useEffect(() => subscribe(() => setValue(enabled)), []);
      return value;
    }

    /**
     * Subscribe to the selected palette id, for the same reason.
     * @returns the current preset id.
     */
    function usePreset() {
      const [value, setValue] = React.useState(preset);
      React.useEffect(() => subscribe(() => setValue(preset)), []);
      return value;
    }

    /**
     * Subscribe to everything the panel draws from.
     *
     * `usePreset` alone is not enough for the custom editor: tuning a parameter
     * keeps the preset id at `custom`, so `setValue(preset)` receives an
     * unchanged value and React skips the re-render. The controlled inputs then
     * keep their stale `value`, which is what made the contrast slider look
     * stuck. This hook carries a revision counter that increments on every
     * notification, so any preference change forces a render.
     *
     * @returns `{ enabled, preset, custom, revision }` read at render time.
     */
    function useThemeState() {
      const [revision, setRevision] = React.useState(0);
      React.useEffect(() => subscribe(() => setRevision((n) => n + 1)), []);
      // The module-level values are read fresh on every render, so the returned
      // record always reflects the latest preference; `revision` only exists to
      // make React notice the change.
      return { enabled, preset, custom, revision };
    }

    /**
     * The dedicated Codex theme panel, registered as its own Settings section.
     *
     * This is the page the sidebar shortcut and the panel list open into. It
     * owns three things the one-line General row cannot carry:
     *
     *   1. the on/off switch (same `enabled` flag as everywhere else),
     *   2. the syntax-palette picker, shown as a list of swatches rather than a
     *      select, so the colour difference is visible before choosing, and
     *   3. a live sample of the selected palette, so a choice can be judged
     *      without opening a code block.
     *
     * @param props - `t` from the plugin body; the shell supplies nothing else
     *   this page needs.
     * @returns the section content.
     */
    function CodexThemePanel(props) {
      const t = typeof props.t === 'function' ? props.t : null;
      // `useThemeState` rather than `usePreset`: the custom editor's controls are
      // controlled inputs, so they need a render on every parameter change, not
      // only when the preset id changes.
      const state = useThemeState();
      const on = state.enabled;
      const current = state.preset;
      const custom = state.custom;
      const text = (key) => (t ? t(key) : FALLBACK_TEXT[key]);

      /**
       * One preset as a selectable chip.
       *
       * The dots show the preset's own chrome colours — base surface, the derived
       * sidebar step, the ink, and the accent — because that is what changes when
       * a chrome preset is applied. Showing syntax colours here would advertise
       * the wrong thing.
       */
      const swatch = (id) => {
        // `custom` has no table entry, so resolve through presetFor.
        const preset = presetFor(id);
        // Resolve the real palette so the chip matches what activation produces,
        // including the measured values for the default preset.
        const pal = paletteFromPreset('dark', preset);
        const dots = [pal.bgBase, pal.bgSecondary, pal.text, pal.accent];
        return h(
          'button',
          {
            key: id,
            type: 'button',
            className: 'ct-swatch' + (id === current ? ' ct-swatchOn' : ''),
            role: 'radio',
            'aria-checked': id === current,
            onClick: () => setPreset(id),
          },
          h(
            'span',
            { className: 'ct-swatchDots', key: 'dots' },
            dots.map((color, i) =>
              h('span', {
                key: i,
                className: 'ct-dot',
                style: { background: color },
              }),
            ),
          ),
          h('span', { className: 'ct-swatchName', key: 'name' }, text(`preset.${id}`)),
        );
      };

      /**
       * One editable parameter row.
       * @param mode - `'light'` or `'dark'`.
       * @param field - `'accent' | 'surface' | 'ink'`.
       */
      const colorRow = (mode, field) => {
        const value = custom[mode][field];
        return h(
          'label',
          { className: 'ct-field', key: `${mode}.${field}` },
          h('span', { className: 'ct-fieldLabel' }, text(`custom.${field}`)),
          h('input', {
            type: 'color',
            className: 'ct-colorInput',
            value,
            'aria-label': `${text(`custom.mode.${mode}`)} ${text(`custom.${field}`)}`,
            onChange: (event) => setCustomMode(mode, { [field]: event.target.value }),
          }),
          h('code', { className: 'ct-fieldValue' }, value),
        );
      };

      /** Contrast slider row for one mode. */
      const contrastRow = (mode) => {
        const value = custom[mode].contrast;
        return h(
          'label',
          { className: 'ct-field', key: `${mode}.contrast` },
          h('span', { className: 'ct-fieldLabel' }, text('custom.contrast')),
          h('input', {
            type: 'range',
            className: 'ct-contrast',
            min: 0,
            max: 100,
            step: 1,
            value,
            'aria-label': `${text(`custom.mode.${mode}`)} ${text('custom.contrast')}`,
            onChange: (event) =>
              setCustomMode(mode, { contrast: Number(event.target.value) }),
          }),
          h('code', { className: 'ct-fieldValue' }, String(value)),
        );
      };

      /** The editor block, shown only while `custom` is the active palette. */
      const customEditor =
        current === CUSTOM_PRESET
          ? h(
              'div',
              { className: 'ct-custom', key: 'custom' },
              h('div', { className: 'ct-panelDesc' }, text('customHint')),
              ...['light', 'dark'].map((mode) =>
                h(
                  'div',
                  { className: 'ct-customGroup', key: mode },
                  h('div', { className: 'ct-customGroupTitle' }, text(`custom.mode.${mode}`)),
                  colorRow(mode, 'accent'),
                  colorRow(mode, 'surface'),
                  colorRow(mode, 'ink'),
                  contrastRow(mode),
                ),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'ct-customReset',
                  onClick: resetCustom,
                },
                text('customReset'),
              ),
            )
          : null;

      // Resolve the preview palette the same way activation does, so the card
      // shows exactly what the preset will produce in dark mode (the denser of
      // the two, and the one where surface differences read most clearly).
      const previewPreset = presetFor(current);
      const previewPal = paletteFromPreset('dark', previewPreset);
      previewPal.onAccent = '#ffffff';

      return h(
        'div',
        { className: 'ct-panel' },
        h('style', { key: 'css' }, PANEL_CSS),
        h(
          'section',
          { className: 'ct-panelBlock', key: 'toggle' },
          h(
            'div',
            { className: 'ct-panelRow' },
            h(
              'div',
              { className: 'ct-panelRowText' },
              h('div', { className: 'ct-panelTitle' }, text('title')),
              h('div', { className: 'ct-panelDesc' }, text('description')),
            ),
            h(
              'button',
              {
                type: 'button',
                role: 'switch',
                className: 'ct-switch',
                'aria-checked': on,
                'aria-label': text('title'),
                onClick: () => setEnabled(!on),
              },
              h('span', { className: 'ct-thumb' }),
            ),
          ),
        ),
        h(
          'section',
          { className: 'ct-panelBlock', key: 'palette' },
          h('div', { className: 'ct-panelHeading' }, text('presetLabel')),
          h('div', { className: 'ct-swatches', role: 'radiogroup', 'aria-label': text('presetLabel') },
            PRESET_ORDER.map(swatch)),
          customEditor,
          h(
            // Preview of the selected chrome preset: a miniature of the real
            // layout, painted with the preset's own surface / ink / accent so the
            // choice can be judged before applying it.
            'div',
            {
              className: 'ct-preview',
              key: 'preview',
              style: { background: previewPal.bgBase, color: previewPal.text },
            },
            h(
              'div',
              { className: 'ct-previewSide', style: { background: previewPal.bgSecondary } },
              h('span', { className: 'ct-previewItem' }, text('preview.item1')),
              h(
                'span',
                {
                  className: 'ct-previewItem ct-previewItemOn',
                  style: { background: previewPal.bubble },
                },
                text('preview.item2'),
              ),
            ),
            h(
              'div',
              { className: 'ct-previewMain' },
              h(
                'span',
                { className: 'ct-previewBubble', style: { background: previewPal.bubble } },
                text('preview.sample'),
              ),
              h(
                'span',
                {
                  className: 'ct-previewButton',
                  style: { background: previewPal.accent, color: previewPal.onAccent },
                },
                text('preview.action'),
              ),
            ),
          ),
        ),
        h(
          'section',
          { className: 'ct-panelBlock ct-panelNote', key: 'note' },
          h('div', { className: 'ct-panelDesc' }, text('panelNote')),
        ),
      );
    }

    /**
     * The sidebar-foot shortcut: one click toggles the theme.
     *
     * This mirrors the Settings switch rather than duplicating any logic — both
     * read and write the same `enabled` flag through `useEnabled`/`setEnabled`,
     * so the two controls can never disagree.
     *
     * The slot passes `wide`, which is false in the 56px rail. The label is
     * dropped there and only the glyph remains, so the collapsed sidebar keeps
     * its single-column rhythm.
     *
     * @param props - `wide` from the slot owner, plus `t`.
     * @returns the toggle button.
     */
    return {
      inject: ['theme', 'slots'],
      /**
       * Install the layer, the Settings row, and the composer effort meter.
       * Every registration goes through `ctx.effect` or `ctx.slots.inject`, so
       * unloading the bundle removes the override layer, both UI contributions,
       * and the preference effect together.
       * @param ctx - client cordis context.
       */
      apply(ctx) {
        // Optional locale: bind the rows' copy to the active language when the
        // service is present, and fall back to inline text otherwise.
        const locale = ctx.get('locale');
        let translate = null;
        if (locale) {
          ctx.effect(
            () => locale.register('codex-theme', { zh: ZH, en: EN }),
            'codex-theme: dictionaries',
          );
          translate = locale.bind('codex-theme');
        }
        const t = translate ?? ((key) => FALLBACK_TEXT[key]);

        const Row = (props) => CodexThemeRow({ ...props, t });
        const Panel = (props) => CodexThemePanel({ ...props, t });

        // The alias-token layer, installed and retired with the preference.
        //
        // `overrideTokens` replaces a source's whole layer when called again, so
        // switching presets is just a re-install with a different token map — no
        // separate teardown needed. The disposer is tracked so the layer still
        // comes off cleanly when the plugin unloads or the user turns it off.
        ctx.effect(() => {
          let disposeLayer = null;
          // Signature of what is currently installed. Comparing the preset id
          // alone is not enough: every custom tweak keeps the id at `custom`,
          // so the layer would never be rebuilt and the edits would not show.
          // The serialised parameters make the comparison content-based.
          let installedSignature = null;
          const sync = () => {
            if (!enabled) {
              if (disposeLayer) {
                disposeLayer();
                disposeLayer = null;
                installedSignature = null;
              }
              return;
            }
            const signature = JSON.stringify({ preset, custom });
            if (signature === installedSignature && disposeLayer) return;
            disposeLayer = ctx.theme.overrideTokens(SOURCE, buildTokens(preset));
            installedSignature = signature;
          };
          sync();
          const unsubscribe = subscribe(sync);
          return () => {
            unsubscribe();
            if (disposeLayer) {
              disposeLayer();
              disposeLayer = null;
              installedSignature = null;
            }
          };
        }, 'codex-theme: Codex alias token layer');

        // The dedicated theme page. `settings.section` renders a full page in the
        // settings panel's content column, which is what lets the palette picker
        // show swatches and a live sample instead of a cramped one-line select.
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'codex-theme',
              order: 16,
              label: () => t('title'),
            },
            Panel,
          ),
        );

        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register({ name: 'settings.general.item', id: 'codex-theme', order: 14 }, Row),
        );
      },
    };
  },
});
