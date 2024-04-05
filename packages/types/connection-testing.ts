export interface TestConnectionModelParams {
  connectionDefinitionId: string;
  connectionKey: string;
  modelName: string;
  modelConfig: {
    updateIdFieldName?: string;
    updateFields?: string[];
    getIdFieldName?: string;
    deleteIdFieldName?: string;
    customDeleteValue?: string;
  };
}

export interface TestModelReturn {
  action: string;
  connectionModelDefinitionId: string;
  success: boolean;
  request: {
    headers: Record<string, string> | null;
    body: Record<string, any> | null;
    pathParams: Record<string, string> | null;
    queryParams: Record<string, string> | null;
  };
  testEndpointResponse: any;
}
