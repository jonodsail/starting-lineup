// League rosters were checked against official 2026 league directories. Keeping
// the full lists here prevents the alumni search from depending on editorial cards.
const leagueOrganizations = {
  MLB: [
    'Arizona Diamondbacks', 'Athletics', 'Atlanta Braves', 'Baltimore Orioles',
    'Boston Red Sox', 'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds',
    'Cleveland Guardians', 'Colorado Rockies', 'Detroit Tigers', 'Houston Astros',
    'Kansas City Royals', 'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins',
    'Milwaukee Brewers', 'Minnesota Twins', 'New York Mets', 'New York Yankees',
    'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres',
    'San Francisco Giants', 'Seattle Mariners', 'St. Louis Cardinals',
    'Tampa Bay Rays', 'Texas Rangers', 'Toronto Blue Jays', 'Washington Nationals',
  ],
  NFL: [
    'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
    'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
    'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
    'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
    'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
    'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
    'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
    'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders',
  ],
  NBA: [
    'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
    'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets',
    'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
    'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat',
    'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
    'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns',
    'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors',
    'Utah Jazz', 'Washington Wizards',
  ],
  NHL: [
    'Anaheim Ducks', 'Boston Bruins', 'Buffalo Sabres', 'Calgary Flames',
    'Carolina Hurricanes', 'Chicago Blackhawks', 'Colorado Avalanche',
    'Columbus Blue Jackets', 'Dallas Stars', 'Detroit Red Wings', 'Edmonton Oilers',
    'Florida Panthers', 'Los Angeles Kings', 'Minnesota Wild', 'Montréal Canadiens',
    'Nashville Predators', 'New Jersey Devils', 'New York Islanders', 'New York Rangers',
    'Ottawa Senators', 'Philadelphia Flyers', 'Pittsburgh Penguins', 'San Jose Sharks',
    'Seattle Kraken', 'St. Louis Blues', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
    'Utah Mammoth', 'Vancouver Canucks', 'Vegas Golden Knights', 'Washington Capitals',
    'Winnipeg Jets',
  ],
  MLS: [
    'Atlanta United', 'Austin FC', 'Charlotte FC', 'Chicago Fire FC', 'FC Cincinnati',
    'Colorado Rapids', 'Columbus Crew', 'D.C. United', 'FC Dallas', 'Houston Dynamo FC',
    'Sporting Kansas City', 'LA Galaxy', 'Los Angeles Football Club', 'Inter Miami CF',
    'Minnesota United FC', 'CF Montréal', 'Nashville SC', 'New England Revolution',
    'Red Bull New York', 'New York City Football Club', 'Orlando City',
    'Philadelphia Union', 'Portland Timbers', 'Real Salt Lake', 'San Diego FC',
    'San Jose Earthquakes', 'Seattle Sounders FC', 'St. Louis CITY SC', 'Toronto FC',
    'Vancouver Whitecaps FC',
  ],
  WNBA: [
    'Atlanta Dream', 'Chicago Sky', 'Connecticut Sun', 'Dallas Wings',
    'Golden State Valkyries', 'Indiana Fever', 'Las Vegas Aces', 'Los Angeles Sparks',
    'Minnesota Lynx', 'New York Liberty', 'Phoenix Mercury', 'Portland Fire',
    'Seattle Storm', 'Toronto Tempo', 'Washington Mystics',
  ],
  NWSL: [
    'Angel City FC', 'Bay FC', 'Boston Legacy FC', 'Chicago Stars FC',
    'Denver Summit FC', 'Gotham FC', 'Houston Dash', 'Kansas City Current',
    'North Carolina Courage', 'Orlando Pride', 'Portland Thorns FC',
    'Racing Louisville FC', 'San Diego Wave FC', 'Seattle Reign FC',
    'Utah Royals FC', 'Washington Spirit',
  ],
}

export const majorLeagueOrganizations = Object.values(leagueOrganizations).flat()

const aliasGroups = [
  ['Prime Video & Amazon MGM Studios', 'Prime Video', 'Amazon Prime Video', 'Amazon Prime Video Sports', 'Amazon MGM Studios'],
  ['Arctos Partners', 'Arctos'],
  ['CAA Sports', 'Creative Artists Agency', 'CAA'],
  ['Madison Square Garden Sports', 'MSG Sports', 'Madison Square Garden Sports Corp'],
  ['BSE Global', 'Brooklyn Sports & Entertainment'],
  ['LA Clippers', 'Los Angeles Clippers'],
  ['Los Angeles Football Club', 'LAFC'],
  ['New York City Football Club', 'New York City FC', 'NYCFC'],
  ['Red Bull New York', 'New York Red Bulls'],
  ['Montréal Canadiens', 'Montreal Canadiens'],
  ['CF Montréal', 'CF Montreal'],
  ['St. Louis CITY SC', 'St Louis City SC'],
]

function normalizeOrganization(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const aliasLookup = new Map()
const aliasesByCanonical = new Map()

aliasGroups.forEach(([canonical, ...aliases]) => {
  const group = [canonical, ...aliases]
  aliasesByCanonical.set(canonical, group)
  group.forEach(alias => aliasLookup.set(normalizeOrganization(alias), canonical))
})

export function canonicalizeOrganization(value = '') {
  return aliasLookup.get(normalizeOrganization(value)) || value.trim()
}

export function organizationsMatch(left, right) {
  const a = normalizeOrganization(canonicalizeOrganization(left))
  const b = normalizeOrganization(canonicalizeOrganization(right))
  return a === b || (Math.min(a.length, b.length) > 5 && (a.includes(b) || b.includes(a)))
}

export function organizationSearchText(value = '') {
  const canonical = canonicalizeOrganization(value)
  return (aliasesByCanonical.get(canonical) || [canonical]).join(' ').toLowerCase()
}
