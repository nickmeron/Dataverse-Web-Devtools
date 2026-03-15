import type { XrmContext, XrmGlobalContext } from '@/shared/types/xrm';

/**
 * Resolves the global context from all available sources:
 * 1. GetGlobalContext() — provided by ClientGlobalContext.js.aspx (standalone web resource)
 * 2. window.Xrm — available when loaded as a form script
 * 3. parent.Xrm — available when loaded as an iframe inside a Model-Driven App
 */
function resolveGlobalContext(): XrmGlobalContext | null {
  // ClientGlobalContext.js.aspx sets GetGlobalContext on the window
  // This is the official way for standalone web resources
  try {
    const getter = (window as unknown as Record<string, unknown>)['GetGlobalContext'];
    if (typeof getter === 'function') {
      return getter() as XrmGlobalContext;
    }
  } catch {
    // not available
  }

  // Direct on window (form script context)
  if (window.Xrm?.Utility?.getGlobalContext) {
    return window.Xrm.Utility.getGlobalContext();
  }

  // Parent frame (web resource embedded in iframe)
  try {
    const parentXrm = (parent as Window & { Xrm?: XrmContext }).Xrm;
    if (parentXrm?.Utility?.getGlobalContext) {
      return parentXrm.Utility.getGlobalContext();
    }
  } catch {
    // Cross-origin
  }

  // Grandparent (nested iframes)
  try {
    const gpXrm = (parent?.parent as Window & { Xrm?: XrmContext })?.Xrm;
    if (gpXrm?.Utility?.getGlobalContext) {
      return gpXrm.Utility.getGlobalContext();
    }
  } catch {
    // Cross-origin
  }

  return null;
}

let cachedGlobalContext: XrmGlobalContext | null = null;

export function getGlobalContext(): XrmGlobalContext {
  if (!cachedGlobalContext) {
    cachedGlobalContext = resolveGlobalContext();
  }
  if (!cachedGlobalContext) {
    throw new Error(
      'Xrm context not found. This app must run as a Dataverse web resource.',
    );
  }
  return cachedGlobalContext;
}

/** Returns the org base URL, e.g. "https://myorg.crm.dynamics.com" */
export function getClientUrl(): string {
  return getGlobalContext().getClientUrl();
}

/** Returns current user ID (GUID without braces) */
export function getUserId(): string {
  return getGlobalContext().userSettings.userId.replace(/[{}]/g, '');
}

/** Returns current user display name */
export function getUserName(): string {
  return getGlobalContext().userSettings.userName;
}

/** Returns organization unique name */
export function getOrgName(): string {
  return getGlobalContext().organizationSettings.uniqueName;
}

/** Returns organization ID */
export function getOrgId(): string {
  return getGlobalContext().organizationSettings.organizationId;
}

/** Returns Dataverse version */
export function getVersion(): string {
  return getGlobalContext().getVersion();
}

/** Check if context is available (for conditional rendering) */
export function isXrmAvailable(): boolean {
  try {
    getGlobalContext();
    return true;
  } catch {
    return false;
  }
}
