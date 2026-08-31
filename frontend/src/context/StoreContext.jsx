import { createContext, useContext, useEffect, useState } from "react";
import { getStoreSettings } from "../services/api";

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [storeSettings, setStoreSettings] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);

  const loadSettings = async () => {
    setLoadingStore(true);
    try {
      const response = await getStoreSettings();
      setStoreSettings(response.data);
    } catch (error) {
      console.error("Failed to load store settings", error);
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <StoreContext.Provider
      value={{ storeSettings, loadingStore, loadSettings }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStoreSettings = () => useContext(StoreContext);
