export const queryKeys = {
  assemblies: {
    all: ['assemblies'] as const,
    detail: (id: string) => ['assemblies', id] as const,
    types: (assemblyId: string) => ['assemblies', assemblyId, 'types'] as const,
  },
  steps: {
    all: ['steps'] as const,
    byType: (typeId: string) => ['steps', 'byType', typeId] as const,
    detail: (id: string) => ['steps', id] as const,
    images: (stepId: string) => ['steps', stepId, 'images'] as const,
  },
  messages: {
    all: ['messages'] as const,
    filters: (messageId: string) => ['messages', messageId, 'filters'] as const,
  },
  entities: {
    attributes: (entity: string) => ['entities', entity, 'attributes'] as const,
  },
  secureConfigs: {
    detail: (id: string) => ['secureConfigs', id] as const,
  },
  webhooks: { all: ['webhooks'] as const },
  serviceEndpoints: { all: ['serviceEndpoints'] as const },
  traceLogs: {
    all: ['traceLogs'] as const,
    list: (filters: Record<string, unknown>) => ['traceLogs', filters] as const,
  },
  solutions: { all: ['solutions'] as const },
  users: { all: ['users'] as const },
  whoAmI: ['whoAmI'] as const,
} as const;
