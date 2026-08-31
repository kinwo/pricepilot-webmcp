# PricePilot competition demo guide

## Before recording or presenting

1. Open `/api/ready` and confirm `database: "ready"`.
2. Open the home page and create a new demo room.
3. Copy the six-character room code.
4. Open the shopper and merchant URLs in separate ChatGPT browser sessions if available. A single session can also use the role switcher.
5. Open the WebMCP status pill and confirm the expected tools are registered.

## Recommended three-minute story

### 1. Product and price discovery

On the shopper page, ask ChatGPT:

> Find me a lightweight refurbished laptop under $900. Compare every available price path, negotiate toward $800 if sensible, and ask before joining a group or checking out.

Point out that ChatGPT receives structured product IDs and integer-cent prices instead of scraping visual cards.

### 2. Human-agent group buying

Let ChatGPT call `join_group_buy`. The page pauses for human confirmation. Approve it and show the group moving from four to five buyers, which unlocks the deterministic 8% tier.

This demonstrates that shopper intent can directly change a transparent price path without creating an order.

### 3. Subscribe once, benefit later

Save an Aster Air target of $800 in excellent condition. Switch to the merchant page and ask:

> Review aggregate demand in this room. Find the strongest opportunity, then propose a limited bargain that would notify interested shoppers. Ask before publishing it.

Publish three excellent-condition units at $790. Show that the merchant sees aggregate demand rather than the individual's target, and that the publishing tool requires confirmation.

### 4. Proactive notification and mock checkout

Return to the shopper page. The bargain notification appears through SSE and remains in the inbox after a refresh. Ask ChatGPT to request or reuse the best offer and prepare checkout.

Approve the final dialog. Emphasize that:

- The tool waits for the human.
- No payment or personal data is collected.
- The mock order and inventory mutation happen transactionally.

## Reset

Use the circular reset button in the top navigation. After confirmation, offers, subscriptions, bargains, notifications, and orders are cleared; the four seeded showcase commitments return.

## Suggested judging points

- One page supports both humans and agents through the same business logic.
- WebMCP avoids brittle UI automation and ambiguous finalization.
- Merchant guardrails remain private while counteroffers remain explainable.
- Group demand makes pricing collaborative rather than individually extractive.
- Subscriptions turn a one-time search into a durable, privacy-conscious buying intent.
- The merchant agent can proactively notify only shoppers whose structured intent qualifies.

