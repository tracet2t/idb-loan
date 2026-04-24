import { useState, useEffect, useCallback } from 'react'
import { MapPin, Layers } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

import { referenceService } from '../api/referenceService'
import ReferenceList  from '../components/ReferenceList'
import AddEditModal   from '../components/ui/AddEditModal'
import ConfirmDialog  from '../components/ui/ConfirmDialog'

export default function ReferenceData() {
  const [regions,  setRegions]  = useState([])
  const [sectors,  setSectors]  = useState([])
  const [loading,  setLoading]  = useState(true)

  // ── Fetch both in parallel ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rRes, sRes] = await Promise.all([
        referenceService.getRegions(),
        referenceService.getSectors(),
      ])
      setRegions(rRes.data)
      setSectors(sRes.data)
    } catch {
      toast.error('Failed to load reference data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Region handlers ────────────────────────────────────────────────────
  const handleAddRegion = async (name) => {
    try {
      await referenceService.createRegion(name)
      toast.success(`Region "${name}" added`)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add region')
      throw err  // re-throw so modal stays open
    }
  }

  const handleEditRegion = async (id, name) => {
    try {
      await referenceService.updateRegion(id, name)
      toast.success('Region updated')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update region')
      throw err
    }
  }

  const handleDeactivateRegion = async (id) => {
    try {
      await referenceService.deactivateRegion(id)
      toast.success('Region deactivated')
      fetchAll()
    } catch {
      toast.error('Failed to deactivate region')
    }
  }

  const handleDeleteRegion = async (id) => {
    try {
      await referenceService.deleteRegion(id)
      toast.success('Region deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete region')
    }
  }

  // ── Sector handlers ────────────────────────────────────────────────────
  const handleAddSector = async (name) => {
    try {
      await referenceService.createSector(name)
      toast.success(`Sector "${name}" added`)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add sector')
      throw err
    }
  }

  const handleEditSector = async (id, name) => {
    try {
      await referenceService.updateSector(id, name)
      toast.success('Sector updated')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update sector')
      throw err
    }
  }

  const handleDeactivateSector = async (id) => {
    try {
      await referenceService.deactivateSector(id)
      toast.success('Sector deactivated')
      fetchAll()
    } catch {
      toast.error('Failed to deactivate sector')
    }
  }

  const handleDeleteSector = async (id) => {
    try {
      await referenceService.deleteSector(id)
      toast.success('Sector deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete sector')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="space-y-5">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reference Data</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage provinces/regions and economic sectors used across the system.
          </p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Regions */}
          <ReferenceList
            title="Regions"
            icon={MapPin}
            items={regions}
            loading={loading}
            onAdd={handleAddRegion}
            onEdit={handleEditRegion}
            onDeactivate={handleDeactivateRegion}
            onDelete={handleDeleteRegion}
            AddEditModal={AddEditModal}
            ConfirmDialog={ConfirmDialog}
          />

          {/* Sectors */}
          <ReferenceList
            title="Sectors"
            icon={Layers}
            items={sectors}
            loading={loading}
            onAdd={handleAddSector}
            onEdit={handleEditSector}
            onDeactivate={handleDeactivateSector}
            onDelete={handleDeleteSector}
            AddEditModal={AddEditModal}
            ConfirmDialog={ConfirmDialog}
          />
        </div>
      </div>
    </>
  )
}