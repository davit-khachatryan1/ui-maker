# Figma HTML Cleaner

A React + Vite + TypeScript app for cleaning Figma-exported HTML into readable HTML or React TSX components. It parses HTML into an AST, applies deterministic cleanup rules, fixes fake image divs, and optionally runs an AI cleanup step.

## Features

- Parse once, transform via AST (parse5).
- Tailwind CSS UI styling.
- Deterministic cleanup: remove empty wrappers, flatten single-child wrappers, normalize whitespace, fix simple nesting, and remove duplicate attributes.
- Image fixes:
  - Convert Figma icon blocks (nested divs with `data-crypto`) into empty `<img>` placeholders.
  - Convert background-image divs and role=img/aria-label divs when safe.
- Class rules: remove, rename (regex), prefix, and dedupe classes in stable order.
- Output modes: clean HTML or React TSX component.
- Preview sandbox via DOMPurify + iframe `srcDoc`.
- Optional AI cleanup with Ollama or cloud providers.

## Getting started

```bash
npm install
npm run dev
```

In a second terminal, run the backend proxy:

```bash
npm run server:dev
```

Or run both together:

```bash
npm run dev:all
```

## Testing

```bash
npm run test
```

## AI providers

Cloud providers are accessed through a local backend proxy so API keys never reach the browser.

### Ollama (local)

1. Install Ollama and pull a model:

```bash
ollama pull qwen2.5-coder:7b
```

2. Keep Ollama running locally. The backend uses `http://localhost:11434` by default.
   You can override it in `server/.env`.

Suggested models:
- `qwen2.5-coder`
- `llama3.1`
- `gemma3`

### OpenAI (paid)

- Add `OPENAI_API_KEY` in `server/.env`.
- Suggested low-cost model: `gpt-4o-mini`.
- See OpenAI pricing for current token rates.

### Groq (paid)

- Add `GROQ_API_KEY` in `server/.env`.
- See Groq pricing for current token rates.

### Anthropic (paid)

- Add `ANTHROPIC_API_KEY` in `server/.env`.
- Suggested tier: `claude-3-5-haiku-latest`.

### xAI (paid)

- Add `XAI_API_KEY` in `server/.env`.

### Free vs paid

- Ollama is free when running locally.
- Groq, xAI, and OpenAI are paid APIs that require keys.

### Backend environment

Create `server/.env` using the example:

```
cp server/.env.example server/.env
```

## Notes

- The preview panel sanitizes HTML output before rendering in a sandboxed iframe.
- TSX preview uses `esbuild-wasm` and works in the dev server. If preview is blocked, check the TSX output for scripts or event handlers.
- AI output is validated to reject scripts, event handlers, and javascript: URLs.

## Project structure

```
src/
  api/
  ai/
  components/
  core/
    transforms/
  samples/
server/
  src/
    providers/
```
