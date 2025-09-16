/**
 * @fileoverview Delivery shell showing estimates panel placeholder
 */
import axios from 'axios';

export default async function DeliveryPage() {
	let estimates: any = null;
	try {
		const res = await axios.get(`${process.env.KDS_SERVICE_URL}/api/kds/stats?period=day`);
		estimates = res.data;
	} catch {}
	return (
		<div className="max-w-6xl mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">Delivery</h1>
			<div className="border rounded p-4">Panel de delivery (prototipo)</div>
		</div>
	);
}


