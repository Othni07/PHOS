import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appearanceVars,
  defaultAppearance,
  fontStack,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  normalizeAppearance,
  TRANSITION_MAX,
  TRANSITION_MIN,
} from "./appearance.ts";

test("un état sans apparence retombe sur les défauts", () => {
  assert.deepEqual(normalizeAppearance(undefined), defaultAppearance);
  assert.deepEqual(normalizeAppearance({}), defaultAppearance);
});

test("les valeurs valides sont conservées", () => {
  const source = {
    fontId: "georgia",
    fontScale: 1.4,
    bandOpacity: 0.5,
    transitionMs: 700,
  };
  assert.deepEqual(normalizeAppearance(source), source);
});

test("une police inconnue ne casse pas l'affichage", () => {
  assert.equal(normalizeAppearance({ fontId: "comic-sans-2000" }).fontId, "system");
});

test("les valeurs hors bornes sont ramenées dans la plage", () => {
  assert.equal(normalizeAppearance({ fontScale: 99 }).fontScale, FONT_SCALE_MAX);
  assert.equal(normalizeAppearance({ fontScale: 0 }).fontScale, FONT_SCALE_MIN);
  assert.equal(normalizeAppearance({ bandOpacity: 5 }).bandOpacity, 1);
  assert.equal(normalizeAppearance({ bandOpacity: -3 }).bandOpacity, 0);
});

test("une valeur non numérique ne vide pas l'écran", () => {
  const from = normalizeAppearance({
    fontScale: "grand" as unknown as number,
    bandOpacity: Number.NaN,
  });
  assert.equal(from.fontScale, defaultAppearance.fontScale);
  assert.equal(from.bandOpacity, defaultAppearance.bandOpacity);
});

test("fontStack retombe sur la police système si l'identifiant est inconnu", () => {
  assert.equal(fontStack("inexistante"), fontStack("system"));
});

test("les variables CSS reprennent les réglages", () => {
  const vars = appearanceVars({
    fontId: "arial",
    fontScale: 1.5,
    bandOpacity: 0.4,
    transitionMs: 300,
  });
  assert.equal(vars["--overlay-scale"], "1.5");
  assert.equal(vars["--overlay-band-opacity"], "0.4");
  assert.match(vars["--overlay-font"], /Arial/);
  assert.equal(vars["--overlay-transition"], "300ms");
});

test("la durée des fondus est ramenée dans sa plage", () => {
  assert.equal(normalizeAppearance({ transitionMs: 99999 }).transitionMs, TRANSITION_MAX);
  assert.equal(normalizeAppearance({ transitionMs: -5 }).transitionMs, TRANSITION_MIN);
  assert.equal(
    normalizeAppearance({ transitionMs: "lent" as unknown as number }).transitionMs,
    defaultAppearance.transitionMs,
  );
});
