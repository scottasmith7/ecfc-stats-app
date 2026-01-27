import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import Header from '../components/layout/Header'
import Navigation from '../components/layout/Navigation'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'

const TeamSettings = () => {
  const navigate = useNavigate()
  const { activeTeam, teams, editTeam, removeTeam } = useTeam()
  const [formData, setFormData] = useState({
    teamName: '',
    ageGroup: '',
    coachName: ''
  })
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (activeTeam) {
      setFormData({
        teamName: activeTeam.teamName || '',
        ageGroup: activeTeam.ageGroup || '',
        coachName: activeTeam.coachName || ''
      })
    }
  }, [activeTeam])

  const handleSave = async () => {
    if (!formData.teamName.trim()) return

    setSaving(true)
    await editTeam(activeTeam.id, {
      teamName: formData.teamName.trim(),
      ageGroup: formData.ageGroup.trim(),
      coachName: formData.coachName.trim()
    })
    setSaving(false)
    navigate('/')
  }

  const handleDelete = async () => {
    if (teams.length <= 1) {
      setDeleteError('Cannot delete the only team. Create another team first.')
      return
    }

    const success = await removeTeam(activeTeam.id)
    if (success) {
      navigate('/')
    } else {
      setDeleteError('Failed to delete team.')
    }
  }

  if (!activeTeam) {
    return null
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Team Settings" showBack />

      <main className="p-4 space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Edit Team</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., U16 Girls"
                value={formData.teamName}
                onChange={e => setFormData({ ...formData, teamName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Age Group</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., U16, U14, Senior"
                value={formData.ageGroup}
                onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Coach Name</label>
              <input
                type="text"
                className="input"
                placeholder="Your name"
                value={formData.coachName}
                onChange={e => setFormData({ ...formData, coachName: e.target.value })}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!formData.teamName.trim() || saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Team Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Team Info</h2>
          <div className="text-sm text-slate-400 space-y-1">
            <p>Created: {new Date(activeTeam.createdAt).toLocaleDateString()}</p>
            {teams.length > 1 && (
              <p>You have {teams.length} teams on this device</p>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border border-red-900/50">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-slate-400 mb-4">
            Deleting a team will permanently remove all its players, games, and stats.
            This action cannot be undone.
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={teams.length <= 1}
          >
            Delete Team
          </Button>
          {teams.length <= 1 && (
            <p className="text-xs text-slate-500 mt-2">
              Cannot delete the only team. Add another team first.
            </p>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeleteError('')
        }}
        title="Delete Team"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowDeleteConfirm(false)
              setDeleteError('')
            }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Forever
            </Button>
          </>
        }
      >
        <p className="text-slate-300 mb-2">
          Are you sure you want to delete <strong>{activeTeam.teamName}</strong>?
        </p>
        <p className="text-slate-400 text-sm">
          All players, games, and stats for this team will be permanently deleted.
        </p>
        {deleteError && (
          <p className="text-red-400 text-sm mt-3">{deleteError}</p>
        )}
      </Modal>

      <Navigation />
    </div>
  )
}

export default TeamSettings
