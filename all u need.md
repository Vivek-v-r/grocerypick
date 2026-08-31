# 🎯 ALL U NEED — Fresher Interview Cracking Guide (GroceryPick Edition)

Read top to bottom. Diagrams first, words after.
Rule of the game: Interviewers test DEPTH on 2–3 things and BASICS everywhere else.

---

## PART 0 — HOW FREShER INTERVIEWS ACTUALLY WORK

Typical rounds:

| Round | What happens | How to pass |
|---|---|---|
| 1 | Aptitude + basic coding MCQs | Practice percentages, series, easy LeetCode |
| 2 | Technical: project + fundamentals | THIS guide |
| 3 | Deep dive / scenarios / "why" | Project defense + honesty |
| 4 | HR | Calm + positive attitude |

Where freshers ACTUALLY fail:
- Can't explain their own project without notes
- Panic on basic "why" questions (why Django? why REST?)
- Zero SQL by hand
- Give up instantly on simple coding problems

Where they DON'T fail:
- Not knowing every line of the project (nobody does)
- Advanced topics (not expected from freshers)

**Your strategy = defend GroceryPick cold + solid basics = 90% of the game.**

---

## PART 1 — YOUR PROJECT DEFENSE (the money section)

### 1.1 System Architecture (draw this on any whiteboard)

```
    ┌─────────────────┐         HTTP/JSON          ┌──────────────────┐
    │   REACT (Vite)  │  ───────────────────────▶  │  DJANGO REST API │
    │                 │      Axios requests        │                  │
    │ localhost:3000  │  ◀───────────────────────  │  localhost:8000  │
    └────────┬────────┘       JSON responses       └────────┬─────────┘
             │                                              │
       Browser only                                 ┌───────▼───────┐
       (UI + state)                                 │  SQLite (DB)  │
                                                    └───────────────┘
```

Say it like this:
> "React handles ONLY the UI. It never touches the database.
> Everything goes through REST API calls via Axios.
> Backend validates, runs logic, talks to DB, returns JSON."

### 1.2 Database Design (know these relationships COLD)

```
    Category ──1:N──▶ Product
                          ▲
                          │ N:1
    Customer ──1:N──▶ Order ──1:N──▶ OrderItem
                                          ▲
                                          │ FK
                                       Product

    ShoppingGroup ──1:N──▶ GroupCartItem
          │
          ├──1:N──▶ Members (customers join groups)
          └──1:N──▶ PaymentStatus (one row per member per split)

    StoreSettings ──▶ singleton row (UPI ID, store info)
```

One-liner per table:
- **Category** → groups products (Fruits, Dairy...)
- **Product** → name, price, stock, image, FK category
- **Order** → customer info, total, status, GP-number
- **OrderItem** → snapshot of product + qty + price at purchase time
- **Customer** → name, phone, hashed password, token
- **ShoppingGroup** → family/roommates sharing one cart
- **PaymentStatus** → who owes what after bill split, paid or not

⭐ **Star answer:** Why does OrderItem store a price COPY?
> "If owner changes price tomorrow, old orders must show price at
> purchase time. So I snapshot the price into OrderItem."

This one answer sounds senior-level. Use it.

### 1.3 Order Flow (trace this end-to-end OUT LOUD until smooth)

```
 [Browse]──▶[Add to Cart]──▶[Cart Drawer]──▶[Checkout]
                                                 │
                                    name+phone+payment choice
                                                 ▼
                                      POST /api/orders/
                                                 │
              ┌──────────────────────────────────▼───────────────────┐
              │ BACKEND:                                             │
              │ 1. serializer validates data                         │
              │ 2. stock check per item                              │
              │ 3. create Order (status=Pending)                     │
              │ 4. create OrderItems (price snapshot)                │
              │ 5. reduce Product.stock                              │
              │ 6. generate GP-number                                │
              │ 7. return order JSON                                 │
              └──────────────────────────────────┬───────────────────┘
                                                 ▼
                              [Success page: GP number + share button]
```

