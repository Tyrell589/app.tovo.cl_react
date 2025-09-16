/**
 * @fileoverview Mesas shell fetching from restaurant-service
 */
import axios from 'axios';

async function fetchTables() {
	const res = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/api/tables`);
	return res.data;
}

export default async function MesasPage() {
	let tables: any[] = [];
	try {
		tables = await fetchTables();
	} catch (e) {
		// ignore for shell
	}

	return (
		<div className="max-w-6xl mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">Mesas</h1>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
				{(tables || []).map((t: any) => (
					<div key={t.mesa_codigo} className="border rounded p-3 text-center">
						<div className="font-medium">{t.mesa_nombre}</div>
						<div className="text-sm text-gray-500">Capacidad: {t.mesa_capacidad}</div>
					</div>
				))}
				{tables?.length === 0 && (
					<div className="col-span-full text-sm text-gray-500">Sin datos</div>
				)}
			</div>
		</div>
	);
}


