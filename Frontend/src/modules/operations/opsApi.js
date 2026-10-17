import { createContext, useContext } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

/**
 * Event operations API. The same screens serve the vendor owner (vendorToken) and team members
 * (teamToken); the server decides what each role may see and do.
 */
export function createOpsApi(getToken) {
  const request = async (path, { method = 'GET', body } = {}) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  };
  const get = (p) => request(p);
  const post = (p, body = {}) => request(p, { method: 'POST', body });
  const put = (p, body = {}) => request(p, { method: 'PUT', body });
  const del = (p, body) => request(p, { method: 'DELETE', body });

  return {
    me: () => get('/ops/me'),
    changePassword: (body) => put('/ops/me/password', body),
    myWallet: () => get('/ops/me/wallet'),

    events: (range = 'upcoming') => get(`/ops/events?range=${range}`),
    board: (days = 2) => get(`/ops/events/board?days=${days}`),
    event: (id) => get(`/ops/events/${id}`),
    updateEvent: (id, body) => put(`/ops/events/${id}`, body),
    generateChecklist: (id) => post(`/ops/events/${id}/generate-checklist`),
    copyPlan: (id, fromEventId) => post(`/ops/events/${id}/copy-plan`, { fromEventId }),
    confirmReady: (id) => post(`/ops/events/${id}/confirm-ready`),
    createChangeRequest: (id, body) => post(`/ops/events/${id}/change-requests`, body),
    withdrawChangeRequest: (crId) => post(`/ops/change-requests/${crId}/withdraw`),

    myTasks: () => get('/ops/my/tasks'),
    createTask: (eventId, body) => post(`/ops/events/${eventId}/tasks`, body),
    updateTask: (taskId, body) => put(`/ops/tasks/${taskId}`, body),
    deleteTask: (taskId) => del(`/ops/tasks/${taskId}`),
    setTaskStatus: (taskId, body) => post(`/ops/tasks/${taskId}/status`, body),

    stock: (from, to) => get(`/ops/stock${from ? `?from=${from}&to=${to || from}` : ''}`),
    createStock: (body) => post('/ops/stock', body),
    assignItemCodes: () => post('/ops/stock/assign-codes'),
    updateStock: (id, body) => put(`/ops/stock/${id}`, body),
    adjustStock: (id, body) => post(`/ops/stock/${id}/adjust`, body),
    stockMovements: (id) => get(`/ops/stock/${id}/movements`),
    reserve: (eventId, body) => post(`/ops/events/${eventId}/reservations`, body),
    releaseReservation: (rid) => del(`/ops/reservations/${rid}`),
    createGatePass: (eventId, body) => post(`/ops/events/${eventId}/gatepasses`, body),
    packGatePass: (gid, body) => post(`/ops/gatepasses/${gid}/pack`, body),
    dispatchGatePass: (gid) => post(`/ops/gatepasses/${gid}/dispatch`),
    receiveGatePass: (gid, body) => post(`/ops/gatepasses/${gid}/receive`, body),
    returnGatePass: (gid, body) => post(`/ops/gatepasses/${gid}/return`, body),
    shortages: (status = 'Open') => get(`/ops/shortages?status=${status}`),
    resolveShortage: (sid, body) => post(`/ops/shortages/${sid}/resolve`, body),

    purchases: (q = '') => get(`/ops/purchases${q}`),
    createPurchase: (body) => post('/ops/purchases', body),
    decidePurchase: (pid, body) => post(`/ops/purchases/${pid}/decide`, body),
    recordPurchase: (pid, body) => post(`/ops/purchases/${pid}/record`, body),

    expenses: (q = '') => get(`/ops/expenses${q}`),
    createExpense: (body) => post('/ops/expenses', body),
    updateExpense: (id, body) => put(`/ops/expenses/${id}`, body),
    approveExpense: (id, body) => post(`/ops/expenses/${id}/approve`, body),
    deleteExpense: (id, reason) => del(`/ops/expenses/${id}`, { reason }),
    unsettled: (id) => get(`/ops/events/${id}/unsettled`),
    closeAccounts: (id, body) => post(`/ops/events/${id}/close-accounts`, body),
    brief: () => get('/ops/brief'),
    settings: () => get('/ops/settings'),
    updateSettings: (body) => put('/ops/settings', body),
    sendCustomerUpdate: (id, body) => post(`/ops/events/${id}/customer-updates`, body),
    decideCustomerUpdate: (id, uid, body) => post(`/ops/events/${id}/customer-updates/${uid}`, body),
    cashDay: (day) => get(`/ops/cash${day ? `?day=${day}` : ''}`),
    closeCashDay: (body) => post('/ops/cash/close', body),
    splitExpense: (body) => post('/ops/expenses/split', body),
    accounts: (month) => get(`/ops/accounts${month ? `?month=${month}` : ''}`),

    team: () => get('/ops/team'),
    addMember: (body) => post('/ops/team', body),
    updateMember: (id, body) => put(`/ops/team/${id}`, body),
    wallet: (memberId) => get(`/ops/team/${memberId}/wallet`),
    addWalletEntry: (memberId, body) => post(`/ops/team/${memberId}/wallet`, body),
    attendance: (eventId, body) => post(`/ops/events/${eventId}/attendance`, body),
    confirmShift: (sid, body) => post(`/ops/shifts/${sid}/confirm`, body),

    myPackages: () => get('/ops/my/packages'),
    createPackage: (eventId, body) => post(`/ops/events/${eventId}/packages`, body),
    respondPackage: (pid, body) => post(`/ops/packages/${pid}/respond`, body),
    packageProgress: (pid, body) => post(`/ops/packages/${pid}/progress`, body),
    approvePackage: (pid, body) => post(`/ops/packages/${pid}/approve`, body),
    settlePackage: (pid) => post(`/ops/packages/${pid}/settle`),
    reassignPackage: (pid, body) => post(`/ops/packages/${pid}/reassign`, body),

    // Workforce jobs posted by the business
    jobs: () => get('/work/vendor/jobs'),
    job: (id) => get(`/work/vendor/jobs/${id}`),
    createJob: (body) => post('/work/vendor/jobs', body),
    updateJob: (id, body) => put(`/work/vendor/jobs/${id}`, body),
    cancelJob: (id, body) => post(`/work/vendor/jobs/${id}/cancel`, body),
    jobAction: (id, aid, action, body) => post(`/work/vendor/jobs/${id}/assignments/${aid}/${action}`, body),
    jobMessages: (id, aid) => get(`/work/vendor/jobs/${id}/assignments/${aid}/messages`),
    sendJobMessage: (id, aid, text) => post(`/work/vendor/jobs/${id}/assignments/${aid}/messages`, { text }),
    reportJobSafety: (id, body) => post(`/work/vendor/jobs/${id}/safety`, body),

    upload: async (file) => {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE_URL}/upload/single`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.data?.url) throw new Error(data.message || 'Upload failed');
      return data.data.url;
    }
  };
}

export const OpsContext = createContext(null);

/** { api, basePath, me } for the current shell (owner inside the vendor panel, or team app) */
export const useOps = () => useContext(OpsContext);

export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-IN', opts) : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
export const can = (me, permission) => Boolean(me?.permissions?.includes('*') || me?.permissions?.includes(permission));
