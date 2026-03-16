import { useQuery } from '@tanstack/react-query';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/queryKeys';
import type {
  PluginAssembly,
  PluginType,
  SdkMessageProcessingStep,
  SdkMessageProcessingStepImage,
  ServiceEndpoint,
} from '@/shared/types/dataverse';

// Note: ishidden and ismanaged are BooleanManagedProperty types.
// Filter using the nested Value property: ishidden/Value eq false

export function useAssemblies() {
  return useQuery({
    queryKey: queryKeys.assemblies.all,
    queryFn: () =>
      dataverseClient.getCollection<PluginAssembly>(
        `${endpoints.assemblies.list}?$select=pluginassemblyid,name,version,publickeytoken,culture,isolationmode,sourcetype,description,createdon,modifiedon,ismanaged&$filter=ishidden/Value eq false&$orderby=name`,
      ),
    staleTime: 30_000,
  });
}

export function usePluginTypes() {
  return useQuery({
    queryKey: ['pluginTypes'],
    queryFn: () =>
      dataverseClient.getCollection<PluginType>(
        `${endpoints.pluginTypes.list}?$select=plugintypeid,typename,friendlyname,name,assemblyname,isworkflowactivity,workflowactivitygroupname,description,_pluginassemblyid_value&$filter=isworkflowactivity eq false`,
      ),
    staleTime: 30_000,
  });
}

export function useSteps() {
  return useQuery({
    queryKey: queryKeys.steps.all,
    queryFn: () =>
      dataverseClient.getCollection<SdkMessageProcessingStep>(
        `${endpoints.steps.list}?$select=sdkmessageprocessingstepid,name,stage,mode,rank,filteringattributes,supporteddeployment,asyncautodelete,configuration,description,statecode,statuscode,_sdkmessageid_value,_sdkmessagefilterid_value,_plugintypeid_value,_impersonatinguserid_value,_eventhandler_value,_sdkmessageprocessingstepsecureconfigid_value&$filter=ishidden/Value eq false and _plugintypeid_value ne null&$orderby=name`,
      ),
    staleTime: 30_000,
  });
}

export function useStepImages() {
  return useQuery({
    queryKey: ['stepImages'],
    queryFn: () =>
      dataverseClient.getCollection<SdkMessageProcessingStepImage>(
        `${endpoints.images.list}?$select=sdkmessageprocessingstepimageid,imagetype,name,entityalias,attributes,messagepropertyname,_sdkmessageprocessingstepid_value`,
      ),
    staleTime: 30_000,
  });
}

export function useServiceEndpoints() {
  return useQuery({
    queryKey: queryKeys.serviceEndpoints.all,
    queryFn: () =>
      dataverseClient.getCollection<ServiceEndpoint>(
        `${endpoints.serviceEndpoints.list}?$select=serviceendpointid,name,description,contract,url,authtype,messageformat,namespaceaddress,path,userclaim,connectionmode`,
      ),
    staleTime: 30_000,
  });
}

export function useWebhookSteps() {
  return useQuery({
    queryKey: queryKeys.webhooks.all,
    queryFn: () =>
      dataverseClient.getCollection<SdkMessageProcessingStep>(
        `${endpoints.steps.list}?$select=sdkmessageprocessingstepid,name,stage,mode,rank,filteringattributes,supporteddeployment,asyncautodelete,configuration,description,statecode,statuscode,_sdkmessageid_value,_sdkmessagefilterid_value,_plugintypeid_value,_impersonatinguserid_value,_eventhandler_value,_sdkmessageprocessingstepsecureconfigid_value&$filter=ishidden/Value eq false and _eventhandler_value ne null&$orderby=name`,
      ),
    staleTime: 30_000,
  });
}
