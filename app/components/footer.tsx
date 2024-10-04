import { Link } from '@remix-run/react';

export function Footer() {
	return (
		<footer className="mt-16 bg-white p-4">
			<div className="m-auto" style={{ maxWidth: 'min(1200px, 90%)' }}>
				<div className="sm:flex block min-h-16  justify-between items-center sticky mb-4">
					AkariNext
					<div>
						<h4>LINKS</h4>
						<ul>
							<li>
								<Link to="/tos">利用規約</Link>
							</li>
						</ul>
					</div>
				</div>
				<div className="mt-4">&copy; 2024 AkariNext</div>
			</div>
		</footer>
	);
}
