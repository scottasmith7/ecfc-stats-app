import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllGames } from '../db/database'
import { formatDate, GAME_STATUS } from '../utils/constants'
import Header from '../components/layout/Header'
import Navigation from '../components/layout/Navigation'
import Button from '../components/common/Button'

const Home = () => {
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGames = async () => {
      try {
        const allGames = await getAllGames()
        setGames(allGames)
      } catch (err) {
        console.error('Failed to load games:', err)
      } finally {
        setLoading(false)
      }
    }
    loadGames()
  }, [])

  // Find current or next game
  const today = new Date().toISOString().split('T')[0]
  const liveGame = games.find(g => g.status === 'live')
  const upcomingGame = games.find(g => g.status === 'scheduled' && g.date >= today)
  const currentGame = liveGame || upcomingGame

  // Recent completed games
  const completedGames = games
    .filter(g => g.status === 'completed')
    .slice(0, 5)

  const handleGameClick = (game) => {
    if (game.status === 'live') {
      navigate(`/game/${game.id}/live`)
    } else if (game.status === 'completed') {
      navigate(`/game/${game.id}/review`)
    } else {
      navigate(`/game/${game.id}/setup`)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="ECFC Stats" />

      <main className="p-4 space-y-6">
        {/* Hero section */}
        <div className="text-center py-6">
          <img
            src="/ecfc-logo.png"
            alt="ECFC Logo"
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-white">ECFC U16 Girls</h2>
          <p className="text-slate-400">Stats Tracker</p>
        </div>

        {/* Current/Next Game Card */}
        {currentGame ? (
          <div className="card">
            <div className="text-sm text-slate-400 mb-2">
              {currentGame.status === 'live' ? '🔴 LIVE NOW' : 'NEXT GAME'}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xl font-bold text-white">
                  vs {currentGame.opponent}
                </div>
                <div className="text-slate-400">
                  {formatDate(currentGame.date)}
                </div>
              </div>
              {currentGame.status === 'live' && (
                <div className="text-2xl font-bold text-ecfc-green">
                  {currentGame.homeScore} - {currentGame.awayScore}
                </div>
              )}
            </div>
            <Button
              variant={currentGame.status === 'live' ? 'success' : 'primary'}
              className="w-full"
              onClick={() => handleGameClick(currentGame)}
            >
              {currentGame.status === 'live' ? 'Continue Tracking' : 'Start Game'}
            </Button>
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-slate-400 mb-4">No upcoming games scheduled</p>
            <Button onClick={() => navigate('/schedule')} variant="primary">
              Add a Game
            </Button>
          </div>
        )}

        {/* Recent Games */}
        {completedGames.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Games</h3>
            <div className="space-y-2">
              {completedGames.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleGameClick(game)}
                  className="w-full card flex items-center justify-between active:scale-[0.98] transition-transform"
                >
                  <div>
                    <div className="font-medium text-white">vs {game.opponent}</div>
                    <div className="text-sm text-slate-400">{formatDate(game.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      game.homeScore > game.awayScore ? 'text-green-400' :
                      game.homeScore < game.awayScore ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {game.homeScore} - {game.awayScore}
                    </div>
                    <div className="text-xs text-slate-500">
                      {game.homeScore > game.awayScore ? 'WIN' :
                       game.homeScore < game.awayScore ? 'LOSS' : 'DRAW'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/roster')}
            className="py-6"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">👥</div>
              <div>Roster</div>
            </div>
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/stats/team')}
            className="py-6"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <div>Stats</div>
            </div>
          </Button>
        </div>
      </main>

      <Navigation />
    </div>
  )
}

export default Home
