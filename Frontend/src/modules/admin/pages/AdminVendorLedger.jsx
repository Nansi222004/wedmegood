import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

// Sub-component for Vendor Calendar
const VendorMiniCalendar = ({ bookings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

    const handlePrev = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNext = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const eventsMap = useMemo(() => {
        const map = {};
        bookings.forEach(b => {
            if (b.eventDate) {
                const d = new Date(b.eventDate);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                if (!map[key]) map[key] = [];
                map[key].push(b);
            }
        });
        return map;
    }, [bookings]);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm w-full max-w-[300px]">
            <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h5>
                <div className="flex gap-1">
                    <button onClick={handlePrev} className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all text-slate-400">
                        <Icon name="chevron-down" className="rotate-90" size="xs" />
                    </button>
                    <button onClick={handleNext} className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all text-slate-400">
                        <Icon name="chevron-down" className="-rotate-90" size="xs" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="h-6 flex items-center justify-center text-[7px] font-black text-slate-300">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {[...Array(adjustedStartDay)].map((_, i) => <div key={`off-${i}`} className="h-6"></div>)}
                {[...Array(daysInMonth(currentDate.getMonth(), currentDate.getFullYear()))].map((_, i) => {
                    const day = i + 1;
                    const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
                    const hasEvent = !!eventsMap[key];
                    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                    return (
                        <div key={day} className="relative flex justify-center items-center h-6">
                            <div className={`h-6 w-6 flex items-center justify-center rounded-lg text-[9px] font-bold transition-all ${
                                hasEvent 
                                    ? 'bg-rose-500 text-white shadow-sm' 
                                    : isToday 
                                        ? 'bg-slate-100 text-slate-900' 
                                        : 'text-slate-400'
                            }`}>
                                {day}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Booked Dates</span>
            </div>
        </div>
    );
};

const AdminVendorLedger = () => {
    const [ledgerData, setLedgerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVendorId, setSelectedVendorId] = useState(null);

    const token = localStorage.getItem('adminToken');

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getVendorLedger(token);
            if (res.success) {
                setLedgerData(res.data);
            }
        } catch (err) {
            console.error('Failed to sync ledger:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredLedger = useMemo(() => {
        return ledgerData.filter(v => 
            v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => b.bookingCount - a.bookingCount);
    }, [ledgerData, searchQuery]);

    const stats = useMemo(() => {
        return {
            totalVolume: ledgerData.reduce((acc, v) => acc + (v.totalRevenue || 0), 0),
            totalBookings: ledgerData.reduce((acc, v) => acc + (v.bookingCount || 0), 0),
            activePartners: ledgerData.filter(v => v.status === 'Approved').length
        };
    }, [ledgerData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Partner Ledger...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Partner Ledger</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Vendor Performance & Transaction Audit</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Grep partner records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold focus:ring-2 focus:ring-slate-900/10 outline-none w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Platform GMV', value: `₹${stats.totalVolume.toLocaleString()}`, color: 'emerald' },
                    { label: 'Transaction Count', value: stats.totalBookings, color: 'blue' },
                    { label: 'Active Service Nodes', value: stats.activePartners, color: 'amber' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <p className={`text-2xl font-black mt-1 ${stat.color === 'emerald' ? 'text-emerald-600' : 'text-slate-900'}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-12">#</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Partner Entity</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Bookings</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Generated GMV</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact Node</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Expansion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLedger.map((v, idx) => (
                                <React.Fragment key={v._id}>
                                    <tr className={`group transition-all hover:bg-slate-50/50 ${selectedVendorId === v._id ? 'bg-slate-50/80' : ''}`}>
                                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm shrink-0">
                                                    <img src={v.portfolio?.[0]?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${v.businessName}`} className="h-full w-full object-cover" alt="" />
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black text-slate-900 leading-tight">{v.businessName}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">{v.fullName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-tight">
                                                {v.bookingCount}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-[11px] font-black text-emerald-600 tracking-tight">₹{v.totalRevenue.toLocaleString()}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-[11px] font-bold text-slate-700">{v.phone}</p>
                                            <p className="text-[9px] font-bold text-slate-400 truncate w-32">{v.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedVendorId(selectedVendorId === v._id ? null : v._id)}
                                                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${selectedVendorId === v._id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900'}`}
                                            >
                                                <Icon name={selectedVendorId === v._id ? 'close' : 'chevron-down'} size="xs" />
                                            </button>
                                        </td>
                                    </tr>
                                    {selectedVendorId === v._id && (
                                        <tr>
                                            <td colSpan="6" className="bg-slate-50/30 px-6 py-8 border-b border-slate-100">
                                                <div className="animate-in slide-in-from-top-2 duration-300">
                                                    
                                                    <div className="grid lg:grid-cols-[1fr_300px] gap-8">
                                                        {/* Left Side: Transaction History */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                                    <Icon name="clock" size="xs" /> Transaction History
                                                                </h4>
                                                            </div>
                                                            
                                                            {v.bookings.length === 0 ? (
                                                                <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No transaction data available</p>
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {v.bookings.map((b) => (
                                                                        <div key={b._id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group/card hover:border-slate-300 transition-all">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">#{b._id.slice(-6).toUpperCase()}</span>
                                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                                                    b.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-500' :
                                                                                    b.status === 'Rejected' ? 'bg-rose-50 text-rose-500' :
                                                                                    'bg-blue-50 text-blue-500'
                                                                                }`}>
                                                                                    {b.status}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[11px] font-black text-slate-900 mb-1">{b.customerName || b.userId?.fullName || 'Client Node'}</p>
                                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                                                                    <Icon name="calendar" size="xs" />
                                                                                    {new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                                                </div>
                                                                                <p className="text-[11px] font-black text-slate-900">₹{b.totalPrice?.toLocaleString()}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right Side: Visual Calendar */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                                    <Icon name="calendar" size="xs" /> Availability Grid
                                                                </h4>
                                                            </div>
                                                            <VendorMiniCalendar bookings={v.bookings} />
                                                            
                                                            <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Entity Context</p>
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-bold text-slate-700 flex items-center gap-2">
                                                                        <Icon name="map" size="xs" /> {v.city || 'Location N/A'}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-slate-700 flex items-center gap-2">
                                                                        <Icon name="sparkles" size="xs" /> {v.category || 'Service N/A'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
export default AdminVendorLedger;
