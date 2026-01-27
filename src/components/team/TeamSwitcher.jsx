import { useState, useRef, useEffect } from 'react'
import { useTeam } from '../../context/TeamContext'
import Modal from '../common/Modal'
import Button from '../common/Button'

const TeamSwitcher = () => {
  const { teams, activeTeam, switchTeam, createTeam } = useTeam()
  const [isOpen, setIsOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    teamName: '',
    ageGroup: '',
    coachName: ''
  })
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectTeam = (teamId) => {
    switchTeam(teamId)
    setIsOpen(false)
  }

  const handleAddTeam = async () => {
    if (!formData.teamName.trim()) return

    await createTeam({
      teamName: formData.teamName.trim(),
      ageGroup: formData.ageGroup.trim(),
      coachName: formData.coachName.trim()
    })

    setFormData({ teamName: '', ageGroup: '', coachName: '' })
    setShowAddModal(false)
    setIsOpen(false)
  }

  if (!activeTeam) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors min-h-[36px]"
      >
        <span className="text-white font-medium truncate max-w-[140px]">
          {activeTeam.teamName}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="py-1">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team.id)}
                className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-700 transition-colors ${
                  team.id === activeTeam.id ? 'bg-slate-700' : ''
                }`}
              >
                <div className="truncate">
                  <div className="text-white font-medium truncate">{team.teamName}</div>
                  {team.ageGroup && (
                    <div className="text-xs text-slate-400">{team.ageGroup}</div>
                  )}
                </div>
                {team.id === activeTeam.id && (
                  <svg className="w-5 h-5 text-ecfc-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-700">
            <button
              onClick={() => {
                setIsOpen(false)
                setShowAddModal(true)
              }}
              className="w-full px-4 py-2.5 text-left text-ecfc-blue hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Team
            </button>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setFormData({ teamName: '', ageGroup: '', coachName: '' })
        }}
        title="Add New Team"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                setFormData({ teamName: '', ageGroup: '', coachName: '' })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddTeam} disabled={!formData.teamName.trim()}>
              Add Team
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Team Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g., U14 Boys"
              value={formData.teamName}
              onChange={e => setFormData({ ...formData, teamName: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Age Group</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., U14, Senior"
              value={formData.ageGroup}
              onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Coach Name</label>
            <input
              type="text"
              className="input"
              placeholder="Coach name"
              value={formData.coachName}
              onChange={e => setFormData({ ...formData, coachName: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TeamSwitcher
