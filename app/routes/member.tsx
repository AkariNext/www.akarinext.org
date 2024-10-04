import { Outlet } from '@remix-run/react';
import { Footer } from '~/components/footer';
import { Navbar } from '~/components/navbar';
import { useUser } from '~/lib/user';

export default function MemberLayout() {
    const user = useUser() ?? undefined
	return (
		<>
			<Navbar user={user}/>
			<Outlet />
			<Footer />
		</>
	);
}
