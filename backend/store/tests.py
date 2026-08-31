from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.hashers import make_password
from .models import (
    Category, Product, Order, OrderItem, Customer,
    ShoppingGroup, GroupMember, SharedCartItem,
    BillSplit, PaymentStatus
)


# ─── Model Unit Tests ─────────────────────────────────────────────────────

class OrderDiscountTests(TestCase):
    def test_discount_300_and_above(self):
        self.assertEqual(Order.calculate_discount(300), 15)
        self.assertEqual(Order.calculate_discount(500), 15)
        self.assertEqual(Order.calculate_discount(9999), 15)

    def test_discount_100_to_299(self):
        self.assertEqual(Order.calculate_discount(100), 5)
        self.assertEqual(Order.calculate_discount(150), 5)
        self.assertEqual(Order.calculate_discount(299), 5)

    def test_discount_below_100(self):
        self.assertEqual(Order.calculate_discount(0), 0)
        self.assertEqual(Order.calculate_discount(50), 0)
        self.assertEqual(Order.calculate_discount(99), 0)


class ProductModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Test Cat", icon="🛒")

    def test_in_stock_true_when_stock_positive(self):
        p = Product.objects.create(name="Item", price=100, stock=10, category=self.category)
        self.assertTrue(p.in_stock)

    def test_in_stock_false_when_stock_zero(self):
        p = Product.objects.create(name="Item", price=100, stock=0, category=self.category)
        self.assertFalse(p.in_stock)

    def test_category_name_property(self):
        p = Product.objects.create(name="Item", price=100, stock=10, category=self.category)
        self.assertEqual(p.category_name, "Test Cat")

    def test_category_name_uncategorized_when_null(self):
        p = Product.objects.create(name="Item", price=100, stock=10, category=None)
        self.assertEqual(p.category_name, "Uncategorized")

    def test_bulk_import_ignores_mrp(self):
        data = [
            {"name": "Sugar", "category_id": self.category.id, "unit": "1 kg", "mrp": 50.00, "price": 45.00, "stock": 100},
        ]
        products = Product.bulk_import(data)
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0].price, 45.00)


class ShoppingGroupModelTests(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            name="Test", mobile="9999999999",
            password=make_password("pass123")
        )

    def test_unique_join_code_generated_on_save(self):
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        self.assertIsNotNone(group.unique_join_code)
        self.assertEqual(len(group.unique_join_code), 8)

    def test_join_code_is_unique(self):
        g1 = ShoppingGroup.objects.create(name="Group1", created_by=self.customer)
        g2 = ShoppingGroup.objects.create(name="Group2", created_by=self.customer)
        self.assertNotEqual(g1.unique_join_code, g2.unique_join_code)

    def test_member_count(self):
        g = ShoppingGroup.objects.create(name="Group", created_by=self.customer)
        GroupMember.objects.create(group=g, customer=self.customer)
        c2 = Customer.objects.create(name="User2", mobile="8888888888", password=make_password("pass"))
        GroupMember.objects.create(group=g, customer=c2)
        self.assertEqual(g.members.count(), 2)


class OrderNumberGenerationTests(TestCase):
    def test_order_number_starts_at_1001(self):
        o = Order.objects.create(
            customer_name="Test", customer_phone="9999999999",
            customer_address="Addr", total_amount=100,
            discount_amount=0, final_amount=100
        )
        num = int(o.order_number.split('-')[1])
        self.assertEqual(num, 1001)

    def test_order_numbers_are_consecutive(self):
        o1 = Order.objects.create(
            customer_name="Test", customer_phone="9999999999",
            customer_address="Addr", total_amount=100,
            discount_amount=0, final_amount=100
        )
        o2 = Order.objects.create(
            customer_name="Test2", customer_phone="8888888888",
            customer_address="Addr2", total_amount=200,
            discount_amount=0, final_amount=200
        )
        n1 = int(o1.order_number.split('-')[1])
        n2 = int(o2.order_number.split('-')[1])
        self.assertEqual(n2, n1 + 1)

    def test_order_number_is_unique(self):
        o1 = Order.objects.create(
            customer_name="Test", customer_phone="9999999999",
            customer_address="Addr", total_amount=100,
            discount_amount=0, final_amount=100
        )
        o2 = Order.objects.create(
            customer_name="Test2", customer_phone="8888888888",
            customer_address="Addr2", total_amount=200,
            discount_amount=0, final_amount=200
        )
        self.assertNotEqual(o1.order_number, o2.order_number)


