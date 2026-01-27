import { useState, useEffect, useRef } from 'react'
import { getAllPlayers, getAllGames, exportAllData, importAllData } from '../db/database'
import { db } from '../db/database'
import { exportGameCSV, exportPlayerCSV, exportSeasonSummaryCSV, exportBackupJSON, readRestoreFile } from '../utils/export'
import { formatDate } from '../utils/constants'
import { useTeam } from '../context/TeamContext'
import Header from '../components/layout/Header'
import Navigation from '../components/layout/Navigation'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'

const Export = () => {
  const { activeTeam, refreshTeams } = useTeam()
  const [players, setPlayers] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGameSelect, setShowGameSelect] = useState(false)
  const [showPlayerSelect, setShowPlayerSelect] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [restoreData, setRestoreData] = useState(null)
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      if (!activeTeam) return
      try {
        const [playersData, gamesData] = await Promise.all([
          getAllPlayers(activeTeam.id),
          getAllGames(activeTeam.id)
        ])
        setPlayers(playersData)
        setGames(gamesData.filter(g => g.status === 'completed'))
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    loadData()
  }, [activeTeam])

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleExportGame = async (game) => {
    try {
      const [lineups, events] = await Promise.all([
        db.gameLineups.where('gameId').equals(game.id).toArray(),
        db.gameEvents.where('gameId').equals(game.id).toArray()
      ])
      exportGameCSV(game, players, lineups, events, activeTeam?.teamName)
      setShowGameSelect(false)
      showMessage('Game exported successfully')
    } catch (err) {
      showMessage('Failed to export game', 'error')
    }
  }

  const handleExportPlayer = async (player) => {
    try {
      const gameIds = games.map(g => g.id)
      const [lineups, events] = await Promise.all([
        gameIds.length > 0 ? db.gameLineups.where('gameId').anyOf(gameIds).toArray() : [],
        gameIds.length > 0 ? db.gameEvents.where('gameId').anyOf(gameIds).toArray() : []
      ])
      exportPlayerCSV(player, games, lineups, events)
      setShowPlayerSelect(false)
      showMessage('Player stats exported successfully')
    } catch (err) {
      showMessage('Failed to export player stats', 'error')
    }
  }

  const handleExportSeason = async () => {
    try {
      const gameIds = games.map(g => g.id)
      const [lineups, events] = await Promise.all([
        gameIds.length > 0 ? db.gameLineups.where('gameId').anyOf(gameIds).toArray() : [],
        gameIds.length > 0 ? db.gameEvents.where('gameId').anyOf(gameIds).toArray() : []
      ])
      exportSeasonSummaryCSV(players, games, lineups, events, activeTeam?.teamName)
      showMessage('Season summary exported successfully')
    } catch (err) {
      showMessage('Failed to export season summary', 'error')
    }
  }

  const handleBackup = async () => {
    try {
      const data = await exportAllData(activeTeam?.id)
      exportBackupJSON(data, activeTeam?.teamName)
      showMessage(`Backup for ${activeTeam?.teamName} created`)
    } catch (err) {
      showMessage('Failed to create backup', 'error')
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await readRestoreFile(file)
      setRestoreData(data)
      setShowRestoreConfirm(true)
    } catch (err) {
      showMessage('Failed to read backup file', 'error')
    }

    // Reset file input
    e.target.value = ''
  }

  const handleRestore = async () => {
    if (!restoreData) return

    try {
      await importAllData(restoreData)
      setShowRestoreConfirm(false)
      setRestoreData(null)
      showMessage('Data restored successfully')

      // Refresh teams (this will also update activeTeam)
      await refreshTeams()
    } catch (err) {
      showMessage('Failed to restore data: ' + err.message, 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Export & Backup" />

      <main className="p-4 space-y-4">
        {/* Message Toast */}
        {message && (
          <div className={`p-3 rounded-lg text-center ${
            message.type === 'error' ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Export Section */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Export Data</h3>

          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => setShowGameSelect(true)}
              disabled={games.length === 0}
            >
              <span className="mr-3">📊</span>
              Export Game Stats
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => setShowPlayerSelect(true)}
              disabled={players.length === 0}
            >
              <span className="mr-3">👤</span>
              Export Player Stats
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={handleExportSeason}
              disabled={games.length === 0}
            >
              <span className="mr-3">📈</span>
              Export Season Summary
            </Button>
          </div>
        </div>

        {/* Backup Section */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Backup & Restore</h3>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full justify-start"
              onClick={handleBackup}
            >
              <span className="mr-3">💾</span>
              Backup All Data (JSON)
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="mr-3">📂</span>
              Restore from Backup
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <p className="text-sm text-slate-500 mt-4">
            Backups include all players, games, lineups, and stats.
            Restoring will replace all existing data.
          </p>
        </div>

        {/* Data Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Data Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{players.length}</div>
              <div className="text-xs text-slate-400">Players</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{games.length}</div>
              <div className="text-xs text-slate-400">Completed Games</div>
            </div>
          </div>
        </div>
      </main>

      {/* Game Select Modal */}
      <Modal
        isOpen={showGameSelect}
        onClose={() => setShowGameSelect(false)}
        title="Select Game to Export"
        size="lg"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => handleExportGame(game)}
              className="w-full p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-left transition-colors"
            >
              <div className="font-medium">vs {game.opponent}</div>
              <div className="text-sm text-slate-400 flex justify-between">
                <span>{formatDate(game.date)}</span>
                <span>{game.homeScore} - {game.awayScore}</span>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Player Select Modal */}
      <Modal
        isOpen={showPlayerSelect}
        onClose={() => setShowPlayerSelect(false)}
        title="Select Player to Export"
        size="lg"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {players.map(player => (
            <button
              key={player.id}
              onClick={() => handleExportPlayer(player)}
              className="w-full p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-left transition-colors flex items-center gap-3"
            >
              <span className="text-xl font-bold">#{player.jerseyNumber}</span>
              <span className="flex-1">{player.name}</span>
              <span className="text-slate-400">{player.position}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false)
          setRestoreData(null)
        }}
        title="Restore Data"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowRestoreConfirm(false)
              setRestoreData(null)
            }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRestore}>
              Restore
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            This will <strong className="text-red-400">replace all existing data</strong> with the backup.
          </p>
          {restoreData && (
            <div className="bg-slate-700 rounded-lg p-3 text-sm">
              <div>Backup date: {new Date(restoreData.exportDate).toLocaleString()}</div>
              <div>Players: {restoreData.data.players?.length || 0}</div>
              <div>Games: {restoreData.data.games?.length || 0}</div>
            </div>
          )}
          <p className="text-yellow-400 text-sm">
            ⚠️ This action cannot be undone.
          </p>
        </div>
      </Modal>

      <Navigation />
    </div>
  )
}

export default Export
