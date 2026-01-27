import { useState } from 'react'
import { useTeam } from '../context/TeamContext'

const TeamSetup = () => {
  const { createTeam } = useTeam()
  const [formData, setFormData] = useState({
    teamName: '',
    ageGroup: '',
    coachName: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.teamName.trim()) return

    setSubmitting(true)
    await createTeam({
      teamName: formData.teamName.trim(),
      ageGroup: formData.ageGroup.trim(),
      coachName: formData.coachName.trim()
    })
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/ecfc-logo.png"
            alt="ECFC Logo"
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to ECFC Stats</h1>
          <p className="text-slate-400">Create your first team to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoFocus
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

          <button
            type="submit"
            disabled={!formData.teamName.trim() || submitting}
            className="w-full btn btn-primary py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default TeamSetup
