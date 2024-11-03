import { LoaderFunctionArgs } from '@remix-run/node';
import { authenticator } from '~/lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
	return authenticator.authenticate('oidc', request, {
		successRedirect: '/',
	});
}
