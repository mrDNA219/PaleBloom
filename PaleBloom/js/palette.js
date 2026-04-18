/**
 * palette.js — PaleBloom master color palette
 *
 * All game colors live here, organized by color theory harmony.
 * Inspired by Scavenger's Reign and Synergy: soft pastels meet alien hues,
 * naturalistic tones collide with surreal bioluminescence — dreamlike yet terrifying.
 *
 * ─── Structure ───────────────────────────────────────────────────────────────
 *   Part I   — Monochromatic families  (named individual colors)
 *   Part II  — Complementary harmonies (pairs 180° apart — maximum tension)
 *   Part III — Analogous harmonies     (adjacent hues — cohesive, naturalistic)
 *   Part IV  — Triadic harmonies       (120° spacing — balanced full-spectrum)
 *   Part V   — Split-complementary     (base + two near the complement — softer)
 *   Part VI  — Tetradic / Square       (four 90°-spaced hues — rich, complex)
 *   Part VII — Scene-role palettes     (curated pools for glow, bark, void, etc.)
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *   import { MINT_SOFT, PALETTE_GLOW, H_TRIADIC_ALIEN } from '../palette.js';
 *   import { pick } from '../palette.js';   // random pick helper
 */

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Pick a random element from an array. */
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }


// ═════════════════════════════════════════════════════════════════════════════
// PART I — MONOCHROMATIC FAMILIES
// Each family covers a single hue from whisper-pale to near-void black.
// Naming convention:  <HUE>_<BRIGHTNESS>
//   WHISPER  ≈ 96% lightness — barely tinted whites
//   PALE     ≈ 85% lightness — classic pastels
//   SOFT     ≈ 76% lightness — the "Scavenger's Reign" sweet spot
//   MID      ≈ 65% lightness — confident mid-tones
//   VIVID    ≈ 50% lightness — fully saturated
//   DEEP     ≈ 30% lightness — rich darks (catch light well)
//   VOID     ≈  8% lightness — near-black with hue undertone (bark, shadow, bg)
// ═════════════════════════════════════════════════════════════════════════════

// ── Mint / Teal  (hue ~158°) ──────────────────────────────────────────────
export const MINT_WHISPER  = 0xecfff8;
export const MINT_PALE     = 0xb3ffd9;
export const MINT_SOFT     = 0x88ffcc;
export const MINT_MID      = 0x55eeaa;
export const MINT_VIVID    = 0x00dd77;
export const TEAL_LIGHT    = 0x1ab87a;
export const TEAL_DEEP     = 0x0d7a50;
export const TEAL_VOID     = 0x051a10;

// ── Cyan  (hue ~178°) ────────────────────────────────────────────────────
export const CYAN_WHISPER  = 0xe0fffc;
export const CYAN_PALE     = 0xaaffee;
export const CYAN_SOFT     = 0x66ffee;
export const CYAN_VIVID    = 0x00eedd;
export const CYAN_DEEP     = 0x009988;
export const CYAN_VOID     = 0x092225;

// ── Seafoam  (hue ~165°, muted — organic liminal zone between mint and cyan) ─
export const SEAFOAM_PALE  = 0xb8ffe8;
export const SEAFOAM_SOFT  = 0x77ddbb;
export const SEAFOAM_MID   = 0x44bb99;
export const SEAFOAM_DEEP  = 0x1a7760;
export const SEAFOAM_VOID  = 0x091a15;

// ── Azure / Blue  (hue ~210°) ─────────────────────────────────────────────
export const AZURE_WHISPER = 0xe8f4ff;
export const AZURE_PALE    = 0x99ddff;
export const AZURE_SOFT    = 0x66bbff;
export const AZURE_MID     = 0x3399ee;
export const AZURE_VIVID   = 0x1177dd;
export const AZURE_DEEP    = 0x0d4477;
export const BLUE_VOID     = 0x06101a;

// ── Periwinkle  (hue ~240°, blue-violet — the "alien sky at dusk" register) ─
export const PERI_PALE     = 0xdde0ff;
export const PERI_SOFT     = 0xaaaaff;
export const PERI_MID      = 0x7777ff;
export const PERI_DEEP     = 0x3333aa;
export const PERI_VOID     = 0x0d0d33;