Status machine:

```
   Pending ──▶ Preparing ──▶ Ready For Pickup ──▶ Collected
      │            │
      └────────────┴──▶ Cancelled (owner only, before ready)
```

### 1.4 Auth Flow (your BEST story — rehearse exactly)

```
 LOGIN:
   POST /api/login/ (phone + password)
        │
        ▼
   backend verifies hash ──▶ returns TOKEN string
        │
        ▼
   Frontend stores token in localStorage via Context
        │
        ▼
   Axios interceptor adds header on EVERY request:
        Authorization: Token abc123...
        │
        ▼
   Backend auth class checks token → allow or 401
```

TWO auth systems:

```
   Admin    ──▶ Django built-in User + DRF Token model
   Customer ──▶ custom Customer model with own token field
```

**The bug story (tell problem → why it broke → your fix):**
> "DRF's default TokenAuthentication raised 401 immediately when a
> CUSTOMER token arrived, because it only knows ADMIN tokens — the
> view never even ran."
>
> "Fix: I wrote LenientTokenAuthentication — checks admin token first;
> if not found, falls back silently to the customer token table instead
> of raising. Views then decide permissions themselves."

This story alone beats 10 textbook answers.

### 1.5 Group Bill Split (unique feature — expect deep questions)

```
 Create/Join group (shareable code)
        │
        ▼
 Shared cart: anyone adds GroupCartItem → all members see it live
        │
        ▼
 Split request → backend totals the cart
        ├── equal mode:   total ÷ member count
        └── custom mode:  each member enters own amount
        │
        ▼
 Creates PaymentStatus row PER MEMBER (amount, paid=False)
        │
        ▼
 Member marks ONLY THEIR OWN row paid
        │
        ▼
 PaymentDashboard: who paid ✅ / pending ⏳
```

Ready answers:
- **"What if a member leaves mid-split?"** → Their unpaid rows stay; group can re-split remaining. Honest answer if not implemented: "Good edge case — I'd block leaving while splits are open. That's my next step." (Honesty > bluffing.)
- **"Why backend calculates the split?"** → "Never trust the client. Client could send fake amounts."

---

## PART 2 — PROJECT RAPID-FIRE Q&A (memorize the SHAPE of answers)

| Question | Your answer |
|---|---|
| Explain your project in 30 sec | Use pitch: "GroceryPick is a pre-order & pickup system... unique feature is group shopping with auto bill split..." (see files_to_know_for_interview.txt) |
| Why Django? | "Batteries included — ORM, admin panel, auth built-in. For a solo fresher build, that's speed without losing structure." |
| Why DRF and not plain Django? | "Plain Django returns HTML; I needed JSON APIs for React. DRF gives serializers, auth classes, browsable API for free." |
| Why React? | "Component reuse (ProductCard everywhere), fast state updates for cart, huge ecosystem." |
| Why SQLite? | "Zero-config dev DB, perfect for single-store scale. Swapping to Postgres is one settings change — Django abstracts the DB." |
| Why pickup not delivery? | "Target = small kirana stores. No fleet needed. Proven model: BOPIS at Walmart/Target." |
| Hardest bug? | LenientTokenAuthentication story (Part 1.4) |
| What if 10,000 users? | "Move to Postgres, add pagination + throttling, gunicorn workers behind nginx, cache product list. Architecture already separates concerns so it scales horizontally." |
| Payment real? | "No — simulated flow with UPI QR generation via qrserver.com. Integration-ready: swap in Razorpay webhook on order create." ← honest + shows roadmap |
| What would you improve? | "Tests, deployment, and moving group chat/websockets live updates." |

**Golden rule:** never bluff. If unknown → "Haven't used that yet, but my understanding is X — happy to be corrected." Interviewers respect this.

---

## PART 3 — PYTHON BASICS (asked in EVERY fresher round)

### Must-answer cold:

