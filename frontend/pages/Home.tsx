import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTileClick = (action: string) => {
    switch (action) {
      case 'create':
        navigate('/create-event');
        break;
      case 'join':
        navigate('/dashboard');
        break;
      case 'updates':
        navigate('/dashboard');
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to EventHub
        </h1>
        <p className="text-xl text-gray-600">
          Create, manage, and join events with real-time updates
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* ✅ Only show "Create Events" if the user is not a guest */}
        {!user?.isGuest && (
          <div
            onClick={() => handleTileClick('create')}
            className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer transform transition-transform hover:scale-105"
          >
            <Calendar className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Create Events</h3>
            <p className="text-gray-600">
              Easily create and manage your events with our intuitive interface
            </p>
          </div>
        )}

        <div
          onClick={() => handleTileClick('join')}
          className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer transform transition-transform hover:scale-105"
        >
          <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Join Events</h3>
          <p className="text-gray-600">
            Discover and participate in events that interest you
          </p>
        </div>

        <div
          onClick={() => handleTileClick('updates')}
          className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer transform transition-transform hover:scale-105"
        >
          <Clock className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
          <p className="text-gray-600">
            Stay informed with live attendee updates and event changes
          </p>
        </div>
      </div>

      {!user && (
        <div className="text-center">
          <Link
            to="/register"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 mr-4"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="inline-block bg-gray-200 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-300"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
