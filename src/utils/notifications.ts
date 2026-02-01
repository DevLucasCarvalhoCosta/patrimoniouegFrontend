import type { Notice } from '@/interface/layout/notice.interface';

import store from '@/stores';
import { setUserItem } from '@/stores/user.store';

const LS_KEY = 'notifications';
const MAX_ITEMS = 50;

export type NotificationInput = {
  title: string;
  description?: string;
  type?: Notice['type'];
  operation?: 'create' | 'update' | 'delete' | 'transfer' | 'other';
  entity?: 'usuario' | 'bem' | 'local' | 'categoria' | 'setor' | 'transferencia';
  entityId?: string | number;
};

export const getStored = (): Notice[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);

    if (!raw) return [];
    const arr = JSON.parse(raw);

    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const saveStored = (items: Notice[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore
  }
};

export const countNotifications = (): number => getStored().length;

export const syncBadgeCount = () => {
  const count = countNotifications();

  store.dispatch(setUserItem({ noticeCount: count }) as any);
};

export const addNotification = (input: NotificationInput) => {
  const items = getStored();
  const now = new Date();

  // Gerar descrição automática baseada na operação
  let description = input.description;

  if (!description && input.operation && input.entity) {
    const operationText = {
      create: 'cadastrado',
      update: 'atualizado',
      delete: 'excluído',
      transfer: 'transferido',
      other: 'processado',
    }[input.operation];

    const entityText = {
      usuario: 'Usuário',
      bem: 'Bem',
      local: 'Local',
      categoria: 'Categoria',
      setor: 'Setor',
      transferencia: 'Transferência',
    }[input.entity];

    description = `${entityText} ${operationText} com sucesso`;

    if (input.entityId) {
      description += ` (ID: ${input.entityId})`;
    }
  }

  const item: Notice = {
    id: `${now.getTime()}`,
    type: 'notification', // Sempre usar notification para ter uma única aba
    title: input.title,
    // @ts-ignore use shared shape fields for notification/message
    description: description || '',
    avatar: '',
    datetime: now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  } as any;

  const next = [item, ...items].slice(0, MAX_ITEMS);

  saveStored(next);
  syncBadgeCount();
};

export const clearNotifications = () => {
  saveStored([]);
  syncBadgeCount();
};

// Funções utilitárias para operações comuns
export const notifyUserCreated = (nome: string, id?: string | number) => {
  addNotification({
    title: 'Novo usuário cadastrado',
    operation: 'create',
    entity: 'usuario',
    entityId: id,
    description: `Usuário "${nome}" foi cadastrado com sucesso`,
  });
};

export const notifyBemCreated = (nome: string, patrimonio: string, id?: string | number) => {
  addNotification({
    title: 'Novo bem cadastrado',
    operation: 'create',
    entity: 'bem',
    entityId: id,
    description: `Bem "${nome}" (Patrimônio: ${patrimonio}) foi cadastrado com sucesso`,
  });
};

export const notifyBemUpdated = (nome: string, patrimonio: string, id?: string | number) => {
  addNotification({
    title: 'Bem atualizado',
    operation: 'update',
    entity: 'bem',
    entityId: id,
    description: `Bem "${nome}" (Patrimônio: ${patrimonio}) foi atualizado`,
  });
};

export const notifyBemDeleted = (nome: string, patrimonio: string, id?: string | number) => {
  addNotification({
    title: 'Bem excluído',
    operation: 'delete',
    entity: 'bem',
    entityId: id,
    description: `Bem "${nome}" (Patrimônio: ${patrimonio}) foi excluído`,
  });
};

export const notifyTransferencia = (
  nomeBean: string,
  patrimonio: string,
  localDestino: string,
  bemId?: string | number,
) => {
  addNotification({
    title: 'Transferência de bem realizada',
    operation: 'transfer',
    entity: 'bem',
    entityId: bemId,
    description: `Bem "${nomeBean}" (Patrimônio: ${patrimonio}) foi transferido para ${localDestino}`,
  });
};

export const notifyEntityOperation = (
  operation: 'create' | 'update' | 'delete',
  entity: 'local' | 'categoria' | 'setor',
  name: string,
  id?: string | number,
) => {
  const operationText = {
    create: 'cadastrado',
    update: 'atualizado',
    delete: 'excluído',
  }[operation];

  const entityText = {
    local: 'Local',
    categoria: 'Categoria',
    setor: 'Setor',
  }[entity];

  const titleText = operation === 'create' ? `Novo ${entity} cadastrado` : `${entityText} ${operationText}`;

  addNotification({
    title: titleText,
    operation,
    entity,
    entityId: id,
    description: `${entityText} "${name}" foi ${operationText} com sucesso`,
  });
};
