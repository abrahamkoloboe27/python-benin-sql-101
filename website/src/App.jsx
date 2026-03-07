import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Schema from './pages/Schema'
import Exercises from './pages/Exercises'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schema" element={<Schema />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>
          🇧🇯 Python Bénin – SQL 101 &nbsp;|&nbsp;
          Base de données en mémoire via{' '}
          <a href="https://sql.js.org" target="_blank" rel="noreferrer">SQL.js</a> (SQLite)
        </p>
      </footer>
    </div>
  )
}

export default App
