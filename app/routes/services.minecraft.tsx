import { defer } from '@remix-run/node';
import { IMCServer, MC_SERVERS } from '~/lib/mc_servers';
import {
	statusJava,
	statusBedrock,
	BedrockStatusResponse,
	JavaStatusResponse,
} from 'node-mcstatus';
import { Await, useLoaderData } from '@remix-run/react';
import { Badge } from '~/components/ui/badge';
import { IconQuestionMark } from '@tabler/icons-react';
import { LRUCache } from 'lru-cache';
import { Snippet } from '~/components/Snippet';
import { Suspense } from 'react';

interface IMinecraftProtocolVersion {
	minecraftVersion: string;
	version: number;
	dataVersion: number;
	useNetty: boolean;
	majorVersion: string;
}

const protocolVersions = new LRUCache<string, IMinecraftProtocolVersion[]>({
	max: 10,
	ttl: 60 * 60 * 1000,
});
const serverStatus = new LRUCache<
	string,
	{
		info: IMCServer;
		status: BedrockStatusResponse | JavaStatusResponse;
		protocolVersion: IMinecraftProtocolVersion;
		latestFetchDate: Date;
	}[]
>({ max: 1, ttl: 60 * 5 * 1000 });

async function getProtocolVersion(platform: 'pc' | 'bedrock' = 'pc') {
	let foundCache = protocolVersions.get(platform);
	if (!foundCache) {
		foundCache = (await (
			await fetch(
				`https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/${platform}/common/protocolVersions.json`,
			)
		).json()) as IMinecraftProtocolVersion[];
		protocolVersions.set(platform, foundCache);
	}
	return foundCache;
}

async function getServerStatus() {
	const foundCache = serverStatus.get('serverStatus');
	if (foundCache) return foundCache;

	const status = await Promise.all(
		MC_SERVERS.map(async (server) => {
			switch (server.type) {
				case 'bedrock': {
					const status = await statusBedrock(server.address, server.port);
					const fetchedProtocolVersion = await getProtocolVersion('bedrock');
					const protocolVersion = fetchedProtocolVersion.filter(
						(v) => v.version === status.version?.protocol,
					)[0];
					return {
						info: server,
						status,
						protocolVersion,
						latestFetchDate: new Date(),
					};
				}

				default: {
					const status = await statusJava(server.address, server.port);
					const fetchedProtocolVersion = await getProtocolVersion();
					const protocolVersion = fetchedProtocolVersion.filter(
						(v) => v.version === status.version?.protocol,
					)[0];
					return {
						info: server,
						status,
						protocolVersion,
						latestFetchDate: new Date(),
					};
				}
			}
		}),
	);

	serverStatus.set('serverStatus', status);
	return status;
}

export async function loader() {
	const status = getServerStatus();
	return defer({ status });
}

function isJavaResponse(
	response: JavaStatusResponse | BedrockStatusResponse,
): response is JavaStatusResponse {
	return 'icon' in response;
}

export default function Minecraft() {
	const { status } = useLoaderData<typeof loader>();
	return (
		<div className="grid grid-col-start-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
			<Suspense fallback={<p>Loading....</p>}>
				<Await resolve={status}>
					{(status) =>
						status.map((server) => {
							const diff_date = new Date(
								new Date().getTime() -
									new Date(server.latestFetchDate).getTime(),
							);
							return (
								<div
									key={server.info.name}
									className="border-2 rounded-xl py-4"
								>
									<div className="flex justify-between border-b items-center px-4 pb-2 mb-2">
										<div className="flex gap-4 items-center">
											{isJavaResponse(server.status) && server.status.icon ? (
												<img
													src={server.status.icon}
													className="h-16 w-16 flex-shrink-0"
													alt={`${server.info.name} icon`}
												/>
											) : (
												<IconQuestionMark className="border rounded-full border-slate-300 h-16 w-16 flex-shrink-0" />
											)}
											<h2>{server.info.name}</h2>
										</div>
										<div>
											<Badge
												className={
													server.status.online
														? 'bg-green-600 hover:bg-green-500'
														: 'bg-red-600 hover:bg-red-500'
												}
											>
												{server.status.online ? 'Online' : 'Offline'}
											</Badge>
										</div>
									</div>
									<div className="pl-4">
										<h3>アドレス</h3>
										<Snippet>
											{server.status.port === 25565
												? `${server.status.host}`
												: `${server.status.host}:${server.status.port}`}
										</Snippet>
										<h3 className="mt-2">バージョン</h3>
										<div
											dangerouslySetInnerHTML={{
												__html: isJavaResponse(server.status)
													? server.status.version!.name_raw
													: server.status.version?.name ?? '?',
											}}
										></div>
										<h3>プレイヤー数</h3>
										{server.status.players ? (
											<p>
												{server.status.players.online} &#47;{' '}
												{server.status.players.max}
											</p>
										) : (
											<p>不明</p>
										)}
										<h3>ステータス取得</h3>
										<p>
											{diff_date.getMinutes()}分{diff_date.getSeconds()}秒前
										</p>
										<h3>プロトコルバージョン</h3>
										{server.protocolVersion ? (
											<p>
												{server.protocolVersion.majorVersion} (
												{server.protocolVersion.minecraftVersion})
											</p>
										) : (
											<p>不明</p>
										)}
									</div>
								</div>
							);
						})
					}
				</Await>
			</Suspense>
		</div>
	);
}
