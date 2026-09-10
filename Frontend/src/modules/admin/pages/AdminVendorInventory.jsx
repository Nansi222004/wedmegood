import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import Icon from '../../../components/ui/Icon';

const AdminVendorInventory = () => {
    const [inventories, setInventories] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchInventories();
    }, []);

    const fetchInventories = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getVendorInventories(token);
            if (res.success) {
                setInventories(res.data);
            }
        } catch (error) {
            console.error('Error fetching vendor inventories:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Global Vendor Inventory</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">View and manage inventory items across all vendors.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading inventories...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4">Item Details</th>
                                    <th className="p-4">Vendor</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 text-center">Available / Total</th>
                                    <th className="p-4 text-right">Price/Unit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventories.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-500 text-sm">
                                            No vendor inventories found.
                                        </td>
                                    </tr>
                                ) : (
                                    inventories.map(item => (
                                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{item.itemName}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{item.vendor?.businessName || 'N/A'}</div>
                                                <div className="text-xs text-slate-500">{item.vendor?.email}</div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-700">
                                                {item.category?.name || 'N/A'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${item.availableQuantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {item.availableQuantity} / {item.totalQuantity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-slate-900 text-right">
                                                ₹{item.pricePerUnit?.toLocaleString() || 0}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminVendorInventory;