// ── Violet / Purple  (hue ~275°) ──────────────────────────────────────────
export const VIOLET_WHISPER = 0xf5eeff;
export const VIOLET_PALE    = 0xeeccff;
export const VIOLET_SOFT    = 0xcc88ff;
export const VIOLET_MID     = 0xaa55ff;
export const VIOLET_VIVID   = 0x8822ee;
export const VIOLET_DEEP    = 0x5511aa;
export const VIOLET_ABYSS   = 0x2d1040;
export const GRAPE_VOID     = 0x120620;

// ── Fuchsia / Magenta  (hue ~300°) ────────────────────────────────────────
export const FUCHSIA_PALE   = 0xffaaee;
export const FUCHSIA_SOFT   = 0xff77dd;
export const FUCHSIA_MID    = 0xff44cc;
export const FUCHSIA_DEEP   = 0xcc0099;
export const FUCHSIA_VOID   = 0x2a0520;

// ── Rose / Pink  (hue ~335°) ──────────────────────────────────────────────
export const ROSE_WHISPER   = 0xfff0f5;
export const ROSE_PALE      = 0xffccdd;
export const ROSE_SOFT      = 0xff99bb;
export const ROSE_MID       = 0xff6699;
export const ROSE_VIVID     = 0xff2266;
export const ROSE_DEEP      = 0xaa1144;
export const ROSE_VOID      = 0x300818;

// ── Coral / Orange  (hue ~18°) ────────────────────────────────────────────
export const CORAL_WHISPER  = 0xfff0ec;
export const CORAL_PALE     = 0xffccbb;
export const CORAL_SOFT     = 0xff9966;
export const CORAL_MID      = 0xff7744;
export const CORAL_VIVID    = 0xff5522;
export const CORAL_DEEP     = 0xcc2200;
export const RUST_VOID      = 0x280e05;

// ── Amber / Gold  (hue ~42°) ──────────────────────────────────────────────
export const AMBER_WHISPER  = 0xfff8e6;
export const AMBER_PALE     = 0xffeeb3;
export const AMBER_SOFT     = 0xffdd88;
export const AMBER_MID      = 0xffcc44;
export const AMBER_VIVID    = 0xffaa00;
export const AMBER_WARM     = 0xff8800;
export const AMBER_DEEP     = 0xcc6600;
export const AMBER_VOID     = 0x221504;

// ── Lime / Yellow-Green  (hue ~82°) ───────────────────────────────────────
export const LIME_WHISPER   = 0xf5ffe0;
export const LIME_PALE      = 0xeeffcc;
export const LIME_SOFT      = 0xddff88;
export const LIME_MID       = 0xccff55;
export const LIME_VIVID     = 0xaaff00;
export const LIME_DEEP      = 0x77bb00;
export const OLIVE_VOID     = 0x151f05;

// ── Green / Forest  (hue ~138°) ───────────────────────────────────────────
export const GREEN_WHISPER  = 0xeaffe8;
export const GREEN_PALE     = 0xaaffcc;
export const GREEN_SOFT     = 0x88ffaa;
export const GREEN_MID      = 0x44ee88;
export const GREEN_VIVID    = 0x00cc55;
export const GREEN_DEEP     = 0x007733;
export const JUNGLE_VOID    = 0x061510;

// ── Void tones  (near-black with color undertones — scene backgrounds, deep shadow) ─
export const VOID_TEAL      = 0x030d06;   // PaleBloom default scene bg / fog
export const VOID_CYAN      = 0x020d0c;
export const VOID_BLUE      = 0x03060d;
export const VOID_VIOLET    = 0x07030d;
export const VOID_ROSE      = 0x0d0308;
export const VOID_AMBER     = 0x0d0803;
export const VOID_GREEN     = 0x030d05;
export const VOID_NEUTRAL   = 0x080808;

// ── Bark / Organic matter  (saturated-deep — visible under alien lighting) ─
export const BARK_JUNGLE    = 0x1a4a2e;   // deep forest teal
export const BARK_VIOLET    = 0x3d1a5a;   // midnight violet
export const BARK_UMBER     = 0x2a1a0e;   // warm dark umber
export const BARK_SAPPHIRE  = 0x0d3035;   // deep blue-teal
export const BARK_RUST      = 0x3a1e10;   // deep rust
export const BARK_OLIVE     = 0x1e2f0a;   // dark olive
export const BARK_GRAPE     = 0x2e1035;   // dark grape
export const BARK_MOSS      = 0x0f2a1a;   // deep jungle moss

