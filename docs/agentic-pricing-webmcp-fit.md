# Agentic Price Discovery and Negotiation — WebMCP Competition Fit

The novel framing is not “an AI coupon finder.” It is a **two-sided intent market**: shopper agents express structured buying intent, while merchant agents respond to aggregate demand with transparent, rule-bound offers.

## Why is this use case a strong fit for WebMCP?

Product discovery and pricing depend on live website state: condition-specific inventory, current and group-buy prices, group progress, active bargains, offer expiry, and merchant pricing policies. These details are difficult for an agent to understand reliably by reading page text or clicking through filters.

WebMCP turns that state into precise, discoverable actions. On the shopper page, an agent can search the laptop catalogue, compare condition, group, and bargain price paths, request a rule-bound offer, join a group buy, save a target-price subscription, read bargain notifications, and prepare a mock checkout. On the merchant page, a different agent can review aggregate demand and offer activity, update private pricing guardrails, and publish or close limited bargains.

Each page registers only the tools appropriate to its role, with the room code already bound to every call. Both roles use the same validated room backend, so a shopper action can change aggregate demand and a merchant action can create a qualifying shopper notification without exposing the merchant’s private floor through the shopper tool surface.

This transforms the storefront from a static catalogue into a structured negotiation space for people, shopper agents, and merchant agents.

## How does it create a better user experience?

The shopper describes the outcome once:

> “Find me a lightweight laptop under $900. Excellent refurbished condition is acceptable. Compare every available price path and negotiate toward $800 if sensible.”

The agent can then present understandable options instead of another long list of products:

- Buy at the current price for the selected condition
- Join a group buy and show how many more commitments would unlock its next discount
- Use an active, inventory-limited merchant bargain
- Request a ten-minute offer or transparent counteroffer within the merchant’s private guardrails
- Save the product, acceptable condition, and target price for a future bargain

Every price path states why it is available, whether it is currently unlocked, and what the shopper must do next. Offers include their rationale and expiry. Joining a group, saving a subscription, and placing the fictional mock order pause for visible human approval.

The shopper no longer needs to repeatedly search the catalogue, compare product conditions, monitor group progress, or refresh the page looking for a relevant bargain. Matching merchant bargains create persisted in-app notifications, while server-sent events update the open room live.

Merchants gain a complementary experience: they can see group commitments, subscriber counts, average target prices, and offer volume; tune the private floor and discount limits; and publish limited bargains that are matched against saved shopper intent. They do this without receiving a list of individual shopper budgets.

## What can people and agents do together that was difficult before?

People remain responsible for the important trade-offs:

- Which laptop condition is acceptable
- What target price is worthwhile
- Whether to join a non-binding group buy
- Whether to save buying intent in the room
- Whether to complete a fictional checkout
- On the merchant side, whether to change pricing policy or publish or close a bargain

Agents handle the structured, repetitive work:

- Search products by need, use case, condition, and budget
- Compare current condition, unlocked group, and active bargain prices
- Request an accepted offer or explain a policy-bound counteroffer
- Retrieve relevant bargain notifications
- Summarize aggregate demand and recent offer outcomes
- Turn a demand signal into a proposed limited bargain

For example, the merchant agent can see that a product has five group commitments, three bargain subscribers, an aggregate average target, and recent offer activity. It can propose a price, condition, inventory allocation, expiry, and shopper-facing message. The merchant reviews the action before publication; matching subscribers then receive an in-app notification that the shopper agent can retrieve and explain.

This creates something that was previously difficult: **asynchronous negotiation around durable buyer intent**. A shopper can save a condition and target price, leave the original search, and return to a persisted notification after a merchant publishes a qualifying bargain. Demand is used to unlock lower group prices and guide shared bargains—not to secretly calculate a different price for each shopper.

## How was WebMCP implemented?

LitghtningPricePilot implements two role-specific WebMCP surfaces with `document.modelContext.registerTool`.

The shopper page registers seven tools:

- `search_products` — find up to five laptops by plain-language query, use case, condition, or maximum budget
- `get_price_options` — compare the current condition price, group-buy path, and any active bargain for one laptop
- `request_offer` — create a non-binding ten-minute accepted offer or counteroffer within merchant guardrails
- `join_group_buy` — record the shopper’s non-binding group commitment and unlock a tier when its threshold is reached
- `subscribe_bargains` — save a product, acceptable condition, and target price in the demo room
- `get_notifications` — retrieve persisted bargain notifications, treating merchant-authored messages as untrusted content
- `prepare_mock_checkout` — place a human-approved fictional order from a valid offer and decrement demo inventory

The merchant page registers five tools:

- `get_demand_summary` — return group commitments, subscriber counts, aggregate average targets, and offer counts
- `get_offer_activity` — return recent accepted, countered, expired, and checked-out offers
- `set_pricing_policy` — update the private floor, maximum instant discount, and five- and ten-buyer discounts
- `publish_bargain` — publish a condition-specific, inventory-limited, expiring bargain and notify matching subscribers
- `close_bargain` — stop an active bargain while preserving its notification and audit history

Each tool posts its role, action, and structured input to the room action API. The server validates the room, role-specific action allowlist, and input schema before running shared domain logic against the room’s persisted state. The deterministic pricing service enforces condition inventory, merchant floors, instant-discount limits, five- and ten-buyer group tiers, bargain inventory, and expiry.

The WebMCP definitions mark read operations with `readOnlyHint`, mark merchant-authored notification content with `untrustedContentHint`, forward cancellation signals, and unregister when the page unmounts. Visible confirmation dialogs protect group joining, bargain subscriptions, mock checkout, pricing-policy changes, and bargain publication or closure.

All products, prices, offers, and orders are fictional. The prototype collects no payment or personal data, and the mock checkout is the only checkout behavior implemented.
