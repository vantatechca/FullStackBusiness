'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface DepartmentMap {
  /** id → name */
  byId: Record<string, string>;
  /** name → id */
  byName: Record<string, string>;
  /** full department list */
  list: { id: string; name: string; type: string }[];
}

interface DepartmentContextValue extends DepartmentMap {
  loading: boolean;
  refresh: () => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextValue>({
  byId: {},
  byName: {},
  list: [],
  loading: true,
  refresh: async () => {},
});

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DepartmentMap>({ byId: {}, byName: {}, list: [] });
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/table-data?table=departments');
      if (!res.ok) return;
      const depts = await res.json();
      if (!Array.isArray(depts)) return;
      const byId: Record<string, string> = {};
      const byName: Record<string, string> = {};
      depts.forEach((d: any) => {
        byId[d.id] = d.name;
        byName[d.name] = d.id;
      });
      setState({ byId, byName, list: depts });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      refresh();
    }
  }, [refresh]);

  return (
    <DepartmentContext.Provider value={{ ...state, loading, refresh }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartments() {
  return useContext(DepartmentContext);
}
