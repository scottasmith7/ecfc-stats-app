export const POSITIONS = {
  GK: { label: 'GK', color: 'bg-pos-gk text-black', name: 'Goalkeeper' },
  DEF: { label: 'DEF', color: 'bg-pos-def text-white', name: 'Defender' },
  MID: { label: 'MID', color: 'bg-pos-mid text-black', name: 'Midfielder' },
  FWD: { label: 'FWD', color: 'bg-pos-fwd text-white', name: 'Forward' }
}

export const STAT_TYPES = {
  // Passing
  pass_complete: { label: 'Pass ✓', category: 'passing', abbrev: 'P+' },
  pass_incomplete: { label: 'Pass ✗', category: 'passing', abbrev: 'P-' },
  cross_complete: { label: 'Cross ✓', category: 'passing', abbrev: 'X+' },
  cross_incomplete: { label: 'Cross ✗', category: 'passing', abbrev: 'X-' },
  key_pass: { label: 'Key Pass', category: 'passing', abbrev: 'KP' },
  assist: { label: 'Assist', category: 'passing', abbrev: 'A' },
  chance_created: { label: 'Chance', category: 'passing', abbrev: 'CC' },

  // Shooting
  shot_on_target: { label: 'Shot On', category: 'shooting', abbrev: 'SO' },
  shot_off_target: { label: 'Shot Off', category: 'shooting', abbrev: 'SM' },
  goal: { label: '⚽ GOAL', category: 'shooting', abbrev: 'G' },

  // Dribbling
  takeon_success: { label: 'Take-on ✓', category: 'dribbling', abbrev: 'TO+' },
  takeon_fail: { label: 'Take-on ✗', category: 'dribbling', abbrev: 'TO-' },

  // Defending
  tackle: { label: 'Tackle', category: 'defending', abbrev: 'T' },
  interception: { label: 'Intercept', category: 'defending', abbrev: 'I' },
  clearance: { label: 'Clear', category: 'defending', abbrev: 'C' },
  header: { label: 'Header', category: 'defending', abbrev: 'H' },

  // Goalkeeper
  save: { label: 'Save', category: 'goalkeeper', abbrev: 'SV' },
  goal_against: { label: 'Goal Against', category: 'goalkeeper', abbrev: 'GA' },

  // Other
  possession_lost: { label: 'Poss Lost', category: 'other', abbrev: 'PL' },
  foul: { label: 'Foul', category: 'other', abbrev: 'F' },
  opponent_foul: { label: 'Opp Foul', category: 'other', abbrev: 'OF' },
  opponent_pass: { label: 'Opp Pass', category: 'other', abbrev: 'OP' }
}

export const STAT_CATEGORIES = {
  passing: {
    label: 'PASSING',
    stats: ['pass_complete', 'pass_incomplete', 'cross_complete', 'cross_incomplete', 'key_pass', 'assist', 'chance_created'],
    btnClass: 'stat-btn-pass'
  },
  shooting: {
    label: 'SHOOTING',
    stats: ['shot_on_target', 'shot_off_target', 'goal'],
    btnClass: 'stat-btn-shoot'
  },
  dribbling: {
    label: 'DRIBBLING',
    stats: ['takeon_success', 'takeon_fail'],
    btnClass: 'stat-btn-dribble'
  },
  defending: {
    label: 'DEFENDING',
    stats: ['tackle', 'interception', 'clearance', 'header'],
    btnClass: 'stat-btn-defend'
  },
  goalkeeper: {
    label: 'GK',
    stats: ['save', 'goal_against'],
    btnClass: 'stat-btn-gk'
  },
  other: {
    label: 'OTHER',
    stats: ['possession_lost', 'foul', 'opponent_foul', 'opponent_pass'],
    btnClass: 'stat-btn-other'
  }
}

export const GAME_STATUS = {
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed'
}

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}
