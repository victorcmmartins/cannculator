// js/calculator.js
// Lógica pura de cálculo da receita de extração.
// Sem nenhuma referência ao DOM: isso permite testar o módulo diretamente
// no Node.js (ver tests/calculator.test.js) e reutilizá-lo em outros lugares.

export const EFFICIENCY_PERCENT = 80; // eficiência média de extração caseira com solvente
export const DROPS_PER_ML = 20; // gotas por mL (conta-gotas padrão)
export const FALLBACK_TRACE_PERCENT = 0.5; // traço mínimo assumido p/ genéticas manuais
export const PERCENT_TO_MGML = 10; // 1% de canabinoide equivale a 10 mg/mL

/**
 * Normaliza um valor de cannabinoide informado manualmente.
 * Valores ausentes, inválidos ou zerados viram o traço mínimo (0.5%),
 * já que mesmo genéticas "puras" mantêm concentrações residuais de outros
 * canabinoides.
 * @param {number|string|undefined} raw
 * @returns {number}
 */
export function normalizeManualCannabinoid(raw) {
  const value = parseFloat(raw);
  if (Number.isNaN(value) || value <= 0) {
    return FALLBACK_TRACE_PERCENT;
  }
  return value;
}

/**
 * Constrói o objeto de genética a partir dos campos de inserção manual.
 * @param {{name?: string, type: string, thc?: number|string, cbd?: number|string, cbg?: number|string}} fields
 */
export function buildCustomStrain(fields) {
  const name = (fields.name || '').trim();
  return {
    name: name !== '' ? name : 'Genética Personalizada',
    type: fields.type,
    thc_avg: normalizeManualCannabinoid(fields.thc),
    cbd_avg: normalizeManualCannabinoid(fields.cbd),
    cbg_avg: normalizeManualCannabinoid(fields.cbg),
  };
}

/**
 * Converte uma concentração informada (mg/mL ou %) para mg/mL.
 * @param {number} rawConcentration
 * @param {boolean} isMgMl
 */
export function toMgMl(rawConcentration, isMgMl) {
  return isMgMl ? rawConcentration : rawConcentration * PERCENT_TO_MGML;
}

/**
 * Formata o ratio CBD:THC como texto legível.
 * @param {number} cbdMgMl
 * @param {number} thcMgMl
 */
export function formatRatio(cbdMgMl, thcMgMl) {
  if (cbdMgMl > thcMgMl) {
    return `${(cbdMgMl / (thcMgMl || 0.1)).toFixed(1)} : 1 (CBD:THC)`;
  }
  if (thcMgMl > cbdMgMl) {
    return `1 : ${(thcMgMl / (cbdMgMl || 0.1)).toFixed(1)} (CBD:THC)`;
  }
  return '1 : 1 (CBD:THC)';
}

/**
 * Calcula volume (mL) e nº de gotas necessários para atingir uma dose alvo (mg).
 * @param {number} targetMg
 * @param {number} targetMgMl
 * @param {number} mgPerDrop
 */
export function calcDose(targetMg, targetMgMl, mgPerDrop) {
  const volumeMl = targetMg / targetMgMl;
  const drops = targetMg / mgPerDrop;
  return { volumeMl, drops: Math.round(drops) };
}

/**
 * @typedef {Object} Strain
 * @property {string} name
 * @property {string} type
 * @property {number} thc_avg
 * @property {number} cbd_avg
 * @property {number} cbg_avg
 */

/**
 * @typedef {Object} RecipeInput
 * @property {Strain} strain
 * @property {number} volumeMl - volume final do frasco (mL)
 * @property {number} rawConcentration - concentração alvo, na unidade escolhida
 * @property {boolean} isMgMl - true se rawConcentration já está em mg/mL
 * @property {number} [efficiencyPercent]
 * @property {number} [dropsPerMl]
 */

/**
 * Calcula a receita completa de extração e o perfil farmacológico estimado.
 * Lança um Error com mensagem amigável em caso de entrada inválida.
 * @param {RecipeInput} input
 */
export function calculateRecipe(input) {
  const {
    strain,
    volumeMl,
    rawConcentration,
    isMgMl,
    efficiencyPercent = EFFICIENCY_PERCENT,
    dropsPerMl = DROPS_PER_ML,
  } = input;

  if (!strain) {
    throw new Error('Genética inválida ou não selecionada.');
  }
  if (!Number.isFinite(volumeMl) || volumeMl <= 0) {
    throw new Error('Volume do frasco deve ser um número maior que zero.');
  }
  if (!Number.isFinite(rawConcentration) || rawConcentration <= 0) {
    throw new Error('Concentração alvo deve ser um número maior que zero.');
  }

  const targetMgMl = toMgMl(rawConcentration, isMgMl);

  const totalStrainPercent = strain.thc_avg + strain.cbd_avg + strain.cbg_avg;
  if (totalStrainPercent <= 0) {
    throw new Error('Perfil de canabinoides da genética é inválido (soma zero).');
  }

  const totalMgRequired = targetMgMl * volumeMl;
  const mgPerGramYield = (totalStrainPercent / 100) * 1000 * (efficiencyPercent / 100);
  const requiredGrams = totalMgRequired / mgPerGramYield;

  const thcMgMl = (strain.thc_avg / totalStrainPercent) * targetMgMl;
  const cbdMgMl = (strain.cbd_avg / totalStrainPercent) * targetMgMl;
  const cbgMgMl = (strain.cbg_avg / totalStrainPercent) * targetMgMl;
  const mgPerDrop = targetMgMl / dropsPerMl;

  const doseTargetsMg = [10, 25, 50];
  const doseGuide = doseTargetsMg.map((targetMg) => ({
    targetMg,
    ...calcDose(targetMg, targetMgMl, mgPerDrop),
  }));

  return {
    strain,
    volumeMl,
    targetMgMl,
    requiredGrams,
    carrierOilMl: volumeMl,
    ratioText: formatRatio(cbdMgMl, thcMgMl),
    mgPerDrop,
    profile: {
      thc: { mgMl: thcMgMl, totalMg: thcMgMl * volumeMl },
      cbd: { mgMl: cbdMgMl, totalMg: cbdMgMl * volumeMl },
      cbg: { mgMl: cbgMgMl, totalMg: cbgMgMl * volumeMl },
    },
    doseGuide,
  };
}
