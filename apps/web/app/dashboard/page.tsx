/**
 * @fileoverview Dashboard shell with links to core areas
 */
import Link from 'next/link';

export default function DashboardPage() {
	const cards = [
		{ href: '/mesas', title: 'Mesas' },
		{ href: '/orders', title: 'Órdenes' },
		{ href: '/kds', title: 'KDS' },
		{ href: '/reports', title: 'Reportes' },
		{ href: '/delivery', title: 'Delivery' }
	];

	return (
		<div className="max-w-6xl mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{cards.map(c => (
					<Link key={c.href} href={c.href} className="border rounded p-4 hover:shadow">
						{c.title}
					</Link>
				))}
			</div>
		</div>
	);
}


