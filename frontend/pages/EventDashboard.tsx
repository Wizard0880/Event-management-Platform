import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users } from 'lucide-react';

interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  category: string;
  location: string;
  attendees: string[];
}

const EventDashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const { socket } = useSocket();
  const { user } = useAuth(); // ✅ Added authentication check

  useEffect(() => {
    fetchEvents();
  }, [category, startDate]);

  useEffect(() => {
    if (socket) {
      socket.on('attendeeUpdate', ({ eventId, attendeeCount }) => {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === eventId
              ? { ...event, attendees: new Array(attendeeCount).fill('') }
              : event
          )
        );
      });
    }
  }, [socket]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (startDate) params.append('startDate', startDate);

      const response = await axios.get(`http://localhost:3000/api/events?${params}`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const joinEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/events/${eventId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchEvents();
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Categories</option>
          <option value="conference">Conference</option>
          <option value="workshop">Workshop</option>
          <option value="social">Social</option>
          <option value="other">Other</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
              <p className="text-gray-600 mb-4">{event.description}</p>

              <div className="flex items-center space-x-2 text-gray-500 mb-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(event.date), 'PPP')}</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 mb-4">
                <Users className="h-4 w-4" />
                <span>{event.attendees.length} attendees</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">
                  {event.category}
                </span>
                <button
                  onClick={() => joinEvent(event._id)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  {user?.isGuest ? 'Join as Guest' : 'Join Event'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDashboard;
