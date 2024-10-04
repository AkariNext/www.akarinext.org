import { useRouteLoaderData } from '@remix-run/react';
import { loader as rootLoader } from '~/root';

export function useUser() {
	const data = useRouteLoaderData<typeof rootLoader>('root');

	if (!data) {
		return null;
	}

	return data.user;
}
