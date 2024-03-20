type Props = {
	name: string;
	description: string;
	thumbnailUrl: string;
};

export function ServiceCard({ name, description, thumbnailUrl }: Props) {
	return (
		<div className="w-[250px] max-w-fit ">
			<div className="flex justify-center">
				<img
					srcSet={thumbnailUrl}
					decoding="async"
					loading="lazy"
					alt={name}
					className="h-[330px] object-cover transition-all hover:scale-95 aspect-[3/4] mb-4 rounded-md"
				/>
			</div>
			<div className="text-xl">{name}</div>
			<p>{description}</p>
		</div>
	);
}
