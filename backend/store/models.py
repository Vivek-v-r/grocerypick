from django.db import models
from django.contrib.auth.models import User
import secrets


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='🛒')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Selling Price')
    unit = models.CharField(max_length=30, default='1 kg')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    stock = models.PositiveIntegerField(default=100)
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_popular', 'name']

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        return self.stock is not None and self.stock > 0

    @property
    def image_url(self):
        try:
            if self.image and hasattr(self.image, 'url'):
                return self.image.url
        except ValueError:
            pass
        return None

    @property
    def category_name(self):
        return self.category.name if self.category else "Uncategorized"

    @classmethod
    def bulk_import(cls, products_data):
        """
        Helper for bulk importing 100-150 fast-moving items via script or shell.
        Example format:
        [
            {"name": "Sugar", "category_id": 1, "unit": "1 kg", "price": 45.00, "stock": 100},
        ]
        """
        objects = [
            cls(
                name=data.get('name'),
                category_id=data.get('category_id'),
                unit=data.get('unit', '1 pc'),
                price=data.get('price'),
                stock=data.get('stock', 100)
            ) for data in products_data
        ]
        return cls.objects.bulk_create(objects)

class Customer(models.Model):
    mobile = models.CharField(max_length=15, unique=True)
    name = models.CharField(max_length=150)
    password = models.CharField(max_length=255)
    token = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def generate_token(self):
        import secrets
        self.token = secrets.token_hex(32)
        self.save(update_fields=['token'])
        return self.token

    def __str__(self):
        return f"{self.name} ({self.mobile})"


class DailyOffer(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='offers/', blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    priority = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', '-created_at']

    def __str__(self):
        return self.title


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready For Pickup'),
        ('collected', 'Collected'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_CHOICES = [
        ('upi', 'UPI Payment'),
        ('pickup', 'Pay On Pickup'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=15)
    customer_address = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='pickup')
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def calculate_discount(subtotal):
        if subtotal >= 300:
            return 15
        elif subtotal >= 100:
            return 5
        return 0

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            from django.conf import settings
            from django.db import transaction
            prefix = getattr(settings, 'ORDER_PREFIX', 'GP')
            start = getattr(settings, 'ORDER_START', 1001)
            with transaction.atomic():
                last = Order.objects.select_for_update().order_by('-created_at').first()
                next_num = start
                if last and getattr(last, 'order_number', None):
                    try:
                        suffix = str(last.order_number).split('-')[-1]
                        last_num = int(suffix)
                        next_num = last_num + 1
                    except Exception:
                        next_num = start
                self.order_number = f"{prefix}-{next_num}"
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    @property
    def subtotal(self):
        return self.product_price * self.quantity


class ShoppingGroup(models.Model):
    name = models.CharField(max_length=200)
    unique_join_code = models.CharField(max_length=10, unique=True)
    created_by = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.unique_join_code})"

    def save(self, *args, **kwargs):
        if not self.unique_join_code:
            import string
            alphabet = string.ascii_uppercase + string.digits
            while True:
                code = ''.join(secrets.choice(alphabet) for _ in range(8))
                if not ShoppingGroup.objects.filter(unique_join_code=code).exists():
                    self.unique_join_code = code
                    break
        super().save(*args, **kwargs)


class GroupMember(models.Model):
    group = models.ForeignKey(ShoppingGroup, on_delete=models.CASCADE, related_name='members')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='group_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['group', 'customer']
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.customer.name} in {self.group.name}"


class SharedCartItem(models.Model):
    group = models.ForeignKey(ShoppingGroup, on_delete=models.CASCADE, related_name='cart_items')
    added_by = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='added_items')
    item_name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    is_purchased = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.item_name} x{self.quantity}"


class BillSplit(models.Model):
    group = models.ForeignKey(ShoppingGroup, on_delete=models.CASCADE, related_name='bill_splits')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    split_type = models.CharField(max_length=10, choices=[('equal', 'Equal'), ('custom', 'Custom')], default='equal')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Bill {self.id} - {self.group.name} (₹{self.total_amount})"


class PaymentStatus(models.Model):
    bill = models.ForeignKey(BillSplit, on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bill_payments')
    amount_owed = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=[('pending', 'Pending'), ('paid', 'Paid')], default='pending')

    class Meta:
        unique_together = ['bill', 'customer']

    def __str__(self):
        return f"{self.customer.name} - ₹{self.amount_owed} ({self.status})"


class StoreSettings(models.Model):
    store_name = models.CharField(max_length=200, default='GroceryPick')
    store_address = models.TextField(default='123 Main Street, City')
    store_phone = models.CharField(max_length=15, default='+91-9999999999')
    store_hours = models.CharField(max_length=100, default='8:00 AM - 10:00 PM')
    upi_id = models.CharField(max_length=100, default='grocerypick@upi')
    upi_name = models.CharField(max_length=100, default='GroceryPick Store')

    class Meta:
        verbose_name = 'Store Settings'
        verbose_name_plural = 'Store Settings'

    def __str__(self):
        return self.store_name
