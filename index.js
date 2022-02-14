const { version } = require('./package.json');
const http = require('http');
const env = require('env-var');

const K8S_NODE_NAME = env.get('K8S_NODE_NAME').default('').asString();
const K8S_POD_NAME = env.get('K8S_POD_NAME').default('').asString();
const K8S_POD_NAMESPACE = env.get('K8S_POD_NAMESPACE').default('').asString();
const K8S_POD_IP = env.get('K8S_POD_IP').default('').asString();
const K8S_POD_SERVICE_ACCOUNT = env.get('K8S_POD_SERVICE_ACCOUNT').default('').asString();

const requestListener = function (req, res) {
    setTimeout(() => {
        res.writeHead(200).end(`[${version}] (${K8S_NODE_NAME}/${K8S_POD_NAME}/${K8S_POD_NAMESPACE}/${K8S_POD_IP}/${K8S_POD_SERVICE_ACCOUNT}): Now is: ` + new Date().toISOString());
    }, 20);
}

const server = http.createServer(requestListener);
server.listen(8080, () => {
    console.log('Server started at port 8080');
});
