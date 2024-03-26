import satori from 'satori';
import moralerspaceData from '../../public/fonts/moralerspace/MoralerspaceNeonNF-Regular.ttf?arraybuffer';
import socialBackground from '../routes/og.$slug/og-base.png?arraybuffer';
import { getAuthor } from './member.server';

export async function createOgImageSVG(request: Request) {
	const requestUrl = new URL(request.url);
	const searchParams = new URLSearchParams(requestUrl.search);
	const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`;

	const { title, displayDate, authors } = await getDataFromParams(searchParams);

	const primaryFont = 'moralerspace';


	return satori(
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				fontFamily: primaryFont,
				width: '100vw',
				height: '100vh',
				backgroundRepeat: 'no-repeat',
				backgroundImage: `url("data:image/png;base64,${_arrayBufferToBase64(
					socialBackground,
				)}")`,
				padding: '125px 125px 10px 125px',
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					margin: 0,
					padding: 0,
					gap: 0,
				}}
			>
				<p style={{ margin: 0, padding: 0 }}>{displayDate}</p>
				<h1 style={{ fontWeight: 'bold', margin: '18px 0', padding: 0 }}>
					{title}
				</h1>
			</div>
			<div style={{ display: 'flex' }}>
				{authors.map((authorName) => {
					const author = getAuthor(authorName);
					return (
						<div
							style={{ display: 'flex', justifyContent: 'center' }}
							key={authorName}
						>
							<img
								src={`${siteUrl}${author!.avatar}`}
								width={100}
								height={100}
                                aria-label='Author avatar'
							/>
							<p>{author!.name}</p>
						</div>
					);
				})}
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: primaryFont,
					data: moralerspaceData,
				},
			],
		},
	);
}

export async function getDataFromParams(searchParams: URLSearchParams) {
	const title = searchParams.get('title');
	const displayDate = searchParams.get('displayDate');
	const authors = searchParams.get('authors')?.split(',') ?? [];
	return { title, displayDate, authors };
}

function _arrayBufferToBase64(buffer: ArrayBuffer) {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