// ── Cream / Ivory  (rare — starlight, bleached bone, alien bioluminescent whites) ─
export const CREAM_WHITE    = 0xfff8f0;
export const CREAM_WARM     = 0xfff0d0;
export const CREAM_BONE     = 0xf5e8cc;
export const CREAM_IVORY    = 0xeedd99;


// ═════════════════════════════════════════════════════════════════════════════
// PART II — COMPLEMENTARY HARMONIES
// Pairs of hues ~180° apart on the wheel.
// Effect: maximum contrast and vibrant visual tension — the alien "wrongness" register.
// ═════════════════════════════════════════════════════════════════════════════

/** Teal ↔ Coral  (the core PaleBloom pairing — organic cool vs. hot bioluminescence) */
export const H_COMP_TEAL_CORAL = [
    MINT_SOFT, MINT_VIVID, TEAL_LIGHT,
    CORAL_SOFT, CORAL_MID, CORAL_VIVID,
];

/** Violet ↔ Lime  (the "toxic bloom" pairing — psychedelic and unsettling) */
export const H_COMP_VIOLET_LIME = [
    VIOLET_SOFT, VIOLET_MID, VIOLET_VIVID,
    LIME_SOFT,   LIME_MID,   LIME_VIVID,
];

/** Azure ↔ Amber  (the "deep ocean meets volcanic warmth" pairing) */
export const H_COMP_AZURE_AMBER = [
    AZURE_SOFT,  AZURE_VIVID, AZURE_DEEP,
    AMBER_SOFT,  AMBER_MID,   AMBER_VIVID,
];

/** Rose ↔ Green  (the "predator flush meets jungle" pairing) */
export const H_COMP_ROSE_GREEN = [
    ROSE_SOFT,  ROSE_MID,  ROSE_VIVID,
    GREEN_SOFT, GREEN_MID, GREEN_VIVID,
];

/** Cyan ↔ Coral  (the "bioluminescent deep" pairing) */
export const H_COMP_CYAN_CORAL = [
    CYAN_SOFT, CYAN_VIVID,
    CORAL_SOFT, CORAL_MID,
];

/** Fuchsia ↔ Lime  (the "alien spore" pairing — garish and beautiful) */
export const H_COMP_FUCHSIA_LIME = [
    FUCHSIA_SOFT, FUCHSIA_MID,
    LIME_SOFT,    LIME_MID,
];


// ═════════════════════════════════════════════════════════════════════════════
// PART III — ANALOGOUS HARMONIES
// Groups of 3–5 adjacent hues on the wheel.
// Effect: cohesive, naturalistic — a single "biome feel".
// ═════════════════════════════════════════════════════════════════════════════

/** The cool alien ocean — teal through blue through violet */
export const H_ANALOG_COOL_OCEAN = [
    TEAL_LIGHT, CYAN_SOFT, SEAFOAM_SOFT,
    AZURE_SOFT, AZURE_VIVID, PERI_SOFT,
    VIOLET_SOFT,
];

/** The warm ember bloom — rose through coral through amber */
export const H_ANALOG_WARM_EMBER = [
    ROSE_SOFT,  ROSE_MID,
    CORAL_SOFT, CORAL_MID,
    AMBER_SOFT, AMBER_MID,
];

/** Bioluminescent cool — the palette for glowing alien flora */
export const H_ANALOG_BIOLUM_COOL = [
    MINT_SOFT, MINT_VIVID,
    CYAN_SOFT, CYAN_VIVID,
    AZURE_SOFT, AZURE_VIVID,
];

/** Bioluminescent warm — lure colors, danger signals, predator markings */
export const H_ANALOG_BIOLUM_WARM = [
    AMBER_SOFT, AMBER_VIVID, AMBER_WARM,
    CORAL_SOFT, CORAL_MID,
    ROSE_SOFT,
];

