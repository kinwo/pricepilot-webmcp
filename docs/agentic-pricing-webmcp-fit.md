# Agentic Price Discovery and Negotiation — WebMCP Competition Fit

The novel framing is not “an AI coupon finder.” It is a **two-sided intent market**: shopper agents publish private, structured buying intentions, while merchant agents respond with transparent, rule-bound offers.

## Why is this use case a strong fit for WebMCP?

Product discovery and pricing involve live website state: inventory, product condition, eligibility rules, preorder dates, group-order progress, discount thresholds, and offer expiry. These details are difficult for an agent to understand reliably by reading page text or clicking through filters.

WebMCP lets the storefront expose this information as precise actions. A shopper agent can discover every valid route to a better price—not only the current retail price, but refurbished stock, education pricing, preorder discounts, seasonal offers, group purchases, and future-sale subscriptions.

The concept uses WebMCP on both sides:

- The shopper-facing storefront exposes discovery, comparison, subscription, and commitment tools.
- The merchant dashboard exposes aggregate-demand and bargain-publication tools.
- A shared backend allows merchant agents to respond to demand without revealing individual shopper identities or private budgets.

This transforms the storefront from a static catalogue into a structured negotiation space for people, shopper agents, and merchant agents.

## How does it create a better user experience?

The shopper describes the outcome once:

> “I want this laptop or an equivalent model under $800. Refurbished is acceptable, I qualify for education pricing, and I can wait six weeks.”

The agent then presents understandable price paths rather than another long list of products:

- Buy a refurbished unit now
- Verify eligibility for an education discount
- Join a group order that unlocks a lower price at 20 buyers
- Preorder for later delivery
- Wait for a seasonal promotion
- Subscribe to future qualifying offers

Every offer explains why the price is available, what trade-off it requires, when it expires, and whether the shopper is making a commitment.

The shopper no longer needs to repeatedly revisit the store, search for coupon codes, compare several product conditions, or monitor a group-buy threshold. The agent does the repetitive work, while the shopper retains control over preferences, privacy, notifications, and purchases.

Merchants also gain a better experience: they can convert refurbished inventory, measure unmet demand, test preorder interest, and offer volume discounts without manually negotiating with every customer.

## What can people and agents do together that was difficult before?

People are good at expressing preferences and making trade-offs:

- Whether refurbished condition is acceptable
- How long they can wait
- Whether they want to disclose eligibility
- Whether they are comfortable joining a group order
- Whether the final offer is worth accepting

Agents are good at continuously comparing structured possibilities:

- Searching equivalent products
- Monitoring inventory and offer changes
- Comparing discount programs
- Tracking group-order progress
- Requesting offers within merchant-defined limits
- Watching for future bargains

Merchant agents can examine anonymous, aggregated demand and publish offers such as:

> “Thirty-two opted-in shoppers want this model below $750. Offer a $729 group price if twenty buyers commit before Friday.”

This creates something that was previously difficult: **asynchronous negotiation around durable buyer intent**. Shoppers do not need to be browsing when a deal becomes possible. Their opted-in agent remains represented through a subscription, the merchant agent can respond when inventory or demand changes, and the shopper returns only when there is a relevant offer to review.

For fairness, demand is used to unlock lower group prices—not to infer an individual’s willingness to pay or secretly charge different users different amounts.

## How was WebMCP implemented?

The proposed implementation uses two WebMCP-enabled web experiences.

The shopper storefront registers tools such as:

- `search_products`
- `get_price_options`
- `request_rule_bound_offer`
- `join_group_order`
- `create_preorder`
- `subscribe_to_bargains`
- `get_new_bargains`
- `accept_offer`

The merchant dashboard registers tools such as:

- `get_aggregate_demand`
- `create_group_price_tier`
- `publish_bargain`
- `close_offer`

Both experiences connect to a shared commerce backend containing product inventory, condition, merchant discount policies, price floors, group demand, subscriptions, and offer history.

A deterministic pricing service enforces inventory limits, eligibility, minimum prices, expiry dates, and discount policies. Agents can explore and propose offers, but they cannot bypass these merchant rules.

Because WebMCP operates while a storefront page is open, background alerts are handled by a separate subscription service. When a merchant agent publishes a qualifying bargain, that service sends an opted-in email or push notification. When the shopper returns, their agent uses WebMCP to retrieve the current offer and explain it.

Any action that creates a commitment—joining a group, placing a preorder, or accepting an offer—requires explicit shopper confirmation. Every offer includes its reason, terms, expiry, and an audit record.
