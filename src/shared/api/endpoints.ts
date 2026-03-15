// Dataverse Web API endpoint builders

const BASE = '/api/data/v9.2';

export const endpoints = {
  // Functions
  whoAmI: `${BASE}/WhoAmI`,

  // Plugin Assemblies
  assemblies: {
    list: `${BASE}/pluginassemblies`,
    detail: (id: string) => `${BASE}/pluginassemblies(${id})`,
  },

  // Plugin Packages
  pluginPackages: {
    list: `${BASE}/pluginpackages`,
    detail: (id: string) => `${BASE}/pluginpackages(${id})`,
  },

  // Plugin Types
  pluginTypes: {
    list: `${BASE}/plugintypes`,
    byAssembly: (assemblyId: string) =>
      `${BASE}/plugintypes?$filter=_pluginassemblyid_value eq ${assemblyId}&$select=plugintypeid,typename,friendlyname,name,assemblyname,isworkflowactivity,workflowactivitygroupname,description,_pluginassemblyid_value`,
  },

  // Steps
  steps: {
    list: `${BASE}/sdkmessageprocessingsteps`,
    detail: (id: string) => `${BASE}/sdkmessageprocessingsteps(${id})`,
  },

  // Step Images
  images: {
    list: `${BASE}/sdkmessageprocessingstepimages`,
    detail: (id: string) => `${BASE}/sdkmessageprocessingstepimages(${id})`,
  },

  // Secure Configs
  secureConfigs: {
    list: `${BASE}/sdkmessageprocessingstepsecureconfigs`,
    detail: (id: string) =>
      `${BASE}/sdkmessageprocessingstepsecureconfigs(${id})`,
  },

  // SDK Messages
  messages: {
    list: `${BASE}/sdkmessages`,
  },

  // SDK Message Filters
  messageFilters: {
    list: `${BASE}/sdkmessagefilters`,
    byMessage: (messageId: string) =>
      `${BASE}/sdkmessagefilters?$filter=_sdkmessageid_value eq ${messageId} and iscustomprocessingstepallowed eq true&$select=sdkmessagefilterid,primaryobjecttypecode,secondaryobjecttypecode,_sdkmessageid_value`,
  },

  // Entity Metadata
  entityMetadata: {
    attributes: (entityName: string) =>
      `${BASE}/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,DisplayName,AttributeType&$filter=IsValidForRead eq true`,
  },

  // Service Endpoints
  serviceEndpoints: {
    list: `${BASE}/serviceendpoints`,
    detail: (id: string) => `${BASE}/serviceendpoints(${id})`,
  },

  // Trace Logs
  traceLogs: {
    list: `${BASE}/plugintracelogs`,
    detail: (id: string) => `${BASE}/plugintracelogs(${id})`,
  },

  // Organization (for trace settings)
  organizations: {
    list: `${BASE}/organizations`,
    detail: (id: string) => `${BASE}/organizations(${id})`,
  },

  // System Users
  users: {
    list: `${BASE}/systemusers`,
  },

  // Solutions
  solutions: {
    list: `${BASE}/solutions`,
  },

  // Batch
  batch: `${BASE}/$batch`,
} as const;
