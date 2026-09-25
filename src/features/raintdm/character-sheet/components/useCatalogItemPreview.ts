import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

const LONG_PRESS_MS = 480;

/**
 * Long-press opens a preview and suppresses the following click (selection).
 * Works for mouse, touch, and pen.
 */
export function useCatalogItemPreview(onPreview: () => void) {
  const pressTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const clearTimer = useCallback(() => {
    if (pressTimer.current != null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const onPointerDown = useCallback(
    (_e: ReactPointerEvent) => {
      clearTimer();
      suppressClick.current = false;
      pressTimer.current = window.setTimeout(() => {
        pressTimer.current = null;
        suppressClick.current = true;
        onPreview();
      }, LONG_PRESS_MS);
    },
    [clearTimer, onPreview],
  );

  const onPointerUp = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onPointerCancel = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onPointerLeave = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onClickCapture = useCallback((e: ReactMouseEvent) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onClickCapture,
  };
}
