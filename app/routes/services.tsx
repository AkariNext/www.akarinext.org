import { Outlet } from '@remix-run/react';
import { Footer } from '~/components/footer';
import { Navbar } from '~/components/navbar';

export default function ServicesLayout() {
	return (
		<>
			<Navbar />
			<Outlet />
			<Footer />
		</>
	);
}
