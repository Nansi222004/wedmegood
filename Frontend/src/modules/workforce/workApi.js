import { getAuthToken } from '../../services/userApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function request(path, { method = 'GET', body } = {}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    cache: 'no-store',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
}
const post = (p, body = {}) => request(p, { method: 'POST', body });
const put = (p, body = {}) => request(p, { method: 'PUT', body });

/** Worker side (the customer account doubles as a worker profile) */
export const workerApi = {
  options: () => request('/work/options'),
  me: () => request('/work/me'),
  saveMe: (body) => put('/work/me', body),
  setAvailability: (body) => put('/work/me/availability', body),
  startDigilocker: () => post('/work/me/digilocker'),
  submitVerification: (body) => post('/work/me/verification', body),
  demand: () => request('/work/demand'),
  offers: () => request('/work/offers/active'),
  accept: (id) => post(`/work/offers/${id}/accept`),
  decline: (id, reason) => post(`/work/offers/${id}/decline`, { reason }),
  assignments: () => request('/work/assignments'),
  checkIn: (id, code) => post(`/work/assignments/${id}/checkin`, { code }),
  checkOut: (id) => post(`/work/assignments/${id}/checkout`),
  confirmPayment: (id) => post(`/work/assignments/${id}/confirm-payment`),
  dispute: (id, reason) => post(`/work/assignments/${id}/dispute`, { reason }),
  cancel: (id, reason) => post(`/work/assignments/${id}/cancel`, { reason }),
  messages: (id) => request(`/work/assignments/${id}/messages`),
  sendMessage: (id, text) => post(`/work/assignments/${id}/messages`, { text }),
  reportSafety: (id, body) => post(`/work/assignments/${id}/safety`, body)
};

/** Customer posting home jobs: same shape as the vendor's ops api job methods */
export const customerJobsApi = {
  jobs: () => request('/work/customer/jobs'),
  job: (id) => request(`/work/customer/jobs/${id}`),
  createJob: (body) => post('/work/customer/jobs', body),
  updateJob: (id, body) => put(`/work/customer/jobs/${id}`, body),
  cancelJob: (id, body) => post(`/work/customer/jobs/${id}/cancel`, body),
  jobAction: (id, aid, action, body) => post(`/work/customer/jobs/${id}/assignments/${aid}/${action}`, body),
  messages: (id, aid) => request(`/work/customer/jobs/${id}/assignments/${aid}/messages`),
  sendMessage: (id, aid, text) => post(`/work/customer/jobs/${id}/assignments/${aid}/messages`, { text }),
  reportSafety: (id, body) => post(`/work/customer/jobs/${id}/safety`, body)
};
