import React from 'react';
import { Users, Plus, MessageSquare } from 'lucide-react';

const Collaboration = () => {
  // Mock data for now
  const groups = [
    {
      id: 1,
      name: 'System Analysis Project',
      members: 5,
      description: 'Main capstone project group',
      lastActivity: '2 hours ago'
    },
    {
      id: 2,
      name: 'Database Study Group',
      members: 8,
      description: 'Weekly study sessions for DBMS',
      lastActivity: '1 day ago'
    },
    {
      id: 3,
      name: 'Programming Practice',
      members: 12,
      description: 'Collaborative coding exercises',
      lastActivity: '3 days ago'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Collaboration Groups</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition">
          <Plus className="w-5 h-5" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div key={group.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-gray-800">{group.name}</h3>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">{group.description}</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                👥 {group.members} members
              </span>
              <span className="text-gray-500">
                {group.lastActivity}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-primary text-white rounded hover:bg-blue-600 transition text-sm">
                View Group
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon</h3>
        <p className="text-blue-800">
          Full collaboration features including real-time chat, file sharing, and task assignment will be available soon!
        </p>
      </div>
    </div>
  );
};

export default Collaboration;