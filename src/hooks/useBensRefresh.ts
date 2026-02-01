import { useEffect, useRef } from 'react';

// Event emitter simples para notificar atualizações de bens
class BensRefreshEmitter {
  private listeners: Set<() => void> = new Set();

  subscribe(callback: () => void) {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  emit() {
    this.listeners.forEach(callback => callback());
  }
}

const bensRefreshEmitter = new BensRefreshEmitter();

/**
 * Hook para notificar que os bens precisam ser atualizados
 */
export const useBensRefreshTrigger = () => {
  return {
    triggerRefresh: () => bensRefreshEmitter.emit(),
  };
};

/**
 * Hook para escutar quando os bens precisam ser atualizados
 */
export const useBensRefreshListener = (onRefresh: () => void) => {
  const onRefreshRef = useRef(onRefresh);

  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const unsubscribe = bensRefreshEmitter.subscribe(() => {
      onRefreshRef.current();
    });

    return unsubscribe;
  }, []);
};
