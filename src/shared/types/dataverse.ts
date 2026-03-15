// --- Dataverse entity types ---

export interface PluginAssembly {
  pluginassemblyid: string;
  name: string;
  version: string;
  publickeytoken: string | null;
  culture: string;
  isolationmode: number;
  sourcetype: number;
  description: string | null;
  content?: string; // base64 DLL bytes, only on upload/update
  createdon: string;
  modifiedon: string;
  ismanaged: boolean;
  ishidden: boolean;
  _pluginpackageid_value: string | null;
}

export interface PluginType {
  plugintypeid: string;
  typename: string;
  friendlyname: string;
  name: string;
  assemblyname: string;
  isworkflowactivity: boolean;
  workflowactivitygroupname: string | null;
  description: string | null;
  _pluginassemblyid_value: string;
}

export interface SdkMessageProcessingStep {
  sdkmessageprocessingstepid: string;
  name: string;
  stage: number;
  mode: number;
  rank: number;
  filteringattributes: string | null;
  supporteddeployment: number;
  asyncautodelete: boolean;
  configuration: string | null;
  description: string | null;
  statecode: number;
  statuscode: number;
  _sdkmessageid_value: string;
  _sdkmessagefilterid_value: string | null;
  _plugintypeid_value: string | null;
  _impersonatinguserid_value: string | null;
  _eventhandler_value: string | null;
  _sdkmessageprocessingstepsecureconfigid_value: string | null;
  // Formatted values from annotations
  '_sdkmessageid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_sdkmessagefilterid_value@OData.Community.Display.V1.FormattedValue'?: string;
  // Expanded navigation properties
  sdkmessageid?: { name: string; sdkmessageid: string };
  sdkmessagefilterid?: { primaryobjecttypecode: string };
  plugintypeid?: { typename: string; friendlyname: string };
  impersonatinguserid?: { fullname: string };
}

export interface SdkMessageProcessingStepImage {
  sdkmessageprocessingstepimageid: string;
  imagetype: number;
  name: string;
  entityalias: string;
  attributes: string | null;
  messagepropertyname: string;
  _sdkmessageprocessingstepid_value: string;
}

export interface SdkMessage {
  sdkmessageid: string;
  name: string;
  isprivate: boolean;
  availability?: number; // 0 = Server, 1 = Client, 2 = Both
  customizationlevel?: number; // 0 = OOB/system, >0 = custom
  isvalidforexecuteasync?: boolean;
  workflowsdkstepenabled?: boolean;
}

export interface SdkMessageFilter {
  sdkmessagefilterid: string;
  primaryobjecttypecode: string;
  secondaryobjecttypecode: string;
  _sdkmessageid_value: string;
  iscustomprocessingstepallowed: boolean;
}

export interface ServiceEndpoint {
  serviceendpointid: string;
  name: string;
  description: string | null;
  contract: number;
  url: string | null;
  authtype: number | null;
  authvalue: string | null;
  messageformat: number;
  namespaceaddress: string | null;
  path: string | null;
  saskeyname: string | null;
  saskey: string | null;
  sastoken: string | null;
  userclaim: number;
  connectionmode: number | null;
}

export interface PluginTraceLog {
  plugintracelogid: string;
  typename: string;
  messagename: string;
  primaryentity: string;
  messageblock: string | null;
  operationtype: number;
  mode: number;
  depth: number;
  createdon: string;
  performanceexecutionstarttime: string;
  performanceexecutionduration: number;
  performanceconstructorduration: number;
  exceptiondetails: string | null;
  configuration: string | null;
  correlationid: string | null;
  requestid: string | null;
}

export interface SecureConfig {
  sdkmessageprocessingstepsecureconfigid: string;
  secureconfig: string;
}

export interface SystemUser {
  systemuserid: string;
  fullname: string;
  internalemailaddress: string | null;
  isdisabled: boolean;
}

export interface Solution {
  solutionid: string;
  uniquename: string;
  friendlyname: string;
  version: string;
  ismanaged: boolean;
}

export interface WhoAmIResponse {
  BusinessUnitId: string;
  UserId: string;
  OrganizationId: string;
}

// --- OData response wrappers ---

export interface ODataCollectionResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

// --- Tree node types ---

export type TreeNodeType =
  | 'assembly'
  | 'type'
  | 'step'
  | 'image'
  | 'webhook'
  | 'serviceEndpoint';

export interface TreeNode {
  id: string;
  type: TreeNodeType;
  label: string;
  sublabel?: string;
  isEnabled?: boolean;
  isManaged?: boolean;
  children: TreeNode[];
  data:
    | PluginAssembly
    | PluginType
    | SdkMessageProcessingStep
    | SdkMessageProcessingStepImage
    | ServiceEndpoint;
}
