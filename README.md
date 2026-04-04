# KleinGuard

KleinGuard is an AI-powered, parametric income-protection prototype for gig workers. It monitors hyper-local disruption signals, adjusts weekly premiums using machine learning, and creates zero-touch claims when a worker loses earning time because of events like rain, flood, AQI spikes, traffic congestion, or demand drops.

This project is built as a Phase 2 submission for:

- Theme: `Protect Your Worker`
- Focus: `Automation & Protection`

## What The Solution Demonstrates

KleinGuard already covers the core Phase 2 product requirements in executable code:

- Registration process
  - Worker onboarding with phone OTP flow
  - City, platform, work pattern, and delivery-zone capture
- Insurance policy management
  - Policy generation
  - Policy activation
  - Current policy and policy history views
  - Coverage adjustment flow
- Dynamic premium calculation
  - ML-backed weekly premium prediction
  - Hyper-local zone risk, AQI, demand volatility, trust score, claim history, and coverage amount as inputs
  - Formula fallback if the ML service is unavailable
- Claims management
  - Automated claim creation
  - Fraud/risk scoring for claims
  - Auto-approved, under-review, escalated, and paid states
  - Claims history and payout handling

## Phase 2 Deliverable Check

Status against the requested list:

- Registration Process: Present
- Insurance Policy Management: Present
- Dynamic Premium Calculation: Present
- Claims Management: Present
- 3-5 automated disruption triggers: Present
- Seamless zero-touch claim experience: Present
- Publicly accessible 2-minute demo video: Not included in codebase

Important note:
The only major submission item not inherently stored inside this repository is the public demo video link. To help with that, a recording guide is included in [docs/DEMO_VIDEO_SCRIPT.md](d:\sentitrade\KleinGuard\docs\DEMO_VIDEO_SCRIPT.md).

## Why This Fits The Theme

Gig workers face income volatility from disruptions they do not control. KleinGuard turns those disruptions into machine-detected coverage events.

Instead of asking workers to manually prove every loss event, the system:

- detects disruption conditions,
- checks if the worker is active and in the affected zone,
- estimates lost income,
- scores fraud risk automatically,
- creates and progresses the claim with little or no user effort.

That makes the experience fast, legible, and protective by default.

## Key Product Flows

### 1. Registration

Workers can:

- enter their name and phone number,
- verify OTP,
- choose their city and platform,
- set typical work hours,
- select operating zones,
- define work frequency.

Primary frontend screens:

- [client/src/screens/RegistrationScreen.tsx](d:\sentitrade\KleinGuard\client\src\screens\RegistrationScreen.tsx)
- [client/src/screens/PlatformLinkScreen.tsx](d:\sentitrade\KleinGuard\client\src\screens\PlatformLinkScreen.tsx)
- [client/src/screens/ZoneSetupScreen.tsx](d:\sentitrade\KleinGuard\client\src\screens\ZoneSetupScreen.tsx)

Primary backend routes:

- [server/routes/auth.js](d:\sentitrade\KleinGuard\server\routes\auth.js)

### 2. Insurance Policy Management

The worker can:

- generate a policy offer,
- review premium factors,
- activate a policy,
- inspect current coverage,
- adjust coverage amounts,
- review policy history.

Primary frontend screens:

- [client/src/screens/RiskAnalysisScreen.tsx](d:\sentitrade\KleinGuard\client\src\screens\RiskAnalysisScreen.tsx)
- [client/src/screens/PolicyOfferScreen.tsx](d:\sentitrade\KleinGuard\client\src\screens\PolicyOfferScreen.tsx)
- [client/src/screens/CoverageScreen.tsx](d:\sentitrade\KleinGuard\client\src\screens\CoverageScreen.tsx)

Primary backend routes:

- [server/routes/policy.js](d:\sentitrade\KleinGuard\server\routes\policy.js)

### 3. Dynamic Premium Calculation

Premiums are computed using an ML microservice with a deterministic fallback.

Model inputs include:

- zone flood probability,
- AQI exposure,
- demand-drop events,
- trust score,
- recent claim count,
- hours worked,
- chosen coverage amount.

Primary files:

- [server/ml/premium_engine.py](d:\sentitrade\KleinGuard\server\ml\premium_engine.py)
- [server/ml/train_model.py](d:\sentitrade\KleinGuard\server\ml\train_model.py)
- [server/routes/premium.js](d:\sentitrade\KleinGuard\server\routes\premium.js)
- [server/routes/policy.js](d:\sentitrade\KleinGuard\server\routes\policy.js)

### 4. Claims Management

Claims are designed to be zero-touch:

- a trigger is detected,
- affected workers are matched,
- lost income is estimated,
- fraud risk is evaluated,
- a claim is created automatically,
- low-risk claims can be auto-approved and paid.

Primary files:

- [server/triggerMonitor.js](d:\sentitrade\KleinGuard\server\triggerMonitor.js)
- [server/claimsProcessor.js](d:\sentitrade\KleinGuard\server\claimsProcessor.js)
- [server/routes/claims.js](d:\sentitrade\KleinGuard\server\routes\claims.js)
- [client/src/screens/ClaimsScreen.tsx](d:\sentitrade\KleinGuard\client\src\screens\ClaimsScreen.tsx)

