import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import Home from './pages/Home'
import Schema from './pages/Schema'
import Exercises from './pages/Exercises'
import History from './pages/History'
import './App.css'

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false)

  return (
    <AuthProvider>
      <div className="app">
        <Navbar onLoginClick={() => setAuthModalOpen(true)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/schema" element={<Schema />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>
            🇧🇯 Python Bénin – SQL 101 &nbsp;|&nbsp;
            Playground via{' '}
            <a href="https://sql.js.org" target="_blank" rel="noreferrer">SQL.js</a>
            {' '}(SQLite en mémoire)
          </p>
        </footer>

        {authModalOpen && (
          <AuthModal onClose={() => setAuthModalOpen(false)} />
        )}
      </div>
    </AuthProvider>
  )
}

export default App

