"use strict";

// 10 ml testers sold in the shop (src/data/testers.json, which the website
// uses too). A tester isn't a catalogue row: its id is its perfume's id plus
// TESTER_ID_OFFSET, and it is on sale whenever its perfume is. Every
// `bundleSize` testers in an order cost `bundlePrice` together and are saved
// as one "Tester set" line, so emails, invoices and packing show the set.

const config = require("../../src/data/testers.json");

const TESTER_ID_OFFSET = 1000000;

function isTesterId(id) {
  return Number.isInteger(id) && id > TESTER_ID_OFFSET;
}

function perfumeIdOf(testerId) {
  return testerId - TESTER_ID_OFFSET;
}

function testerName(perfumeName) {
  return `${perfumeName} · ${config.ml} ml tester`;
}

/**
 * Order lines for the testers in a bag: [{ product_id, perfume, qty }] →
 * { lines, paise }. Units are taken in bag order; every full group of
 * `bundleSize` becomes one set line at `bundlePrice` (when that is cheaper),
 * the rest stay single testers at `price`. product_id 0 marks a set line.
 */
function testerLines(testers) {
  const unitPaise = Math.round(config.price * 100);
  const setPaise = Math.round(config.bundlePrice * 100);
  const units = [];
  for (const tester of testers) for (let i = 0; i < tester.qty; i += 1) units.push(tester);
  const lines = [];
  let used = 0;
  if (setPaise < unitPaise * config.bundleSize) {
    for (; used + config.bundleSize <= units.length; used += config.bundleSize) {
      const group = units.slice(used, used + config.bundleSize);
      const counts = new Map();
      for (const unit of group) counts.set(unit.perfume, (counts.get(unit.perfume) || 0) + 1);
      const contents = [...counts].map(([name, qty]) => (qty > 1 ? `${name} ×${qty}` : name)).join(", ");
      lines.push({ product_id: 0, name: `Tester set (${config.bundleSize} × ${config.ml} ml): ${contents}`.slice(0, 250), price: setPaise / 100, qty: 1, set: true });
    }
  }
  const singles = new Map();
  for (const unit of units.slice(used)) {
    const line = singles.get(unit.product_id) || { product_id: unit.product_id, name: testerName(unit.perfume), price: unitPaise / 100, qty: 0 };
    line.qty += 1;
    singles.set(unit.product_id, line);
  }
  lines.push(...singles.values());
  const paise = lines.reduce((sum, line) => sum + Math.round(line.price * 100) * line.qty, 0);
  return { lines, paise };
}

module.exports = { TESTER_ID_OFFSET, isTesterId, perfumeIdOf, testerName, testerLines, testerConfig: config };
