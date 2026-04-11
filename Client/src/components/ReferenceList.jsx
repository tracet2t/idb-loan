import { useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, Layers } from 'lucide-react'
import { Toaster } from 'react-hot-toast'

/**
 * ReferenceList — reusable card for Regions OR Sectors
 * Props:
 *   title      – 'Regions' | 'Sectors'
 *   icon       – lucide icon component
 *   items      – array of { _id, name, isActive }
 *   loading    – bool
 *   onAdd      – (name) => Promise<void>
 *   onEdit     – (id, name) => Promise<void>
 *   onDeactivate – (id) => Promise<void>
 *   onDelete   – (id) => Promise<void>
 *   AddEditModal   – modal component
 *   ConfirmDialog  – confirm component
 */
export default function ReferenceList({
  title, icon: Icon = Layers,
  items = [], loading,
  onAdd, onEdit, onDeactivate, onDelete,
  AddEditModal, ConfirmDialog,
}) {
  const [addOpen,     setAddOpen]     = useState(false)
  const [editItem,    setEditItem]    = useState(null)   // { _id, name }
  const [deactivateId, setDeactivateId] = useState(null)
  const [deleteId,    setDeleteId]    = useState(null)
  const [saving,      setSaving]      = useState(false)

  const handleAdd = async (name) => {
    setSaving(true)
    await onAdd(name)
    setSaving(false)
    setAddOpen(false)
  }

  const handleEdit = async (name) => {
    setSaving(true)
    await onEdit(editItem._id, name)
    setSaving(false)
    setEditItem(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-slate-500" />
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <span className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-[#1a2535] text-white text-xs font-bold">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2e7d5e] hover:bg-[#256b50] rounded-lg transition"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-32" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400 text-sm">
            No {title.toLowerCase()} added yet
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className={`px-5 py-4 flex items-center justify-between group transition-colors hover:bg-slate-50/70 ${
                !item.isActive ? 'opacity-50' : ''
              }`}
            >
              {/* Name */}
              <span className="text-sm font-medium text-slate-700">
                {item.name}
                {!item.isActive && (
                  <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Deactivate toggle */}
                <button
                  onClick={() => setDeactivateId(item._id)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  {item.isActive ? 'Deactivate' : 'Activate'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => setEditItem(item)}
                  className="text-slate-400 hover:text-[#F5A623] transition"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteId(item._id)}
                  className="text-slate-300 hover:text-red-500 transition"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modals ── */}
      <AddEditModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title={`Add ${title.slice(0, -1)}`}
        label={`${title.slice(0, -1)} Name`}
        loading={saving}
      />

      <AddEditModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title={`Edit ${title.slice(0, -1)}`}
        label={`${title.slice(0, -1)} Name`}
        initial={editItem?.name || ''}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={() => onDeactivate(deactivateId)}
        title="Deactivate?"
        message="This item will be hidden from new loan application dropdowns but kept in historical records."
        confirmLabel="Deactivate"
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => onDelete(deleteId)}
        title="Delete permanently?"
        message="This cannot be undone. Loans using this reference will not be affected."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}