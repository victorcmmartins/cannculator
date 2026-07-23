// tests/calculator.test.js
// Executa com: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeManualCannabinoid,
  buildCustomStrain,
  toMgMl,
  formatRatio,
  calcDose,
  calculateRecipe,
  FALLBACK_TRACE_PERCENT,
} from '../js/calculator.js';

test('normalizeManualCannabinoid: valores vazios/zero/NaN viram o traço mínimo', () => {
  assert.equal(normalizeManualCannabinoid(undefined), FALLBACK_TRACE_PERCENT);
  assert.equal(normalizeManualCannabinoid(''), FALLBACK_TRACE_PERCENT);
  assert.equal(normalizeManualCannabinoid('0'), FALLBACK_TRACE_PERCENT);
  assert.equal(normalizeManualCannabinoid(-5), FALLBACK_TRACE_PERCENT);
  assert.equal(normalizeManualCannabinoid('abc'), FALLBACK_TRACE_PERCENT);
});

test('normalizeManualCannabinoid: valores válidos são preservados', () => {
  assert.equal(normalizeManualCannabinoid('18.5'), 18.5);
  assert.equal(normalizeManualCannabinoid(1), 1);
});

test('buildCustomStrain: usa nome padrão quando vazio e aplica fallback nos canabinoides', () => {
  const strain = buildCustomStrain({ name: '  ', type: 'Híbrida', thc: 0, cbd: '12', cbg: undefined });
  assert.equal(strain.name, 'Genética Personalizada');
  assert.equal(strain.type, 'Híbrida');
  assert.equal(strain.thc_avg, FALLBACK_TRACE_PERCENT);
  assert.equal(strain.cbd_avg, 12);
  assert.equal(strain.cbg_avg, FALLBACK_TRACE_PERCENT);
});

test('toMgMl: converte porcentagem para mg/mL (1% = 10 mg/mL) e mantém mg/mL intacto', () => {
  assert.equal(toMgMl(5, false), 50);
  assert.equal(toMgMl(50, true), 50);
});

test('formatRatio: identifica corretamente predominância de CBD, THC ou equilíbrio', () => {
  assert.equal(formatRatio(20, 2), '10.0 : 1 (CBD:THC)');
  assert.equal(formatRatio(2, 20), '1 : 10.0 (CBD:THC)');
  assert.equal(formatRatio(5, 5), '1 : 1 (CBD:THC)');
});

test('calcDose: calcula volume e gotas para uma dose alvo', () => {
  const result = calcDose(25, 50, 2.5); // 50 mg/mL, 2.5 mg/gota
  assert.equal(result.volumeMl, 0.5);
  assert.equal(result.drops, 10);
});

test('calculateRecipe: caso de referência com ACDC-like (CBD 18%, THC 1%, CBG 1%)', () => {
  const strain = { name: 'ACDC', type: 'Sativa-dominant', thc_avg: 1, cbd_avg: 18, cbg_avg: 1 };
  const result = calculateRecipe({
    strain,
    volumeMl: 30,
    rawConcentration: 50, // mg/mL
    isMgMl: true,
  });

  // total mg necessário = 50 * 30 = 1500mg
  // rendimento por grama = (20/100)*1000*0.8 = 160 mg/g
  // gramas = 1500 / 160 = 9.375
  assert.ok(Math.abs(result.requiredGrams - 9.375) < 1e-9);
  assert.equal(result.carrierOilMl, 30);
  assert.equal(result.targetMgMl, 50);
  assert.ok(result.ratioText.includes('CBD:THC'));
  assert.equal(result.doseGuide.length, 3);
  assert.equal(result.doseGuide[0].targetMg, 10);
});

test('calculateRecipe: converte corretamente quando a unidade é %', () => {
  const strain = { name: 'Teste', type: 'Híbrida', thc_avg: 10, cbd_avg: 10, cbg_avg: 0.5 };
  const result = calculateRecipe({
    strain,
    volumeMl: 10,
    rawConcentration: 5, // 5% -> 50 mg/mL
    isMgMl: false,
  });
  assert.equal(result.targetMgMl, 50);
});

test('calculateRecipe: rejeita volume inválido', () => {
  const strain = { name: 'Teste', type: 'Híbrida', thc_avg: 10, cbd_avg: 10, cbg_avg: 0.5 };
  assert.throws(
    () => calculateRecipe({ strain, volumeMl: 0, rawConcentration: 10, isMgMl: true }),
    /Volume do frasco/
  );
  assert.throws(
    () => calculateRecipe({ strain, volumeMl: NaN, rawConcentration: 10, isMgMl: true }),
    /Volume do frasco/
  );
});

test('calculateRecipe: rejeita concentração inválida', () => {
  const strain = { name: 'Teste', type: 'Híbrida', thc_avg: 10, cbd_avg: 10, cbg_avg: 0.5 };
  assert.throws(
    () => calculateRecipe({ strain, volumeMl: 30, rawConcentration: 0, isMgMl: true }),
    /Concentração alvo/
  );
});

test('calculateRecipe: rejeita ausência de genética', () => {
  assert.throws(
    () => calculateRecipe({ strain: null, volumeMl: 30, rawConcentration: 10, isMgMl: true }),
    /Genética inválida/
  );
});
