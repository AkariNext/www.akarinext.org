import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { MEMBERS } from '~/lib/member.server';
import { SERVICES } from '~/lib/services.server';
import { ServiceCard } from '~/components/ServiceCard';
import { MemberCard } from '~/components/MemberCard';

export function loader() {
	return json(
		{ members: MEMBERS, services: SERVICES.slice(0, 3) },
		{
			headers: {
				'Cache-Control': 'max-age=300',
			},
		},
	);
}

export default function Index() {
	const { members, services } = useLoaderData<typeof loader>();
	const displayMembers = members.slice(0, 3); // 3人だけ表示する残りはView allで専用ページにて表示する

	return (
		<div>
			<div className="grid grid-cols-1  md:grid-cols-3 w-full  gap-y-4 md:gap-x-4 h-screen items-center">
				<div className="h-96 col-span-2 rounded-lg flex flex-col p-8 md:p-16 order-2 sm:order-1">
					<h1 className="text-4xl">Let&apos;s have fun and play funny!</h1>
					<h2 className="mt-4">
						AkariNextで一緒に楽しくゲームや開発を行いましょう！
					</h2>

					<div className="pt-8">
						<Link to="/blog/" aria-label="ブログを読む">
							<Button size={'lg'} className="rounded-3xl">
								Read the blog
							</Button>
						</Link>
						<div className="pt-4">
							<Button variant={'outline'} size={'lg'} className="rounded-3xl">
								Join us
							</Button>
						</div>
					</div>
				</div>
				<div className="order-1 sm:order-1">
					<img src="/party.svg" alt="" />
				</div>
			</div>
			<div className="relative">
				<div
					className="
          ball
          mt-8
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
					<h2 className="text-slate-700 text-3xl font-bold z-40">
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

			<div className='akari-container'>
				<div className="mt-28 rounded-lg min-h-[500px] grid grid-cols-1 md:grid-cols-3">
					<div className='rounded-l-xl' style={{background: "url(/img/hero.webp)", backgroundPosition: "75% 45%"}} />

					<div className='bg-white py-8 col-span-2 rounded-r-xl flex justify-center flex-col'>
						<div className='flex justify-between items-center px-8'>
						<h2 className="text-slate-700 text-2xl font-bold">
							運営メンバー
						</h2>
						<Link to="/members/" aria-label="メンバーを見る">
							<Button variant={"ghost"} size={'lg'}  className="rounded-3xl">
								VIEW ALL
							</Button>
						</Link>
						</div>
						<p className='px-8 mt-8 border-b pb-4'>
							AkariNextを運営するメンバーです。
						</p>
						<div className="flex flex-wrap justify-center gap-4 col-col-span-1 md:col-span-2">

							{displayMembers.map((member) => (
								<div key={member.name} className='w-full md:w-3/12'>
									<MemberCard member={member} />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* <div className="mt-8">
				<div className="col-span-1 w-full h-full bg-slate-200 rounded-lg p-8">
					<h2 className="text-slate-700 text-2xl font-bold text-center">
						SERVICES
					</h2>

					<p className="text-slate-600 text-center mt-4">
						これらのサービスはAkariNextが運営するサービスのほんのすこしです。詳しくは
						VIEW ALL からご覧ください！
					</p>

					<div className="flex flex-wrap justify-center  gap-x-16 mt-8">
						{services.map((service, index) => (
							<div key={index} className="mb-8">
								<ServiceCard {...service} />
							</div>
						))}
					</div>
					<div className="flex items-center flex-col">
						<div className="mt-4">
							<Link to="/services/" aria-label="サービスを見る">
								<Button size={'lg'} className="rounded-3xl">
									VIEW ALL
								</Button>
							</Link>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
					<div className="w-full h-full bg-slate-200 rounded-lg p-8">
						<h2 className="text-slate-700 text-2xl font-bold text-center">
							PLAYING GAME&apos;S
						</h2>
					</div>
					<div className="w-full h-full bg-slate-200 rounded-lg p-8">
						<h2 className="text-slate-700 text-2xl font-bold text-center">
							WORKS
						</h2>
					</div>
				</div>
			</div> */}
		</div>
	);
}
