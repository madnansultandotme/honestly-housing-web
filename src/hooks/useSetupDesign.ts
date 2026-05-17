'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SETUP_DESIGN,
  DEFAULT_STANDARD_ROOMS,
  SetupDesignConfig,
  StandardRoomDefault,
} from '@/lib/setupDesign/defaults';
import { apiClient } from '@/lib/api/client';

export function useSetupDesign() {
  const [setupDesign, setSetupDesign] = useState<SetupDesignConfig>(DEFAULT_SETUP_DESIGN);
  const [standardRooms, setStandardRooms] = useState<StandardRoomDefault[]>(DEFAULT_STANDARD_ROOMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSetupDesign = async () => {
      try {
        const data = await apiClient.get<{
          config?: SetupDesignConfig;
          standardRooms?: StandardRoomDefault[];
        }>('/setup-design');
        if (active && data?.config) {
          setSetupDesign(data.config);
        }
        if (active && Array.isArray(data?.standardRooms)) {
          setStandardRooms(data.standardRooms);
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

  return { setupDesign, standardRooms, loading };
}
