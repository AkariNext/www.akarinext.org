import { createDirectus, rest, readItems } from '@directus/sdk';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import ping from 'ping';
import dotenv from 'dotenv';
import tcpp from 'tcp-ping';

// Load .env file
dotenv.config();

const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORG = process.env.INFLUX_ORG || 'akarinext';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'server_metrics';
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

if (!INFLUX_TOKEN) {
    console.error('Error: INFLUX_TOKEN is not defined in .env');
    process.exit(1);
}

// InfluxDB Setup
const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET);

// Directus Setup
const directus = createDirectus(DIRECTUS_URL).with(rest());

interface MonitoredServer {
    name: string;
    ip: string;
    port?: number;
    type?: string;
}

// Helper for TCP Ping
const probeTcp = (host: string, port: number): Promise<{ alive: boolean, avg: number }> => {
    return new Promise((resolve) => {
        tcpp.ping({ address: host, port: port, attempts: 3, timeout: 2000 }, (err, data) => {
            if (err || !data) {
                resolve({ alive: false, avg: 0 });
                return;
            }
            const success = data.results.filter(r => !r.err);
            if (success.length === 0) {
                resolve({ alive: false, avg: 0 });
            } else {
                resolve({ alive: true, avg: data.avg });
            }
        });
    });
};

// Monitoring Loop
async function monitorServers() {
    try {
        const servers = await directus.request(readItems('game_servers', {
            fields: ['name', 'ip', 'port', 'type'],
            filter: {
                _and: [
                   { ip: { _nnull: true } },
                   { ip: { _nempty: true } }
                ]
            }
        })) as unknown as MonitoredServer[];

        if (!servers || servers.length === 0) {
            console.log(`[${new Date().toISOString()}] No servers found to monitor.`);
            return;
        }

        console.log(`[${new Date().toISOString()}] Monitoring ${servers.length} servers...`);

        for (const server of servers) {
            const host = server.ip.trim();
            if (!host) continue;

            let alive = false;
            let avg = 0;
            let loss = 0;

            // Strategy: TCP first if port exists, else ICMP
            if (server.port) {
                const tcpRes = await probeTcp(host, server.port);
                alive = tcpRes.alive;
                avg = tcpRes.avg;
                loss = alive ? 0 : 100;
            } else {
                try {
                    const res = await ping.promise.probe(host, { timeout: 2 });
                    alive = res.alive;
                    avg = res.avg === 'unknown' ? 0 : parseFloat(String(res.avg));
                    loss = res.packetLoss === 'unknown' ? 100 : parseFloat(String(res.packetLoss));
                } catch (e) {
                    console.error(`ICMP failed for ${host}:`, e);
                }
            }

            const point = new Point('ping')
                .tag('url', host)
                .tag('name', server.name || host)
                .tag('type', server.type || 'unknown')
                .floatField('average_response_ms', avg)
                .floatField('packet_loss_percent', loss)
                .booleanField('alive', alive);

            writeApi.writePoint(point);
            console.log(`  > ${host}:${server.port || '(ICMP)'} : ${alive ? 'OK' : 'FAIL'} (${Math.round(avg)}ms)`);
        }
        
        await writeApi.flush();

    } catch (e) {
        console.error('Error during monitoring cycle:', e);
    }
}

// Start
console.log("Starting server monitor agent...");
monitorServers();
setInterval(monitorServers, 10000);
