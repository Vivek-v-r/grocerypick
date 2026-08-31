# TODO

## Completed

- Repo inspection completed (models/auth/views/serializers/urls/api.js).
- Fixed `Product.bulk_import()` docstring — removed non-existent `mrp` field from example.
- Fixed `Order.save()` order number collision — added `select_for_update()` in an atomic block.
- Fixed `verify_endpoints.py` — removed duplicate `groceryproject` sys.path entry.
- Fixed `Product.in_stock` property — handles `None` stock without TypeError.
- Registered `Customer` and `DailyOffer` in Django admin.
- Fixed frontend API baseURL to use relative `/api` (Vite proxy).
- Added `ErrorBoundary` component wrapping all routes.
- Added 401 auto-redirect interceptor in api.js.
- Removed unused `showFilters` variable in CustomerOrdersPage.
- Extracted duplicated UPI payment code into shared `UpiPaymentBlock` component.

## Remaining

1. Run backend endpoint verification again.
2. Run lint/build for frontend/backend if available (build verified OK; lint has 49 pre-existing errors).
