"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import Cookies from "js-cookie";

interface MatchSettingsContextValue {
  enabled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const MatchSettingsContext = createContext<MatchSettingsContextValue | undefined>(undefined);

export const MatchSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch("http://localhost:3001/api/matches/settings", { headers });
      if (!response.ok) {
        throw new Error("No se pudo obtener el estado del sistema de matchs.");
      }
      const data = await response.json();
      setEnabled(Boolean(data.enabled));
    } catch (error) {
      console.error("Error al obtener el estado del sistema de matchs:", error);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const value = useMemo(
    () => ({
      enabled,
      loading,
      refresh: fetchStatus,
    }),
    [enabled, loading, fetchStatus]
  );

  return <MatchSettingsContext.Provider value={value}>{children}</MatchSettingsContext.Provider>;
};

export const useMatchSettings = () => {
  const context = useContext(MatchSettingsContext);
  if (!context) {
    throw new Error("useMatchSettings debe usarse dentro de un MatchSettingsProvider");
  }
  return context;
};