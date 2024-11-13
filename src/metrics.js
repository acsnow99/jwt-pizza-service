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
    requestTracker = (req, res) => {
        this.sendMetricToGrafana('request', req.method, 'requested', 30);
    }

    sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
        const metric = `${metricPrefix},source=jwt-pizza-service ${metricName}=${metricValue}`;

        console.log("Request body:", {
            method: 'post',
            body: metric,
            headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`, 'Content-Type': 'text/plain', },
            }, config.metrics.url);

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
module.exports = metrics;
