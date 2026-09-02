# 🧠 RevenueGuard — Autonomous AI Revenue Recovery OS

**Razorpay AI Buildathon 2026 · Track 3: AI Revenue Recovery**

RevenueGuard is a multi-agent system that operates as a complete **revenue immune system** for merchants. It diagnoses payment failures at the infrastructure level, predicts which payments are about to fail, and orchestrates recovery across every possible channel — all while maintaining bulletproof compliance and auditability.

---

## Architecture

```
Revenue At Risk → Root Cause Diagnosis → Intervention Selection → Multi-Channel Recovery → Compliance Audit
```

### The Agent Team
| Agent | Role |
|-------|------|
| 🎯 **Orchestrator** | Supervisor — classifies risk type and routes to specialists |
| 🔬 **Diagnostician** | Root cause engine — analyzes failure codes and bank patterns |
| 🔇 **Silent Recovery** | Background fixer — gateway switching, optimal retry timing |
| 📱 **Outreach** | Multi-channel comms — WhatsApp, Email, Voice, SMS |
| 🔮 **Prediction** | Pre-failure oracle — intercepts before a payment fails |
| ⚖️ **Compliance** | Audit + boundaries — stopping rules, PII, gating actions |

### Tech Stack
- **Orchestration:** LangGraph (stateful cyclic graph with checkpointing)
- **LLM:** Claude 3.5 Sonnet (via Anthropic SDK)
- **API:** FastAPI + uvicorn
- **Task Queue:** Celery + RabbitMQ
- **Database:** PostgreSQL (via asyncpg)
- **Cache/Pub-Sub:** Redis
- **Dashboard:** Next.js + Tailwind CSS
- **Deployment:** Docker Compose (dev) / Kubernetes (prod)

---

## Quick Start

### 1. Clone and configure
```bash
git clone https://github.com/YOUR_USERNAME/RevenueGuard.git
cd RevenueGuard
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start with Docker Compose
```bash
docker-compose up -d --build
```

### 3. Start the Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### 4. Send a test webhook
```bash
curl -X POST http://localhost:8000/webhooks/razorpay/payment.failed \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"tx_demo","customer":{"name":"Test","email":"test@example.com","phone":"+919876543210","type":"B2C"},"payment":{"amount":15000,"currency":"INR","method":"UPI","bank":"HDFC","timestamp":"2026-09-01T10:00:00Z","status":"failed","error_code":"UPI_APP_TIMEOUT"},"merchant":{"id":"mer_test","name":"Test Merchant"}}'
```

### 5. Open the dashboard
Visit **http://localhost:3000** to see the recovery pipeline in action.

---

## Project Structure

```
RevenueGuard/
├── src/
│   ├── agents/           # 6 specialized LangGraph agents
│   ├── graph/            # State schema + graph builder
│   ├── workers/          # Celery tasks (recovery, outreach, retry)
│   ├── tools/            # Mock API clients (Razorpay, Twilio, etc.)
│   ├── models/           # Pydantic schemas
│   ├── data/             # Synthetic data generator
│   ├── persistence/      # PostgreSQL, Redis, Audit Store
│   └── streaming/        # Redis Pub/Sub event system
├── dashboard/            # Next.js real-time dashboard
├── infra/                # K8s manifests, Prometheus, Grafana
├── tests/                # Unit + integration + load tests
└── docker-compose.yml
```

---

## License

Built for the Razorpay AI Buildathon 2026.
