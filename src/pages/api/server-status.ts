export const prerender = false;

import type { APIRoute } from 'astro';
import { getServerPingHistory, getServerAvailability, type PingData } from "../../lib/influxdb";

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const ip = url.searchParams.get('ip');
    const port = url.searchParams.get('port');
    const type = url.searchParams.get('type');
    const isBedrock = url.searchParams.get('bedrock') === 'true';

    if (!ip) {
        return new Response(JSON.stringify({ error: 'Missing IP' }), { status: 400 });
    }

    const fetchAddress = port ? `${ip}:${port}` : ip;
    let statusData: any = { online: false };
    
    // InfluxDB Data (Availability / Ping)
    let availability = 100;
    let avgPing = 0;
    let pingHistory: PingData[] = [];
    let sparklinePath = "";

    try {
        const targetHost = ip.trim();
        pingHistory = await getServerPingHistory(targetHost);
        availability = await getServerAvailability(targetHost);
        
        if (pingHistory.length > 0) {
            const total = pingHistory.reduce((acc, curr) => acc + curr.avg, 0);
            avgPing = Math.round(total / pingHistory.length);

            // Generate SVG Path for Sparkline (Server-side calculation)
            const width = 100;
            const height = 30;
            const maxPing = Math.max(...pingHistory.map(p => p.avg), 1);
            
            if (pingHistory.length > 1) {
                const points = pingHistory.map((p, i) => {
                    const x = (i / (pingHistory.length - 1)) * width;
                    const normalizedY = height - ((p.avg / (maxPing * 1.2)) * height); 
                    return `${x},${normalizedY}`;
                });
                sparklinePath = `M ${points.join(" L ")}`;
            } else if (pingHistory.length === 1) {
                const normalizedY = height - ((pingHistory[0].avg / (maxPing * 1.2)) * height);
                sparklinePath = `M 0,${normalizedY} L 100,${normalizedY}`;
            }
        }
    } catch (e) {
        // Ignore Influx errors
    }

    try {
        if (type === 'minecraft') {
            const apiEndpoint = isBedrock ? 'bedrock/3' : '3';
            const res = await fetch(`https://api.mcsrvstat.us/${apiEndpoint}/${fetchAddress}`);
            if (res.ok) {
                const data = await res.json();
                statusData = {
                    ...data,
                    online: data.online,
                    availability,
                    avgPing,
                    pingHistory,
                    sparklinePath
                };
            }
            
            if (!statusData.online && !isBedrock) {
                 const fallbackRes = await fetch(`https://api.mcsrvstat.us/2/${fetchAddress}`);
                 if (fallbackRes.ok) {
                     const fbData = await fallbackRes.json();
                     if (fbData.online) {
                         statusData = { 
                             ...fbData, 
                             online: true, 
                             availability, 
                             avgPing, 
                             pingHistory,
                             sparklinePath
                         };
                     }
                 }
            }
        } else {
            // Web or Service
            statusData = { 
                online: true, 
                availability, 
                avgPing, 
                pingHistory,
                sparklinePath
            };
        }
    } catch (e) {
        console.error('API Error:', e);
    }
    
    // Add calculated stats to response root if not present (fallback)
    if (statusData.availability === undefined) statusData.availability = availability;
    if (statusData.avgPing === undefined) statusData.avgPing = avgPing;
    if (statusData.sparklinePath === undefined) statusData.sparklinePath = sparklinePath;

    return new Response(JSON.stringify(statusData), {
        headers: { 'Content-Type': 'application/json' }
    });
};
