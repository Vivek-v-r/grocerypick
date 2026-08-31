# 🏏 CRACK IT — GroceryPick Project Guide (4–5 LPA Edition)

Only THIS project. Nothing else. If you can talk through this file without notes,
you clear the technical round at any service company / small startup.

---

## 1. THE 30-SECOND PITCH (memorize word-for-word)

> "I built **GroceryPick** — a grocery pre-order and pickup system using
> **Django REST Framework** for the backend and **React** for the frontend.
> Customers browse products, order online, and pick up from the store in
> 1–2 minutes using a shareable order number like GP-1001 — no queues,
> no delivery fees.
> The unique feature is **group shopping**: family or roommates can share
> one cart and automatically split the bill equally or custom amounts,
> with payment tracking per person.
> An admin dashboard lets the shop owner manage products, stock, orders,
> daily offers and payments."

Practice until you can say it while walking. This answer decides 50% of the round.

---

## 2. WHY THIS PROJECT EXISTS (they WILL ask "real problem?")

| Problem | Your solution |
|---|---|
| Wasted time inside store (select → queue → bill) | Pre-order → walk in → collect in 1–2 min |
| Person who knows items ≠ person who visits store | Share GP-number via WhatsApp; anyone can collect |
| Roommates/family splitting grocery bills manually | Shared cart + auto split + per-person paid tracking |

One-liner to drop:
> "It's the same BOPIS model — Buy Online, Pick Up In Store — that Walmart
> and Target use, built for small kirana stores."

---

## 3. ARCHITECTURE (draw this every time)

```
┌──────────────────────┐                    ┌─────────────────────────┐
│  REACT + VITE        │   HTTP (JSON)      │  DJANGO REST FRAMEWORK  │
│                      │  ───────────────▶  │                         │
│ • Pages & components │   Axios requests   │ • views.py = endpoints  │
│ • Cart/Auth Context  │  ◀───────────────  │ • serializers validate  │
│ • Axios + interceptors│    JSON responses │ • models.py = tables    │
└──────────────────────┘                    └───────────┬─────────────┘
        Browser only                                    │
                                              ┌─────────▼─────────┐
                                              │     SQLite DB     │
                                              └───────────────────┘
```

Say:
> "Frontend never touches the database. Every action is an API call.
> Backend validates, runs logic, talks to DB, returns JSON."

Tech stack table (say it fast):

| Layer | Tech |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Database | SQLite |
| Frontend | React 19, Vite, React Router |
| HTTP client | Axios (with interceptors) |
| Auth | Token authentication |
| Notifications | react-hot-toast |
| QR / Payment | UPI QR via qrserver API (simulated flow) |
| Images | Pillow + Django media |

---

## 4. THE DATABASE (5 relationships is all you need)

```
Category ──1:N──▶ Product
Customer ──1:N──▶ Order ──1:N──▶ OrderItem ──N:1──▶ Product
ShoppingGroup ──1:N──▶ GroupCartItem
ShoppingGroup ──1:N──▶ PaymentStatus (one row per member)
StoreSettings ──▶ single row (UPI ID etc.)
```

⭐ Star answer — why OrderItem copies price:
> "Owner may change price tomorrow. Old bills must show price at purchase
> time, so I snapshot price into OrderItem instead of relying on the FK."

---

## 5. THREE FLOWS TO NARRATE (practice out loud ×3)

### FLOW A — Order (the main one)

```
Browse → Add to cart → Checkout (name/phone/payment)
    → POST /api/orders/
    → backend: validate → stock check → create Order (Pending)
      → create OrderItems (price snapshot) → reduce stock
      → generate GP-1001 number
    → success page → WhatsApp/copy number → track at /track
```

Status machine:

```
Pending → Preparing → Ready For Pickup → Collected
   └─────────┴──→ Cancelled (owner only)
```

### FLOW B — Auth

```
Login (phone+password) → backend verifies hash → returns TOKEN
→ saved in localStorage via AuthContext
→ Axios interceptor auto-attaches "Authorization: Token <t>"
→ backend checks token → allow or 401
```

Two systems + bug story (your best material):

