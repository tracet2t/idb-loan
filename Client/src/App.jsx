import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        {/* Add your dashboard route here later */}
      </Routes>
    </BrowserRouter>
  )
}

export default App