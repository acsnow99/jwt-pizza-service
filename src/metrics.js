const os = require('os');

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

const config = require('./config.js');

class Metrics {
    requestCount = 0;
    getCount = 0;
    postCount = 0;
    putCount = 0;
    deleteCount = 0;

    requestTracker = (req, res, next) => {
        this.requestCount++;
        console.log("Method", req.method);
        switch (req.method) {
            case 'GET':
                this.getCount++;
                break;
            case 'POST':
                this.postCount++;
                break;
            case 'PUT':
                this.putCount++;
                break;
            case 'DELETE':
                this.deleteCount++;
                break;
        }
        next();
    }

    sendOsMetrics = async () => {
        console.log("Sending system metrics");
        const cpuUsage = getCpuUsagePercentage();
        const memoryUsage = getMemoryUsagePercentage();
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'CPU', cpuUsage);
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'memory', memoryUsage);
        setTimeout(() => this.sendOsMetrics(), 10000);
    }

    sendRequestsMetrics = async () => {
        this.sendMetricToGrafana('jwt-pizza-service', 'all', 'requests', this.requestCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'get', 'requests', this.getCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'post', 'requests', this.postCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'put', 'requests', this.putCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'delete', 'requests', this.deleteCount);
        setTimeout(() => this.sendRequestsMetrics(), 10000);
    }

    sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
        const metric = `${metricPrefix},source=jwt-pizza-service,method=${httpMethod} ${metricName}=${metricValue}`;

        // console.log("Request body:", {
        //     method: 'post',
        //     body: metric,
        //     headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`, 'Content-Type': 'text/plain', },
        //     }, config.metrics.url);

        fetch(`${config.metrics.url}`, {
        method: 'post',
        body: metric,
        headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`, 'Content-Type': 'text/plain', },
        })
        .then((response) => {
            if (!response.ok) {
                console.log("Failed response:", response);
                console.error('Failed to push metrics data to Grafana');
            } else {
            console.log(`Pushed ${metric}`);
            }
        })
        .catch((error) => {
            console.error('Error pushing metrics:', error);
        });
    }
}

const metrics = new Metrics();
metrics.sendOsMetrics();
metrics.sendRequestsMetrics();
module.exports = metrics;
