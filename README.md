# FinPilot AI

Hackathon MVP for an explainable, human-in-the-loop accounting assistant for Moldovan small businesses.

## Implemented demo flow

1. Sign in through the demo authentication screen.
2. Review business health on the dashboard.
3. Upload and filter source documents in the Document Inbox.
4. Compare an invoice with extracted fields and source evidence.
5. Inspect the deterministic accounting proposal and confirm posting.
6. Trace the entry in the ledger.
7. Ask Copilot questions backed by source documents and entries.

The current version uses a synthetic demo tenant and in-memory fixtures. It deliberately separates document receipt, accounting posting and payment status.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production verification:

```bash
npm run lint
npm run build
```

Demo account: `admin@finpilot.ai` / `demo2026`.

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS 4
- Zod-validated API request for Copilot
- Lucide icons

## API demo

- `GET /api/v1/analytics/summary`
- `POST /api/v1/auth/login`
- `POST /api/v1/copilot/query` with `{ "query": "What were our September expenses?" }`

## Next implementation slice

Replace fixtures with PostgreSQL, add immutable object storage and connect the document-processing adapter to OCR/vision. Posting must stay behind the existing validation and approval gate.
