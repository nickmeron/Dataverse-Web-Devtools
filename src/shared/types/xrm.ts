/** Minimal Xrm type declarations for web resource context */

export interface XrmGlobalContext {
  getClientUrl(): string;
  getVersion(): string;
  getCurrentAppUrl?(): string;
  getCurrentAppProperties?(): Promise<{
    appId: string;
    displayName: string;
    uniqueName: string;
    url: string;
  }>;
  client?: {
    getClient(): string; // "Web" | "Outlook" | "Mobile"
    getClientState(): string; // "Online" | "Offline"
  };
  organizationSettings: {
    uniqueName: string;
    organizationId: string;
    baseCurrencyId: string;
    languageId?: number;
    isAutoSaveEnabled?: boolean;
  };
  userSettings: {
    userId: string;
    userName: string;
    languageId: number;
    securityRoles: string[];
    roles?: Array<{ id: string; name: string }>;
  };
}

export interface XrmContext {
  Utility: {
    getGlobalContext(): XrmGlobalContext;
  };
  WebApi: {
    retrieveMultipleRecords(
      entityLogicalName: string,
      options?: string,
      maxPageSize?: number,
    ): Promise<{ entities: Record<string, unknown>[]; nextLink?: string }>;
    retrieveRecord(
      entityLogicalName: string,
      id: string,
      options?: string,
    ): Promise<Record<string, unknown>>;
    createRecord(
      entityLogicalName: string,
      data: Record<string, unknown>,
    ): Promise<{ id: string }>;
    updateRecord(
      entityLogicalName: string,
      id: string,
      data: Record<string, unknown>,
    ): Promise<{ id: string }>;
    deleteRecord(
      entityLogicalName: string,
      id: string,
    ): Promise<{ id: string }>;
  };
}

declare global {
  interface Window {
    Xrm?: XrmContext;
  }
}
