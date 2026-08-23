# Last-Mile Delivery Tracker - System Design Write-Up

## Overview
This document outlines the architectural decisions and internal logic of the Last-Mile Delivery Tracker, specifically covering the rate calculation engine, zone detection, intelligent agent auto-assignment, and the failed-delivery lifecycle. The system is built on a Node.js + Express backend with a PostgreSQL relational database. 

## 1. Zone Detection & Rate Engine (Modules 2 & 3)
### Zone Detection
Zones represent geographical delivery boundaries. The system uses a simple yet effective O(1) database lookup to map Indian postal codes (Pincodes) to their respective zones. Pincodes are stored as a primary key in the `pincodes` table with a foreign key to `zones.id`. When a user provides pickup and drop-off pincodes, the `rateEngine.js` service performs a direct relational join to identify `pickup_zone_id` and `drop_zone_id`.

### Rate Calculation
The rate engine operates dynamically to avoid hardcoded pricing logic. The calculation pipeline is:
1. **Volumetric Weight**: Evaluated as `(Length × Width × Height) / 5000`.
2. **Chargeable Weight**: The `MAX(Actual Weight, Volumetric Weight)`.
3. **Base and Per-Kg Rates**: The system fetches the configured rate card for the specific `source_zone_id`, `destination_zone_id`, and `order_type` (B2B or B2C).
4. **Surcharges**: If the `payment_type` is COD (Cash on Delivery), the system queries the `cod_surcharges` table to apply an additional admin-configured flat fee based on the order type.
5. **Total Quote**: `Base Fee + (Chargeable Weight × Per-Kg Rate) + COD Surcharge`.

This data-driven design allows administrators to configure dynamic rates without requiring code deployments.

## 2. Intelligent Auto-Assignment (Module 4)
The auto-assignment system enhances the standard "nearest available" algorithm by injecting a **Failed-Delivery Risk Score** to handle high-risk packages proactively. 

### Risk Scoring Model
When an order is created, the system evaluates it against a transparent, weighted-rule heuristic:
- **Payment Method**: COD orders receive penalty points (+30) due to higher rejection rates.
- **Package Size**: Large packages (volumetric weight > 10kg) get penalty points (+20) as they are harder to deliver.
- **Customer History**: The customer's historical failure rate is calculated dynamically (`failed_orders / total_orders`) and scales up to +50 points.

### Assignment Logic
When `autoAssign()` is invoked, the database queries all agents who:
1. Are marked as `is_available = TRUE`.
2. Have their `current_zone_id` matching the order's pickup zone.
3. Have fewer active deliveries than their `max_concurrent_orders` limit.

For low-risk orders (Score <= 50), the system performs **load-balancing** by assigning the order to the agent with the lowest count of currently active orders. 
For high-risk orders (Score > 50), the assignment becomes **competency-based**. The system evaluates the historical success rate of all available agents in that zone, and dispatches the high-risk package to the agent with the highest lifetime completion rate. This strategic routing directly mitigates the probability of delivery failures.

## 3. Failed-Delivery Lifecycle (Module 5 & 6)
Order tracking utilizes an immutable ledger model. The `orders` table tracks the current state, while the `order_status_history` table logs every transition (Pending → Assigned → Picked Up → In Transit → Delivered/Failed) with a timestamp, actor ID, and optional notes. 

When a delivery fails:
1. **Agent Updates Status**: The agent updates the order status to `Failed` via the agent API, providing reason notes (e.g., "Customer unavailable").
2. **Event Trigger**: The status update hooks into `emailService.js`, dispatching an SMTP notification to the customer with a tracking link.
3. **Reschedule Action**: The customer can click the link and trigger the `POST /orders/:id/reschedule` endpoint. This acts as a state-machine reset: it clears the `assigned_agent_id`, reverts the status to `Pending`, and logs the action in the immutable history ledger. 
4. **Re-Assignment**: The order is now eligible to be picked up by the `autoAssign()` daemon or manually dispatched by an admin.

## Conclusion
By combining strict relational data integrity with a decoupled AI service (via Anthropic API), the Last-Mile Delivery Tracker offers robust logistics management. The transparent risk scoring model provides immediate operational value while serving as a foundational stepping stone for future machine learning model integration.