```
list vs tuple      → mutable vs immutable
dict               → key:value, O(1) average lookup
set                → unique items, no order
== vs is           → value equality vs same object in memory
shallow vs deep copy → copy shares nested objects / fully independent
*args/**kwargs     → variable positional args / keyword args
list slicing       → a[1:4], a[::-1] reverses
```

### OOP in 60 seconds:

```
class Dog(Animal):          # class inherits from Animal
    def __init__(self, n):  # constructor
        self.name = n       # instance attribute
    def speak(self):        # method
        return f"{self.name} barks"
```

- **Encapsulation** → bundle data+methods, hide internals
- **Inheritance** → Dog extends Animal, reuses code
- **Polymorphism** → same method name, different behavior per class
- **Django link:** "Models are classes inheriting models.Model — inheritance in action."

### Code they WILL ask (write on paper, no IDE):

```python
# Reverse string
s[::-1]

# Palindrome check
s == s[::-1]

# Count vowels
sum(1 for c in s if c.lower() in 'aeiou')

# Find duplicates
seen, dupes = set(), set()
for x in arr:
    if x in seen: dupes.add(x)
    seen.add(x)

# FizzBuzz
for i in range(1, 16):
    print("FizzBuzz" if i%15==0 else "Fizz" if i%3==0 else "Buzz" if i%5==0 else i)
```

---

## PART 4 — SQL (freshers get rejected HERE, not on DSA)

Learn by writing these 10 BY HAND:

```sql
-- 1. All products above ₹100
SELECT * FROM store_product WHERE price > 100;

-- 2. Product names with category name (JOIN)
SELECT p.name, c.name
FROM store_product p
JOIN store_category c ON p.category_id = c.id;

-- 3. Count orders per status
SELECT status, COUNT(*) FROM store_order GROUP BY status;

-- 4. Top 5 customers by total spend
SELECT o.customer_id, SUM(o.total) AS spend
FROM store_order o
GROUP BY o.customer_id
ORDER BY spend DESC LIMIT 5;

-- 5. Products never ordered
SELECT p.name FROM store_product p
LEFT JOIN store_orderitem oi ON oi.product_id = p.id
WHERE oi.id IS NULL;

-- 6. Second highest price
SELECT MAX(price) FROM store_product
WHERE price < (SELECT MAX(price) FROM store_product);

-- 7. Update stock after order
UPDATE store_product SET stock = stock - 5 WHERE id = 1;

-- 8. Orders today
SELECT * FROM store_order WHERE DATE(created_at) = CURDATE();

-- 9. Delete cancelled orders
DELETE FROM store_order WHERE status = 'CANCELLED';

-- 10. Customers with more than 3 orders (HAVING)
SELECT customer_id, COUNT(*) c FROM store_order
GROUP BY customer_id HAVING c > 3;
```

Concept map:

```
WHERE  = filter ROWS            GROUP BY = bucket rows
HAVING = filter GROUPS          JOIN = combine tables on key
INNER  = only matches           LEFT = all left + matches (NULL right)
ORDER BY = sort                 LIMIT = cap results
```

Classic trap: **WHERE vs HAVING** → WHERE before grouping, HAVING filters aggregated groups.

---

## PART 5 — HTTP, REST & APIs (guaranteed questions)

### HTTP methods:

```
GET    → read      /api/products/       (safe, no body changes)
POST   → create    POST /api/orders/
PUT    → replace   whole record
PATCH  → partial   update one field (order status)
DELETE → remove
```

### Status codes (know these 8):

```
200 OK          → success
201 Created     → new order created
400 Bad Request → your input is wrong (validation failed)
401 Unauthorized→ not logged in / bad token
403 Forbidden   → logged in but not allowed (customer hitting admin API)
404 Not Found   → no such GP-number
429 Too Many Requests → rate limit
500 Internal Server Error → YOUR code crashed
```

Trap: **401 vs 403** → 401 = "who are you?", 403 = "I know you, but no."

### REST in one picture:

