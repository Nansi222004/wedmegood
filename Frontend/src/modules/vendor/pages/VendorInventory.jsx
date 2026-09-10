import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { vendorApi } from '../vendorApi';
import { useVendorState } from '../useVendorState';
import Icon from '../../../components/ui/Icon';

const VendorInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('vendorToken');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        itemName: '',
        description: '',
        totalQuantity: 0,
        availableQuantity: 0,
        pricePerUnit: 0,
        category: '',
    });
    const [images, setImages] = useState([]);

    useEffect(() => {
        if (token) {
            fetchInventory();
        }
    }, [token]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await vendorApi.getInventory(token);
            if (res.success) {
                setInventory(res.data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        setImages([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        images.forEach(image => {
            data.append('images', image);
        });

        try {
            const res = await vendorApi.createInventoryItem(data, token);
            if (res.success) {
                setIsModalOpen(false);
                setFormData({
                    itemName: '',
                    description: '',
                    totalQuantity: 0,
                    availableQuantity: 0,
                    pricePerUnit: 0,
                    category: '',
                });
                setImages([]);
                fetchInventory();
            } else {
                alert('Failed to add item: ' + res.message);
            }
        } catch (error) {
            console.error('Error adding inventory item:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const res = await vendorApi.deleteInventoryItem(id, token);
            if (res.success) {
                fetchInventory();
            }
        } catch (error) {
            console.error('Error deleting inventory item:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading inventory...</div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Inventory Management</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage your available stock, items, and pricing.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#581C87] text-white text-sm font-bold rounded-xl hover:bg-[#4c1875] transition-colors"
                >
                    <Icon name="plus" size="sm" />
                    <span>Add Item</span>
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4">Item Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Price/Unit</th>
                                <th className="p-4 text-center">Available / Total</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {inventory.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 text-sm">
                                        No inventory items found. Click 'Add Item' to start.
                                    </td>
                                </tr>
                            ) : (
                                inventory.map(item => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{item.itemName}</div>
                                            <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-700">
                                            {item.category?.name || 'N/A'}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-900 text-right">
                                            ₹{item.pricePerUnit?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${item.availableQuantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {item.availableQuantity} / {item.totalQuantity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleDelete(item._id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Icon name="trash" size="sm" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-black text-slate-900 uppercase">Add New Inventory Item</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <Icon name="close" size="md" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Item Name</label>
                                    <input required type="text" name="itemName" value={formData.itemName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" placeholder="e.g. Vintage Chiavari Chair" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category ID</label>
                                    <input required type="text" name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" placeholder="Enter Category Object ID" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Total Quantity</label>
                                        <input required type="number" min="0" name="totalQuantity" value={formData.totalQuantity} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Available Quantity</label>
                                        <input required type="number" min="0" name="availableQuantity" value={formData.availableQuantity} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Price Per Unit (₹)</label>
                                    <input required type="number" min="0" name="pricePerUnit" value={formData.pricePerUnit} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all resize-none"></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Images</label>
                                    <input type="file" multiple onChange={handleImageChange} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#581C87]/10 file:text-[#581C87] hover:file:bg-[#581C87]/20 transition-all cursor-pointer" />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleSubmit} className="px-5 py-2.5 bg-[#581C87] text-white text-sm font-bold rounded-xl hover:bg-[#4c1875] transition-colors shadow-sm">Save Item</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default VendorInventory;
