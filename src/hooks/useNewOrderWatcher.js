import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOrdersWithItems } from "../services/queries";
import { playNewOrderSound } from "../utils/orderNotificationSound";

const POLL_MS = 3000;

/**
 * Polls orders; after the first load, alerts when new order IDs appear.
 */
export function useNewOrderWatcher(enabled = true) {
  const [activeAlert, setActiveAlert] = useState(null);
  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const queueRef = useRef([]);
  const showingRef = useRef(false);

  const pumpQueue = useCallback(() => {
    if (showingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    showingRef.current = true;
    setActiveAlert(next);
    playNewOrderSound();
  }, []);

  const dismissAlert = useCallback(() => {
    showingRef.current = false;
    setActiveAlert(null);
    requestAnimationFrame(() => {
      pumpQueue();
    });
  }, [pumpQueue]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    async function poll() {
      const { data, error } = await fetchOrdersWithItems();
      if (cancelled || error) return;

      const orders = data ?? [];
      const known = knownIdsRef.current;

      if (!initializedRef.current) {
        for (const o of orders) {
          if (o.id) known.add(o.id);
        }
        initializedRef.current = true;
        return;
      }

      const newcomers = orders.filter((o) => o.id && !known.has(o.id));
      if (newcomers.length === 0) return;

      for (const o of newcomers) {
        known.add(o.id);
        queueRef.current.push(o);
      }

      if (showingRef.current) {
        playNewOrderSound();
      } else {
        pumpQueue();
      }
    }

    poll();
    const intervalId = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [enabled, pumpQueue]);

  return { activeAlert, dismissAlert };
}
