import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultBackground,
  defaultTicker,
  DURATION_MAX,
  DURATION_MIN,
  normalizeBackground,
  normalizeTicker,
  projectionVars,
  SCALE_MAX,
  SCALE_MIN,
  TICKER_MAX_LENGTH,
} from "./settings.ts";

test("un état sans réglages retombe sur les défauts", () => {
  assert.deepEqual(normalizeBackground(undefined), defaultBackground);
  assert.deepEqual(normalizeTicker(undefined), defaultTicker);
});

test("le fond conserve une image et ses réglages", () => {
  const source = { imageId: "fond-abc", opacity: 0.3, scale: 1.5 };
  assert.deepEqual(normalizeBackground(source), source);
});

test("les réglages du fond sont ramenés dans leur plage", () => {
  assert.equal(normalizeBackground({ opacity: 9 }).opacity, 1);
  assert.equal(normalizeBackground({ opacity: -2 }).opacity, 0);
  assert.equal(normalizeBackground({ scale: 99 }).scale, SCALE_MAX);
  assert.equal(normalizeBackground({ scale: 0.1 }).scale, SCALE_MIN);
});

test("un identifiant d'image invalide vaut fond noir", () => {
  assert.equal(normalizeBackground({ imageId: 42 as unknown as string }).imageId, null);
});

test("un bandeau sans texte est tenu pour éteint", () => {
  assert.equal(normalizeTicker({ enabled: true, text: "" }).enabled, false);
  assert.equal(normalizeTicker({ enabled: true, text: "   " }).enabled, false);
  assert.equal(normalizeTicker({ enabled: true, text: "Annonce" }).enabled, true);
});

test("le texte du bandeau est tronqué, pas rejeté", () => {
  const long = "a".repeat(TICKER_MAX_LENGTH + 200);
  assert.equal(normalizeTicker({ text: long }).text.length, TICKER_MAX_LENGTH);
});

test("la vitesse du bandeau reste dans sa plage", () => {
  assert.equal(normalizeTicker({ durationSec: 9999 }).durationSec, DURATION_MAX);
  assert.equal(normalizeTicker({ durationSec: 1 }).durationSec, DURATION_MIN);
  assert.equal(
    normalizeTicker({ durationSec: "vite" as unknown as number }).durationSec,
    defaultTicker.durationSec,
  );
});

test("les variables CSS reprennent les réglages de salle", () => {
  const vars = projectionVars(
    { imageId: "x", opacity: 0.6, scale: 1.2 },
    { enabled: true, text: "Annonce", durationSec: 40 },
  );
  assert.equal(vars["--fond-opacite"], "0.6");
  assert.equal(vars["--fond-echelle"], "1.2");
  assert.equal(vars["--bandeau-duree"], "40s");
});
