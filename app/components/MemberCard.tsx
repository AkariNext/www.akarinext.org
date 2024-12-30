import { getSocialIcon } from '~/lib/icon';
import { Badge } from './ui/badge';
import type { Member } from '~/const';

interface MemberCardProps {
	member: Member;
}

export function MemberCard({ member }: MemberCardProps) {
	return (
		<div
			key={member.name}
			className="flex justify-center items-center flex-col backdrop-blur-sm bg-white rounded-lg p-6"
		>
			<img src={member.avatar} className="h-24 w-24 rounded-lg flex-1" alt="" />
			<div className="mt-2 text-slate-700 text-lg font-bold">{member.name}</div>
			<div className="flex flex-row gap-2">
				{member.socials.map((social, index) => (
					<a
						href={social.url}
						key={index}
						target="_blank"
						rel="noreferrer noopener"
						aria-label={`${social.type}のリンクへ移動する`}
					>
						{getSocialIcon(social.type)}
					</a>
				))}
			</div>
			<div className="flex gap-1 flex-row flex-wrap border-t pt-2 mt-2">
				{member.roles.map((role, index) => (
					<Badge key={index} className="select-none">
						{role}
					</Badge>
				))}
			</div>
		</div>
	);
}
