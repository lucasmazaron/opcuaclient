import {
    OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    AttributeIds,
    makeBrowsePath,
    ClientSubscription,
    TimestampsToReturn,
    MonitoringParametersOptions,
    ReadValueIdLike,
    ClientMonitoredItem,
    DataValue
  } from "node-opcua";

  interface Fields {
    fieldDescription: string,
    nodeId: string
  }

  interface OpcUaConfig {
    fields?: Array<Fields>, 
    endPoint?: string,
    applicationName?: string
}

const connectionStrategy = {
    initialDelay: 1000,
    maxRetry: 1
};

export module OpcUaClient {
  
  export async function startConnection(configs: OpcUaConfig) {
    try {
      let client = OPCUAClient.create({
        applicationName: configs.applicationName,
        connectionStrategy: connectionStrategy,
        securityMode: MessageSecurityMode.None,
        securityPolicy: SecurityPolicy.None,
        endpoint_must_exist: false
    });
      await client.connect(configs.endPoint);
      console.log("connected !");
  
      const session = await client.createSession();
      console.log("session created !");
  
  
      const fields = configs.fields;
      let value = null;
      let data = [];
      for(const field of fields){
        value = await session.read({nodeId: field.nodeId, attributeId: AttributeIds.Value});
        data.push({nodeId: field.nodeId, description: field.fieldDescription, value: value.value.value});
      }
  
      await session.close();
  
      await client.disconnect();
      console.log("done !");

      return data;
    } catch(err) {
      console.log("An error has occured : ",err);
    }
  }
}