```
URL = RESOURCE (noun)        METHOD = ACTION (verb)

GET    /api/products/        → list all
GET    /api/products/5/      → one product
POST   /api/products/        → create
PATCH  /api/products/5/      → update price
DELETE /api/products/5/      → remove

Stateless: every request carries everything needed (token),
server remembers nothing between requests.
```

### CORS (they love this one because you USED it):

```
Browser blocks: React(localhost:3000) ──▶ Django(localhost:8000)
because different origins. Server must say "I allow this origin".
Fix: django-cors-headers + DJANGO_CORS_ALLOWED_ORIGINS setting.
CORS is a BROWSER rule — Postman doesn't care.
```

---

## PART 6 — DJANGO / DRF MINIMUM

### Request lifecycle (draw it):

```
Request → URL router (urls.py) → View (views.py)
       → Serializer validates input
       → Models/ORM touch DB
       → Serializer converts back to JSON
       → Response
```

### Concepts with one-liners:

- **MVT** → Model=DB table, View=request handler, Template=HTML. "DRF replaces Template with JSON."
- **ORM** → Python classes auto-map to tables. `Product.objects.filter(price__gt=100)` = SQL WHERE.
- **Migration** → version control for DB schema. makemigrations creates plan, migrate applies.
- **Serializer** → Model ↔ JSON converter + validation gate.
- **@api_view** → decorator turning a function into an API endpoint with DRF request/response.
- **Middleware** → code running on EVERY request (auth check, CORS).
- **settings.py** → single config file; DB, apps, auth, CORS.

### ORM you should be able to write:

```python
Product.objects.filter(category__name="Dairy")           # JOIN via FK
Product.objects.filter(price__gte=50).order_by("-price") # DESC sort
Order.objects.filter(status="PENDING").count()
Product.objects.get(id=5)          # exactly one or raises
Product.objects.first()
Order.objects.select_related("customer")   # avoid N+1 queries ← bonus points
```

**N+1 trap question:** "You loop orders and print customer name — how many queries?"
→ 1 for orders + N per loop = N+1. Fix: `select_related` (FK) / `prefetch_related` (reverse/M2M).

---

## PART 7 — REACT / JS MINIMUM

### Core hooks:

```jsx
const [cart, setCart] = useState([]);        // state that triggers re-render

useEffect(() => {                            // runs AFTER render
  fetchProducts();
}, []);                                      // [] = once on mount
// [cart] = re-run whenever cart changes
// cleanup return = runs on unmount
```

- **Component** → reusable UI function returning JSX
- **Props** → data passed DOWN parent → child (read-only)
- **State** → data a component owns and can change
- **Context API** → global data (auth, cart) without prop drilling — "that's how my AuthContext works"
- **React Router** → client-side routing, URL changes without page reload
- **Axios interceptor** → middleware for HTTP calls; mine attaches the token to every request automatically

### Component tree of YOUR app (draw if asked):

```
App
 ├── Navbar
 ├── Routes
 │    ├── HomePage
 │    ├── ProductsPage ──▶ ProductCard × N
 │    ├── CheckoutPage
 │    ├── TrackOrderPage
 │    ├── GroupsPage ──▶ GroupManager
 │    │                 ├─ SharedCart
 │    │                 ├─ BillSplitter
 │    │                 └─ PaymentDashboard
 │    └── /admin/* ──▶ AdminLayout ──▶ Dashboard/Orders/Products/Settings
 ├── CartDrawer (global)
 └── Contexts: CustomerAuthContext, CartContext (localStorage-backed)
```

### JS quick hits:

```
let/const vs var     → block scope vs function scope (avoid var)
=== vs ==            → strict equality, no type coercion
arrow functions      → () => {}, inherit `this`
map/filter/reduce    → transform / select / aggregate arrays
async/await          → readable promises; try/catch for errors
JSON.stringify/parse → object ↔ string (how cart persists to localStorage)
```

---

## PART 8 — DSA MINIMUM (30 problems, that's enough)

### Big-O in one picture:

```
O(1)  <  O(log n)  <  O(n)  <  O(n log n)  <  O(n²)
dict     binary       loop     good sort      nested loops
lookup   search

Say: "My stock check loops items once → O(n).
      Dict lookups are O(1) average."
```

