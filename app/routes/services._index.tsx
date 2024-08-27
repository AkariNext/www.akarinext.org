import { type MetaFunction, json } from '@remix-run/node';
import { ServiceCard } from '../components/ServiceCard';
import { SERVICES } from '~/lib/services.server';
import { Link, useLoaderData } from '@remix-run/react';

export async function loader() {
	return json({ services: SERVICES });
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Services | AkariNext' },
		{ name: 'description', content: 'List of services provided by AkariNext' },
	];
};

export default function Services() {
	const { services } = useLoaderData<typeof loader>();
	return (
		<div>
			<div className="text-2xl mb-8 text-center">
				AkariNextが提供しているサービス
			</div>
			<div className="flex flex-wrap justify-center  gap-x-8">
				{services.map((service, index) => (
					<div key={index} className="mb-8">
						{service.name.toLowerCase() === 'minecraft' ? (
							<Link to="/services/minecraft">
								<ServiceCard {...service} />
							</Link>
						) : (
							<ServiceCard {...service} />
						)}
					</div>
				))}
			</div>
		</div>
	);
}
