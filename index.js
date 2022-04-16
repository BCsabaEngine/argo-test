const { version } = require('./package.json');
const http = require('http');
const env = require('env-var');
const mq = require('enginemq-client');

const K8S_NODE_NAME = env.get('K8S_NODE_NAME').default('').asString();
const K8S_POD_NAME = env.get('K8S_POD_NAME').default('').asString();
const K8S_POD_NAMESPACE = env.get('K8S_POD_NAMESPACE').default('').asString();
const K8S_POD_IP = env.get('K8S_POD_IP').default('').asString();
const K8S_POD_SERVICE_ACCOUNT = env.get('K8S_POD_SERVICE_ACCOUNT').default('').asString();

let mqReconnectCount = 0;
let mqMessageCount = 0;
const startAt = new Date().toISOString();

const requestListener = function (req, res) {
    //    setTimeout(() => {
    res.writeHead(200).end(`[${version}] (${K8S_NODE_NAME}/${K8S_POD_NAME}/${K8S_POD_NAMESPACE}/${K8S_POD_IP}/${K8S_POD_SERVICE_ACCOUNT}) Now is: ${new Date().toISOString()} | Start: ${startAt} | MsgCount: ${mqMessageCount} | Reconnect: ${mqReconnectCount}`);
    //    }, 20);
}

const server = http.createServer(requestListener);
server.listen(8080, () => {
    console.log('Server started at port 8080');
});

const mqclient = new mq.EngineMqClient({
    clientId: 'test',
    host: 'enginemq-broker-prod',
    // authToken: '????', 
    connectAutoStart: false,
    maxWorkers: 4
});

mqclient.on('mq-connected', (reconnectCount) => {
    console.log("Connected: " + reconnectCount);
    mqReconnectCount = reconnectCount;
});
mqclient.on('mq-error', (errorCode, errorMessage, data) => console.log("Error " + errorCode + ': ' + errorMessage, data));
mqclient.on('mq-disconnected', () => console.log("Disconnected"));

mqclient.on('mq-ready', async () => {
    console.log("Ready");

    mqclient.subscribe(['log.event.*', 'log.#.plugins']);

    await publish(20);
    setInterval(async () => {
        await publish(20);
    }, 3 * 1000);
});

mqclient.on('mq-message', (ack, topic, data, delivery) => {
    console.dir(`Received message from ${topic} (id=${delivery.options.messageId}): ${JSON.stringify(data)}`);
    mqMessageCount++;
    ack.finish();
});

mqclient.connect();

const publish = async (count) => {
    try {
        if (mqclient.connected) {
            for (let i = 0; i < count; i++)
                await mqclient.publish(
                    'log.wordpress.plugins',
                    {
                        mimeType: 'application/string',
                        str: `Example data #${i}`,
                    });
            console.log(`Published ${count} messages`);
        }
    }
    catch (error) {
        console.log(`Error: ${error instanceof Error ? error.message : ''}`)
    }
}
