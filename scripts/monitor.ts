import { InfluxDB, Point, type WriteApi } from "@influxdata/influxdb-client";
import dotenv from "dotenv";
import ping from "ping";
import tcpp from "tcp-ping";

// Load .env file
dotenv.config();

const INFLUX_URL = process.env.INFLUX_URL || "http://localhost:8086";
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORG = process.env.INFLUX_ORG || "akarinext";
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || "server_metrics";
const POCKETBASE_URL = (
	process.env.POCKETBASE_URL ||
	process.env.PUBLIC_POCKETBASE_URL ||
	"http://localhost:8090"
).replace(/\/$/, "");

let writeApi: WriteApi | null = null;

if (!INFLUX_TOKEN) {
	console.error(
		"Error: INFLUX_TOKEN is not defined in .env. Helper will stand by without monitoring.",
	);
} else {
	// InfluxDB Setup
	const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
	writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET);
}

interface MonitoredServer {
	name: string;
	ip: string;
	port?: number;
	type?: string;
}

// Helper for TCP Ping
const probeTcp = (
	host: string,
	port: number,
): Promise<{ alive: boolean; avg: number }> => {
	return new Promise((resolve) => {
		tcpp.ping(
			{ address: host, port: port, attempts: 3, timeout: 2000 },
			(err, data) => {
				if (err || !data) {
					resolve({ alive: false, avg: 0 });
					return;
				}
				const success = data.results.filter((r) => !r.err);
				if (success.length === 0) {
					resolve({ alive: false, avg: 0 });
				} else {
					resolve({ alive: true, avg: data.avg || 0 });
				}
			},
		);
	});
};

// Monitoring Loop
async function monitorServers() {
	if (!writeApi) return; // Skip if no write API

	try {
		const res = await fetch(
			`${POCKETBASE_URL}/api/collections/game_servers/records?perPage=100&skipTotal=1`,
		);
		if (!res.ok) throw new Error(`CMS Error: ${res.status}`);
		const data = (await res.json()) as { items?: MonitoredServer[] };
		const servers = data.items ?? [];

		if (!servers || servers.length === 0) {
			console.log(`[${new Date().toISOString()}] No servers found to monitor.`);
			return;
		}

		console.log(
			`[${new Date().toISOString()}] Monitoring ${servers.length} servers...`,
		);

		for (const server of servers) {
			const host = server.ip?.trim();
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
					// 届かなかったとき、avg は数値ではなく "unknown" になる。
					// packetLoss は数値で返るので、そのまま受ける
					avg = res.avg === "unknown" ? 0 : Number.parseFloat(res.avg);
					loss = Number.isNaN(res.packetLoss) ? 100 : res.packetLoss;
				} catch (e) {
					console.error(`ICMP failed for ${host}:`, e);
				}
			}

			// Ensure no NaNs
			if (Number.isNaN(avg)) avg = 0;
			if (Number.isNaN(loss)) loss = 0;

			const point = new Point("ping")
				.tag("url", host)
				.tag("name", server.name || host)
				.tag("type", server.type || "unknown")
				.floatField("average_response_ms", avg)
				.floatField("packet_loss_percent", loss)
				.booleanField("alive", alive);

			writeApi.writePoint(point);
			console.log(
				`  > ${host}:${server.port || "(ICMP)"} : ${alive ? "OK" : "FAIL"} (${Math.round(avg)}ms)`,
			);
		}

		await writeApi.flush();
	} catch (e) {
		console.error("Error during monitoring cycle:", e);
	}
}

// ---------------------------------------------------------------------------
// HTTP 外形監視
//
// Traefik が落ちるとサーバー上の全サイトが 502 になるが、TCP 接続自体は
// Cloudflare が受けるため成功してしまう。TCP ping では検知できないので、
// ステータスコードまで確認する。
// ---------------------------------------------------------------------------

/** 監視対象 URL（カンマ区切り） */
const HTTP_TARGETS = (process.env.MONITOR_HTTP_TARGETS || "")
	.split(",")
	.map((value) => value.trim())
	.filter(Boolean);
