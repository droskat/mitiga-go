const API_BASE = '/api'

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export const api = {
  login: (body) => apiFetch('/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => apiFetch('/register', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => apiFetch('/profile'),
  getTags: () => apiFetch('/tags'),
  getGossips: (tag) => apiFetch(`/gossips${tag ? `?tag=${tag}` : ''}`),
  getGossip: (id) => apiFetch(`/gossips/${id}`),
  createGossip: (body) => apiFetch('/gossips', { method: 'POST', body: JSON.stringify(body) }),
  toggleLike: (id) => apiFetch(`/gossips/${id}/like`, { method: 'POST' }),
  getComments: (id) => apiFetch(`/gossips/${id}/comments`),
  createComment: (id, body) => apiFetch(`/gossips/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  getNicknames: () => apiFetch('/nicknames'),
  upsertNickname: (body) => apiFetch('/nicknames', { method: 'POST', body: JSON.stringify(body) }),
  deleteNickname: (id) => apiFetch(`/nicknames/${id}`, { method: 'DELETE' }),
  getNicknameMap: () => apiFetch('/nickname-map'),
  getScoreboard: () => apiFetch('/scoreboard'),
  getPendingUsers: () => apiFetch('/pending-users'),
  approveUser: (id) => apiFetch(`/approve/${id}`, { method: 'POST' }),
  rejectUser: (id) => apiFetch(`/reject/${id}`, { method: 'POST' }),
}
