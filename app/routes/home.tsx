import type { Route } from './+types/home';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { MEMBERS } from '~/const';
import { MemberCard } from '~/components/MemberCard';
import stylesheet from '~/home/style.css?url';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	];
}

export const links: Route.LinksFunction = () => [
	{ rel: 'stylesheet', href: stylesheet },
];

export async function loader() {
	return MEMBERS;
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const members = loaderData;

	return (
		<div>
			{/* <Navbar user={user} /> */}
			<div className="grid grid-cols-1  md:grid-cols-3 w-full  gap-y-4 md:gap-x-4 h-screen items-center relative overflow-hidden">
				<div className="h-96 col-span-2 rounded-lg flex flex-col p-8 md:p-16 order-2 sm:order-1 z-30 bg-white/80">
					<h1 className="text-4xl">Let&apos;s have fun and play funny!</h1>
					<h2 className="mt-4">
						AkariNextで一緒に楽しくゲームや開発を行いましょう！
					</h2>

					<div className="pt-8">
						<Link to="/articles/" aria-label="ブログを読む">
							<Button size={'lg'} className="rounded-3xl">
								Read the blog
							</Button>
						</Link>
						<div className="pt-4">
							<a
								href="https://discord.gg/CcT997U"
								target="_blank"
								rel="noreferrer noopener"
							>
								<Button variant={'outline'} size={'lg'} className="rounded-3xl">
									Join us
								</Button>
							</a>
						</div>
					</div>
				</div>
				<div className="order-1 sm:order-1 w-full h-full">
					<div className="bg-primary w-[100vw] h-full -skew-x-12 absolute"></div>
					{/* <img src="/img/party.svg" alt="" /> */}
				</div>
			</div>
			<div className="container mx-auto">
				<div className="relative z-10">
					<div
						className="
		
          ball
          mt-52
        bg-white/90
		  akari-container
          rounded-3xl
          p-8

          before:shadow
          before:-z-10
          before:absolute
          before:w-96
          before:h-96
          before:-top-40
          before:-left-24
          before:rounded-full

          after:shadow
          after:-z-10
          after:absolute
          after:w-56
          after:h-56
          after:-right-0
          after:-bottom-12
          after:rounded-full
      "
					>
						<h2 className="text-slate-700 text-3xl font-bold">
							AkariNextって何！？
						</h2>
						<div className="mt-8">
							<p>
								AkariNextはゲームやプログラミングといった開発に興味を持つ人たちが集まっているコミュニティーです。
								主にDiscordを使ってコミュニケーションを取りながら、ゲームをしたり、開発をしたりしています。
								<br />
								<br />
								また、副次的な活動としてサーバーの運営や本サイト上でのブログの執筆なども行っています。
							</p>
						</div>
					</div>
				</div>

				<div className="">
					<div className="mt-28 rounded-lg min-h-[500px] grid grid-cols-1 md:grid-cols-3">
						<div
							className="rounded-t-xl md:rounded-l-xl bg-cover bg-center min-h-48"
							style={{
								backgroundImage: 'url(/img/hero.webp)',
							}}
						/>

						<div className="bg-white py-8 col-span-2 rounded-r-xl flex justify-center flex-col">
							<div className="flex justify-between items-center px-8">
								<h2 className="text-slate-700 text-2xl font-bold">
									運営メンバー
								</h2>
								<Link to="/members/" aria-label="メンバーを見る">
									<Button variant={'ghost'} size={'lg'} className="rounded-3xl">
										VIEW ALL
									</Button>
								</Link>
							</div>
							<p className="px-8 mt-8 border-b pb-4">
								AkariNextを運営するメンバーです。
							</p>
							<div className="flex flex-wrap justify-center gap-4 col-col-span-1 md:col-span-2">
								{members.map((member) => (
									<div key={member.name} className="w-6/12 md:w-3/12">
										<MemberCard member={member} />
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* <Footer /> */}
		</div>
	);
}
