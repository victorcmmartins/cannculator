// js/app.js
// Camada de interface: lê o formulário, chama js/calculator.js (lógica pura)
// e escreve os resultados no DOM.
import { buildCustomStrain, calculateRecipe } from './calculator.js';

let strainsData = [];

const els = {
  sourceToggle: () => document.querySelector('input[name="sourceToggle"]:checked').value,
  unitToggle: () => document.querySelector('input[name="unitToggle"]:checked').value,
  dbSelection: document.getElementById('dbSelection'),
  customSelection: document.getElementById('customSelection'),
  strainInput: document.getElementById('strainInput'),
  strainOptions: document.getElementById('strainOptions'),
  strainDetails: document.getElementById('strainDetails'),
  customName: document.getElementById('customName'),
  customType: document.getElementById('customType'),
  customThc: document.getElementById('customThc'),
  customCbd: document.getElementById('customCbd'),
  customCbg: document.getElementById('customCbg'),
  targetVolume: document.getElementById('targetVolume'),
  targetConcentrationLabel: document.getElementById('targetConcentrationLabel'),
  targetConcentration: document.getElementById('targetConcentration'),
  form: document.getElementById('recipeForm'),
  errorBox: document.getElementById('formError'),
  results: document.getElementById('results'),
};

async function loadStrains() {
  try {
    const response = await fetch('data/strains_db.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    strainsData = await response.json();
    populateDatalist();
  } catch (error) {
    console.error('Erro ao carregar strains_db.json:', error);
    showError('Não foi possível carregar o banco de genéticas. Você ainda pode usar "Inserir Manualmente".');
  }
}

function populateDatalist() {
  els.strainOptions.innerHTML = '';
  const fragment = document.createDocumentFragment();
  strainsData.forEach((strain) => {
    const option = document.createElement('option');
    option.value = strain.name;
    fragment.appendChild(option);
  });
  els.strainOptions.appendChild(fragment);
}

function updateSourceUI() {
  const isCustom = els.sourceToggle() === 'custom';
  els.dbSelection.style.display = isCustom ? 'none' : 'block';
  els.customSelection.style.display = isCustom ? 'block' : 'none';
}

function updateUnitUI() {
  const isMgMl = els.unitToggle() === 'mgml';
  els.targetConcentrationLabel.textContent = isMgMl
    ? '4. Concentração Alvo Desejada (mg/mL):'
    : '4. Concentração Alvo Desejada (%):';
  els.targetConcentration.placeholder = isMgMl ? 'Ex: 50' : 'Ex: 5';
}

function renderStrainDetails() {
  const strainName = els.strainInput.value;
  const strain = strainsData.find((s) => s.name === strainName);

  if (!strain) {
    els.strainDetails.innerHTML = '';
    els.strainDetails.style.display = 'none';
    return;
  }

  let ratioTxt = 'Equilibrado';
  if (strain.cbd_avg > strain.thc_avg) {
    ratioTxt = `${(strain.cbd_avg / (strain.thc_avg || 0.1)).toFixed(0)}:1 (CBD:THC)`;
  } else if (strain.thc_avg > strain.cbd_avg) {
    ratioTxt = `1:${(strain.thc_avg / (strain.cbd_avg || 0.1)).toFixed(0)} (CBD:THC)`;
  }

  els.strainDetails.innerHTML = `
    <dl>
      <dt>Perfil</dt><dd>${escapeHtml(strain.type)}</dd>
      <dt>Ratio aprox.</dt><dd>${escapeHtml(ratioTxt)}</dd>
      <dt>THC médio</dt><dd>${strain.thc_avg}%</dd>
      <dt>CBD médio</dt><dd>${strain.cbd_avg}%</dd>
      <dt>CBG médio</dt><dd>${strain.cbg_avg}%</dd>
    </dl>`;
  els.strainDetails.style.display = 'block';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showError(message) {
  els.errorBox.textContent = message;
  els.errorBox.style.display = 'block';
}

function clearError() {
  els.errorBox.textContent = '';
  els.errorBox.style.display = 'none';
}

function getActiveStrain() {
  const isCustom = els.sourceToggle() === 'custom';

  if (isCustom) {
    return buildCustomStrain({
      name: els.customName.value,
      type: els.customType.value,
      thc: els.customThc.value,
      cbd: els.customCbd.value,
      cbg: els.customCbg.value,
    });
  }

  const strainName = els.strainInput.value;
  const strain = strainsData.find((s) => s.name === strainName);
  if (!strain) {
    throw new Error('Selecione uma genética válida da lista ou utilize "Inserir Manualmente".');
  }
  return strain;
}

function renderResults(result) {
  const set = (id, value) => {
    document.getElementById(id).textContent = value;
  };

  set('resName', result.strain.name);
  set('resType', result.strain.type);
  set('resVol', result.volumeMl);
  set('resMgMlInput', result.targetMgMl.toFixed(1));
  set('resGrams', result.requiredGrams.toFixed(2));
  set('resTcm', result.carrierOilMl.toFixed(1));
  set('resRatio', result.ratioText);
  set('resMgGota', result.mgPerDrop.toFixed(2));

  set('thcMl', result.profile.thc.mgMl.toFixed(2));
  set('thcTotal', result.profile.thc.totalMg.toFixed(0));
  set('cbdMl', result.profile.cbd.mgMl.toFixed(2));
  set('cbdTotal', result.profile.cbd.totalMg.toFixed(0));
  set('cbgMl', result.profile.cbg.mgMl.toFixed(2));
  set('cbgTotal', result.profile.cbg.totalMg.toFixed(0));

  const doseIds = { 10: ['vol10', 'gotas10'], 25: ['vol25', 'gotas25'], 50: ['vol50', 'gotas50'] };
  result.doseGuide.forEach((dose) => {
    const [volId, dropsId] = doseIds[dose.targetMg];
    set(volId, dose.volumeMl.toFixed(2));
    set(dropsId, dose.drops);
  });

  els.results.style.display = 'block';
  els.results.setAttribute('data-open', 'true');
  els.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleSubmit(event) {
  event.preventDefault();
  clearError();
  els.results.style.display = 'none';
  els.results.removeAttribute('data-open');

  try {
    const strain = getActiveStrain();
    const volumeMl = parseFloat(els.targetVolume.value);
    const rawConcentration = parseFloat(els.targetConcentration.value);
    const isMgMl = els.unitToggle() === 'mgml';

    const result = calculateRecipe({ strain, volumeMl, rawConcentration, isMgMl });
    renderResults(result);
  } catch (error) {
    showError(error.message);
  }
}

function init() {
  document.querySelectorAll('input[name="sourceToggle"]').forEach((el) => {
    el.addEventListener('change', updateSourceUI);
  });
  document.querySelectorAll('input[name="unitToggle"]').forEach((el) => {
    el.addEventListener('change', updateUnitUI);
  });
  els.strainInput.addEventListener('input', renderStrainDetails);
  els.form.addEventListener('submit', handleSubmit);

  updateSourceUI();
  updateUnitUI();
  loadStrains();
}

document.addEventListener('DOMContentLoaded', init);
