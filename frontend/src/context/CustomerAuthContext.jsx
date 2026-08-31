import { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken } from "../services/api";

const CustomerAuthContext = createContext();

const CUSTOMER_TOKEN_KEY = "customerToken";
const CUSTOMER_DATA_KEY = "customerData";

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const data = localStorage.getItem(CUSTOMER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(CUSTOMER_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const login = (newToken, customerData) => {
    try {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, newToken);
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(customerData));
    } catch (e) {}
    setToken(newToken);
    setCustomer(customerData);
  };

  const logout = () => {
    try {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_DATA_KEY);
    } catch (e) {}
    setToken(null);
    setCustomer(null);
  };

  const updateCustomer = (customerData) => {
    try {
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(customerData));
    } catch (e) {}
    setCustomer(customerData);
  };

  return (
    <CustomerAuthContext.Provider
      value={{ customer, token, isLoggedIn: !!token, login, logout, updateCustomer }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => useContext(CustomerAuthContext);