const HTTP_INTERVAL_MS = Number(process.env.MONITOR_HTTP_INTERVAL_MS || 60000);
/** 何回連続で失敗したら通知するか。1 回の瞬断で鳴らさないための猶予 */
const ALERT_AFTER = Number(process.env.MONITOR_ALERT_AFTER || 2);
const ALERT_WEBHOOK = process.env.DISCORD_WEBHOOK_ALERTS || "";

/** URL ごとの連続失敗回数と、通知済みかどうか */
const httpState = new Map<string, { fails: number; alerted: boolean }>();

async function sendAlert(content: string) {
	console.log(`[ALERT] ${content}`);
	if (!ALERT_WEBHOOK) return;
	try {
		await fetch(ALERT_WEBHOOK, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content }),
		});
	} catch (e) {
		console.error("Failed to send alert:", e);
	}
}

async function probeHttp(
	url: string,
): Promise<{ ok: boolean; status: number; ms: number }> {
	const started = Date.now();
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 10000);
	try {
		const res = await fetch(url, {
			// リダイレクトは追わない。3xx がそのまま返れば入口は生きている
			redirect: "manual",
			signal: controller.signal,
			headers: { "User-Agent": "akarinext-monitor/1" },
			cache: "no-store",
		});
		return {
			ok: res.status < 400,
			status: res.status,
			ms: Date.now() - started,
		};
	} catch {
		// タイムアウトや接続失敗は status 0 として扱う
		return { ok: false, status: 0, ms: Date.now() - started };
	} finally {
		clearTimeout(timer);
	}
}

async function checkOne(url: string) {
	const result = await probeHttp(url);
	const state = httpState.get(url) || { fails: 0, alerted: false };

	if (result.ok) {
		if (state.alerted) await sendAlert(`✅ 復旧: ${url} (${result.status})`);
		httpState.set(url, { fails: 0, alerted: false });
	} else {
		state.fails += 1;
		if (state.fails >= ALERT_AFTER && !state.alerted) {
			const reason = result.status ? `HTTP ${result.status}` : "接続できません";
			await sendAlert(`🚨 ${url} — ${reason}（${state.fails} 回連続）`);
			state.alerted = true;
		}
		httpState.set(url, state);
	}

	console.log(
		`  > ${url} : ${result.ok ? "OK" : "FAIL"} (${result.status || "-"}, ${result.ms}ms)`,
	);

	if (writeApi) {
		writeApi.writePoint(
			new Point("http_check")
				.tag("url", url)
				.intField("status_code", result.status)
				.floatField("response_ms", result.ms)
				.booleanField("ok", result.ok),
		);
	}
}

async function monitorHttp() {
	console.log(
		`[${new Date().toISOString()}] Checking ${HTTP_TARGETS.length} URLs...`,
	);
	// 応答の遅い対象が他の監視を止めないよう並列で叩く
	await Promise.all(HTTP_TARGETS.map((url) => checkOne(url)));
	if (writeApi) {
		try {
			await writeApi.flush();
		} catch (e) {
			console.error("Failed to flush HTTP metrics:", e);
		}
	}
}

// Start only if configured
console.log("Starting server monitor agent...", INFLUX_URL, POCKETBASE_URL);
if (writeApi) {
	monitorServers();
	setInterval(monitorServers, 10000);
} else {
	console.log("Ping monitoring disabled (INFLUX_TOKEN is not set).");
}

// HTTP 監視は InfluxDB に依存させない。記録先が落ちていても通知は出したい
if (HTTP_TARGETS.length > 0) {
	console.log(
		`HTTP monitoring: ${HTTP_TARGETS.length} target(s) every ${HTTP_INTERVAL_MS / 1000}s`,
		ALERT_WEBHOOK ? "(alerts enabled)" : "(alerts to log only)",
	);
	monitorHttp();
	setInterval(monitorHttp, HTTP_INTERVAL_MS);
} else {
	console.log("HTTP monitoring disabled (MONITOR_HTTP_TARGETS is not set).");
}

if (!writeApi && HTTP_TARGETS.length === 0) {
	// 何も監視しない場合でもプロセスは生かしておく（concurrently の安定のため）
	setInterval(() => {}, 60000);
}
