import { useMemo, useState } from 'react'

type PlanKind = 'listing' | 'aplus'

type PlanCard = {
  slot: string
  title: string
  kind: PlanKind
  objective: string
  composition: string
  onImageCopy: string
  prompt: string
  negativePrompt: string
  risks: string[]
}

type ApiConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

type ProductDraft = {
  title: string
  bullets: string
  facts: string
  brand: string
  audience: string
  style: string
  forbidden: string
}

const API_CONFIG_STORAGE_KEY = 'amazon-planner-lite-api-config'

const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: '',
}

const DEFAULT_DRAFT: ProductDraft = {
  title: '49/54/62 Inch Large Folding Golf Umbrella',
  bullets: [
    'Large folding umbrella for 2-3 people, compact when closed.',
    'Double canopy windproof structure.',
    'Waterproof 210T pongee fabric, quick drying.',
    'Automatic open and close button.',
    'Fiberglass ribs and tips, flexible and durable.',
  ].join('\n'),
  facts: 'Product color: black. Product type: large folding umbrella. Key parts: double canopy, handle button, ribs, compact folded body. Package includes 1 umbrella.',
  brand: 'Your Brand',
  audience: 'Amazon US shoppers who need a reliable travel umbrella for rain and wind.',
  style: 'Clean premium Amazon gallery style, photorealistic product rendering, consistent lighting, mobile-readable English callouts.',
  forbidden: 'Do not add unprovided certifications, warranty claims, Amazon badges, Prime logos, reviews, discounts, medical claims, or competitor branding.',
}

const LISTING_BLUEPRINTS = [
  {
    slot: 'MAIN',
    title: '主图',
    objective: '清晰展示产品整体外观，符合 Amazon 主图规范。',
    composition: '纯白背景，产品居中，展示完整展开状态或最能代表产品的标准角度，画面占比 85% 以上。',
    onImageCopy: '',
    risk: '主图不能加文字、图标、场景道具、边框、夸张效果或未提供配件。',
  },
  {
    slot: 'PT01',
    title: '核心卖点图',
    objective: '用第一张附图讲清最强购买理由。',
    composition: '产品大图 + 2-3 个简洁英文卖点，用清晰层级突出核心利益点。',
    onImageCopy: 'Windproof Double Canopy\nBuilt for Heavy Rain',
    risk: '英文卖点必须和 Listing 信息一致，不能夸大防风、防水或质保能力。',
  },
  {
    slot: 'PT02',
    title: '功能结构图',
    objective: '解释关键功能、结构或使用方式。',
    composition: '产品局部结构放大，配少量箭头或线框标注，突出用户最关心的功能点。',
    onImageCopy: 'Auto Open / Close\nReinforced Frame',
    risk: '结构、按钮、部件数量必须和实拍一致，不要生成不存在的结构。',
  },
  {
    slot: 'PT03',
    title: '使用场景图',
    objective: '让买家看到真实使用情境和比例。',
    composition: '生活场景中展示产品使用状态，人物或环境不抢主体，产品保持清晰可辨。',
    onImageCopy: 'Travel Ready\nFor Daily Rain Protection',
    risk: '场景要真实，不能暗示产品没有提供的极端性能或专业认证。',
  },
  {
    slot: 'PT04',
    title: '尺寸细节图',
    objective: '表达尺寸、收纳状态、细节或配件。',
    composition: '展开状态和收纳状态并列，配尺寸线、局部细节图和简洁英文标签。',
    onImageCopy: 'Compact When Folded\nLarge Coverage When Open',
    risk: '所有尺寸数字必须来自用户提供资料；不确定时只写可核对表达。',
  },
  {
    slot: 'PT05',
    title: '材质对比图',
    objective: '说明材质、工艺、耐用性或差异化。',
    composition: '材质纹理特写 + 产品整体小图 + 简洁对比信息，保持商业质感。',
    onImageCopy: 'Water-Resistant Fabric\nDurable Fiberglass Ribs',
    risk: '材质名称、耐用性表达和对比对象必须可证实，不要虚构实验数据。',
  },
  {
    slot: 'PT06',
    title: '包装组合图',
    objective: '展示包装、配件、套装数量或最终使用效果。',
    composition: '产品、收纳袋、包装或配件平铺展示，信息清楚，视觉统一。',
    onImageCopy: 'What You Get\nReady for Travel',
    risk: '包装数量和配件必须准确，不要添加未提供的赠品。',
  },
]