/** The violet-fuchsia twilight — alien sky colors, membrane tones */
export const H_ANALOG_TWILIGHT = [
    PERI_SOFT, VIOLET_PALE, VIOLET_SOFT,
    FUCHSIA_PALE, FUCHSIA_SOFT, ROSE_PALE,
];

/** Forest floor — naturalistic deep greens and teals */
export const H_ANALOG_FOREST_FLOOR = [
    JUNGLE_VOID, GREEN_DEEP, GREEN_VIVID,
    SEAFOAM_MID, TEAL_DEEP, TEAL_LIGHT,
];

/** Toxic spore — lime through yellow-green, noxious and beautiful */
export const H_ANALOG_TOXIC_SPORE = [
    LIME_MID, LIME_VIVID, LIME_DEEP,
    GREEN_MID, GREEN_VIVID,
];


// ═════════════════════════════════════════════════════════════════════════════
// PART IV — TRIADIC HARMONIES
// Three hues evenly spaced (~120° apart).
// Effect: dynamic full-spectrum balance — no color dominates.
// ═════════════════════════════════════════════════════════════════════════════

/** Primary alien triad: teal + violet + coral — the signature PaleBloom triad */
export const H_TRIADIC_ALIEN_PRIMARY = [
    MINT_SOFT,   TEAL_LIGHT,
    VIOLET_SOFT, VIOLET_MID,
    CORAL_SOFT,  CORAL_MID,
];

/** Secondary alien triad: cyan + rose + amber — warmer, more urgent */
export const H_TRIADIC_ALIEN_SECONDARY = [
    CYAN_SOFT,  CYAN_VIVID,
    ROSE_SOFT,  ROSE_MID,
    AMBER_SOFT, AMBER_MID,
];

/** Pastel dream triad: mint pale + violet pale + amber pale — soft and eerie */
export const H_TRIADIC_PASTEL_DREAM = [
    MINT_PALE,
    VIOLET_PALE,
    AMBER_PALE,
];

/** Toxic triad: lime + violet + coral — harsh, dangerous, vivid */
export const H_TRIADIC_TOXIC = [
    LIME_VIVID,
    VIOLET_VIVID,
    CORAL_VIVID,
];

/** Dark matter triad: void tones in triadic balance — for shadow/deep environments */
export const H_TRIADIC_DARK_MATTER = [
    TEAL_VOID,
    GRAPE_VOID,
    RUST_VOID,
];


// ═════════════════════════════════════════════════════════════════════════════
// PART V — SPLIT-COMPLEMENTARY
// A base hue + two colors flanking its complement.
// Effect: softer than pure complementary — still contrasting but less harsh.
// ═════════════════════════════════════════════════════════════════════════════

/** Teal base, split from coral: rose and amber flank the complement */
export const H_SPLIT_TEAL = [
    MINT_SOFT, MINT_VIVID, TEAL_LIGHT,   // base
    ROSE_SOFT, AMBER_SOFT,                // split flanks
];

/** Violet base, split from lime: amber and coral flank the complement */
export const H_SPLIT_VIOLET = [
    VIOLET_SOFT, VIOLET_MID,              // base
    AMBER_SOFT,  CORAL_SOFT,              // split flanks
];

/** Azure base, split from orange: coral and rose flank the complement */
export const H_SPLIT_AZURE = [
    AZURE_SOFT, AZURE_VIVID,              // base
    CORAL_SOFT, ROSE_SOFT,                // split flanks
];

/** Lime base, split from violet: azure and fuchsia flank the complement */
export const H_SPLIT_LIME = [
    LIME_SOFT, LIME_MID,                  // base
    AZURE_SOFT, FUCHSIA_SOFT,             // split flanks
];

/** Rose base, split from green: teal and lime flank the complement */
export const H_SPLIT_ROSE = [
    ROSE_SOFT,  ROSE_MID,                 // base
    TEAL_LIGHT, LIME_SOFT,                // split flanks
];


// ═════════════════════════════════════════════════════════════════════════════
// PART VI — TETRADIC / SQUARE
// Four hues evenly spaced (~90° apart).
// Effect: the richest, most complex harmony — use sparingly, let one hue lead.
// ═════════════════════════════════════════════════════════════════════════════

