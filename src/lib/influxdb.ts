import { InfluxDB, type QueryApi } from '@influxdata/influxdb-client';

const url = import.meta.env.INFLUX_URL || process.env.INFLUX_URL || 'http://localhost:8086';
// In development, you might not have the token set yet
const token = import.meta.env.INFLUX_TOKEN || process.env.INFLUX_TOKEN; 
const org = import.meta.env.INFLUX_ORG || process.env.INFLUX_ORG || 'akarinext';
const bucket = import.meta.env.INFLUX_BUCKET || process.env.INFLUX_BUCKET || 'server_metrics';

let queryApi: QueryApi | null = null;

if (token) {
    const client = new InfluxDB({ url, token });
    queryApi = client.getQueryApi(org);
}

export interface PingData {
    time: string;
    avg: number;
    loss: number;
    alive: boolean;
}

export async function getServerPingHistory(host: string, range = '-1h'): Promise<PingData[]> {
    if (!queryApi) return [];

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
        await new Promise<void>((resolve, reject) => {
            queryApi!.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row);
                    result.push({
                        time: o._time,
                        avg: Math.round(o._value * 10) / 10 || 0,
                        loss: 0,
                        alive: true // Fallback for simple query
                    });
                },
                error(error: Error) {
                    console.error('InfluxDB Query Error:', error);
                    reject(error);
                },
                complete() {
                    resolve();
                },
            });
        });
        return result;
    } catch {
        return [];
    }
}

export async function getServerAvailability(host: string, range = '-24h'): Promise<number> {
    if (!queryApi) return 100;

    const fluxQuery = `
    from(bucket: "${bucket}")
    |> range(start: ${range})
    |> filter(fn: (r) => r["_measurement"] == "ping")
    |> filter(fn: (r) => r["_field"] == "alive")
    |> filter(fn: (r) => r["url"] == "${host}")
    |> map(fn: (r) => ({ r with _value: if r._value then 1.0 else 0.0 }))
    |> mean()
    `;

    try {
        let availability = 100;
        await new Promise<void>((resolve, reject) => {
            if (!queryApi) {
                resolve();
                return;
            }
            queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row);
                    // alive is booleanField, in Influx it usually means 1 for true, 0 for false in aggregation
                    availability = Math.round(o._value * 1000) / 10;
                },
                error(error: Error) {
                    reject(error);
                },
                complete() {
                    resolve();
                },
            });
        });
        return availability;
    } catch {
        return 100;
    }
}
