import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Navigation from '../components/layout/Navigation'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { usePlayers } from '../hooks/usePlayers'
import { POSITIONS } from '../utils/constants'

const Roster = () => {
  const navigate = useNavigate()
  const { players, loading, createPlayer, editPlayer, removePlayer } = usePlayers()
  const [showModal, setShowModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    jerseyNumber: '',
    positions: ['MID']
  })

  const resetForm = () => {
    setFormData({ name: '', jerseyNumber: '', positions: ['MID'] })
    setEditingPlayer(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setShowModal(true)
  }

  const handleOpenEdit = (player) => {
    setEditingPlayer(player)
    setFormData({
      name: player.name,
      jerseyNumber: player.jerseyNumber.toString(),
      positions: player.positions || [player.position] || ['MID']
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    const data = {
      name: formData.name.trim(),
      jerseyNumber: parseInt(formData.jerseyNumber),
      positions: formData.positions
    }

    if (!data.name || isNaN(data.jerseyNumber) || data.positions.length === 0) return

    if (editingPlayer) {
      await editPlayer(editingPlayer.id, data)
    } else {
      await createPlayer(data)
    }

    setShowModal(false)
    resetForm()
  }

  const togglePosition = (key) => {
    const current = formData.positions || []
    if (current.includes(key)) {
      // Remove if already selected (but keep at least one)
      if (current.length > 1) {
        setFormData({ ...formData, positions: current.filter(p => p !== key) })
      }
    } else {
      setFormData({ ...formData, positions: [...current, key] })
    }
  }

  const handleDelete = async (id) => {
    await removePlayer(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen pb-20">
      <Header
        title="Roster"
        rightContent={
          <Button size="sm" onClick={handleOpenAdd}>
            + Add
          </Button>
        }
      />

      <main className="p-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : players.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No players yet</p>
            <Button onClick={handleOpenAdd}>Add First Player</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map(player => {
              const positions = player.positions || [player.position] || ['MID']
              const primaryPos = POSITIONS[positions[0]] || POSITIONS.MID
              const positionDisplay = positions.map(p => POSITIONS[p]?.label || p).join('/')
              return (
                <div
                  key={player.id}
                  className="card flex items-center gap-4"
                >
                  <button
                    onClick={() => handleOpenEdit(player)}
                    className="flex-1 flex items-center gap-4 text-left"
                  >
                    <div className="text-2xl font-bold text-white w-12">
                      #{player.jerseyNumber}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{player.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded ${primaryPos.color}`}>
                        {positionDisplay}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate(`/stats/player/${player.id}`)}
                    className="p-2 text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    📊
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(player)}
                    className="p-2 text-red-400 hover:text-red-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    🗑
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingPlayer ? 'Edit Player' : 'Add Player'}
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowModal(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPlayer ? 'Save' : 'Add'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              type="text"
              className="input"
              placeholder="Player name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Jersey Number</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              min="0"
              max="99"
              value={formData.jerseyNumber}
              onChange={e => setFormData({ ...formData, jerseyNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Position(s)</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(POSITIONS).map(([key, pos]) => (
                <button
                  key={key}
                  onClick={() => togglePosition(key)}
                  className={`
                    p-3 rounded-lg font-medium transition-all
                    ${formData.positions.includes(key)
                      ? pos.color
                      : 'bg-slate-700 text-slate-300'}
                  `}
                >
                  {pos.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">Tap to toggle. At least one position required.</p>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Player"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-slate-300">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
          This will also remove their stats from all games.
        </p>
      </Modal>

      <Navigation />
    </div>
  )
}

export default Roster