/** Dream square: teal + azure + rose + amber — the full PaleBloom emotional range */
export const H_TETRADIC_DREAM = [
    MINT_SOFT,  TEAL_LIGHT,
    AZURE_SOFT, AZURE_VIVID,
    ROSE_SOFT,  ROSE_MID,
    AMBER_SOFT, AMBER_MID,
];

/** Alien square: cyan + violet + coral + lime — maximum alien intensity */
export const H_TETRADIC_ALIEN = [
    CYAN_VIVID,
    VIOLET_VIVID,
    CORAL_VIVID,
    LIME_VIVID,
];

/** Pastel square: the four corners of the dream palette softened to pastels */
export const H_TETRADIC_PASTEL = [
    MINT_PALE,
    PERI_PALE,
    ROSE_PALE,
    AMBER_PALE,
];

/** Dark square: deep bark tones in tetradic balance — for environmental variety */
export const H_TETRADIC_DARK = [
    BARK_JUNGLE,
    BARK_VIOLET,
    BARK_RUST,
    BARK_OLIVE,
];


// ═════════════════════════════════════════════════════════════════════════════
// PART VII — SCENE-ROLE PALETTES
// Curated color pools for specific scene use-cases.
// These are the arrays to pass to pick() when building entities.
// ═════════════════════════════════════════════════════════════════════════════

/** All viable bioluminescent glow colors — soft enough to not oversaturate */
export const PALETTE_GLOW = [
    MINT_SOFT,    MINT_MID,
    CYAN_SOFT,    CYAN_VIVID,
    SEAFOAM_SOFT,
    AZURE_PALE,   AZURE_SOFT,
    VIOLET_SOFT,
    FUCHSIA_SOFT,
    ROSE_SOFT,
    CORAL_SOFT,
    AMBER_SOFT,   AMBER_MID,
    LIME_SOFT,    LIME_MID,
    GREEN_SOFT,
];

/** All viable bark / organic structure colors */
export const PALETTE_BARK = [
    BARK_JUNGLE, BARK_VIOLET, BARK_UMBER,
    BARK_SAPPHIRE, BARK_RUST, BARK_OLIVE,
    BARK_GRAPE,  BARK_MOSS,
];

/** Near-black void tones for backgrounds, deep shadow, fog */
export const PALETTE_VOID = [
    VOID_TEAL, VOID_CYAN, VOID_BLUE,
    VOID_VIOLET, VOID_ROSE,
    VOID_AMBER, VOID_GREEN,
];

/** Pastel range only — for dream sequences, memories, UI elements */
export const PALETTE_PASTEL = [
    MINT_PALE,  MINT_WHISPER,
    CYAN_PALE,
    SEAFOAM_PALE,
    AZURE_PALE,  AZURE_WHISPER,
    PERI_PALE,
    VIOLET_PALE, VIOLET_WHISPER,
    FUCHSIA_PALE,
    ROSE_PALE,   ROSE_WHISPER,
    CORAL_PALE,
    AMBER_PALE,  AMBER_WHISPER,
    LIME_PALE,
    GREEN_PALE,
    CREAM_WARM,
];

/** Vivid / fully-saturated range — warning signals, predator markings, spell effects */
export const PALETTE_VIVID = [
    MINT_VIVID,    CYAN_VIVID,
    AZURE_VIVID,   PERI_MID,
    VIOLET_VIVID,  FUCHSIA_MID,
    ROSE_VIVID,    CORAL_VIVID,
    AMBER_VIVID,   LIME_VIVID,
    GREEN_VIVID,
];

/** Warm-spectrum only — heat, danger, creature markings, lures */
export const PALETTE_WARM = [
    ROSE_SOFT,  ROSE_MID,
    CORAL_SOFT, CORAL_MID,  CORAL_VIVID,
    AMBER_SOFT, AMBER_MID,  AMBER_VIVID, AMBER_WARM,
    FUCHSIA_SOFT,
    LIME_SOFT,  LIME_MID,
];

/** Cool-spectrum only — atmosphere, water, sky, passive flora */
export const PALETTE_COOL = [
    MINT_SOFT,    MINT_VIVID,
    CYAN_SOFT,    CYAN_VIVID,
    SEAFOAM_SOFT, SEAFOAM_MID,
    AZURE_SOFT,   AZURE_VIVID,
    PERI_SOFT,
    VIOLET_SOFT,  VIOLET_MID,
];
