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

  // POST add documents to a loan (multipart/form-data)
  addLoanDocuments: (id, formData) =>
    api.post(`/loans/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // DELETE remove a document by index
  removeLoanDocument: (id, docIndex) =>
    api.delete(`/loans/${id}/documents/${docIndex}`),
}