## Automated Triggers Implemented

The project includes more than the requested 3-5 triggers. Current disruption signals include:

- Rain trigger
- Flood trigger
- Heat trigger
- AQI trigger
- Demand-drop trigger
- Traffic trigger

Trigger sources are implemented as mock/public-API-style adapters:

- [server/mockApis/weather.js](d:\sentitrade\KleinGuard\server\mockApis\weather.js)
- [server/mockApis/aqi.js](d:\sentitrade\KleinGuard\server\mockApis\aqi.js)
- [server/mockApis/platform.js](d:\sentitrade\KleinGuard\server\mockApis\platform.js)
- [server/mockApis/traffic.js](d:\sentitrade\KleinGuard\server\mockApis\traffic.js)

## Zero-Touch Claim UX Recommendation

The best customer experience for this kind of product is:

- invisible protection during work,
- transparent explanation after an event,
- minimal input from the worker,
- immediate status feedback,
- payout confidence without paperwork overload.

Recommended UX principles:

- Detect first, ask later
  - Auto-create claims from verified trigger signals.
- Explain the reason clearly
  - Show the worker which trigger fired, where it happened, how payout was estimated, and current status.
- Require user action only when risk is high
  - Low-risk claims should move to payout automatically.
- Show trust and fairness
  - Surface premium factors and fraud checks in plain language.
- Use proactive notifications
  - Notify workers when coverage is active, when a trigger occurs, when a claim is created, and when payout is processed.

KleinGuard already follows this direction through trigger monitoring, auto-claim creation, socket-based live updates, and payout progression.

## Architecture

The solution is split into three parts:

- `client`
  - React + TypeScript + Vite frontend
- `server`
  - Node.js + Express + Socket.IO + SQLite backend
- `server/ml`
  - Python Flask ML microservice for premium and fraud scoring

## Tech Stack

- Frontend
  - React
  - TypeScript
  - Vite
  - Zustand
  - Framer Motion
  - Recharts
- Backend
  - Node.js
  - Express
  - better-sqlite3
  - Socket.IO
  - JWT auth
- ML Service
  - Python
  - Flask
  - scikit-learn
  - pandas
  - numpy

## Project Structure

```text
KleinGuard/
├─ client/                  # React frontend
├─ server/                  # Express API + SQLite + trigger engine
│  ├─ ml/                   # Premium + fraud ML microservice
│  ├─ mockApis/             # Mock disruption signal providers
│  └─ routes/               # Auth, policy, premium, claims, triggers
├─ run-logs/                # Local runtime logs
└─ README.md
```

## Local Run Guide

### Prerequisites

- Node.js 22+
- Python 3.13+
- npm

### Install

From the project root:

```powershell
npm.cmd install
cd client
npm.cmd install
cd ..
cd server
npm.cmd install
cd ..
python -m pip install -r server/ml/requirements.txt
npm.cmd run seed
```

### Start services

Backend:

```powershell
cd server
node server.js
```

ML service:

```powershell
cd server/ml
python -X utf8 premium_engine.py
```

Frontend:

```powershell
cd client
npm.cmd run dev -- --host 0.0.0.0
```

### Local URLs

- Frontend: `http://localhost:5174/`
- Backend health: `http://localhost:3001/api/health`
- ML health: `http://localhost:5001/health`

Note:
The frontend may start on `5174` instead of `5173` if `5173` is already in use.

## Demo Account

Use the seeded demo account:

- Phone: `9876543210`
- OTP: `123456`

Seed logic lives in:

- [server/db.js](d:\sentitrade\KleinGuard\server\db.js)

## API Overview

Important backend endpoints:

- `POST /api/auth/register`
- `POST /api/auth/otp/send`
- `POST /api/auth/otp/verify`
- `GET /api/auth/me`
- `POST /api/policy/generate`
- `POST /api/policy/activate`
- `GET /api/policy/current`
- `GET /api/policy/history`
- `PUT /api/policy/adjust`
- `POST /api/premium/calculate`
- `GET /api/claims`
- `GET /api/claims/stats`
- `GET /api/triggers/active`
- `POST /api/mock/force-trigger/:type`
- `POST /api/demo/reset`

## Demo Walkthrough Suggestion

For a strong 2-minute submission demo:

1. Show registration and OTP verification.
2. Show the policy offer and explain premium factors.
3. Show coverage activation and dashboard.
4. Fire a mock disruption trigger from demo controls.
5. Show automatic claim generation and payout/review progression.
6. Close with how ML makes pricing more adaptive and fair.

Detailed narration help:

- [docs/DEMO_VIDEO_SCRIPT.md](d:\sentitrade\KleinGuard\docs\DEMO_VIDEO_SCRIPT.md)

## Submission Strengths

- Strong alignment to the challenge theme
- Clear registration-to-protection flow
- ML-based premium engine
- Automated claims pipeline
- Multiple disruption triggers
- Real-time claim updates
- Demo-friendly seeded data

## Current Gaps To Close Before Final Submission

- Record and upload the 2-minute public demo video
- Add the public video link into this README
- Optionally replace mock signal providers with real public APIs for production realism
- Optionally clean a few remaining backend console-only encoding artifacts that do not affect product behavior

## License

This repository is intended for hackathon/demo submission use.
