import { Routes, Route } from 'react-router-dom'

function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="font-display text-6xl text-accent tracking-widest">
        Starting Lineup
      </h1>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
