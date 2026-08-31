# 🚀 Upgrade Plan: 7 → 9

Exact steps to push GroceryPick from a good fresher project to a standout one.
Do them in order — each one is independently worth showing in an interview.

---

## 1. Deploy It (biggest single jump)

Free options that work for Django + React:

- **Backend:** Render.com free tier (or Railway / PythonAnywhere)
  - Push code to GitHub first
  - Add `gunicorn` + `whitenoise` to `backend/requirements.txt`
  - Set env vars: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`
  - Run `python manage.py migrate` + `collectstatic` on deploy
- **Frontend:** Vercel or Netlify (free)
  - Build command: `npm run build`, publish `dist/`
  - Point API base URL (in `frontend/src/services/api.js`) to the deployed backend
  - Add deployed frontend URL to `DJANGO_CORS_ALLOWED_ORIGINS`

**Result:** a live link in your resume → recruiter can click and use it.

---

## 2. Add API Tests (~10 tests is enough)

Create `backend/store/tests.py` tests for the core flows:

- [ ] Product list returns seeded products
- [ ] Cart → create order → order number starts with `GP-`
- [ ] Order status flow: Pending → Preparing → Ready → Collected
- [ ] Cannot order more than available stock
- [ ] Admin endpoints reject unauthenticated requests (token auth works)
- [ ] Group bill split math (equal split) is correct

Run with:

```bash
cd backend
python manage.py test
```

**Interview line:** "I have X% coverage on the order flow" beats "I wrote a lot of code."

---

## 3. Record a 2-Minute Demo Video

- [ ] Screen record: browse → add to cart → checkout → UPI QR → order number
- [ ] Show admin dashboard receiving the order live (second browser window)
- [ ] Mark Ready → show customer tracking page update
- [ ] Show group shopping + bill split (your unique feature!)
- Upload to YouTube (unlisted) → put the link at the top of README

---

## 4. Polish the README

- [ ] Add screenshots (store page, cart, UPI QR, admin dashboard, group split)
- [ ] Add live demo link + demo video link at top
- [ ] Add an architecture diagram (frontend ↔ REST API ↔ SQLite/Postgres)

---

## 5. Small Wins (pick any 2–3)

- [ ] **Switch SQLite → PostgreSQL** on the deployed version (shows production thinking)
- [ ] **Dockerfile + docker-compose.yml** so anyone can run it with one command
- [ ] **Pagination** on product list API (`?page=2`) — trivial to add in DRF
- [ ] **Rate-limit / throttle** the order creation endpoint (DRF built-in throttling)
- [ ] **Logging**: log every order status change (Django `LOGGING` setting)
- [ ] Move hardcoded values (UPI ID etc.) fully into `StoreSettings` model/env vars
- [ ] `.env.example` file committed, real `.env` gitignored

---

## 6. Interview Prep (do after building)

Be ready to answer WITHOUT notes:

- Why DRF over plain Django views?
- How does token auth work end-to-end here?
- Walk through what happens when an order is placed (models touched, status created)
- How does group bill splitting work? (data model + edge cases: someone leaves group?)
- What would break at 10,000 concurrent users, and what would you change first?

---

## ✅ Definition of Done (9/10)

| Item                         | Status |
| ---------------------------- | ------ |
| Live deployed link           | ⬜     |
| 10+ passing tests            | ⬜     |
| Demo video linked in README  | ⬜     |
| Screenshots in README        | ⬜     |
| Can explain design w/o notes | ⬜     |
