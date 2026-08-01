import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Console } from './routes/Console'
import { DisplayView } from './routes/DisplayView'
import { transport } from './transport/instance'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DisplayView transport={transport} />} />
        <Route path="/admin" element={<Console transport={transport} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
