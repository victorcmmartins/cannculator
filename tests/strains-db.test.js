// tests/strains-db.test.js
// Garante que data/strains_db.json está bem formado antes do deploy.
// Executa com: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REQUIRED_FIELDS = ['id', 'name', 'type', 'thc_avg', 'cbd_avg', 'cbg_avg'];

test('strains_db.json: é um JSON válido e é um array não vazio', async () => {
  const raw = await readFile(new URL('../data/strains_db.json', import.meta.url), 'utf-8');
  const data = JSON.parse(raw);
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
});

test('strains_db.json: cada genética tem os campos obrigatórios e tipos corretos', async () => {
  const raw = await readFile(new URL('../data/strains_db.json', import.meta.url), 'utf-8');
  const data = JSON.parse(raw);

  for (const strain of data) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(field in strain, `Campo ausente "${field}" em ${JSON.stringify(strain)}`);
    }
    assert.equal(typeof strain.name, 'string');
    assert.ok(strain.name.trim().length > 0);
    assert.equal(typeof strain.thc_avg, 'number');
    assert.equal(typeof strain.cbd_avg, 'number');
    assert.equal(typeof strain.cbg_avg, 'number');
    assert.ok(strain.thc_avg >= 0, `thc_avg negativo em ${strain.name}`);
    assert.ok(strain.cbd_avg >= 0, `cbd_avg negativo em ${strain.name}`);
    assert.ok(strain.cbg_avg >= 0, `cbg_avg negativo em ${strain.name}`);
    assert.ok(
      strain.thc_avg + strain.cbd_avg + strain.cbg_avg > 0,
      `Soma de canabinoides zerada em ${strain.name}`
    );
  }
});

test('strains_db.json: não há "id" ou "name" duplicados', async () => {
  const raw = await readFile(new URL('../data/strains_db.json', import.meta.url), 'utf-8');
  const data = JSON.parse(raw);

  const ids = data.map((s) => s.id);
  const names = data.map((s) => s.name);
  assert.equal(new Set(ids).size, ids.length, 'Existem ids duplicados em strains_db.json');
  assert.equal(new Set(names).size, names.length, 'Existem nomes duplicados em strains_db.json');
});
