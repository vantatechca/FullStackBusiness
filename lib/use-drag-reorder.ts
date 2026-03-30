'use client';

import { useState, useCallback, useRef } from 'react';

interface DragItem {
  id: string;
  [key: string]: any;
}

export function useDragReorder<T extends DragItem>(
  items: T[],
  onReorder: (next: T[]) => void,
  enabled: boolean = true,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);
  const [itemHeight, setItemHeight] = useState(80);

  const listRef = useRef<HTMLDivElement>(null);
  const originIndex = useRef<number>(-1);
  const frameRef = useRef<number>(0);

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (!enabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const list = listRef.current;
    if (!list) return;

    const idx = items.findIndex(d => d.id === id);
    if (idx === -1) return;

    const rows = list.querySelectorAll<HTMLElement>('[data-drag-item]');
    const h = rows[idx]?.offsetHeight ?? 80;
    setItemHeight(h);

    const listTop = list.getBoundingClientRect().top;
    originIndex.current = idx;

    setDraggingId(id);
    setOverIndex(idx);
    setStartY(e.clientY - listTop - idx * h);
    setDragY(e.clientY - listTop);

    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [enabled, items]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId) return;
    const list = listRef.current;
    if (!list) return;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const listTop = list.getBoundingClientRect().top;
      const y = e.clientY - listTop;
      setDragY(y);
      const newOver = Math.max(0, Math.min(
        items.length - 1,
        Math.round((y - startY) / itemHeight),
      ));
      setOverIndex(newOver);
    });
  }, [draggingId, items.length, itemHeight, startY]);

  const onPointerUp = useCallback(() => {
    if (!draggingId || overIndex === null) {
      setDraggingId(null);
      setOverIndex(null);
      return;
    }
    const from = originIndex.current;
    const to = overIndex;
    if (from !== to) {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onReorder(next);
    }
    setDraggingId(null);
    setOverIndex(null);
    cancelAnimationFrame(frameRef.current);
  }, [draggingId, overIndex, items, onReorder]);

  const getItemStyle = useCallback((index: number, id: string): React.CSSProperties => {
    if (!draggingId) {
      return { transition: 'transform 180ms cubic-bezier(0.25,0.46,0.45,0.94)' };
    }

    if (id === draggingId) {
      const from = originIndex.current;
      const translateY = dragY - startY - from * itemHeight;
      return {
        transform: `translateY(${translateY}px) scale(1.01)`,
        zIndex: 50,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        opacity: 1,
        transition: 'box-shadow 150ms, opacity 150ms',
        position: 'relative',
      };
    }

    const from = originIndex.current;
    const to = overIndex ?? from;
    let shift = 0;
    if (from < to) {
      if (index > from && index <= to) shift = -1;
    } else if (from > to) {
      if (index >= to && index < from) shift = 1;
    }

    return {
      transform: shift !== 0 ? `translateY(${shift * itemHeight}px)` : 'translateY(0)',
      transition: 'transform 180ms cubic-bezier(0.25,0.46,0.45,0.94)',
      opacity: 1,
    };
  }, [draggingId, dragY, startY, itemHeight, overIndex]);

  return { draggingId, listRef, getItemStyle, onPointerDown, onPointerMove, onPointerUp };
}
