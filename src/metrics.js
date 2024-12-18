const os = require('os');

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / 2;
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
    defaultMetricsRate = 60000
    requestCount = 0;
    getCount = 0;
    postCount = 0;
    putCount = 0;
    deleteCount = 0;
    activeUsers = 0;
    pizzaCount = 0;
    revenue = 0;
    successfulOrder = 0;
    failedOrder = 0;
    successfulAuth = 0;
    failedAuth = 0;

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

    sendRegularMetrics = async () => {
        this.sendOsMetrics();
        this.sendRequestsMetrics();
        this.sendUsersMetrics();
        this.sendOrderMetrics();
    }

    sendOsMetrics = async () => {
        console.log("Sending system metrics");
        const cpuUsage = getCpuUsagePercentage();
        const memoryUsage = getMemoryUsagePercentage();
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'none', 'CPU', cpuUsage);
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'none', 'memory', memoryUsage);
        setTimeout(() => this.sendOsMetrics(), this.defaultMetricsRate);
    }

    sendRequestsMetrics = async () => {
        this.sendMetricToGrafana('jwt-pizza-service', 'method', 'all', 'requests', this.requestCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'method', 'get', 'requests', this.getCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'method', 'post', 'requests', this.postCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'method', 'put', 'requests', this.putCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'method', 'delete', 'requests', this.deleteCount);
        setTimeout(() => this.sendRequestsMetrics(), this.defaultMetricsRate);
    }

    sendUsersMetrics = async () => {
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'none', 'activeUsers', this.activeUsers);
        this.sendMetricToGrafana('jwt-pizza-service', 'success', 'success', 'auth', this.successfulAuth);
        this.sendMetricToGrafana('jwt-pizza-service', 'success', 'failed', 'auth', this.failedAuth);
        setTimeout(() => this.sendUsersMetrics(), this.defaultMetricsRate);
    }

    sendOrderMetrics = async () => {
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'none', 'numberOfPizzas', this.pizzaCount);
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'none', 'revenue', this.revenue);
        this.sendMetricToGrafana('jwt-pizza-service', 'success', 'success', 'orderAmount', this.successfulOrder);
        this.sendMetricToGrafana('jwt-pizza-service', 'success', 'failed', 'orderAmount', this.failedOrder);
        setTimeout(() => this.sendOrderMetrics(), this.defaultMetricsRate);
    }

    sendServiceTime = async (time) => {
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'none', 'serviceTime', time);
    }

    incrementSuccessfulAuth = () => {
        this.successfulAuth++;
    }

    incrementFailedAuth = () => {
        this.failedAuth++;
    }

    incrementPizzaCount = async (count) => {
        this.pizzaCount += count;
    }

    sendTimeToOrderMetrics = async (time) => {
        this.sendMetricToGrafana('jwt-pizza-service', 'none', 'none', 'timeToOrder', time);
    }

    incrementRevenue = (cost) => {
        this.revenue += cost;
    }

    incrementOrder = (successMessage) => {
        if (successMessage === 'success') {
            this.successfulOrder++;
        } else {
            this.failedOrder++;
        }
    }

    incrementActiveUsers = () => {
        this.activeUsers++;
    }

    decrementActiveUsers = () => {
        this.activeUsers--;
    }

    sendMetricToGrafana(metricPrefix, variableName, variableValue, metricName, metricValue) {
        const metric = `${metricPrefix},source=jwt-pizza-service,${variableName}=${variableValue} ${metricName}=${metricValue}`;

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
metrics.sendRegularMetrics();
module.exports = metrics;
