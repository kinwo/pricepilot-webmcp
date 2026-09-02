# LightningPricePilot — three-minute demo transcript

Target delivery: warm, confident, and conversational at roughly 140 words per minute. Read only the **Voiceover** text. The **On screen** notes are recording cues. A narration-only version with pronunciation hints is available in [`demo-voiceover.txt`](demo-voiceover.txt).

## 0:00–0:18 — The problem and product

**On screen:** Start on the landing page. Briefly show the hero, then click **Create a demo room**.

**Voiceover:**

Online shopping is still mostly a one-way conversation. Shoppers search repeatedly, while merchants rarely see what people actually want. I built Lightning Price Pilot: a two-sided intent market where a shopper, a merchant, and their AI agents collaborate to discover a fair price.

## 0:18–0:38 — A real WebMCP surface

**On screen:** Open the WebMCP status pill and show the seven registered shopper tools. Copy the suggested shopper prompt.

**Voiceover:**

This is a WebMCP-native laptop marketplace. The page exposes structured tools directly to ChatGPT, with product IDs, integer-cent prices, and clear read-versus-write semantics. The model never scrapes the interface, and the app has no embedded model or API key.

## 0:38–1:03 — Discovery, comparison, and negotiation

**On screen:** Give ChatGPT the shopper prompt. Show the Aster Air 13 result, the price comparison, and the negotiation response.

**Voiceover:**

I ask for a lightweight refurbished laptop under nine hundred dollars, comparing every price path and negotiating toward eight hundred. It finds the Aster Air 13 and compares refurbished, group-buy, and live-bargain prices. Negotiation follows private merchant guardrails, returning an explainable offer or counteroffer without inventing a discount.

## 1:03–1:29 — Human-approved group buying

**On screen:** Let ChatGPT request `join_group_buy`. Pause on the approval dialog, approve it, then show the group count change from four to five and the unlocked price.

**Voiceover:**

Four shoppers have already joined the group. When the agent tries to add my commitment, Lightning Price Pilot pauses for my approval. I confirm, becoming the fifth buyer and unlocking eight percent off for everyone in the room. This is a visible, non-binding commitment—not an order—and the price changes deterministically to eight hundred eight dollars and sixty-eight cents.

## 1:29–1:46 — Save intent for later

**On screen:** Set the target to **$800**, click **Watch price**, and approve the subscription.

**Voiceover:**

The group price is close, but my goal is eight hundred dollars. I save that target as a bargain subscription. My individual budget stays private; the merchant receives only an aggregate demand signal.

## 1:46–2:14 — Merchant agent responds to demand

**On screen:** Switch to **Merchant**. Show the aggregate demand board and private guardrails. Give ChatGPT the merchant prompt. Set an excellent-condition bargain to **$790**, inventory to **3**, review, and approve publication.

**Voiceover:**

Now I switch to the merchant workspace. Its separate WebMCP surface can review group commitments, subscriber counts, average targets, and offer activity—but never an individual shopper’s target. Based on this demand, the merchant agent proposes three excellent-condition units at seven hundred ninety dollars. Publishing is another write action, so it also requires human confirmation. Once approved, the offer is validated against the merchant’s private floor and published.

## 2:14–2:39 — Proactive, persistent matching

**On screen:** Return to **Shopper**. Show the live notification and bargain inbox. Negotiate again to create the $790 offer.

**Voiceover:**

Back in the shopper workspace, the matching bargain arrives in real time. The notification is delivered through server-sent events and persisted, so it survives a refresh. The agent can now reuse the best available price and creates a ten-minute offer at seven hundred ninety dollars—below my saved target.

## 2:39–2:55 — Human-approved mock checkout

**On screen:** Click **Mock checkout**, pause on the confirmation, then approve and show the completed mock order.

**Voiceover:**

Checkout never happens silently. The tool waits while I review the exact item and price. After I approve, the app creates a fictional order and decrements inventory in one database transaction. No payment or personal data is collected.

## 2:55–3:00 — Close

**On screen:** Finish on the shopper and merchant views, or the landing-page brand.

**Voiceover:**

Lightning Price Pilot turns private intent into transparent group value, timely merchant action, and a safer agent-assisted purchase.

## Prompts used during the recording

**Shopper**

> Find me a lightweight refurbished laptop under $900. Compare every available price path, negotiate toward $800 if sensible, and ask before joining a group or checking out.

**Merchant**

> Review aggregate demand in this room. Find the strongest opportunity, then propose a limited bargain that would notify interested shoppers. Ask before publishing it.
