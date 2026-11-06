import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toLocalDate, type LocalDate } from './local-date';

/** Today's local date. Updates at midnight and whenever the app returns to the foreground. */
export function useToday(): LocalDate {
  const [today, setToday] = useState(() => toLocalDate(new Date()));

  useEffect(() => {
    const refresh = () => setToday(toLocalDate(new Date()));
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1).getTime() - now.getTime();
    const timer = setTimeout(refresh, msToMidnight);
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}
