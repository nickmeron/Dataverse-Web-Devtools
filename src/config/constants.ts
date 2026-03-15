export const STAGE = {
  PRE_VALIDATION: 10,
  PRE_OPERATION: 20,
  POST_OPERATION: 40,
} as const;

export const STAGE_LABELS: Record<number, string> = {
  10: 'Pre-validation',
  20: 'Pre-operation',
  40: 'Post-operation',
};

export const MODE = {
  SYNCHRONOUS: 0,
  ASYNCHRONOUS: 1,
} as const;

export const MODE_LABELS: Record<number, string> = {
  0: 'Synchronous',
  1: 'Asynchronous',
};

export const SUPPORTED_DEPLOYMENT = {
  SERVER_ONLY: 0,
  OUTLOOK_ONLY: 1,
  BOTH: 2,
} as const;

export const SUPPORTED_DEPLOYMENT_LABELS: Record<number, string> = {
  0: 'Server Only',
  1: 'Outlook Client Only',
  2: 'Both',
};

export const IMAGE_TYPE = {
  PRE_IMAGE: 0,
  POST_IMAGE: 1,
  BOTH: 2,
} as const;

export const IMAGE_TYPE_LABELS: Record<number, string> = {
  0: 'Pre Image',
  1: 'Post Image',
  2: 'Both',
};

export const ISOLATION_MODE = {
  NONE: 1,
  SANDBOX: 2,
} as const;

export const ISOLATION_MODE_LABELS: Record<number, string> = {
  1: 'None',
  2: 'Sandbox',
};

export const SOURCE_TYPE = {
  DATABASE: 0,
  DISK: 1,
  NORMAL: 2,
  AZURE_WEB_APP: 3,
} as const;

export const SOURCE_TYPE_LABELS: Record<number, string> = {
  0: 'Database',
  1: 'Disk',
  2: 'Normal',
  3: 'Azure Web App',
};

export const CONTRACT_TYPE = {
  ONE_WAY: 1,
  QUEUE: 2,
  REST: 3,
  TWO_WAY: 4,
  TOPIC: 5,
  PERSISTENT_QUEUE: 6,
  EVENT_HUB: 7,
  WEBHOOK: 8,
  EVENT_GRID: 9,
} as const;

export const CONTRACT_TYPE_LABELS: Record<number, string> = {
  1: 'One Way',
  2: 'Queue',
  3: 'REST',
  4: 'Two Way',
  5: 'Topic',
  6: 'Persistent Queue',
  7: 'Event Hub',
  8: 'Webhook',
  9: 'Event Grid',
};

export const AUTH_TYPE = {
  HTTP_HEADER: 1,
  WEBHOOK_KEY: 2,
  HTTP_QUERY_STRING: 3,
  SAS_KEY: 4,
  SAS_TOKEN: 5,
} as const;

export const AUTH_TYPE_LABELS: Record<number, string> = {
  1: 'Http Header',
  2: 'Webhook Key',
  3: 'Http Query String',
  4: 'SAS Key',
  5: 'SAS Token',
};

export const USER_CLAIM = {
  NONE: 0,
  USER_ID: 1,
  CONTACT_ID: 2,
} as const;

export const USER_CLAIM_LABELS: Record<number, string> = {
  0: 'None',
  1: 'UserId',
  2: 'ContactId',
};

export const MESSAGE_FORMAT = {
  BINARY_DEPRECATED: 1,
  JSON: 2,
  XML: 3,
} as const;

export const MESSAGE_FORMAT_LABELS: Record<number, string> = {
  1: 'Binary (deprecated)',
  2: 'JSON',
  3: 'XML',
};

export const STATE_CODE = {
  ENABLED: 0,
  DISABLED: 1,
} as const;

export const STATUS_CODE = {
  ENABLED: 1,
  DISABLED: 2,
} as const;

export const OPERATION_TYPE_LABELS: Record<number, string> = {
  0: 'Unknown',
  1: 'Plug-in',
  2: 'Workflow Activity',
};

export const TRACE_SETTING = {
  OFF: 0,
  EXCEPTION: 1,
  ALL: 2,
} as const;

export const TRACE_SETTING_LABELS: Record<number, string> = {
  0: 'Off',
  1: 'Exception',
  2: 'All',
};
