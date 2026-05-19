import api from './axios'

export const referenceService = {
  // ── Regions ──────────────────────────────────────────────────────────
  getRegions:        ()         => api.get('/reference/regions'),
  createRegion:      (name)     => api.post('/reference/regions', { name }),
  updateRegion:      (id, name) => api.patch(`/reference/regions/${id}`, { name }),
  deactivateRegion:  (id)       => api.patch(`/reference/regions/${id}/deactivate`),
  deleteRegion:      (id)       => api.delete(`/reference/regions/${id}`),

  // ── Sectors ──────────────────────────────────────────────────────────
  getSectors:        ()         => api.get('/reference/sectors'),
  createSector:      (name)     => api.post('/reference/sectors', { name }),
  updateSector:      (id, name) => api.patch(`/reference/sectors/${id}`, { name }),
  deactivateSector:  (id)       => api.patch(`/reference/sectors/${id}/deactivate`),
  deleteSector:      (id)       => api.delete(`/reference/sectors/${id}`),
}