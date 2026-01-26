import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Roster from './pages/Roster'
import Schedule from './pages/Schedule'
import GameSetup from './pages/GameSetup'
import LiveGame from './pages/LiveGame'
import GameReview from './pages/GameReview'
import PlayerStats from './pages/PlayerStats'
import TeamStats from './pages/TeamStats'
import Export from './pages/Export'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/roster" element={<Roster />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/game/:id/setup" element={<GameSetup />} />
      <Route path="/game/:id/live" element={<LiveGame />} />
      <Route path="/game/:id/review" element={<GameReview />} />
      <Route path="/stats/player/:id" element={<PlayerStats />} />
      <Route path="/stats/team" element={<TeamStats />} />
      <Route path="/export" element={<Export />} />
    </Routes>
  )
}

export default App