> "Admin uses DRF's built-in Token model. Customers have their own token
> field on the Customer model. Problem: DRF's default auth raised 401 the
> moment it saw a customer token it didn't recognize — the view never ran.
> I wrote **LenientTokenAuthentication** that checks admin tokens first,
> then silently falls back to the customer table instead of raising."

### FLOW C — Group Bill Split (unique feature)

```
Create/join group via code
→ shared cart: anyone adds items, all see them
→ split: equal (total ÷ members) or custom amounts
→ backend creates PaymentStatus row PER member (paid=False)
→ each member marks ONLY their own row paid
→ dashboard shows who has/hasn't paid
```

If pushed: "Split logic runs on the backend — never trust client-side math."

---

## 6. ADMIN SIDE (30-second answer)

> "Owner logs into /admin dashboard: sees new orders with live notification
> badge, clicks Prepare → Mark Ready → customer sees status update and
> collects with the number. Owner also manages products, stock, daily
> offers and sets their UPI ID in settings."

Order of actions matters — show you designed the workflow, not just pages.

---

## 7. RAPID-FIRE Q&A (the exact questions asked at 4–5 LPA)

| They ask | You say |
|---|---|
| Why Django? | Batteries included: ORM, admin panel, auth free → solo dev speed |
| Why REST API + React instead of plain Django templates? | Separation: frontend independent, mobile app possible later, JSON APIs reusable |
| Why SQLite? | Zero config, fine for one store. Postgres = one settings line later |
| What's a serializer? | Converts model ↔ JSON + validates input before saving |
| What's a migration? | Version control for DB schema; makemigrations plans, migrate applies |
| How does cart persist? | React Context + localStorage — survives page refresh without login |
| What happens if two users buy last item? | Stock check at order creation; honest: "race condition possible — next step would be DB-level locking" |
| Payment real? | "Simulated UPI flow with real QR generation — integration-ready for Razorpay webhook." Honest + roadmap |
| Hardest part? | LenientTokenAuthentication story (Flow B) |
| Biggest learning? | "Designing the order state machine — thinking in statuses/transitions, not just pages" |
| What next? | Tests, deployment, live updates via websockets |

**Never bluff rule:** "Haven't used that yet, but my understanding is X."
This line saves more interviews than any memorized answer.

---

## 8. LIVE DEMO SCRIPT (if they say "show me" / screen share)

1. `/products` — browse, search, filter by category (10 sec)
2. Add 3 items → cart drawer opens (10 sec)
3. Checkout → pick Pay on Pickup → submit (15 sec)
4. **Show GP-number + copy button** (your signature moment)
5. New tab: admin dashboard → notification badge → Prepare → Ready (20 sec)
6. Back to `/track` → enter number → status updated (10 sec)
7. GroupsPage → shared cart + bill split (20 sec, end on unique feature)

Total: under 2 minutes. Rehearse the CLICK ORDER so nothing loads slowly.

---

## 9. TRAP QUESTIONS (know these 4 only)

1. **"Did AI help build this?"**
   → "I used AI tools for boilerplate while learning, but I can explain and
   modify every design decision — ask me anything about it."
   Then nail whatever they ask next. Confidence, not denial.
2. **"What if owner changes price after order placed?"** → Price snapshot in OrderItem (star answer).
3. **"Member leaves group mid-split?"** → "Good edge case — currently unpaid rows remain; I'd block leaving while splits are open."
4. **"How would you scale to 100 stores?"** → "Postgres + multi-tenant store model + deploy behind gunicorn/nginx. Architecture already separates API from UI so each scales independently."

---

## 10. ONE-DAY DRILL (repeat day before interview)

```
□ Pitch out loud ×5 (while walking, not reading)
□ Draw architecture + ER diagram on paper ×2, no peeking
□ Narrate Flow A, B, C out loud ×2 each
□ Run the app locally once — full demo script, timed under 2 min
□ Read Section 7 table twice
□ Sleep properly. Freezing costs more than forgetting.
```

---

## FINAL TRUTH

At 4–5 LPA they're checking ONE thing:
**"Can this person explain tech clearly and won't freeze under pressure?"**

You built a full-stack product with auth, payments flow, admin panel and a
genuinely unique feature. That's ahead of the average fresher pool.

Own the story. Say "I did X because Y." Collect the offer.