const APLUS_BLUEPRINTS = [
  {
    slot: 'A+01',
    title: '品牌首屏横幅',
    objective: '建立品牌第一印象和产品核心利益点。',
    composition: '宽幅横图，产品置于清晰场景中，品牌名和一句核心价值主张作为主视觉。',
    onImageCopy: 'Reliable Protection, Anywhere',
    risk: '不要虚构品牌历史、奖项或认证。',
  },
  {
    slot: 'A+02',
    title: '核心卖点模块',
    objective: '强化最重要的购买理由。',
    composition: '产品主视觉 + 3 个卖点分区，适合移动端阅读。',
    onImageCopy: 'Windproof Design\nWater-Resistant Fabric\nCompact Storage',
    risk: '卖点数量少而准，不要堆满长文案。',
  },
  {
    slot: 'A+03',
    title: '功能结构模块',
    objective: '解释产品为什么好用。',
    composition: '结构拆解或局部放大，使用干净线条连接关键部位。',
    onImageCopy: 'Details That Matter',
    risk: '拆解结构不能和真实产品冲突。',
  },
  {
    slot: 'A+04',
    title: '场景模块',
    objective: '展示目标用户的真实使用画面。',
    composition: '生活方式场景，产品清楚可见，画面氛围和目标人群匹配。',
    onImageCopy: 'Made for Commutes, Trips, and Everyday Rain',
    risk: '不要暗示不适用或不可验证的极端环境。',
  },
  {
    slot: 'A+05',
    title: '信任与购买理由模块',
    objective: '收束购买理由，降低疑虑。',
    composition: '产品细节、包装或对比式布局，强调真实材质、易用性和适用场景。',
    onImageCopy: 'A Practical Choice for Everyday Weather',
    risk: '不添加星级、排名、Best Seller、Prime、价格或虚假背书。',
  },
]

