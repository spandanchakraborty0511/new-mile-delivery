# Last-Mile Delivery Tracker

A complete, end-to-end Last-Mile Delivery tracking system built for Unthinkable. This platform handles everything from dynamic rate calculation and real-time package tracking to smart agent dispatching and an autonomous AI support assistant.

## Live Demo
🚀 **[https://lastmile-delivery-eubf.onrender.com](https://lastmile-delivery-eubf.onrender.com/)**

### Default Testing Credentials
- **Admin:** `admin@example.com` / `admin123`
- **Customer:** (Click "Sign Up" to create your own, or test with any registered email)
- **Agent:** (Log in as Admin, create an Agent on the "Agents" tab, and log in with those credentials)

---

## How to Use (Step-by-Step Guide)

### 1. Configure the System (Admin)
1. **Log in** using the Admin credentials above.
2. Navigate to **Zones** to create geographic delivery zones (e.g., "North Zone", "South Zone") and map real-world pincodes to them.
3. Navigate to **Rate Cards** to define the pricing rules (Base Fee + Per Kg Rate) for delivering packages between these zones.
4. Navigate to **Agents** to hire (register) new Delivery Agents and assign them to specific zones.



### 2. Place an Order (Customer)
1. Log out of the Admin account and click **Sign Up** to create a Customer account.
2. On your Customer Dashboard, click **Create New Order**.
3. Use the OpenStreetMap autocomplete to fill in your Pickup and Drop-off addresses.
4. Enter the dimensions and weight of your package.
5. Click **Calculate Rate Quote** to ping the Rate Engine.
6. Click **Confirm & Place Order** to dispatch it!



### 3. Fulfill the Delivery (Agent)
1. Log out of the Customer account and log in using the Agent credentials you created in Step 1.
2. The Risk-Scoring engine will have automatically assigned the Customer's pending order to you if you were in the correct zone.
3. You will see the package in your active queue.
4. Click through the lifecycle buttons (`Picked Up` → `In Transit` → `Out for Delivery` → `Delivered`) to complete the flow.
5. *(In a production environment with SMTP configured, this sends real-time email updates to the Customer).*



### 4. Talk to Aria (AI Assistant)
At any point, click the floating **Aria AI Assistant** button in the bottom right corner of the screen.
Ask her to:
- *"Calculate the cost to ship 5kg from 400038 to 400058."*
- *"Where is order #1?"*
- *"Can you reschedule my failed delivery?"*

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
