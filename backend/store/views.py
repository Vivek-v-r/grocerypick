from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model, logout

from django.db.models import Count, Q
from .models import Category, Product, Order, OrderItem, StoreSettings, Customer, DailyOffer, ShoppingGroup, GroupMember, SharedCartItem, BillSplit, PaymentStatus
from .serializers import (
    CategorySerializer, ProductSerializer, OrderSerializer,
    OrderCreateSerializer, StoreSettingsSerializer, TrackOrderSerializer,
    CustomerSerializer, CustomerProfileSerializer, CustomerOrderSerializer,
    DailyOfferSerializer, ShoppingGroupSerializer, GroupMemberSerializer,
    SharedCartItemSerializer, BillSplitSerializer, PaymentStatusSerializer
)


# ─── Auth ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    username = str(request.data.get('username', '')).strip()
    password = str(request.data.get('password', ''))

    if not username or not password:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(username=username, password=password)
    if not user:
        User = get_user_model()
        case_insensitive_user = User.objects.filter(username__iexact=username).first()
        if case_insensitive_user:
            user = authenticate(username=case_insensitive_user.username, password=password)

    if user and user.is_staff:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'username': user.username})
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_logout(request):
    if hasattr(request.user, 'auth_token'):
        request.user.auth_token.delete()
    logout(request)
    return Response({'message': 'Logged out'})


# ─── Store Settings ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def store_settings(request):
    settings_obj, _ = StoreSettings.objects.get_or_create(pk=1)
    return Response(StoreSettingsSerializer(settings_obj).data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_store_settings(request):
    settings_obj, _ = StoreSettings.objects.get_or_create(pk=1)
    serializer = StoreSettingsSerializer(settings_obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Categories ───────────────────────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_category(request):
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Products ─────────────────────────────────────────────────────────────────

class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True)
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        popular = self.request.query_params.get('popular')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(category__name__icontains=search))
        if category:
            try:
                category_id = int(category)
                qs = qs.filter(category_id=category_id)
            except ValueError:
                pass  # Ignore invalid category filter
        if popular == 'true':
            qs = qs.filter(is_popular=True)
        return qs

    def get_serializer_context(self):
        return {'request': self.request}


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}


class AdminProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        return {'request': self.request}


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        return {'request': self.request}

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save()
        return Response({'message': 'Product deactivated'}, status=status.HTTP_200_OK)


# ─── Orders ───────────────────────────────────────────────────────────────────

from django.db import transaction

