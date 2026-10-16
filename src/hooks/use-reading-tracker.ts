import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useGame } from '@/store/game';
import { useLibrary } from '@/store/library';

const IDLE_MS = 3 * 60 * 1000;

export function useReadingTracker(bookId: string, enabled = true) {
  const lastActivity = useRef(0);
  const pendingSec = useRef(0);
  const pendingPages = useRef(0);
  const session = useRef(0);
  const [sessionSec, setSessionSec] = useState(0);
  const [idle, setIdle] = useState(false);
  const active = useRef(enabled);

  useEffect(() => {
    active.current = enabled;
    lastActivity.current = Date.now();
  }, [enabled]);

  const flush = useCallback(() => {
    const sec = pendingSec.current;
    const pages = pendingPages.current;
    if (sec === 0 && pages === 0) return;
    pendingSec.current = 0;
    pendingPages.current = 0;
    useGame.getState().addReading(sec, pages, session.current);
    const b = useLibrary.getState().books[bookId];
    if (b) useLibrary.getState().updateBook(bookId, { readSeconds: b.readSeconds + sec, readPages: (b.readPages ?? 0) + pages });
  }, [bookId]);

  const poke = useCallback(() => {
    lastActivity.current = Date.now();
    setIdle(false);
  }, []);

  const addPages = useCallback((n: number) => {
    if (n > 0) pendingPages.current += n;
  }, []);

  useEffect(() => {
    let ticks = 0;
    lastActivity.current = Date.now();
    const timer = setInterval(() => {
      if (!active.current || AppState.currentState !== 'active') return;
      if (Date.now() - lastActivity.current > IDLE_MS) {
        setIdle(true);
        return;
      }
      pendingSec.current += 1;
      session.current += 1;
      setSessionSec(session.current);
      if (++ticks % 15 === 0) flush();
    }, 1000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') flush();
      else lastActivity.current = Date.now();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
      flush();
    };
  }, [flush]);

  return { sessionSec, idle, poke, addPages, flush };
}
