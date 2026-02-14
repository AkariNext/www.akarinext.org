import { InfluxDB } from '@influxdata/influxdb-client';

const url = import.meta.env.INFLUX_URL || process.env.INFLUX_URL || 'http://localhost:8086';
// In development, you might not have the token set yet
const token = import.meta.env.INFLUX_TOKEN || process.env.INFLUX_TOKEN; 
const org = import.meta.env.INFLUX_ORG || process.env.INFLUX_ORG || 'akarinext';
const bucket = import.meta.env.INFLUX_BUCKET || process.env.INFLUX_BUCKET || 'server_metrics';

console.log(`[InfluxDB Lib] Init: URL=${url}, Org=${org}, Bucket=${bucket}, TokenDefined=${!!token}`);

let queryApi: any = null;

if (token) {
    const client = new InfluxDB({ url, token });
    queryApi = client.getQueryApi(org);
}

export interface PingData {
    time: string;
    avg: number;
    loss: number;
}

export async function getServerPingHistory(host: string, range = '-1h'): Promise<PingData[]> {
    if (!queryApi) return [];

    // flux query to get average ping time
    // filtering by url (host)
    const fluxQuery = `
    from(bucket: "${bucket}")
    |> range(start: ${range})
    |> filter(fn: (r) => r["_measurement"] == "ping")
    |> filter(fn: (r) => r["_field"] == "average_response_ms")
    |> filter(fn: (r) => r["url"] == "${host}")
    |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
    |> yield(name: "mean")
    `;

    try {
        const result: PingData[] = [];
        // console.log(`[InfluxDB] Querying for host: ${host}, bucket: ${bucket}`);
        await new Promise<void>((resolve, reject) => {
            queryApi.queryRows(fluxQuery, {
                next(row: any, tableMeta: any) {
                    const o = tableMeta.toObject(row);
                    result.push({
                        time: o._time,
                        avg: Math.round(o._value * 10) / 10, // round to 1 decimal
                        loss: 0 // Placeholder for now
                    });
                },
                error(error: Error) {
                    console.error('InfluxDB Query Error:', error);
                    reject(error);
                },
                complete() {
                    // console.log(`[InfluxDB] Query complete for ${host}. Rows: ${result.length}`);
                    resolve();
                },
            });
        });
        if (result.length === 0) {
            console.warn(`[InfluxDB] No data found for host: ${host} in bucket: ${bucket}`);
        }
        return result;
    } catch (e) {
        console.error("Failed to fetch influx data", e);
        return [];
    }
}