### Patterns to know (in priority order):

1. **Hashing** → two sum, first non-repeating char, duplicates
2. **Two pointers** → reverse, palindrome, pair-sum on sorted array
3. **Sliding window** → longest substring without repeat
4. **Basic sorting** → know bubble concept + why built-in sort is O(n log n)
5. **Binary search** → classic on sorted array
6. **Strings** → reverse words, anagram check, vowel count
7. **Recursion basic** → factorial, fibonacci (and memoization mention)

### Template answers:

```python
# Two Sum (hashmap, O(n))
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target-n], i]
        seen[n] = i

# Binary Search
def bsearch(a, t):
    lo, hi = 0, len(a)-1
    while lo <= hi:
        m = (lo+hi)//2
        if a[m] == t: return m
        if a[m] < t: lo = m+1
        else: hi = m-1
    return -1
```

**Interview behavior rules:**
- Think OUT LOUD before coding — silence reads as panic
- Confirm input/output with an example FIRST
- Stuck? Start with brute force ("I'd do O(n²), then optimize with a hashmap")
- Never submit silently — walk through your code with an example after writing

---

## PART 9 — HR ROUND (free marks if you don't fumble)

Prepare these 5 answers tonight, out loud:

1. **Tell me about yourself** → present → past → future.
   "Final-year/fresher developer focused on full-stack web. Built GroceryPick — Django REST + React pre-order pickup system with group bill-splitting. Comfortable across Python backend and React frontend. Looking to join a team where I can ship real features and learn from code reviews."
2. **Strength** → "I finish things end-to-end" + proof = this project (frontend+backend+auth+admin all wired together).
3. **Weakness** → pick REAL + improving. "I used to over-engineer small features; now I timebox and ship, then iterate." NOT "I'm a perfectionist" cliché.
4. **Why should we hire you?** → "I can contribute from day one on CRUD features, and I've proven I can take a product idea to working software alone."
5. **Salary expectation** → "As a fresher I'm flexible — learning and growth matter most; I trust your standard band."

Also ready: relocation YES, bond read-before-signing, night shifts honest answer.

Questions YOU ask (always ask ≥1):
- "What does the tech stack here look like day-to-day?"
- "What would my first 3 months look like?"
- "How does the team do code reviews?"

---

## PART 10 — YOUR PREP PLAN (14 days)

```
Days 1–3   Project defense: Part 1 out loud ×3 each day.
           Open your actual files alongside; map story ↔ code.
Days 4–6   Python basics + write the 6 code snippets by hand.
Days 7–8   SQL: write all 10 queries without peeking.
Days 9–10  HTTP/REST/Django parts. Explain CORS + N+1 to a wall.
Days 11–12 React part + DSA patterns 1–3 (15 easy problems).
Days 13    Full mock: pitch → project grilling → live coding → HR.
Days 14    Weak-spot review ONLY. Sleep. Don't cram new topics.
```

Daily non-negotiables:
- 1× 30-sec pitch out loud
- 2× LeetCode easy
- 1× SQL query written by hand

---

## LAST-MINUTE CHEAT SHEET (read morning of interview)

```
ARCH        React(Axios) ──JSON──▶ DRF views ──ORM──▶ SQLite
WHY SPLIT   OrderItem snapshots price → old orders stay correct
AUTH        admin=DRF Token | customer=custom token | LenientAuth fix
STATUS      Pending→Preparing→Ready→Collected (+Cancelled)
SPLIT       total ÷ members → PaymentStatus per member → self-mark paid
401 vs 403  who are you vs you can't do this
WHERE/HAVIN filter rows vs filter groups
N+1         loop+query → select_related fixes it
CORS        browser blocks cross-origin; server allows via header
BIG-O       dict O(1), sort O(n logn), nested O(n²)
BLUFF RULE  never bluff → "haven't used it, but I understand X"
```

You built something real. Walk in like it's yours — because it is.



