import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Footer } from '~/components/footer';
import { MemberCard } from '~/components/MemberCard';
import { Navbar } from '~/components/navbar';
import { MEMBERS } from '~/lib/member.server';
import { useUser } from '~/lib/user';

export function loader() {
	return json(
		{ members: MEMBERS },
		{
			headers: {
				'Cache-Control': 'max-age=300',
			},
		},
	);
}

export default function MembersIndex() {
	const { members } = useLoaderData<typeof loader>();
	const user = useUser() ?? undefined;

	return (
		<div>
			<Navbar user={user} />
			<div className="text-slate-700 text-2xl font-bold text-center">
				Members
			</div>
			<p className="text-center mt-4">AkariNextのメンバーを紹介します</p>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
				{members.map((member) => (
					<MemberCard key={member.name} member={member} />
				))}
			</div>
			<Footer />
		</div>
	);
}
