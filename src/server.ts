import { Client } from 'ts-postgres';
import { OpcUaClient } from './opcua/opcua-client';
import * as moment from 'moment-timezone'

async function main() {

    const client = new Client({
        host: "25.45.235.248",
        port: 5432,
        user: "postgres",
        database: "smt",
        password: "postgres"
    });
    await client.connect();
 
    try {
        // Querying the client returns a query result promise
        // which is also an asynchronous result iterator.
        const resultIterator = client.query(
            ` select c.id cliente, cf.clp_id, cl.nome_setor_externo, cf.descricao, cf.node_id, cl.applicationname, cl.end_point
                from tbcliente c
                join tbclp cl on c.id = cl.cliente_id 
                join tbclpfields cf on cl.id = cf.clp_id 
               where c.id = $1`,
            ['1']
        );
 
        let clpData = {};
        let fields = []
        for await (const row of resultIterator) {
            clpData = {clp_id: row.get('clp_id'), applicationName: row.get('applicationname'), endPoint: row.get('end_point')};
            fields.push({fieldDescription: row.get('descricao'), nodeId: row.get('node_id')});
        }

        let data = await OpcUaClient.startConnection({fields: fields, endPoint: clpData['endPoint'], applicationName: clpData['applicationName']});
        
        for await(const row of data){
            client.query(
                `INSERT INTO public.tbdata(clp_id, node_id, value, data_hora)
                     VALUES(${clpData['clp_id']}, '${row.nodeId}', '${row.value}', '${moment().tz("America/Sao_Paulo").format("YYYYMMDD HH:mm:ss")}')`
            )
        }
    } finally {
        await client.end();
    }
}
 
main()