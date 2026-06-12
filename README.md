# Amazon AI Planner

一个轻量的亚马逊 Listing / A+ 图片策划工具。

它不是生图工具，而是先把商品资料整理成可复制的图片策划卡片，方便后续粘贴到 ChatGPT、Gemini、Midjourney、OpenAI 图片模型或其它生图工具里继续出图。

## 功能

- 根据商品标题、五点描述、产品事实、品牌、人群和风格，生成默认策划卡片。
- 默认输出 7 张 Listing 图：
  - `MAIN`
  - `PT01` 至 `PT06`
- 可选输出 5 张 A+ 图：
  - `A+01` 至 `A+05`
- 每张图都可以单独复制：
  - 完整生图信息
  - 英文生图 Prompt
  - 画面文案
  - Negative Prompt
  - 人工核对风险点
- 可配置 OpenAI Chat Completions 兼容 API，让 AI 根据商品资料生成更贴合的策划卡片。

## 本地运行

```bash
npm install
npm run dev
```

然后打开：

```text
http://127.0.0.1:5173/
```

## API 配置

不配置 API 也可以使用模板策划。

如果要使用 AI 策划，在页面左侧填写：

- `Base URL`，例如 `https://api.openai.com/v1`
- `API Key`
- `策划模型`

当前接口使用 OpenAI Chat Completions 兼容格式：

```text
POST {baseUrl}/chat/completions
```

并要求接口支持：

```json
{ "response_format": { "type": "json_object" } }
```

API Key 只保存在当前浏览器的 `localStorage`，不会写入代码仓库。

## 注意

AI 或模板输出都只是策划草案。上传亚马逊前必须人工核对：

- 产品结构
- 尺寸数字
- 材质描述
- 包装数量
- 认证、质保、功效等承诺
- 是否出现 Amazon / Prime / 竞品品牌 / 虚假标识

## 技术栈

- React
- TypeScript
- Vite
- 原生 CSS
