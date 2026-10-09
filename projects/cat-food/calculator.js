/* Shared offline calculation core: browser global and Node CommonJS. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CatCalculator = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  class InputError extends Error {
    constructor(field, message) { super(message); this.field = field; }
  }
  function number(value, field, min = 0, max = Infinity, positive = false) {
    if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '')
      throw new InputError(field, '请填写数值。');
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))
      throw new InputError(field, '请输入有效的十进制数值。');
    const n = Number(value);
    if (!Number.isFinite(n)) throw new InputError(field, '请输入有限数值，不能为 NaN 或 Infinity。');
    if (n < min || n > max || (positive && n === 0))
      throw new InputError(field, positive ? '请输入大于 0 的数值。' : `请输入 ${min} 至 ${max === Infinity ? '有限正数' : max} 之间的数值。`);
    return n;
  }
  function finite(n, field) {
    if (!Number.isFinite(n) || (n === 0)) throw new InputError(field, '数值超出可计算范围，请调整输入。');
    return n;
  }
  function energyPerGram(value, unit, field = 'energy') {
    const n = number(value, field, 0, Infinity, true);
    if (!['kcal/kg', 'kcal/100g'].includes(unit)) throw new InputError(field, '请选择 kcal/kg 或 kcal/100g。');
    return finite(n / (unit === 'kcal/kg' ? 1000 : 100), field);
  }
  function target(input) {
    if (input.mode === 'custom') return { target: number(input.custom, 'custom', 0, Infinity, true), rer: null };
    if (input.mode !== 'formula') throw new InputError('mode', '请选择目标计算方式。');
    const kg = number(input.weight, 'weight', 0, Infinity, true);
    if (!['neutered', 'intact'].includes(input.status)) throw new InputError('status', '请选择绝育状态。');
    const rer = finite(70 * kg ** 0.75, 'weight');
    return { rer, target: finite(rer * (input.status === 'neutered' ? 1.2 : 1.4), 'weight') };
  }
  function calculate(input) {
    const t = target(input);
    const ratio = number(input.dryPct, 'dryPct', 0, 100);
    const treats = number(input.treats, 'treats');
    if (treats > t.target) throw new InputError('treats', `零食超过每日目标。请将零食降至不超过 ${String(t.target)} kcal/day，或核实并调整自定义目标；不要生成负克重。`);
    const remaining = t.target - treats;
    function food(kind, pct) {
      const data = input[kind] || {};
      const kcal = remaining * pct / 100;
      if (pct === 0 || remaining === 0) return { active: false, pct, kcal: 0, grams: 0, cost: null, costState: 'unused' };
      const density = energyPerGram(data.energy, data.unit, kind + 'Energy');
      const grams = finite(kcal / density, kind + 'Energy');
      const blank = data.price === undefined || data.price === null || (typeof data.price === 'string' && data.price.trim() === '');
      const price = blank ? null : number(data.price, kind + 'Price');
      const cost = price === null ? null : grams / 1000 * price;
      if (cost !== null && (!Number.isFinite(cost) || !Number.isFinite(cost * 30))) throw new InputError(kind + 'Price', '成本超出可计算范围，请调整输入。');
      return { active: true, pct, kcal, grams, cost, costState: blank ? 'missing' : 'provided' };
    }
    const dry = food('dry', ratio), wet = food('wet', 100 - ratio);
    const missing = [dry, wet].some(f => f.costState === 'missing');
    const dailyCost = missing ? null : (dry.cost || 0) + (wet.cost || 0);
    if (dailyCost !== null && (!Number.isFinite(dailyCost) || !Number.isFinite(dailyCost * 30))) throw new InputError('dryPrice', '合计成本超出可计算范围。');
    return { ...t, treats, remaining, dry, wet, treatPct: treats / t.target * 100,
      treatWarning: treats > t.target * 0.1, dailyCost, monthlyCost: dailyCost === null ? null : dailyCost * 30 };
  }
  function dryMatter(nutrient, moisture) {
    const m = number(moisture, 'moisture', 0, 100);
    if (m === 100) throw new InputError('moisture', '水分必须小于 100%。');
    const n = number(nutrient, 'nutrient');
    if (n > 100 - m) throw new InputError('nutrient', '营养素不能超过干物质份额（100 − 水分%）。请核对标签。');
    return n / (100 - m) * 100;
  }
  return { InputError, number, energyPerGram, target, calculate, dryMatter };
}));
