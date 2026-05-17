'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_SETUP_DESIGN, SetupDesignConfig } from '@/lib/setupDesign/defaults';
import { apiClient } from '@/lib/api/client';

export function useSetupDesign() {
  const [setupDesign, setSetupDesign] = useState<SetupDesignConfig>(DEFAULT_SETUP_DESIGN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSetupDesign = async () => {
      try {
        const data = await apiClient.get<{ config?: SetupDesignConfig }>('/setup-design');
        if (active && data?.config) {
          setSetupDesign(data.config);
        }
      } catch (error) {
        console.error('Failed to load setup design:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSetupDesign();

    return () => {
      active = false;
    };
  }, []);

  return { setupDesign, loading };
}
