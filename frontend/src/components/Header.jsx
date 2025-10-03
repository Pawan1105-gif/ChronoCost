import { Link, useNavigate } from 'react-router-dom'
import { account } from '../utils/appwrite'

function Header({ user, setUser }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await account.deleteSession('current')
      setUser(null)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-gradient-to-r from-[#110000] via-[#200101] to-[#330000] shadow-lg border-b border-red-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <span className="h-8 w-8 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 text-white rounded font-bold shadow-lg">C</span>
            <Link to="/" className="text-2xl font-bold text-white">ChronoCost</Link>
          </div>
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-white hover:text-gray-200">Dashboard</Link>
                <Link to="/projects" className="text-white hover:text-gray-200">Projects</Link>
                <Link to="/profile" className="text-white hover:text-gray-200">Profile</Link>
                <button onClick={handleLogout} className="btn bg-white text-gradient-end hover:bg-gray-100">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn bg-white text-gradient-end hover:bg-gray-100">Login</Link>
                <Link to="/signup" className="btn border-2 border-white text-white hover:bg-white/10">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header