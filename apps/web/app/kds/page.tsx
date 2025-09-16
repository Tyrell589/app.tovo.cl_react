/**
 * @fileoverview KDS shell wired to kds-service and Socket.IO
 */
'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

export default function KdsPage() {
	const [orders, setOrders] = useState<any[]>([]);

	useEffect(() => {
		let socket: Socket | null = null;
		(async () => {
			try {
				const res = await axios.get(`${process.env.KDS_SERVICE_URL}/api/kds/orders?limit=12`);
				setOrders(res.data?.data?.orders || []);
			} catch {}
			socket = io(process.env.KDS_SERVICE_URL || '', { transports: ['websocket'] });
			socket.on('order-update', (payload: any) => {
				// simplistic refresh hook
				setOrders((prev) => prev.map(o => o.order_id === payload?.data?.ord_codigo ? payload.data : o));
			});
		})();
		return () => { socket?.disconnect(); };
	}, []);

	return (
		<div className="max-w-7xl mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">KDS</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{orders.map((o) => (
					<div key={o.order_id} className="border rounded p-4">
						<div className="font-medium mb-1">Orden #{o.order_id}</div>
						<div className="text-sm text-gray-600 mb-2">Estado: {o.status}</div>
						<ul className="text-sm list-disc pl-5">
							{o.items?.slice(0,5).map((it: any, idx: number) => (
								<li key={idx}>{it.quantity} x {it.name}</li>
							))}
						</ul>
					</div>
				))}
				{orders.length === 0 && (
					<div className="col-span-full text-sm text-gray-500">Sin órdenes</div>
				)}
			</div>
		</div>
	);
}


