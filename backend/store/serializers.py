from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, StoreSettings, Customer, DailyOffer, ShoppingGroup, GroupMember, SharedCartItem, BillSplit, PaymentStatus


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'category', 'category_name', 'name', 'description',
                  'price', 'unit', 'image', 'image_url', 'stock', 'in_stock',
                  'is_active', 'is_popular', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'subtotal']


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'customer', 'customer_name', 'customer_phone',
                  'customer_address', 'status', 'status_display', 'payment_method',
                  'payment_method_display', 'payment_status', 'transaction_id',
                  'total_amount', 'discount_amount', 'final_amount',
                  'notes', 'items', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    customer = serializers.IntegerField(required=False, allow_null=True)
    customer_name = serializers.CharField(max_length=150)
    customer_phone = serializers.CharField(max_length=15)
    customer_address = serializers.CharField(max_length=1000)
    payment_method = serializers.ChoiceField(choices=['upi', 'pickup'])
    transaction_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    items = OrderItemCreateSerializer(many=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Order must have at least one item.")
        return items

    def validate(self, data):
        return data


class TrackOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    customer_phone = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'customer_name', 'customer_phone',
                  'status', 'status_display', 'payment_method',
                  'payment_method_display', 'payment_status', 'transaction_id',
                  'total_amount', 'discount_amount', 'final_amount',
                  'notes', 'items', 'created_at', 'updated_at']

    def get_customer_phone(self, obj):
        phone = obj.customer_phone
        if len(phone) > 4:
            return '*' * (len(phone) - 4) + phone[-4:]
        return phone

    def get_customer_name(self, obj):
        name = obj.customer_name
        if len(name) > 2:
            return name[0] + '*' * (len(name) - 2) + name[-1]
        return name


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = ['store_name', 'store_address', 'store_phone', 'store_hours', 'upi_id', 'upi_name']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'mobile', 'password', 'created_at']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class CustomerProfileSerializer(serializers.ModelSerializer):
    total_orders = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'name', 'mobile', 'total_orders', 'recent_orders', 'created_at']

    def get_total_orders(self, obj):
        return obj.orders.count()

    def get_recent_orders(self, obj):
        orders = obj.orders.all()[:5]
        return OrderSerializer(orders, many=True).data


class CustomerOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'status', 'status_display', 'payment_method',
                  'payment_method_display', 'payment_status', 'total_amount',
                  'discount_amount', 'final_amount', 'items', 'created_at']


class ReorderSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField(), read_only=True)
    message = serializers.CharField(read_only=True)


class ShoppingGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = ShoppingGroup
        fields = ['id', 'name', 'unique_join_code', 'created_by', 'created_by_name', 'member_count', 'created_at']
        read_only_fields = ['unique_join_code', 'created_by', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()


class GroupMemberSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = GroupMember
        fields = ['id', 'group', 'customer', 'customer_name', 'joined_at']
        read_only_fields = ['joined_at']


class SharedCartItemSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source='added_by.name', read_only=True)

    class Meta:
        model = SharedCartItem
        fields = ['id', 'group', 'added_by', 'added_by_name', 'item_name', 'price', 'quantity', 'is_purchased', 'created_at']
        read_only_fields = ['group', 'added_by', 'created_at']


class PaymentStatusSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = PaymentStatus
        fields = ['id', 'bill', 'customer', 'customer_name', 'amount_owed', 'status']
        read_only_fields = ['bill', 'customer', 'amount_owed']


class BillSplitSerializer(serializers.ModelSerializer):
    payments = PaymentStatusSerializer(many=True, read_only=True)

    class Meta:
        model = BillSplit
        fields = ['id', 'group', 'total_amount', 'split_type', 'payments', 'created_at']
        read_only_fields = ['created_at']


class DailyOfferSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = DailyOffer
        fields = ['id', 'title', 'description', 'image', 'image_url',
                  'start_date', 'end_date', 'priority', 'is_active',
                  'is_expired', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_is_expired(self, obj):
        from django.utils import timezone
        return obj.end_date < timezone.now()