# ─── API Integration Tests ────────────────────────────────────────────────

class CustomerAuthAPITests(APITestCase):
    def test_customer_register(self):
        resp = self.client.post("/api/customer/register/", {
            "name": "Test User", "mobile": "7777777777", "password": "pass123"
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertIn("token", resp.data)
        self.assertIn("customer", resp.data)

    def test_customer_register_duplicate_mobile(self):
        Customer.objects.create(name="A", mobile="7777777777", password=make_password("x"))
        resp = self.client.post("/api/customer/register/", {
            "name": "B", "mobile": "7777777777", "password": "pass123"
        }, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_customer_login(self):
        Customer.objects.create(
            name="Test", mobile="7777777777",
            password=make_password("pass123")
        )
        resp = self.client.post("/api/customer/login/", {
            "mobile": "7777777777", "password": "pass123"
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("token", resp.data)

    def test_customer_login_wrong_password(self):
        Customer.objects.create(
            name="Test", mobile="7777777777",
            password=make_password("pass123")
        )
        resp = self.client.post("/api/customer/login/", {
            "mobile": "7777777777", "password": "wrong"
        }, format="json")
        self.assertEqual(resp.status_code, 401)


class GroupAPITests(APITestCase):
    def _auth_header(self, customer):
        return {'HTTP_AUTHORIZATION': f'Token {customer.token}'}

    def setUp(self):
        self.customer = Customer.objects.create(
            name="Test User", mobile="7777777777",
            password=make_password("pass123")
        )
        self.customer.generate_token()



    def test_create_group(self):
        resp = self.client.post(
            "/api/groups/create/", {"name": "Family"}, format="json",
            **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["name"], "Family")
        self.assertIn("unique_join_code", resp.data)
        self.assertEqual(len(resp.data["unique_join_code"]), 8)

    def test_create_group_requires_auth(self):
        resp = self.client.post("/api/groups/create/", {"name": "Family"}, format="json")
        self.assertEqual(resp.status_code, 401)

    def test_join_group_with_valid_code(self):
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        resp = self.client.post(
            "/api/groups/join/", {"code": group.unique_join_code}, format="json",
            **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 200)

    def test_join_group_with_invalid_code(self):
        resp = self.client.post(
            "/api/groups/join/", {"code": "INVALID"}, format="json",
            **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 404)

    def test_my_groups(self):
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        GroupMember.objects.create(group=group, customer=self.customer)
        resp = self.client.get(
            "/api/groups/my/", **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_add_cart_item(self):
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        GroupMember.objects.create(group=group, customer=self.customer)
        resp = self.client.post(
            f"/api/groups/{group.id}/cart/",
            {"item_name": "Milk", "price": 50, "quantity": 2}, format="json",
            **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["item_name"], "Milk")

    def test_cart_items_show_added_by_name(self):
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        GroupMember.objects.create(group=group, customer=self.customer)
        self.client.post(
            f"/api/groups/{group.id}/cart/",
            {"item_name": "Milk", "price": 50, "quantity": 1}, format="json",
            **self._auth_header(self.customer)
        )
        resp = self.client.get(
            f"/api/groups/{group.id}/cart/", **self._auth_header(self.customer)
        )
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["added_by_name"], "Test User")

    def test_non_member_cannot_add_items(self):
        other = Customer.objects.create(
            name="Other", mobile="8888888888",
            password=make_password("pass")
        )
        other.generate_token()
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        resp = self.client.post(
            f"/api/groups/{group.id}/cart/",
            {"item_name": "Milk", "price": 50, "quantity": 1}, format="json",
            **self._auth_header(other)
        )
        self.assertEqual(resp.status_code, 403)

    def test_split_bill_equal(self):
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        GroupMember.objects.create(group=group, customer=self.customer)
        SharedCartItem.objects.create(
            group=group, added_by=self.customer,
            item_name="Milk", price=100, quantity=1
        )
        resp = self.client.post(
            f"/api/groups/{group.id}/split-bill/",
            {"split_type": "equal"}, format="json",
            **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(float(resp.data["total_amount"]), 100)
        self.assertEqual(len(resp.data["payments"]), 1)
        self.assertEqual(float(resp.data["payments"][0]["amount_owed"]), 100)
        self.assertEqual(resp.data["payments"][0]["status"], "pending")

    def test_split_bill_empty_cart_returns_error(self):
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        GroupMember.objects.create(group=group, customer=self.customer)
        resp = self.client.post(
            f"/api/groups/{group.id}/split-bill/",
            {"split_type": "equal"}, format="json",
            **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 400)

    def test_update_payment_status(self):
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        GroupMember.objects.create(group=group, customer=self.customer)
        SharedCartItem.objects.create(
            group=group, added_by=self.customer,
            item_name="Milk", price=100, quantity=1
        )
        split_resp = self.client.post(
            f"/api/groups/{group.id}/split-bill/",
            {"split_type": "equal"}, format="json",
            **self._auth_header(self.customer)
        )
        payment_id = split_resp.data["payments"][0]["id"]
        resp = self.client.patch(
            f"/api/payments/{payment_id}/status/",
            **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "paid")

    def test_only_own_payment_can_be_marked_paid(self):
        other = Customer.objects.create(
            name="Other", mobile="8888888888",
            password=make_password("pass")
        )
        other.generate_token()
        group = ShoppingGroup.objects.create(name="Family", created_by=self.customer)
        GroupMember.objects.create(group=group, customer=self.customer)
        GroupMember.objects.create(group=group, customer=other)
        SharedCartItem.objects.create(
            group=group, added_by=self.customer,
            item_name="Milk", price=200, quantity=1
        )
        split_resp = self.client.post(
            f"/api/groups/{group.id}/split-bill/",
            {"split_type": "equal"}, format="json",
            **self._auth_header(self.customer)
        )
        other_payment = [p for p in split_resp.data["payments"] if p["customer"] == other.id][0]
        resp = self.client.patch(
            f"/api/payments/{other_payment['id']}/status/",
            **self._auth_header(self.customer)
        )
        self.assertEqual(resp.status_code, 403)


class ProductAPITests(APITestCase):
    def setUp(self):
        self.cat = Category.objects.create(name="Fruits", icon="🍎")
        self.product = Product.objects.create(
            name="Apple", price=50, stock=100, category=self.cat,
            is_active=True, is_popular=True
        )

    def test_public_product_list(self):
        resp = self.client.get("/api/products/")
        self.assertEqual(resp.status_code, 200)

    def test_product_list_search(self):
        Product.objects.all().delete()
        Product.objects.create(name="Apple", price=50, stock=100, category=self.cat, is_active=True)
        resp = self.client.get("/api/products/?search=Apple")
        self.assertEqual(len(resp.data), 1)

    def test_product_list_category_filter(self):
        Product.objects.all().delete()
        Product.objects.create(name="Apple", price=50, stock=100, category=self.cat, is_active=True)
        resp = self.client.get(f"/api/products/?category={self.cat.id}")
        self.assertEqual(len(resp.data), 1)

    def test_product_list_filters_out_inactive(self):
        Product.objects.all().delete()
        Product.objects.create(name="Active", price=10, stock=5, category=self.cat, is_active=True)
        Product.objects.create(name="Inactive", price=10, stock=0, category=self.cat, is_active=False)
        resp = self.client.get("/api/products/")
        names = [p["name"] for p in resp.data]
        self.assertIn("Active", names)
        self.assertNotIn("Inactive", names)

    def test_product_detail(self):
        resp = self.client.get(f"/api/products/{self.product.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["name"], "Apple")
