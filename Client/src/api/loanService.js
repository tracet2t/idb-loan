import api from './axios'

export const loanService = {
  // GET /api/loans — with filters, search, pagination
  // params: { status, region, sector, search, page, limit }
  getLoans: (params) => api.get('/loans', { params }),

  // GET /api/loans/:id — single loan detail
  getLoanById: (id) => api.get(`/loans/${id}`),

  // PATCH /api/loans/:id/status — approve or reject
  updateLoanStatus: (id, status, remarks = '') =>
    api.patch(`/loans/${id}/status`, { status, remarks }),

  // PATCH /api/loans/:id/details — edit details of Pending loans only
  updateLoanDetails: (id, data) => api.patch(`/loans/${id}/details`, data),

  // GET /api/loans/stats — counts for dashboard cards
  getLoanStats: () => api.get('/loans/stats'),
}