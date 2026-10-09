# 爱猫如爱人 · 每日食物计算器

按包装标注的代谢能，将每天的能量目标换算为干湿粮克数。原生 HTML、CSS 和 JavaScript，无依赖、无 CDN、无构建步骤；直接打开同目录 `index.html` 即可离线使用。

## 使用

1. 仅用于健康成年猫、理想体况、体重维护期。默认体重 4 kg，选择绝育状态，或输入已有 / 兽医给定的自定义 kcal/day 目标。
2. 填写零食每日总 kcal，选择干粮占主粮能量的 0-100%。先扣零食，再按能量分配干湿粮，比例不是重量比例。
3. 按包装分别录入干湿粮代谢能，独立选择 kcal/kg 或 kcal/100g。未参与配比的一方可留空；缺失标签应向厂商核实。
4. 价格选填，单位为元/kg。空白表示未填写；只有参与配比的价格都有效才显示合计成本。30 天按同一日量和单价估算，零食成本不计。
5. 显式点击计算后可复制每日方案；剪贴板受限时提供可手动选择的文本。任何输入变化都会使旧方案失效，需重新计算。手机端成功提交后定位到结果。
6. “填入演示数据”使用虚构名称、能量与价格，开始前请替换为包装标签；一键重置会同时清空干物质工具。

## 计算依据

- RER = 70 × 体重(kg)^0.75；健康成年猫维护期起点：已绝育 1.2 × RER，未绝育 1.4 × RER。任何计算只是起点，须根据体重、体况和实际响应与兽医调整。
- 主粮能量 = 每日目标 - 零食 kcal；分配后各自除以 kcal/g 得到 g/day。kcal/kg 除以 1000、kcal/100g 除以 100。
- 零食超过目标时阻止计算；超过目标 10% 提醒，等于目标时明确警告主粮为 0 g、不是完整日粮。日常零食尽量低于每日热量的 10%。
- 干物质数值换算 = as-fed % ÷ (100 - 水分%) × 100。仅作算术换算，不把保证分析 min/max 当作精确实测值，不判断营养达标。
- 显示值经过舍入，核心使用未舍入值；很小的正值用科学记数法避免显示为伪零。

公开来源（原文核对：2026-10-09）：

- [Merck Veterinary Manual：RER 与营养需求](https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals/nutritional-requirements-of-small-animals)
- [Merck Veterinary Manual：每日维护期能量](https://www.merckvetmanual.com/multimedia/table/daily-maintenance-energy-requirements-for-dogs-and-cats)
- [WSAVA：Feeding treats to your cat（PDF）](https://wsava.org/wp-content/uploads/2025/11/WSAVA_GuidetoTreats_Cats_251107.pdf)

## 数据与使用边界

没有真实品牌数据库，不估算缺失的包装代谢能，不核验输入标签的真伪。能量匹配不能证明日粮完整、营养达标或鲜食配方安全。本工具不提供幼猫、孕哺、患病和减重治疗处方。

输入仅在页面内存中处理，不上传、不主动保存，不使用 localStorage / sessionStorage。浏览器自身可能恢复表单，开始前请核对或重置；来源外链仅在主动点击时访问，不参与计算。

## 开发验证

开发源码保留无依赖 Node 测试，检查命令为 `node calculator.test.js` 与 `node app.test.js`；可另用 `node --check calculator.js`、`node --check app.js` 检查语法。公开静态包仅含页面、样式、两个运行脚本与本说明，不含开发测试和 QA 记录。

2026-10-09：10 组计算测试、7 组 DOM 契约 / 静态检查及语法检查通过。覆盖单位等价、能量守恒、配比边界、无效输入、零食超标、可选成本、干物质极值、复制兜底与手机提交定位。DOM 契约检查不是实际浏览器布局验收。

Hermes 实现初版，Codex 独立复核公式与计算、修订来源及手机提交体验。源码未包含账号或部署配置。
