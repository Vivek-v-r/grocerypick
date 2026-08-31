from django.urls import path
from . import views

urlpatterns = [
    # Auth (admin)
    path('auth/login/', views.admin_login),
    path('auth/logout/', views.admin_logout),

    # Store
    path('store/settings/', views.store_settings),
    path('store/settings/update/', views.update_store_settings),

    # Categories
    path('categories/', views.CategoryListView.as_view()),
    path('categories/create/', views.create_category),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view()),

    # Products (public)
    path('products/', views.ProductListView.as_view()),
    path('products/<int:pk>/', views.ProductDetailView.as_view()),

    # Products (admin)
    path('admin/products/', views.AdminProductListCreateView.as_view()),
    path('admin/products/<int:pk>/', views.AdminProductDetailView.as_view()),

    # Orders (public)
    path('orders/', views.create_order),
    path('orders/track/<str:order_number>/', views.track_order),

    # Orders (admin)
    path('admin/orders/', views.AdminOrderListView.as_view()),
    path('admin/orders/<int:pk>/', views.order_detail),
    path('admin/orders/<int:pk>/status/', views.update_order_status),
    path('admin/dashboard/', views.dashboard_stats),

    # Customer Auth
    path('customer/register/', views.customer_register),
    path('customer/login/', views.customer_login),
    path('customer/logout/', views.customer_logout),
    path('customer/profile/', views.customer_profile),
    path('customer/forgot-password/', views.customer_forgot_password),

    # Customer Orders
    path('customer/orders/', views.customer_orders),
    path('customer/reorder/<int:order_id>/', views.reorder),

    # Daily Offers
    path('offers/', views.ActiveOffersView.as_view()),
    path('admin/offers/', views.AdminOffersListCreateView.as_view()),
    path('admin/offers/<int:pk>/', views.AdminOffersDetailView.as_view()),
    path('admin/offers/<int:pk>/toggle/', views.toggle_offer),

    # Shared Group Cart & Bill Splitting
    path('groups/create/', views.create_group, name='create-group'),
    path('groups/join/', views.join_group, name='join-group'),
    path('groups/my/', views.my_groups, name='my-groups'),
    path('groups/<int:group_id>/', views.group_details, name='group-details'),
    path('groups/<int:group_id>/cart/', views.group_cart, name='group-cart'),
    path('groups/<int:group_id>/cart/<int:item_id>/', views.delete_cart_item, name='delete-cart-item'),
    path('groups/<int:group_id>/cart/<int:item_id>/toggle/', views.toggle_item_purchased, name='toggle-item-purchased'),
    path('groups/<int:group_id>/split-bill/', views.split_bill, name='split-bill'),
    path('payments/<int:payment_id>/status/', views.update_payment_status, name='update-payment-status'),
]
