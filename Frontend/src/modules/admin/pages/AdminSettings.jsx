import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

// Lead dispatch rules (the 30-second offer, contact deadline, reassignment and spam limits)
const DISPATCH_FIELDS = [
    { key: 'leadOfferWindowSeconds', label: 'Offer response window', hint: 'Time a vendor has to accept once the offer reaches their device', unit: 'sec', min: 10, fallback: 30 },
    { key: 'leadOfferDeliveryGraceSeconds', label: 'Offer delivery wait', hint: 'Extra time before the offer shows on the vendor device', unit: 'sec', min: 0, fallback: 60 },
    { key: 'leadContactDeadlineHours', label: 'Vendor contact deadline', hint: 'After accepting, the vendor must contact the customer within this time', unit: 'hrs', min: 1, fallback: 1 },
    { key: 'leadCustomerReassignLimit', label: 'Automatic reassignments', hint: 'Times a customer can ask for another vendor before choosing one', unit: '', min: 0, fallback: 2 },
    { key: 'leadDetailsRequestHours', label: 'Details request window', hint: 'Time a customer has to add details a vendor asked for', unit: 'hrs', min: 1, fallback: 24 },
    { key: 'enquiryDailyLimit', label: 'Requirements per customer per day', hint: 'Limits spam and fake enquiries', unit: '', min: 1, fallback: 5 },
    // Complaint turnaround targets (operational goals, not legal deadlines)
    { key: 'complaintAckHours', label: 'Complaint: acknowledge within', hint: 'Move new complaints to In-Review by then', unit: 'hrs', min: 1, fallback: 24 },
    { key: 'complaintVendorResponseHours', label: 'Complaint: vendor replies within', hint: 'Vendor is notified and asked for their side', unit: 'hrs', min: 1, fallback: 48 },
    { key: 'complaintResolveDays', label: 'Complaint: resolve within', hint: 'Target for a decision', unit: 'days', min: 1, fallback: 7 },
    { key: 'complaintSafetyResolveDays', label: 'Safety complaint: resolve within', hint: 'Safety complaints are handled first', unit: 'days', min: 1, fallback: 2 }
];

