import type { TMember } from '~/lib/member.server';
import EasyTooltip from './Tooltip';
import { getSocialIcon } from '~/lib/utils';
import { Badge } from './ui/badge';

interface MemberCardProps {
	member: TMember;
}

export function MemberCard({ member }: MemberCardProps) {
	return (
		<div
			key={member.name}
			className="flex justify-center items-center flex-col backdrop-blur-sm bg-white rounded-lg p-6"
		>
			<img src={member.avatar} className="h-24 rounded-lg" alt="" />
			<div className="mt-2 text-slate-700 text-lg font-bold">
				{member.displayName ? member.displayName : member.name}
			</div>
			<div className="flex flex-row gap-2">
				{member.socials.map((social, index) => (
					<a
						href={social.url}
						key={index}
						target="_blank"
						rel="noreferrer noopener"
						aria-label={`${social.type}のリンクへ移動する`}
					>
						{social.alt ? (
							<EasyTooltip tooltip={social.alt}>
								{getSocialIcon(social.type)}
							</EasyTooltip>
						) : (
							getSocialIcon(social.type)
						)}
					</a>
				))}
			</div>
			<div className="flex gap-1 flex-row flex-wrap border-t pt-2 mt-2">
				{member.roles.map((role, index) => (
					<Badge key={index}>{role}</Badge>
				))}
			</div>
		</div>
	);
}
