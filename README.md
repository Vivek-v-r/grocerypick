# 🛒 GroceryPick — Smart Grocery Pre-Order & Pickup System

> **"Order from anywhere, Pick up in minutes."**

## What It Solves

| Problem                                                              | Solution                                        |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| Customers waste time inside the store (selecting, billing, packing)  | Pre-order online → walk in, collect in 1–2 min  |
| The person who knows what's needed ≠ the person who visits the store | Share the pickup order number via WhatsApp/copy |

---

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
```

### Environment variables

Create environment variables for production before starting the backend:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=example.com,www.example.com`
- `DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000`

### 2. Start Backend

```bash
# Double-click start-backend.bat OR:
cd backend
python manage.py runserver
```

Backend runs at → **http://localhost:8000**

### 3. Start Frontend

```bash
# Double-click start-frontend.bat OR:
cd frontend
npm install
npm run dev
```

Frontend runs at → **http://localhost:3000**

---

## Access Points

| URL                            | Description         |
| ------------------------------ | ------------------- |
| http://localhost:3000          | Customer Store      |
| http://localhost:3000/products | Browse All Products |
| http://localhost:3000/checkout | Checkout            |
| http://localhost:3000/track    | Track Order         |
| http://localhost:3000/admin    | Owner Dashboard     |
| http://localhost:8000/admin    | Django Admin        |

---

## Admin Login

| Field    | Value                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Username | actual superuser username created in Django (e.g. `VIVEK`, `VIVEKK`)       |
| Password | set during deployment or with `python manage.py changepassword <username>` |

---

## User Flow

### Customer

1. Browse products at `/products`
2. Add to cart
3. Checkout → Enter name, phone, address
4. Choose payment: **UPI** or **Pay on Pickup**
5. Receive **Pickup Order Number** (e.g. `GP-1001`)
6. Share via WhatsApp or copy
7. Anyone walks in with that number → collects in 1–2 min
8. Track status at `/track`

### Shop Owner

1. Login at `/admin`
2. See new orders with live notification badge
3. Click **Prepare** → packs order
4. Click **Mark Ready** → customer is notified
5. Customer collects → click **Mark Collected**
6. Manage products, update stock, set UPI ID

---

## Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Backend       | Django 4.2 + Django REST Framework |
| Database      | SQLite                             |
| Frontend      | React 19 + Vite                    |
| Routing       | React Router v6                    |
| HTTP          | Axios                              |
| Notifications | react-hot-toast                    |
| Auth          | Token Authentication               |
| Images        | Pillow + Django Media              |
| Payment       | UPI QR via QR Server API           |

---

## Project Structure

```
GP.1/
├── backend/
│   ├── groceryproject/
│   │   ├── settings.py
│   │   └── urls.py
│   └── store/
│       ├── models.py       # Category, Product, Order, OrderItem, StoreSettings
│       ├── serializers.py
│       ├── views.py        # All API endpoints
│       ├── urls.py
│       ├── admin.py
│       └── migrations/
│           ├── 0001_initial.py
│           └── 0002_seed_data.py   # 8 categories + 18 products
│
├── frontend/
│   └── src/
│       ├── context/
│       │   ├── CartContext.jsx   # Cart state (localStorage)
│       │   └── AuthContext.jsx   # Admin auth state
│       ├── services/
│       │   └── api.js           # All API calls
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── CartDrawer.jsx
│       │   └── ProductCard.jsx
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── ProductsPage.jsx
│       │   ├── CheckoutPage.jsx
│       │   ├── OrderSuccessPage.jsx
│       │   └── TrackOrderPage.jsx
│       ├── admin/
│       │   ├── AdminLoginPage.jsx
│       │   ├── AdminLayout.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminOrders.jsx
│       │   ├── AdminProducts.jsx
│       │   └── AdminSettings.jsx
│       ├── styles.css      # Full design system
│       └── App.jsx
│
├── start-backend.bat
├── start-frontend.bat
└── README.md
```

---

## Order Number Format

```
GP-1001
GP-1002
GP-1003
...
```

---

## Order Status Flow

```
Pending → Preparing → Ready For Pickup → Collected
```

Owner can also **Cancel** from Pending or Preparing.

---

## Seed Data

18 products across 8 categories loaded on first migration:

- Fruits & Vegetables, Dairy & Eggs, Bakery, Beverages
- Snacks, Grains & Pulses, Oil & Spices, Personal Care
