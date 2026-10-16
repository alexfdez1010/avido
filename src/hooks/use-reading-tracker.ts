import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useGame } from '@/store/game';
import { useLibrary } from '@/store/library';

const IDLE_MS = 3 * 60 * 1000;

export function useReadingTracker(bookId: string, enabled = true) {
  const checkpoint = useRef<number | null>(null);
  const lastActivity = useRef(0);
  const pendingSec = useRef(0);
  const pendingPages = useRef(0);
  const session = useRef(0);
  const sessionMs = useRef(0);
  const elapsedMs = useRef(0);
  const [sessionSec, setSessionSec] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [idle, setIdle] = useState(false);
  const active = useRef(enabled);
  const foreground = useRef(AppState.currentState === 'active');
  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');

  const accumulate = useCallback(() => {
    const now = performance.now();
    const previous = checkpoint.current;
    checkpoint.current = now;
    if (previous === null || !active.current || !foreground.current) return;

    // A chosen reading timer measures foreground reading, even without gestures.
    elapsedMs.current += Math.max(0, now - previous);
    setElapsedSec(Math.floor(elapsedMs.current / 1000));

    // Keep the existing idle limit for game rewards, separate from that timer.
    const rewardEnd = Math.min(now, lastActivity.current + IDLE_MS);
    sessionMs.current += Math.max(0, rewardEnd - previous);
    const seconds = Math.floor(sessionMs.current / 1000);
    pendingSec.current += seconds - session.current;
    session.current = seconds;
    setSessionSec(seconds);
    setIdle(now - lastActivity.current > IDLE_MS);
  }, []);

  useEffect(() => {
    accumulate();
    active.current = enabled;
    lastActivity.current = performance.now();
  }, [enabled, accumulate]);

  const flush = useCallback(() => {
    accumulate();
    const sec = pendingSec.current;
    const pages = pendingPages.current;
    if (sec === 0 && pages === 0) return;
    pendingSec.current = 0;
    pendingPages.current = 0;
    useGame.getState().addReading(sec, pages, session.current);
    const b = useLibrary.getState().books[bookId];
    if (b) useLibrary.getState().updateBook(bookId, { readSeconds: b.readSeconds + sec, readPages: (b.readPages ?? 0) + pages });
  }, [bookId, accumulate]);

  const poke = useCallback(() => {
    accumulate();
    lastActivity.current = performance.now();
    setIdle(false);
  }, [accumulate]);

  const addPages = useCallback((n: number) => {
    if (n > 0) pendingPages.current += n;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      accumulate();
      if (pendingSec.current >= 15) flush();
    }, 1000);
    const sub = AppState.addEventListener('change', (s) => {
      accumulate();
      foreground.current = s === 'active';
      setIsForeground(foreground.current);
      if (s !== 'active') flush();
      else {
        lastActivity.current = performance.now();
        setIdle(false);
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
      flush();
    };
  }, [flush, accumulate]);

  return { sessionSec, elapsedSec, isForeground, idle, poke, addPages, flush };
}
