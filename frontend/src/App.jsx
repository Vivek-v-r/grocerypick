import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import { StoreProvider } from "./context/StoreContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import CustomerRegisterPage from "./pages/CustomerRegisterPage";
import CustomerForgotPasswordPage from "./pages/CustomerForgotPasswordPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import CustomerOrdersPage from "./pages/CustomerOrdersPage";
import GroupsPage from "./pages/GroupsPage";
import AdminLoginPage from "./admin/AdminLoginPage";
import AdminLayout from "./admin/AdminLayout";
import "./styles.css";

function AdminRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminLayout /> : <AdminLoginPage />;
}

function CustomerLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomerAuthProvider>
          <StoreProvider>
            <CartProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: { borderRadius: "10px", fontWeight: 600 },
                }}
              />
              <Routes>
                <Route path="/admin" element={<ErrorBoundary><AdminRoute /></ErrorBoundary>} />
                <Route
                  path="/"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <HomePage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <ProductsPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <CheckoutPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/order-success/:orderNumber"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <OrderSuccessPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/track"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <TrackOrderPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/customer/login"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <CustomerLoginPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/customer/register"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <CustomerRegisterPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/customer/forgot-password"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <CustomerForgotPasswordPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/customer/dashboard"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <CustomerDashboardPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <GroupsPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/customer/orders"
                  element={
                    <ErrorBoundary>
                      <CustomerLayout>
                        <CustomerOrdersPage />
                      </CustomerLayout>
                    </ErrorBoundary>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </CartProvider>
          </StoreProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
