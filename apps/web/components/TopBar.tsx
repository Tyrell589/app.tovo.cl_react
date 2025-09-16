/**
 * @fileoverview Top navigation bar mirroring barra-main.php
 */
import Link from 'next/link';

export function TopBar() {
	return (
		<header className="w-full border-b bg-white">
			<div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
				<div className="font-semibold">TovoCL</div>
				<nav className="flex gap-4 text-sm">
					<Link href="/dashboard">Dashboard</Link>
					<Link href="/mesas">Mesas</Link>
					<Link href="/kds">KDS</Link>
					<Link href="/delivery">Delivery</Link>
				</nav>
			</div>
		</header>
	);
}


