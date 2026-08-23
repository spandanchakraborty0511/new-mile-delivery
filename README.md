# Last-Mile Delivery Tracker

A complete, end-to-end Last-Mile Delivery tracking system built for Unthinkable. This platform handles everything from dynamic rate calculation and real-time package tracking to smart agent dispatching and an autonomous AI support assistant.

## Final Tech Stack
- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React, Vite, Tailwind CSS v4, Lucide React
- **Auth:** JWT (Access + Refresh tokens), bcrypt hashing, Role-based middleware
- **AI Agent:** Google Gemini 3.5 Flash (Function Calling / Tool-using agent)
- **External APIs:** OpenStreetMap Nominatim (Free Address Autocomplete)
- **Email:** Nodemailer (SMTP, Dev-mode fallback logging)

---

## The AI Feature — "Aria", the Delivery Assistant
Aria is not a standard FAQ chatbot bolted onto the UI. She is an autonomous agent implemented using **Google Gemini's Function Calling API**. She can *perform actions* against the backend database in real-time.

| Tool exposed to Aria | What it does |
|---|---|
| `quote_charge` | Queries the PostgreSQL rate engine so a customer can ask "what would 5kg from 400038 to 400058 cost?" in plain English. |
| `get_order_status` | Looks up live status + full tracking timeline for a given order ID. |
| `reschedule_delivery` | Reschedules a failed delivery and re-triggers agent assignment — Aria takes the action, she doesn't just tell the customer to click a button. |
| `agent_workload_summary` | Summarizes agent load and zone performance for admins on request. |

The AI service (`services/aiAgentService.js`) wraps the Gemini SDK with a tool-dispatch loop, meaning the model's tool calls execute against the exact same logic the REST API uses.

---

## The Novelty — Smart Dispatching & Risk Scoring
Standard auto-assignment logic ("nearest available agent") is naive. It ignores the fact that some orders are simply more likely to fail (COD orders, oversized packages, bad customer history).

This project adds a lightweight, explainable **Risk Score (0-100)** computed at order creation time:
```
risk_score = f(cod_flag, volumetric_weight, customer's_past_failure_rate)
```

**Dispatch Logic:**
- **Low-Risk Orders (Score < 50):** The system load-balances, routing the package to the eligible agent in the zone with the *fewest active deliveries*.
- **High-Risk Orders (Score > 50):** The system overrides standard balancing and routes the delivery to the agent with the *highest historical success rate* in that zone.

---

## Core Modules & Features Completed
- [x] **Module 1 — Auth & Roles:** Customer, Delivery Agent, and Admin roles with isolated React dashboards. Secure JWT authentication and bcrypt hashing.
- [x] **Module 2 — Zones & Rate Cards:** Admin CRUD for geographical zones. Pincode-to-Zone mapping, intra/inter-zone B2B & B2C rate cards, and COD surcharges.
- [x] **Module 3 — Order Creation & Rate Engine:** OpenStreetMap-powered address searching. Volumetric weight calculation (L×W×H/5000), zone detection, and instant pricing quotes.
- [x] **Module 4 — Agent Assignment:** Risk-score-aware auto-assignment engine that routes pending packages to available agents in the pickup zone.
- [x] **Module 5 — Agent Dashboard & Lifecycle:** Dedicated Agent portal to push status updates (`Picked Up` → `In Transit` → `Delivered`).
- [x] **Module 6 — Notifications:** NodeMailer hooks trigger email updates to the customer on every status change.
- [x] **Module 7 — Aria (AI Agent):** Global floating UI widget powered by Gemini 1.5/3.5 Flash for conversational logistics support.

---

## Setup & Run Instructions

### 1. Database & Environment
1. Ensure PostgreSQL is installed and running on port 5432.
2. The system expects a database named `lastmile_delivery` and a user `postgres` / `postgres`. (Update `.env` if yours is different).

### 2. Run the Backend
```bash
cd backend
# Fill in DB creds, JWT secrets, and GEMINI_API_KEY in .env
npm install
npm run migrate         # Applies database schema sequentially
npm run dev             # Starts Express server on port 5000
```
*Note: If you do not provide a `GEMINI_API_KEY`, Aria will automatically fall back to "Offline Mock Mode".*

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev             # Starts Vite server on port 5174
```

### 4. Default Admin Login
Once the migrations run, a default admin account is seeded:
- **Email:** `admin@example.com`
- **Password:** `admin123`

---

## API Reference (Highlights)

### Auth & Core
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as customer |
| POST | `/api/auth/login` | Public | Returns access + refresh token |
| GET  | `/api/auth/me` | Bearer | Returns the authenticated user & role |

### Customer
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders/quote` | Customer | Calculates pricing based on dimensions and rate cards |
| POST | `/api/orders` | Customer | Creates a new pending order |
| GET | `/api/orders` | Customer | Lists all active and past orders for the customer |

### Agent
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/agent/orders` | Agent | Lists all active orders assigned to the agent |
| POST | `/api/agent/orders/:id/status` | Agent | Advances an order (e.g., In Transit, Delivered) |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/zones/:id/pincodes` | Admin | Maps pincodes to a geographical zone |
| POST | `/api/rate-cards` | Admin | Defines pricing between two zones |
| GET | `/api/admin/agents` | Admin | Lists all delivery agents |
| POST | `/api/admin/agents` | Admin | Registers a new delivery agent |
| POST | `/api/admin/orders/:id/auto-assign` | Admin | Triggers the risk-aware smart dispatch engine |