@api_view(['POST'])
@permission_classes([AllowAny])
def create_order(request):
    serializer = OrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    items_data = data.pop('items')

    # Aggregate quantities per product to prevent stock bypass
    aggregated_items = {}
    for item in items_data:
        pid = item['product_id']
        aggregated_items[pid] = aggregated_items.get(pid, 0) + item['quantity']

    # Resolve customer if provided
    customer_id = data.pop('customer', None)
    customer = None
    if customer_id:
        try:
            customer = Customer.objects.get(pk=customer_id)
        except Customer.DoesNotExist:
            pass

    with transaction.atomic():
        total = 0
        order_items = []
        for pid, qty in aggregated_items.items():
            try:
                product = Product.objects.select_for_update().get(id=pid, is_active=True)
            except Product.DoesNotExist:
                return Response({'error': f"Product {pid} not found"}, status=404)
            if product.stock < qty:
                return Response({'error': f"Insufficient stock for {product.name}. Available: {product.stock}"}, status=400)
            total += product.price * qty
            order_items.append((product, qty))

        discount = Order.calculate_discount(total)
        final = total - discount

        order = Order.objects.create(
            customer=customer,
            **data,
            total_amount=total,
            discount_amount=discount,
            final_amount=final,
        )

        for product, qty in order_items:
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                product_price=product.price,
                quantity=qty
            )
            product.stock -= qty
            product.save()

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def track_order(request, order_number):
    try:
        order = Order.objects.get(order_number=order_number)
        return Response(TrackOrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── Admin Order Views ────────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Order.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


@api_view(['GET'])
@permission_classes([IsAdminUser])
def order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk)
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_order_status(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    new_status = request.data.get('status')
    payment_status = request.data.get('payment_status')

    valid_statuses = ['pending', 'preparing', 'ready', 'collected', 'cancelled']
    if new_status and new_status not in valid_statuses:
        return Response({'error': 'Invalid status'}, status=400)

    previous_status = order.status
    if new_status:
        order.status = new_status

    if payment_status:
        order.payment_status = payment_status

    if new_status == 'cancelled' and previous_status != 'cancelled':
        for item in order.items.select_related('product').all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save()

    order.save()
    return Response(OrderSerializer(order).data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    orders = Order.objects.all()
    stats = {
        'total': orders.count(),
        'pending': orders.filter(status='pending').count(),
        'preparing': orders.filter(status='preparing').count(),
        'ready': orders.filter(status='ready').count(),
        'collected': orders.filter(status='collected').count(),
        'cancelled': orders.filter(status='cancelled').count(),
        'new_orders': orders.filter(status='pending').count(),
    }
    latest = orders.filter(status='pending').first()
    if latest:
        stats['latest_order'] = OrderSerializer(latest).data
    return Response(stats)


def _get_customer_from_token(request):
    """Helper to extract customer from Authorization header."""
    token_key = request.headers.get('Authorization', '').replace('Token ', '')
    if not token_key:
        return None
    try:
        return Customer.objects.get(token=token_key)
    except Customer.DoesNotExist:
        return None


# ─── Customer Auth ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def customer_register(request):
    serializer = CustomerSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    customer = serializer.save()
    token = customer.generate_token()
    return Response({
        'token': token,
        'customer': CustomerProfileSerializer(customer).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def customer_login(request):
    mobile = str(request.data.get('mobile', '')).strip()
    password = str(request.data.get('password', ''))

    if not mobile or not password:
        return Response({'error': 'Mobile and password required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        customer = Customer.objects.get(mobile=mobile)
    except Customer.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    from django.contrib.auth.hashers import check_password
    if not check_password(password, customer.password):
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    token = customer.generate_token()
    return Response({
        'token': token,
        'customer': CustomerProfileSerializer(customer).data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def customer_forgot_password(request):
    mobile = str(request.data.get('mobile', '')).strip()
    new_password = str(request.data.get('new_password', ''))

    if not mobile or not new_password:
        return Response({'error': 'Mobile and new_password required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        customer = Customer.objects.get(mobile=mobile)
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

    from django.contrib.auth.hashers import make_password
    customer.password = make_password(new_password)
    customer.token = None
    customer.save()
    return Response({'message': 'Password updated successfully'})


@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def customer_profile(request):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        return Response(CustomerProfileSerializer(customer).data)

    data = request.data
    if 'name' in data:
        customer.name = data['name']
    if 'mobile' in data:
        customer.mobile = data['mobile']
    customer.save()
    return Response(CustomerProfileSerializer(customer).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def customer_logout(request):
    customer = _get_customer_from_token(request)
    if customer:
        customer.token = None
        customer.save()
    return Response({'message': 'Logged out'})


# ─── Customer Orders ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def customer_orders(request):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    qs = Order.objects.filter(customer=customer)
    status_filter = request.query_params.get('status')
    if status_filter and status_filter in dict(Order.STATUS_CHOICES):
        qs = qs.filter(status=status_filter)
    serializer = CustomerOrderSerializer(qs, many=True)
    return Response(serializer.data)


# ─── Reorder ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def reorder(request, order_id):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        order = Order.objects.get(pk=order_id, customer=customer)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    items = []
    messages = []
    for oi in order.items.all():
        product = oi.product
        if not product or not product.is_active:
            messages.append(f"{oi.product_name} is no longer available and has been removed.")
            continue

        qty = min(oi.quantity, product.stock)
        if qty == 0:
            messages.append(f"{oi.product_name} is out of stock and has been removed.")
            continue
        if qty < oi.quantity:
            messages.append(f"{oi.product_name} adjusted from {oi.quantity} to {qty} (only {product.stock} in stock).")

        items.append({
            'product_id': product.id,
            'product_name': product.name,
            'price': str(product.price),
            'quantity': qty,
            'stock': product.stock,
            'image_url': ProductSerializer(product, context={'request': request}).data.get('image_url'),
        })

    message = "Some products were adjusted based on current stock." if messages else ""
    return Response({
        'items': items,
        'message': message,
        'details': messages,
    })


# ─── Daily Offers ────────────────────────────────────────────────────────────

class ActiveOffersView(generics.ListAPIView):
    serializer_class = DailyOfferSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from django.utils import timezone
        now = timezone.now()
        return DailyOffer.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('priority', '-created_at')

    def get_serializer_context(self):
        return {'request': self.request}


class AdminOffersListCreateView(generics.ListCreateAPIView):
    queryset = DailyOffer.objects.all()
    serializer_class = DailyOfferSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        return {'request': self.request}


class AdminOffersDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DailyOffer.objects.all()
    serializer_class = DailyOfferSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        return {'request': self.request}


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def toggle_offer(request, pk):
    try:
        offer = DailyOffer.objects.get(pk=pk)
    except DailyOffer.DoesNotExist:
        return Response({'error': 'Offer not found'}, status=404)
    offer.is_active = not offer.is_active
    offer.save()
    return Response(DailyOfferSerializer(offer, context={'request': request}).data)


# ─── Shared Group Cart & Bill Splitting ─────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def create_group(request):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    name = request.data.get('name', '').strip()
    if not name:
        return Response({'error': 'Group name is required'}, status=status.HTTP_400_BAD_REQUEST)

    group = ShoppingGroup.objects.create(name=name, created_by=customer)
    GroupMember.objects.create(group=group, customer=customer)

    serializer = ShoppingGroupSerializer(group)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def join_group(request):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    code = request.data.get('code', '').strip().upper()
    if not code:
        return Response({'error': 'Join code is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        group = ShoppingGroup.objects.get(unique_join_code=code)
    except ShoppingGroup.DoesNotExist:
        return Response({'error': 'Invalid join code'}, status=status.HTTP_404_NOT_FOUND)

    if GroupMember.objects.filter(group=group, customer=customer).exists():
        return Response({'error': 'You are already a member of this group'}, status=status.HTTP_400_BAD_REQUEST)

    GroupMember.objects.create(group=group, customer=customer)

    serializer = ShoppingGroupSerializer(group)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def my_groups(request):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    memberships = GroupMember.objects.filter(customer=customer).select_related('group')
    groups = [m.group for m in memberships]
    serializer = ShoppingGroupSerializer(groups, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def group_details(request, group_id):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        group = ShoppingGroup.objects.get(id=group_id)
    except ShoppingGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    if not GroupMember.objects.filter(group=group, customer=customer).exists():
        return Response({'error': 'You are not a member of this group'}, status=status.HTTP_403_FORBIDDEN)

    group_serializer = ShoppingGroupSerializer(group)
    members = GroupMember.objects.filter(group=group).select_related('customer')
    member_serializer = GroupMemberSerializer(members, many=True)
    bills = BillSplit.objects.filter(group=group).prefetch_related('payments__customer')
    bill_serializer = BillSplitSerializer(bills, many=True)

    return Response({
        'group': group_serializer.data,
        'members': member_serializer.data,
        'bills': bill_serializer.data,
    })


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def group_cart(request, group_id):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        group = ShoppingGroup.objects.get(id=group_id)
    except ShoppingGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    if not GroupMember.objects.filter(group=group, customer=customer).exists():
        return Response({'error': 'You are not a member of this group'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        items = SharedCartItem.objects.filter(group=group)
        serializer = SharedCartItemSerializer(items, many=True)
        return Response(serializer.data)

    serializer = SharedCartItemSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(group=group, added_by=customer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_cart_item(request, group_id, item_id):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        item = SharedCartItem.objects.get(id=item_id, group_id=group_id)
    except SharedCartItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    if item.added_by != customer:
        return Response({'error': 'You can only delete your own items'}, status=status.HTTP_403_FORBIDDEN)

    item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def toggle_item_purchased(request, group_id, item_id):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        item = SharedCartItem.objects.get(id=item_id, group_id=group_id)
    except SharedCartItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    if not GroupMember.objects.filter(group_id=group_id, customer=customer).exists():
        return Response({'error': 'You are not a member of this group'}, status=status.HTTP_403_FORBIDDEN)

    item.is_purchased = not item.is_purchased
    item.save()
    return Response(SharedCartItemSerializer(item).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def split_bill(request, group_id):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        group = ShoppingGroup.objects.get(id=group_id)
    except ShoppingGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    if not GroupMember.objects.filter(group=group, customer=customer).exists():
        return Response({'error': 'You are not a member of this group'}, status=status.HTTP_403_FORBIDDEN)

    split_type = request.data.get('split_type', 'equal')
    if split_type not in ('equal', 'custom'):
        return Response({'error': 'Invalid split type. Use "equal" or "custom"'}, status=status.HTTP_400_BAD_REQUEST)

    items = SharedCartItem.objects.filter(group=group, is_purchased=False)
    if not items.exists():
        return Response({'error': 'No items in cart to split'}, status=status.HTTP_400_BAD_REQUEST)

    total = sum(item.price * item.quantity for item in items)

    members = GroupMember.objects.filter(group=group).select_related('customer')
    member_ids = list(members.values_list('customer_id', flat=True))

    if split_type == 'equal':
        member_count = len(member_ids)
        if member_count == 0:
            return Response({'error': 'No members in group'}, status=status.HTTP_400_BAD_REQUEST)

        per_person = round(total / member_count, 2)

        bill = BillSplit.objects.create(group=group, total_amount=total, split_type='equal')

        for member in members:
            PaymentStatus.objects.create(
                bill=bill, customer=member.customer,
                amount_owed=per_person, status='pending'
            )
    else:
        amounts = request.data.get('amounts', {})
        bill = BillSplit.objects.create(group=group, total_amount=total, split_type='custom')

        for member in members:
            amount = amounts.get(str(member.customer_id))
            if amount is None:
                return Response(
                    {'error': f'Amount not specified for {member.customer.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            PaymentStatus.objects.create(
                bill=bill, customer=member.customer,
                amount_owed=round(float(amount), 2), status='pending'
            )

    for item in items:
        item.is_purchased = True
        item.save()

    serializer = BillSplitSerializer(bill)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_payment_status(request, payment_id):
    customer = _get_customer_from_token(request)
    if not customer:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        payment = PaymentStatus.objects.get(id=payment_id)
    except PaymentStatus.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

    if payment.customer != customer:
        return Response({'error': 'You can only update your own payment status'}, status=status.HTTP_403_FORBIDDEN)

    if payment.status == 'paid':
        return Response({'error': 'Payment is already marked as paid'}, status=status.HTTP_400_BAD_REQUEST)

    payment.status = 'paid'
    payment.save()

    serializer = PaymentStatusSerializer(payment)
    return Response(serializer.data)
