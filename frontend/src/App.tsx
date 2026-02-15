import { Routes, Route } from 'react-router-dom';
import Login from './pages/LoginForm';
import Home from './pages/Home';
import Header from './components/Header';
import { AuthProvider } from './components/AuthContext'; 

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </AuthProvider>
  );
}
