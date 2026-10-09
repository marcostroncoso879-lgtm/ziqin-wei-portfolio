/* DOM only; calculation rules live in calculator.js. */
(function () {
  'use strict';
  const C = CatCalculator;
  const $ = id => document.getElementById(id);
  const form = $('calculator');
  const planFields = ['mode', 'weight', 'status', 'custom', 'treats', 'dryPct', 'freshPct', 'freshType', 'freshConfirmed', 'dryEnergy', 'wetEnergy', 'freshEnergy', 'dryPrice', 'wetPrice', 'freshPrice'];
  let plan = '';
  let revision = 0;
  const fmt = n => n !== 0 && Math.abs(n) < 0.05 ? n.toExponential(2) : n.toLocaleString('zh-CN', { maximumFractionDigits: 1, useGrouping: false });
  const money = n => n !== 0 && n < 0.005 ? n.toExponential(2) : n.toFixed(2);
  function input() {
    const data = {};
    for (const id of ['mode', 'weight', 'status', 'custom', 'treats', 'dryPct', 'freshPct', 'freshType']) data[id] = $(id).value;
    for (const kind of ['dry', 'wet', 'fresh']) data[kind] = { energy: $(kind + 'Energy').value, unit: $(kind + 'Unit').value, price: $(kind + 'Price').value };
    return data;
  }
  function clearErrors(ids) {
    for (const id of ids) {
      $(id).removeAttribute('aria-invalid');
      if ($(id + '-error')) $(id + '-error').textContent = '';
    }
  }
  function showError(error, focus) {
    const field = $(error.field);
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      $(error.field + '-error').textContent = '错误：' + error.message;
      if (focus) field.focus();
    }
  }
  function invalidate(message = '输入已更新，请重新计算每日方案。') {
    revision += 1;
    plan = '';
    $('result').textContent = message;
    $('copy').disabled = true;
    $('copy-fallback').hidden = true;
    $('plan-text').value = '';
    $('copy-status').textContent = '';
  }
  function preview() {
    const custom = $('mode').value === 'custom';
    $('formula-fields').hidden = custom;
    $('custom-field').hidden = !custom;
    for (const id of ['weight', 'status']) $(id).disabled = custom;
    $('custom').disabled = !custom;
    try {
      const t = C.target(input());
      $('target-preview').textContent = (t.rer === null ? '使用自定义目标：' : `RER ${fmt(t.rer)} kcal/day；参考起点：`) + fmt(t.target) + ' kcal/day';
    } catch (_) { $('target-preview').textContent = '目标尚未有效填写。'; }
    try {
      const t = C.target(input());
      const treats = C.number($('treats').value, 'treats');
      $('meal-preview').textContent = treats > t.target ? '零食超过每日目标，无法分配餐食能量。' : `扣除零食后可分配餐食能量：${fmt(t.target - treats)} kcal/day。`;
    } catch (_) { $('meal-preview').textContent = '可分配餐食能量：待有效填写目标与零食。'; }
    try {
      const allocation = C.ratios(input());
      $('wet-preview').textContent = `湿粮剩余餐食能量占比：${fmt(allocation.wetPct)}%。`;
    } catch (error) { $('wet-preview').textContent = '湿粮剩余占比：待修正。' + error.message; }
    const topper = $('freshType').value === 'topper';
    $('fresh-confirm-field').hidden = topper;
    $('freshConfirmed').disabled = topper;
    $('fresh-energy-label').textContent = topper ? '已知参考热量' : '包装标注代谢能';
    $('fresh-type-note').textContent = topper
      ? '普通熟肉加餐不是完整主食，不做自制完整配方；其热量与单独填写的零食合并计入加餐能量提醒。'
      : '完整均衡鲜食主食仅指由包装标签确认适用成年猫维护期的完整均衡商业主食。普通熟鸡肉、牛肉或食材不能自动视为完整主食。';
    $('fresh-energy-note').textContent = topper
      ? '肉种、部位、生熟状态与烹调方式会影响参考热量。只填写对应食物的已知参考值，不可套用或凭空估算。食物参考热量未必等同猫实际代谢能，所得克数是估算；本页不内置肉类热量表。'
      : '请输入对应产品包装的代谢能，不补算缺失标签。';
  }
  function add(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    $('result').appendChild(el);
  }
  function calculate(focus = true) {
    clearErrors(planFields);
    invalidate();
    preview();
    try {
      const r = C.calculate(input());
      if (r.fresh.active && r.freshType === 'complete' && !$('freshConfirmed').checked)
        throw new C.InputError('freshConfirmed', '请先按包装确认这是适用成年猫维护期的完整均衡商业鲜食主食；普通熟肉请选择“普通熟肉加餐”。');
      $('result').textContent = '';
      const lines = ['爱猫如爱人 · 每日参考方案'];
      if (!$('demo').hidden) { add('p', '演示数据，开始前请替换包装标签。', 'notice'); lines.push('演示数据，开始前请替换包装标签。'); }
      const targetLine = `每日目标 ${fmt(r.target)} kcal；单独填写的零食 ${fmt(r.treats)} kcal（目标的 ${fmt(r.treatPct)}%）；扣除零食后可分配餐食 ${fmt(r.remaining)} kcal。`;
      add('p', targetLine); lines.push(targetLine);
      for (const kind of ['dry', 'wet', 'fresh']) {
        const f = r[kind], title = kind === 'dry' ? '干粮' : kind === 'wet' ? '湿粮' : r.freshType === 'topper' ? '鲜食 / 普通熟肉加餐' : '鲜食 / 完整均衡鲜食主食';
        const name = $(kind + 'Name').value.trim();
        add('h3', title + (name ? ' / ' + name : ''));
        add('p', `${fmt(f.grams)} g / 天`, 'grams');
        const ratioLine = r.remaining === 0 ? '餐食无剩余能量，占比不适用。' : `占扣除零食后的餐食能量 ${fmt(f.pct)}%；占每日目标 ${fmt(f.kcal / r.target * 100)}%。`;
        const detail = `${fmt(f.kcal)} kcal / 天；${ratioLine}`;
        add('p', detail, 'hint');
        lines.push(`${title}${name ? '（' + name + '）' : ''}：${fmt(f.grams)} g/day，${detail}`);
        if (f.active) {
          const energyLine = `${kind === 'fresh' && r.freshType === 'topper' ? '已知参考热量' : '包装标注代谢能'}：${$(kind + 'Energy').value} ${$(kind + 'Unit').value}`;
          add('p', energyLine, 'hint'); lines.push('  ' + energyLine);
          if (kind === 'fresh' && r.freshType === 'topper') {
            const referenceNote = '熟肉克数按输入的参考热量估算；食物参考热量未必等同于猫实际代谢能。';
            add('p', referenceNote, 'hint'); lines.push(referenceNote);
          }
        } else if (kind === 'fresh') lines.push(`  能量未参与计算；所选单位：${$('freshUnit').value}`);
        const cost = f.costState === 'unused' ? '不参与计算' : f.costState === 'missing' ? '未填写' : money(f.cost) + ' 元/天';
        add('p', title + '成本：' + cost, 'hint'); lines.push(title + '成本：' + cost);
      }
      const costLine = r.dailyCost === null ? '食物合计成本：未填写（参与配比的价格未填全）。' : `食物成本：${money(r.dailyCost)} 元/天，${money(r.monthlyCost)} 元/30天。`;
      const costNote = '食物合计包括参与配比的干粮、湿粮、鲜食，不含单独填写的零食成本；30 天按相同用量与单价估算。';
      add('p', costLine, 'cost'); lines.push(costLine, costNote);
      add('p', costNote, 'hint');
      if (r.freshType === 'topper') {
        const extraLine = `熟肉加餐与单独填写的零食合计 ${fmt(r.extraKcal)} kcal/day，占每日目标 ${fmt(r.combinedExtraPct)}%。`;
        add('p', extraLine); lines.push(extraLine);
        if (r.extraWarning) {
          const warning = '合并加餐能量提醒：普通熟肉加餐 + 零食已超过每日目标的 10%，请减少合并加餐量。鲜食餐食占比不高也可能超出额度；这不是营养达标判断。';
          add('p', warning, 'notice'); lines.push(warning);
        }
      } else if (r.treatWarning) {
        const warning = '能量提醒：零食超过每日目标的 10%，日常零食尽量低于每日热量的 10%。此提醒不能判定完整营养。';
        add('p', warning, 'notice'); lines.push(warning);
      }
      if (r.remaining === 0) { add('p', '零食已占满目标，干粮、湿粮、鲜食餐食均为 0 g。这不是可用的完整日粮，请减少零食。', 'notice'); lines.push('零食占满目标，三类餐食均为 0 g，不是完整日粮。'); }
      lines.push('仅供健康成年猫理想体况维护期参考。公式只是起点；能量匹配不等于营养完整，请根据体况与兽医调整。');
      plan = lines.join('\n');
      $('copy').disabled = false;
      return true;
    } catch (error) {
      $('result').textContent = '未生成方案，请修正标有“错误”的输入后重新计算。';
      showError(error, focus);
      return false;
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (calculate() && typeof matchMedia === 'function' && matchMedia('(max-width: 800px)').matches) {
      const title = $('result-title');
      title.focus({ preventScroll: true });
      title.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  });
  for (const event of ['input', 'change']) form.addEventListener(event, () => { clearErrors(planFields); invalidate(); preview(); });
  form.addEventListener('reset', () => {
    setTimeout(() => {
      clearErrors(planFields.concat(['nutrient', 'moisture']));
      $('demo').hidden = true;
      $('freshPct').value = '0'; $('freshType').value = 'complete'; $('freshConfirmed').checked = false;
      for (const id of ['freshName', 'freshEnergy', 'freshPrice']) $(id).value = '';
      $('freshUnit').value = 'kcal/100g';
      $('nutrient').value = ''; $('moisture').value = ''; $('dm-result').textContent = ''; $('dm').open = false;
      invalidate('请先填入参与配比的食品能量（按对应类型的包装标签或已知参考值），再计算。未填写前不生成克重。'); preview();
    }, 0);
  });
  $('example').addEventListener('click', () => {
    const values = { mode: 'formula', weight: '4', status: 'neutered', custom: '', treats: '10', dryPct: '60', freshPct: '0', freshType: 'complete', freshName: '', freshEnergy: '', freshUnit: 'kcal/100g', freshPrice: '', dryName: '演示干粮（虚构）', dryEnergy: '4000', dryUnit: 'kcal/kg', dryPrice: '50', wetName: '演示湿粮（虚构）', wetEnergy: '100', wetUnit: 'kcal/100g', wetPrice: '40' };
    for (const [id, value] of Object.entries(values)) $(id).value = value;
    $('freshConfirmed').checked = false;
    $('demo').hidden = false; calculate(false);
  });
  $('copy').addEventListener('click', async () => {
    if (!plan) return;
    const text = plan, token = revision;
    $('plan-text').value = text;
    $('copy-fallback').hidden = false;
    try {
      await navigator.clipboard.writeText(text);
      if (token === revision) $('copy-status').textContent = '已复制。下方也可手动选择文本。';
    } catch (_) {
      if (token !== revision) return;
      $('copy-status').textContent = '当前环境不允许剪贴板，请选择下方文本手动复制。';
      $('plan-text').focus(); $('plan-text').select();
    }
  });
  $('dm-calculate').addEventListener('click', () => {
    clearErrors(['nutrient', 'moisture']);
    $('dm-result').textContent = '';
    try { $('dm-result').textContent = '标签数值换算结果：' + fmt(C.dryMatter($('nutrient').value, $('moisture').value)) + '%（干物质基）。不是实测值或达标结论。'; }
    catch (error) { $('dm-result').textContent = '未生成换算结果，请修正输入。'; showError(error, true); }
  });
  for (const id of ['nutrient', 'moisture']) $(id).addEventListener('input', () => { clearErrors(['nutrient', 'moisture']); $('dm-result').textContent = '输入已更新，请重新换算。'; });
  preview();
}());
