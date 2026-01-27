import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllGames, addGame, deleteGame } from '../db/database'
import { formatDate, GAME_STATUS } from '../utils/constants'
import { useTeam } from '../context/TeamContext'
import Header from '../components/layout/Header'
import Navigation from '../components/layout/Navigation'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'

const Schedule = () => {
  const navigate = useNavigate()
  const { activeTeam } = useTeam()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    opponent: '',
    halfLength: '35'
  })

  const loadGames = async () => {
    if (!activeTeam) return
    try {
      const allGames = await getAllGames(activeTeam.id)
      setGames(allGames)
    } catch (err) {
      console.error('Failed to load games:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadGames()
  }, [activeTeam])

  const handleSubmit = async () => {
    if (!formData.opponent.trim() || !formData.date || !activeTeam) return

    await addGame({
      teamId: activeTeam.id,
      date: formData.date,
      opponent: formData.opponent.trim(),
      halfLength: parseInt(formData.halfLength) || 35
    })

    setShowModal(false)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      opponent: '',
      halfLength: '35'
    })
    loadGames()
  }

  const handleDelete = async (id) => {
    await deleteGame(id)
    setDeleteConfirm(null)
    loadGames()
  }

  const handleGameClick = (game) => {
    if (game.status === 'live') {
      navigate(`/game/${game.id}/live`)
    } else if (game.status === 'completed') {
      navigate(`/game/${game.id}/review`)
    } else {
      navigate(`/game/${game.id}/setup`)
    }
  }

  // Group games by status
  const liveGames = games.filter(g => g.status === 'live')
  const scheduledGames = games.filter(g => g.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date))
  const completedGames = games.filter(g => g.status === 'completed')

  return (
    <div className="min-h-screen pb-20">
      <Header
        title="Schedule"
        rightContent={
          <Button size="sm" onClick={() => setShowModal(true)}>
            + Add
          </Button>
        }
      />

      <main className="p-4 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No games scheduled</p>
            <Button onClick={() => setShowModal(true)}>Add First Game</Button>
          </div>
        ) : (
          <>
            {/* Live Games */}
            {liveGames.length > 0 && (
              <div>
                <h3 className="text-sm text-red-400 font-semibold mb-2">🔴 LIVE</h3>
                {liveGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onClick={() => handleGameClick(game)}
                    onDelete={() => setDeleteConfirm(game)}
                  />
                ))}
              </div>
            )}

            {/* Upcoming Games */}
            {scheduledGames.length > 0 && (
              <div>
                <h3 className="text-sm text-slate-400 font-semibold mb-2">UPCOMING</h3>
                <div className="space-y-2">
                  {scheduledGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onClick={() => handleGameClick(game)}
                      onDelete={() => setDeleteConfirm(game)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Games */}
            {completedGames.length > 0 && (
              <div>
                <h3 className="text-sm text-slate-400 font-semibold mb-2">COMPLETED</h3>
                <div className="space-y-2">
                  {completedGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onClick={() => handleGameClick(game)}
                      onDelete={() => setDeleteConfirm(game)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Game Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Game"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Add Game</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Opponent</label>
            <input
              type="text"
              className="input"
              placeholder="Team name"
              value={formData.opponent}
              onChange={e => setFormData({ ...formData, opponent: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Half Length (minutes)</label>
            <input
              type="number"
              className="input"
              placeholder="35"
              min="1"
              max="45"
              value={formData.halfLength}
              onChange={e => setFormData({ ...formData, halfLength: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Game"
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
          Are you sure you want to delete the game vs <strong>{deleteConfirm?.opponent}</strong>?
          All stats for this game will be lost.
        </p>
      </Modal>

      <Navigation />
    </div>
  )
}

const GameCard = ({ game, onClick, onDelete }) => {
  const isCompleted = game.status === 'completed'
  const isLive = game.status === 'live'

  return (
    <div className="card flex items-center gap-4">
      <button
        onClick={onClick}
        className="flex-1 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
      >
        <div>
          <div className="font-medium text-white">vs {game.opponent}</div>
          <div className="text-sm text-slate-400">{formatDate(game.date)}</div>
          {isLive && (
            <span className="text-xs text-red-400">In Progress</span>
          )}
        </div>
        {(isCompleted || isLive) && (
          <div className={`text-xl font-bold ${
            game.homeScore > game.awayScore ? 'text-green-400' :
            game.homeScore < game.awayScore ? 'text-red-400' : 'text-slate-400'
          }`}>
            {game.homeScore} - {game.awayScore}
          </div>
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="p-2 text-red-400 hover:text-red-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        🗑
      </button>
    </div>
  )
}

export default Schedule
