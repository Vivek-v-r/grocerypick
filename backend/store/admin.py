from django.contrib import admin
from .models import Category, Product, Order, OrderItem, StoreSettings, Customer, DailyOffer, ShoppingGroup, GroupMember, SharedCartItem, BillSplit, PaymentStatus


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']
    search_fields = ['name']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_price', 'quantity']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'is_active', 'is_popular']
    list_filter = ['category', 'is_active', 'is_popular']
    search_fields = ['name']
    list_editable = ['price', 'stock', 'is_active', 'is_popular']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer_name', 'customer_phone',
                    'status', 'payment_method', 'payment_status', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_method', 'payment_status']
    search_fields = ['order_number', 'customer_name', 'customer_phone']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline]


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ['store_name', 'store_phone', 'upi_id']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'mobile', 'created_at']
    search_fields = ['name', 'mobile']
    readonly_fields = ['token', 'created_at']


@admin.register(DailyOffer)
class DailyOfferAdmin(admin.ModelAdmin):
    list_display = ['title', 'start_date', 'end_date', 'is_active', 'priority']
    list_filter = ['is_active']
    search_fields = ['title']


@admin.register(ShoppingGroup)
class ShoppingGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'unique_join_code', 'created_by', 'created_at']
    search_fields = ['name', 'unique_join_code']
    readonly_fields = ['unique_join_code', 'created_at']


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ['group', 'customer', 'joined_at']
    search_fields = ['group__name', 'customer__name']


@admin.register(SharedCartItem)
class SharedCartItemAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'group', 'added_by', 'price', 'quantity', 'is_purchased']
    list_filter = ['is_purchased']


@admin.register(BillSplit)
class BillSplitAdmin(admin.ModelAdmin):
    list_display = ['id', 'group', 'total_amount', 'split_type', 'created_at']


@admin.register(PaymentStatus)
class PaymentStatusAdmin(admin.ModelAdmin):
    list_display = ['bill', 'customer', 'amount_owed', 'status']
    list_filter = ['status']