function loadApiConfig(): ApiConfig {
  try {
    const raw = window.localStorage.getItem(API_CONFIG_STORAGE_KEY)
    if (!raw) return DEFAULT_API_CONFIG
    const parsed = JSON.parse(raw) as Partial<ApiConfig>
    return {
      ...DEFAULT_API_CONFIG,
      ...parsed,
      baseUrl: parsed.baseUrl?.trim() || DEFAULT_API_CONFIG.baseUrl,
    }
  } catch {
    return DEFAULT_API_CONFIG
  }
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function compactLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function clean(value: string, fallback: string) {
  return value.trim() || fallback
}

function buildPrompt(options: {
  draft: ProductDraft
  slot: string
  title: string
  kind: PlanKind
  objective: string
  composition: string
  onImageCopy: string
}) {
  const title = clean(options.draft.title, 'the provided Amazon product')
  const bullets = compactLines(options.draft.bullets).join(' | ') || 'No bullet points provided.'
  const brand = clean(options.draft.brand, 'the provided brand')
  const facts = clean(options.draft.facts, 'Use only the product details provided by the user.')
  const audience = clean(options.draft.audience, 'Amazon US shoppers')
  const style = clean(options.draft.style, 'Clean premium Amazon gallery style, photorealistic, high resolution.')
  const forbidden = clean(options.draft.forbidden, 'Do not add unprovided claims, certifications, logos, badges, reviews, or competitor branding.')
  const copy = options.onImageCopy.trim()
    ? `Use short, mobile-readable US-English on-image copy only: "${options.onImageCopy.replace(/\n/g, ' / ')}".`
    : 'No on-image text.'
  const mainGuard = options.slot === 'MAIN'
    ? 'Main image compliance: on a seamless pure white background RGB 255, 255, 255, professional studio lighting, product takes up 85% of the frame, no text, no icons, no props, high resolution, photorealistic.'
    : ''
  const aspect = options.kind === 'aplus'
    ? 'wide Amazon A+ banner composition, 16:6 or 970x600 friendly layout'
    : 'square Amazon listing gallery composition, 1:1 friendly layout'

  return [
    `Create ${options.slot} - ${options.title} for Amazon US listing.`,
    `Product: ${title}.`,
    `Listing bullet points: ${bullets}`,
    `Brand: ${brand}.`,
    `Audience: ${audience}.`,
    `Verified product facts: ${facts}`,
    `Image objective: ${options.objective}`,
    `Composition: ${options.composition}`,
    copy,
    `Visual style: ${style}`,
    `Format: ${aspect}, premium commercial product photography, realistic materials, clean hierarchy, sharp details, high resolution.`,
    mainGuard,
    `Restrictions: ${forbidden}`,
  ].filter(Boolean).join('\n')
}

function buildPlans(draft: ProductDraft, includeAPlus: boolean): PlanCard[] {
  const sharedRisks = compactLines(draft.forbidden).slice(0, 3)
  const listingPlans = LISTING_BLUEPRINTS.map((item) => ({
    ...item,
    kind: 'listing' as const,
    risks: [item.risk, '核对产品外观、颜色、结构、尺寸、材质和包装数量。', ...sharedRisks],
    negativePrompt: 'No Amazon logo, no Prime badge, no reviews, no star rating, no price tag, no fake certification, no competitor brand, no distorted product, no unreadable text, no exaggerated claims.',
    prompt: buildPrompt({ draft, kind: 'listing', ...item }),
  }))
  const aplusPlans = APLUS_BLUEPRINTS.map((item) => ({
    ...item,
    kind: 'aplus' as const,
    risks: [item.risk, 'A+ 文案和视觉要服务一个明确模块目标，不要堆信息。', ...sharedRisks],
    negativePrompt: 'No Amazon logo, no Prime badge, no reviews, no star rating, no price tag, no fake certification, no competitor brand, no medical or unsafe claims, no cluttered typography.',
    prompt: buildPrompt({ draft, kind: 'aplus', ...item }),
  }))
  return includeAPlus ? [...listingPlans, ...aplusPlans] : listingPlans
}

function buildAiPlannerPrompt(draft: ProductDraft, includeAPlus: boolean) {
  return [
    '你是 Amazon US 高级产品视觉总监兼合规审核员。请基于用户资料输出亚马逊图片策划。',
    '必须返回严格 JSON，不要 Markdown，不要代码围栏。',
    'JSON 结构：{ "cards": [ { "slot": "MAIN", "title": "主图", "kind": "listing", "objective": "...", "composition": "...", "onImageCopy": "", "prompt": "...", "negativePrompt": "...", "risks": ["..."] } ] }',
    '',
    '策划范围：',
    '- Listing 必须输出 7 张：MAIN、PT01、PT02、PT03、PT04、PT05、PT06。',
    includeAPlus ? '- A+ 必须额外输出 5 张：A+01、A+02、A+03、A+04、A+05。' : '- 不要输出 A+，只输出 Listing 7 张。',
    '',
    '规则：',
    '- MAIN 主图必须纯白底、无文字、无图标、无道具，商品占画面 85%+。',
    '- 每张图都要有完整英文生图 Prompt，能直接复制给生图模型。',
    '- prompt 必须包含产品事实、构图、视觉风格、画面文案要求和限制。',
    '- risks 用中文，列出人工必须核对的风险点。',
    '- 不添加用户没有提供的认证、专利、奖项、Amazon/Prime 标志、评价、价格、排名或竞品品牌。',
    '- kind 只能是 listing 或 aplus。',
    '',
    '用户资料：',
    `产品标题：${draft.title}`,
    `五点描述：${draft.bullets}`,
    `产品事实：${draft.facts}`,
    `品牌：${draft.brand}`,
    `目标人群：${draft.audience}`,
    `视觉风格：${draft.style}`,
    `禁用/风险限制：${draft.forbidden}`,
  ].join('\n')
}

function normalizeCards(value: unknown): PlanCard[] {
  const rawCards = Array.isArray((value as { cards?: unknown[] })?.cards)
    ? (value as { cards: unknown[] }).cards
    : []

  return rawCards
    .map((card, index) => {
      const item = card as Partial<Record<keyof PlanCard, unknown>>
      const slot = String(item.slot || `IMG${index + 1}`).trim()
      const kind = item.kind === 'aplus' ? 'aplus' : 'listing'
      return {
        slot,
        title: String(item.title || slot).trim(),
        kind,
        objective: String(item.objective || '').trim(),
        composition: String(item.composition || '').trim(),
        onImageCopy: String(item.onImageCopy || '').trim(),
        prompt: String(item.prompt || '').trim(),
        negativePrompt: String(item.negativePrompt || 'No Amazon logo, no Prime badge, no reviews, no star rating, no price tag, no fake certification, no competitor brand.').trim(),
        risks: Array.isArray(item.risks)
          ? item.risks.map((risk) => String(risk).trim()).filter(Boolean)
          : ['核对产品事实、文案、尺寸、材质和合规风险。'],
      } satisfies PlanCard
    })
    .filter((card) => card.slot && card.prompt)
}

function extractJsonObject(text: string) {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const match = trimmed.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 没有返回可解析的 JSON。')
  return match[0]
}

async function callPlannerApi(config: ApiConfig, draft: ProductDraft, includeAPlus: boolean) {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')
  const model = config.model.trim()
  const apiKey = config.apiKey.trim()

  if (!baseUrl) throw new Error('请填写 API Base URL。')
  if (!model) throw new Error('请填写策划模型。')
  if (!apiKey) throw new Error('请填写 API Key。')

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You output strict JSON only. Do not use markdown fences.' },
        { role: 'user', content: buildAiPlannerPrompt(draft, includeAPlus) },
      ],
    }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `${response.status} ${response.statusText}`
    throw new Error(`AI 策划失败：${message}`)
  }

  const content = payload?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('AI 响应缺少 message.content。')
  const parsed = JSON.parse(extractJsonObject(content))
  const cards = normalizeCards(parsed)
  if (!cards.length) throw new Error('AI 返回了 JSON，但没有有效策划卡片。')
  return cards
}

