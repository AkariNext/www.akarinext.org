import { Link } from '@remix-run/react';

export function Footer() {
	return (
		<footer className="mt-16 bg-white p-4">
			<div className="m-auto" style={{ maxWidth: 'min(1200px, 90%)' }}>
				<div className="sm:flex block min-h-16  justify-between items-center sticky mb-4">
					AkariNext
					<div className='border-l-2 border-blue-400 p-2'>
						<h4>LINKS</h4>
						<ul>
							<li className='relative'>
								<Link to="/tos" className='after:border-b after:border-blue-400 after:content-[""] after:absolute after:w-2 after:-left-2 after:top-1/2 pl-2'>利用規約</Link>
							</li>
						</ul>
					</div>
				</div>
				<div className="mt-4">&copy; 2024 AkariNext</div>
			</div>
		</footer>
	);
}