// Settings as shown in the form (numbers kept as strings while editing)
const fromApi = (data) => ({
    platformCommissionPercent: data.platformCommissionPercent !== null && data.platformCommissionPercent !== undefined ? data.platformCommissionPercent : '',
    serviceGstPercent: data.serviceGstPercent ?? '',
    minWithdrawalAmount: data.minWithdrawalAmount ?? '',
    maintenanceMode: !!data.maintenanceMode,
    autoPayouts: !!data.autoPayouts,
    ratingsEnabled: data.ratingsEnabled !== false,
    cancellationNoticeDays: data.cancellationNoticeDays ?? 15,
    fakeVendorFreeViews: data.fakeVendorFreeViews ?? 1,
    fakeVendorAccessPrice: data.fakeVendorAccessPrice ?? 99,
    fakeVendorAccessDays: data.fakeVendorAccessDays ?? 30,
    ...Object.fromEntries(DISPATCH_FIELDS.map(f => [f.key, data[f.key] ?? f.fallback])),
    commissionConfig: data.commissionConfig || null,
    updatedAt: data.updatedAt || null,
    updatedBy: data.updatedBy || null
});

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        platformCommissionPercent: 10,
        serviceGstPercent: '',
        minWithdrawalAmount: '',
        maintenanceMode: false,
        autoPayouts: false,
        ratingsEnabled: true,
        cancellationNoticeDays: 15,
        fakeVendorFreeViews: 1,
        fakeVendorAccessPrice: 99,
        fakeVendorAccessDays: 30,
        ...Object.fromEntries(DISPATCH_FIELDS.map(f => [f.key, f.fallback]))
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

    const token = localStorage.getItem('adminToken');

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getPlatformSettings(token);
            if (res.success && res.data) {
                setSettings(fromApi(res.data));
            } else {
                setStatusMsg({ text: res.message || 'Failed to fetch platform settings', type: 'error' });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            setStatusMsg({ text: 'A network error occurred while loading settings', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setStatusMsg({ text: '', type: '' });

        // Client-side validation
        const commission = Number(settings.platformCommissionPercent);
        if (isNaN(commission) || commission < 0 || commission > 100) {
            setStatusMsg({ text: 'Platform commission must be between 0% and 100%', type: 'error' });
            return;
        }

        let gst = null;
        if (settings.serviceGstPercent !== '' && settings.serviceGstPercent !== null) {
            gst = Number(settings.serviceGstPercent);
            if (isNaN(gst) || gst < 0 || gst > 100) {
                setStatusMsg({ text: 'Service GST rate must be between 0% and 100%', type: 'error' });
                return;
            }
        }

        let minWithdrawal = null;
        if (settings.minWithdrawalAmount !== '' && settings.minWithdrawalAmount !== null) {
            minWithdrawal = Number(settings.minWithdrawalAmount);
            if (isNaN(minWithdrawal) || minWithdrawal < 0) {
                setStatusMsg({ text: 'Minimum withdrawal cannot be negative', type: 'error' });
                return;
            }
        }

        const wholeNumbers = {
            cancellationNoticeDays: { min: 0, label: 'Cancellation notice' },
            fakeVendorFreeViews: { min: 0, label: 'Free views' },
            fakeVendorAccessPrice: { min: 1, label: 'Access price' },
            fakeVendorAccessDays: { min: 1, label: 'Access duration' },
            ...Object.fromEntries(DISPATCH_FIELDS.map(f => [f.key, { min: f.min, label: f.label }]))
        };
        for (const [key, rule] of Object.entries(wholeNumbers)) {
            const num = Number(settings[key]);
            if (!Number.isInteger(num) || num < rule.min) {
                setStatusMsg({ text: `${rule.label} must be a whole number of at least ${rule.min}`, type: 'error' });
                return;
            }
        }

        const payload = {
            platformCommissionPercent: commission,
            serviceGstPercent: gst,
            minWithdrawalAmount: minWithdrawal,
            maintenanceMode: settings.maintenanceMode,
            autoPayouts: settings.autoPayouts,
            ratingsEnabled: settings.ratingsEnabled,
            cancellationNoticeDays: Number(settings.cancellationNoticeDays),
            fakeVendorFreeViews: Number(settings.fakeVendorFreeViews),
            fakeVendorAccessPrice: Number(settings.fakeVendorAccessPrice),
            fakeVendorAccessDays: Number(settings.fakeVendorAccessDays),
            ...Object.fromEntries(DISPATCH_FIELDS.map(f => [f.key, Number(settings[f.key])]))
        };

        try {
            setSaving(true);
            const res = await adminApi.updatePlatformSettings(payload, token);
            if (res.success && res.data) {
                setSettings(fromApi(res.data));
                setStatusMsg({ text: 'Platform configurations updated and logged successfully!', type: 'success' });
            } else {
                setStatusMsg({ text: res.message || 'Failed to update settings', type: 'error' });
            }
        } catch (err) {
            console.error('Error saving settings:', err);
            setStatusMsg({ text: 'Failed to communicate with server', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Global Configurations</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform Master Variables & Safeguards</p>
                </div>
                <button 
                    type="submit"
                    disabled={saving || loading}
                    className="h-9 px-6 rounded-xl bg-[#4F35C3] text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#3f2aa6] transition-all disabled:opacity-50"
                >
                    {saving ? 'Updating...' : 'Deploy Changes'}
                </button>
            </div>

            {statusMsg.text && (
                <div className={`p-4 rounded-2xl text-xs font-bold ${
                    statusMsg.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                    {statusMsg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Finance Logic */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Icon name="money" size="xs" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Financial Policy</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Affects subsequent payments & settlements</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">Platform Commission (%)</span>
                                <span className="text-[10px] text-slate-400">Percentage deducted from gross booking amount</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    required
                                    placeholder="e.g. 10"
                                    value={settings.platformCommissionPercent}
                                    onChange={(e) => setSettings({ ...settings, platformCommissionPercent: e.target.value })}
                                    className="w-24 h-9 text-right px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#4F35C3]" 
                                />
                                <span className="text-xs font-bold text-slate-500">%</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
                            <div className="flex items-center justify-between font-bold">
                                <span>Commission Basis: Gross Agreed Amount</span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[9px] uppercase tracking-wider">
                                    {settings.platformCommissionPercent !== '' ? 'Active Policy' : 'Unconfigured'}
                                </span>
                            </div>
                            <p className="text-[10px] text-indigo-700 leading-normal">
                                Changes apply dynamically to new bookings upon quote acceptance. Historical bookings retain their applied commission rate and calculation basis for audit integrity.
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">Service GST Rate (%)</span>
                                <span className="text-[10px] text-slate-400">Nullable / tax configuration if applicable</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="Unset"
                                    value={settings.serviceGstPercent}
                                    onChange={(e) => setSettings({ ...settings, serviceGstPercent: e.target.value })}
                                    className="w-24 h-9 text-right px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#4F35C3]" 
                                />
                                <span className="text-xs font-bold text-slate-500">%</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">Min Withdrawal Threshold (₹)</span>
                                <span className="text-[10px] text-slate-400">Configurable floor for vendor payouts</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-500">₹</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    placeholder="Unset"
                                    value={settings.minWithdrawalAmount}
                                    onChange={(e) => setSettings({ ...settings, minWithdrawalAmount: e.target.value })}
                                    className="w-24 h-9 text-right px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#4F35C3]" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operational Flow */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-purple-50 text-[#4F35C3] flex items-center justify-center">
                            <Icon name="chart" size="xs" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Operational Switches</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Platform availability and automation gates</p>
                        </div>
                    </div>

                    <div className="space-y-6 pt-2">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 leading-tight">Maintenance Mode</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">Flag platform maintenance state</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-amber-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${settings.maintenanceMode ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 leading-tight">Automatic Payouts</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">Toggle automated withdrawal batching</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, autoPayouts: !settings.autoPayouts })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoPayouts ? 'bg-[#4F35C3]' : 'bg-slate-200'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${settings.autoPayouts ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lead dispatch */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 lg:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <Icon name="leads" size="xs" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Lead Dispatch & Complaint Targets</h3>
                            <p className="text-[10px] text-slate-400 font-medium">How requirements are offered to vendors, and how fast complaints are handled</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-5 pt-2">
                        {DISPATCH_FIELDS.map(f => (
                            <div key={f.key} className="flex items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs font-bold text-slate-700 block">{f.label}</span>
                                    <span className="text-[10px] text-slate-400">{f.hint}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <input
                                        type="number"
                                        min={f.min}
                                        step="1"
                                        value={settings[f.key]}
                                        onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                                        className="w-24 h-9 text-right px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#4F35C3]"
                                    />
                                    {f.unit && <span className="text-xs font-bold text-slate-500 w-6">{f.unit}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Marketplace rules */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 lg:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Icon name="shield" size="xs" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Marketplace Rules</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Ratings, cancellation policy and the Fake Vendors page</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-5 pt-2">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 leading-tight">Vendor Ratings</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">When off, star ratings are hidden and reviews are text only</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, ratingsEnabled: !settings.ratingsEnabled })}
                                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.ratingsEnabled ? 'bg-[#4F35C3]' : 'bg-slate-200'}`}
                                aria-label="Toggle vendor ratings"
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${settings.ratingsEnabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">Cancellation Notice (days)</span>
                                <span className="text-[10px] text-slate-400">Cancelling later than this makes the full amount payable</span>
                            </div>
                            <div className="flex items-center gap-1">
                                
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={settings.cancellationNoticeDays}
                                    onChange={(e) => setSettings({ ...settings, cancellationNoticeDays: e.target.value })}
                                    className="w-24 h-9 text-right px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#4F35C3]"
                                />
                                <span className="text-xs font-bold text-slate-500">days</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">Fake Vendors: Free Views</span>
                                <span className="text-[10px] text-slate-400">Views each user gets before paying</span>
                            </div>
                            <div className="flex items-center gap-1">
                                
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={settings.fakeVendorFreeViews}
                                    onChange={(e) => setSettings({ ...settings, fakeVendorFreeViews: e.target.value })}
                                    className="w-24 h-9 text-right px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#4F35C3]"
                                />
                                
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">Fake Vendors: Access Price</span>
                                <span className="text-[10px] text-slate-400">Charged through Razorpay</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-500">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={settings.fakeVendorAccessPrice}
                                    onChange={(e) => setSettings({ ...settings, fakeVendorAccessPrice: e.target.value })}
                                    className="w-24 h-9 text-right px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#4F35C3]"
                                />
                                
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">Fake Vendors: Access Duration</span>
                                <span className="text-[10px] text-slate-400">How long a paid pass lasts</span>
                            </div>
                            <div className="flex items-center gap-1">
                                
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={settings.fakeVendorAccessDays}
                                    onChange={(e) => setSettings({ ...settings, fakeVendorAccessDays: e.target.value })}
                                    className="w-24 h-9 text-right px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#4F35C3]"
                                />
                                <span className="text-xs font-bold text-slate-500">days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AdminSettings;