function formatPlanForCopy(plan: PlanCard) {
  return [
    `【${plan.slot}｜${plan.title}】`,
    `用途：${plan.objective}`,
    `构图：${plan.composition}`,
    `画面文案：${plan.onImageCopy || '无，主图不加文字'}`,
    '',
    '英文生图 Prompt：',
    plan.prompt,
    '',
    'Negative Prompt：',
    plan.negativePrompt,
    '',
    '人工核对风险点：',
    ...plan.risks.map((risk) => `- ${risk}`),
  ].join('\n')
}

export default function App() {
  const [draft, setDraft] = useState<ProductDraft>(DEFAULT_DRAFT)
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => loadApiConfig())
  const [showApiModal, setShowApiModal] = useState(false)
  const [includeAPlus, setIncludeAPlus] = useState(true)
  const [activeKind, setActiveKind] = useState<'all' | PlanKind>('all')
  const [copiedKey, setCopiedKey] = useState('')
  const [aiPlans, setAiPlans] = useState<PlanCard[] | null>(null)
  const [plannerStatus, setPlannerStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [plannerMessage, setPlannerMessage] = useState('')
  const templatePlans = useMemo(() => buildPlans(draft, includeAPlus), [draft, includeAPlus])
  const plans = aiPlans?.length ? aiPlans : templatePlans
  const visiblePlans = plans.filter((plan) => activeKind === 'all' || plan.kind === activeKind)
  const hasApiConfig = Boolean(apiConfig.baseUrl.trim() && apiConfig.apiKey.trim() && apiConfig.model.trim())

  const updateDraft = (key: keyof ProductDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const copy = async (key: string, text: string) => {
    await copyTextToClipboard(text)
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey((current) => (current === key ? '' : current)), 1200)
  }

  const copyAll = () => copy('all', plans.map(formatPlanForCopy).join('\n\n---\n\n'))

  const saveApiConfig = () => {
    window.localStorage.setItem(API_CONFIG_STORAGE_KEY, JSON.stringify(apiConfig))
    setShowApiModal(false)
    setCopiedKey('api-config')
    window.setTimeout(() => setCopiedKey((current) => (current === 'api-config' ? '' : current)), 1200)
  }

  const generatePlan = () => {
    if (hasApiConfig) {
      void runAiPlanner()
      return
    }
    useTemplatePlans()
    setPlannerStatus('done')
    setPlannerMessage(`已使用内置亚马逊图片规范模板生成 ${templatePlans.length} 张策划卡片。`)
  }

  const runAiPlanner = async () => {
    setPlannerStatus('running')
    setPlannerMessage('正在调用 AI 策划接口...')
    try {
      const cards = await callPlannerApi(apiConfig, draft, includeAPlus)
      setAiPlans(cards)
      setPlannerStatus('done')
      setPlannerMessage(`AI 策划完成，共 ${cards.length} 张卡片。`)
    } catch (error) {
      setPlannerStatus('error')
      setPlannerMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const useTemplatePlans = () => {
    setAiPlans(null)
    setPlannerStatus('idle')
    setPlannerMessage('')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>亚马逊图片策划器</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="button primary" onClick={copyAll}>
            {copiedKey === 'all' ? '已复制全部' : '复制完整策划'}
          </button>
          <button type="button" className="button" onClick={() => setDraft(DEFAULT_DRAFT)}>
            恢复示例
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="side-panel">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>产品输入</h2>
                <p>填好资料后点击生成。未配置 API 时使用内置规范模板；配置 API 后调用 AI 生成更贴合的策划。</p>
              </div>
              <label className="checkbox-line">
                <input type="checkbox" checked={includeAPlus} onChange={(event) => setIncludeAPlus(event.target.checked)} />
                A+ 5 张
              </label>
            </div>

            <TextArea label="产品标题" rows={2} value={draft.title} onChange={(value) => updateDraft('title', value)} />
            <TextArea label="五点描述 / 核心卖点" rows={7} value={draft.bullets} onChange={(value) => updateDraft('bullets', value)} />
            <TextArea label="产品事实" rows={5} value={draft.facts} onChange={(value) => updateDraft('facts', value)} />
            <TextInput label="品牌" value={draft.brand} onChange={(value) => updateDraft('brand', value)} />
            <TextInput label="目标人群" value={draft.audience} onChange={(value) => updateDraft('audience', value)} />
            <TextArea label="视觉风格" rows={3} value={draft.style} onChange={(value) => updateDraft('style', value)} />
            <TextArea label="禁用 / 风险限制" rows={4} value={draft.forbidden} onChange={(value) => updateDraft('forbidden', value)} />

            <div className="generate-panel">
              <button type="button" className="button success wide" onClick={generatePlan} disabled={plannerStatus === 'running'}>
                {plannerStatus === 'running'
                  ? 'AI 策划中...'
                  : hasApiConfig
                    ? '生成 AI 策划'
                    : '用内置规范生成策划'}
              </button>
              <button type="button" className="button wide" onClick={() => setShowApiModal(true)}>
                {hasApiConfig ? 'API 已配置' : '配置 API'}
              </button>
              <button type="button" className="button wide" onClick={useTemplatePlans}>
                重置为模板结果
              </button>
            </div>
            {plannerMessage && (
              <p className={`status-message ${plannerStatus === 'error' ? 'error' : 'ok'}`}>{plannerMessage}</p>
            )}
          </section>
        </aside>

        <section className="plan-area">
          <div className="plan-toolbar">
            <div>
              <div className="title-row">
                <h2>策划卡片</h2>
                <span className={`source-pill ${aiPlans?.length ? 'ai' : ''}`}>{aiPlans?.length ? 'AI 策划' : '模板策划'}</span>
              </div>
              <p>当前共 {visiblePlans.length} 张。先复制策划给生图工具，再回头做人工审核。</p>
            </div>
            <div className="segment">
              {[
                ['all', '全部'],
                ['listing', 'Listing'],
                ['aplus', 'A+'],
              ].map(([value, label]) => (
                <button key={value} type="button" className={activeKind === value ? 'active' : ''} onClick={() => setActiveKind(value as 'all' | PlanKind)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="cards">
            {visiblePlans.map((plan) => {
              const fullText = formatPlanForCopy(plan)
              return (
                <article key={plan.slot} className="plan-card">
                  <div className="card-head">
                    <div>
                      <div className="card-meta">
                        <span className="slot">{plan.slot}</span>
                        <span className={`kind ${plan.kind}`}>{plan.kind === 'listing' ? 'Listing 图' : 'A+ 图'}</span>
                      </div>
                      <h3>{plan.title}</h3>
                      <p>{plan.objective}</p>
                    </div>
                    <div className="card-actions">
                      <button type="button" className="button small primary" onClick={() => copy(`${plan.slot}:all`, fullText)}>
                        {copiedKey === `${plan.slot}:all` ? '已复制' : '复制全部'}
                      </button>
                      <button type="button" className="button small" onClick={() => copy(`${plan.slot}:prompt`, plan.prompt)}>
                        {copiedKey === `${plan.slot}:prompt` ? '已复制' : '复制 Prompt'}
                      </button>
                    </div>
                  </div>

                  <div className="card-grid">
                    <div className="info-column">
                      <InfoBlock title="画面构图" text={plan.composition} />
                      <InfoBlock title="画面文案" text={plan.onImageCopy || '无。主图保持纯白底，不加文字。'} actionLabel="复制文案" onAction={() => copy(`${plan.slot}:copy`, plan.onImageCopy || 'No on-image text.')} active={copiedKey === `${plan.slot}:copy`} />
                      <div className="risk-block">
                        <div className="block-head">
                          <h4>人工核对风险点</h4>
                          <button type="button" onClick={() => copy(`${plan.slot}:risks`, plan.risks.map((risk) => `- ${risk}`).join('\n'))}>
                            {copiedKey === `${plan.slot}:risks` ? '已复制' : '复制'}
                          </button>
                        </div>
                        <ul>
                          {plan.risks.map((risk) => (
                            <li key={risk}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="prompt-column">
                      <PromptBlock title="英文生图 Prompt" text={plan.prompt} copied={copiedKey === `${plan.slot}:prompt`} onCopy={() => copy(`${plan.slot}:prompt`, plan.prompt)} />
                      <PromptBlock title="Negative Prompt" text={plan.negativePrompt} copied={copiedKey === `${plan.slot}:negative`} onCopy={() => copy(`${plan.slot}:negative`, plan.negativePrompt)} />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      {showApiModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowApiModal(false)}>
          <section className="api-modal" role="dialog" aria-modal="true" aria-labelledby="api-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2 id="api-modal-title">API 配置</h2>
                <p>这里配置的是“策划 API”，用于生成图片策划和 Prompt，不会直接生图。</p>
              </div>
              <button type="button" className="icon-button" aria-label="关闭" onClick={() => setShowApiModal(false)}>×</button>
            </div>
            <TextInput label="Base URL" value={apiConfig.baseUrl} placeholder="https://api.openai.com/v1" onChange={(value) => setApiConfig((current) => ({ ...current, baseUrl: value }))} />
            <TextInput label="API Key" type="password" value={apiConfig.apiKey} placeholder="sk-..." onChange={(value) => setApiConfig((current) => ({ ...current, apiKey: value }))} />
            <TextInput label="策划模型" value={apiConfig.model} placeholder="gpt-4.1 / gpt-5 / deepseek-chat" onChange={(value) => setApiConfig((current) => ({ ...current, model: value }))} />
            <div className="modal-note">
              <strong>说明</strong>
              <span>Base URL 只是接口地址；真正调用还需要 API Key 和模型。配置会保存在当前浏览器 localStorage，不会上传到 GitHub。</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="button success" onClick={saveApiConfig}>
                保存配置
              </button>
              <button type="button" className="button" onClick={() => setShowApiModal(false)}>
                取消
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows: number
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function InfoBlock({
  title,
  text,
  actionLabel,
  onAction,
  active,
}: {
  title: string
  text: string
  actionLabel?: string
  onAction?: () => void
  active?: boolean
}) {
  return (
    <div className="info-block">
      <div className="block-head">
        <h4>{title}</h4>
        {onAction && <button type="button" onClick={onAction}>{active ? '已复制' : actionLabel}</button>}
      </div>
      <p>{text}</p>
    </div>
  )
}

function PromptBlock({
  title,
  text,
  copied,
  onCopy,
}: {
  title: string
  text: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="prompt-block">
      <div className="block-head">
        <h4>{title}</h4>
        <button type="button" onClick={onCopy}>{copied ? '已复制' : '复制'}</button>
      </div>
      <pre>{text}</pre>
    </div>
  )
}
