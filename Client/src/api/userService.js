import api from './axios'

export const userService = {
  // GET /api/users — all users
  getUsers: () => api.get('/users'),

  // POST /api/users — create new user
  createUser: (data) => api.post('/users', data),

  // PUT /api/users/:id — edit user (backend uses PUT)
  updateUser: (id, data) => api.put(`/users/${id}`, data),

  // DELETE /api/users/:id — delete user
  deleteUser: (id) => api.delete(`/users/${id}`),

  // PATCH /api/users/reset-password/:id — reset password
  resetPassword: (id, password) =>
    api.patch(`/users/reset-password/${id}`, { newPassword: password }),
}