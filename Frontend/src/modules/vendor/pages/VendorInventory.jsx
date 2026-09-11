import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { vendorApi } from '../vendorApi';
import { useVendorState } from '../useVendorState';
import Icon from '../../../components/ui/Icon';

const VendorInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const token = localStorage.getItem('vendorToken');
    const { vendorState } = useVendorState();
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
            fetchCategories();
        }
    }, [token]);

    const fetchCategories = async () => {
        try {
            const res = await vendorApi.getCategories();
            if (res.success && Array.isArray(res.data)) {
                setCategories(res.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

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

    const openModal = () => {
        setFormError('');
        // If categories are available, default to vendor's category or first category
        const defaultCat = 
            vendorState?.selectedCategories?.[0]?.categoryId?._id ||
            vendorState?.selectedCategories?.[0]?.categoryId ||
            (categories.length > 0 ? categories[0]._id : '');

        setFormData({
            itemName: '',
            description: '',
            totalQuantity: 0,
            availableQuantity: 0,
            pricePerUnit: 0,
            category: defaultCat || '',
        });
        setImages([]);
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formError) setFormError('');
    };

    const handleImageChange = (e) => {
        setImages([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.itemName.trim()) {
            setFormError('Please enter an item name.');
            return;
        }

        if (!formData.category) {
            setFormError('Please select a category for this inventory item.');
            return;
        }

        const totalQty = Number(formData.totalQuantity);
        const availQty = Number(formData.availableQuantity);
        if (isNaN(totalQty) || totalQty < 0) {
            setFormError('Total quantity cannot be negative.');
            return;
        }
        if (isNaN(availQty) || availQty < 0) {
            setFormError('Available quantity cannot be negative.');
            return;
        }
        if (availQty > totalQty) {
            setFormError('Available quantity cannot be greater than total quantity.');
            return;
        }

        setSubmitting(true);
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
                setFormError(res.message || 'Failed to add item');
            }
        } catch (error) {
            console.error('Error adding inventory item:', error);
            setFormError('Failed to save item. Please check your network connection.');
        } finally {
            setSubmitting(false);
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

    // Category options fallback: combine categories and vendorState selectedCategories
    const availableCategories = categories.length > 0
        ? categories
        : (vendorState?.selectedCategories || []).map(sc => ({
            _id: sc.categoryId?._id || sc.categoryId,
            name: sc.categoryName || 'General'
        })).filter(c => c._id);

    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-medium">Loading inventory...</div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Inventory Management</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage your available stock, items, and pricing.</p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#581C87] text-white text-sm font-bold rounded-xl hover:bg-[#4c1875] transition-colors shadow-sm"
                >
                    <Icon name="plus" size="sm" />
                    <span>Add Item</span>
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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
                                            <div className="flex items-center gap-3">
                                                {item.images && item.images.length > 0 ? (
                                                    <img 
                                                        src={item.images[0]} 
                                                        alt={item.itemName} 
                                                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : null}
                                                <div>
                                                    <div className="font-bold text-slate-900">{item.itemName}</div>
                                                    {item.description && (
                                                        <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-700">
                                            {item.category?.name || 'N/A'}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-900 text-right">
                                            ₹{item.pricePerUnit?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.availableQuantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {item.availableQuantity} / {item.totalQuantity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleDelete(item._id)} 
                                                    title="Delete item"
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
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
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
                        onClick={() => !submitting && setIsModalOpen(false)} 
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5 z-10">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-black text-slate-900 uppercase">Add New Inventory Item</h3>
                            <button 
                                onClick={() => !submitting && setIsModalOpen(false)} 
                                disabled={submitting} 
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                            >
                                <Icon name="close" size="md" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            {formError && (
                                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{formError}</span>
                                </div>
                            )}
                            <form id="inventory-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Item Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        required 
                                        type="text" 
                                        name="itemName" 
                                        value={formData.itemName} 
                                        onChange={handleInputChange} 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" 
                                        placeholder="e.g. Vintage Chiavari Chair" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Category <span className="text-rose-500">*</span>
                                    </label>
                                    <select 
                                        required 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={handleInputChange} 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all cursor-pointer"
                                    >
                                        <option value="">Select a Category</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Total Quantity <span className="text-rose-500">*</span>
                                        </label>
                                        <input 
                                            required 
                                            type="number" 
                                            min="0" 
                                            name="totalQuantity" 
                                            value={formData.totalQuantity} 
                                            onChange={handleInputChange} 
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Available Quantity <span className="text-rose-500">*</span>
                                        </label>
                                        <input 
                                            required 
                                            type="number" 
                                            min="0" 
                                            name="availableQuantity" 
                                            value={formData.availableQuantity} 
                                            onChange={handleInputChange} 
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Price Per Unit (₹) <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        required 
                                        type="number" 
                                        min="0" 
                                        name="pricePerUnit" 
                                        value={formData.pricePerUnit} 
                                        onChange={handleInputChange} 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea 
                                        name="description" 
                                        value={formData.description} 
                                        onChange={handleInputChange} 
                                        rows="3" 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87]/20 focus:border-[#581C87] transition-all resize-none"
                                        placeholder="Describe item specifications, materials, condition..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Images</label>
                                    <input 
                                        type="file" 
                                        multiple 
                                        onChange={handleImageChange} 
                                        accept="image/*" 
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#581C87]/10 file:text-[#581C87] hover:file:bg-[#581C87]/20 transition-all cursor-pointer" 
                                    />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)} 
                                disabled={submitting} 
                                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="inventory-form" 
                                disabled={submitting} 
                                className="px-5 py-2.5 bg-[#581C87] text-white text-sm font-bold rounded-xl hover:bg-[#4c1875] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? 'Saving...' : 'Save Item'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default VendorInventory;
