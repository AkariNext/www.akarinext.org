type Props = {
	name: string;
	description: string;
	thumbnailUrl: string;
};

export function ServiceCard({ name, description, thumbnailUrl }: Props) {
	return (
		<div className="w-[250px] max-w-fit group">
			<div className="flex justify-center">
				<img
					srcSet={thumbnailUrl}
					decoding="async"
					loading="lazy"
					alt={name}
					className="h-[330px] object-cover aspect-[3/4] mb-4 group-hover:ring-4 ring-offset-4 ring-offset-slate-100 transition-all rounded-md"
				/>
			</div>
			<h3 className="text-xl">{name}</h3>
			<p>{description}</p>
		</div>
	);
}
