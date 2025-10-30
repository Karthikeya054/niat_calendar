// components/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

interface University {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  university_id: string | null;
  universities?: { name: string };
}

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newUniversityId, setNewUniversityId] = useState<string>('');
  const [adding, setAdding] = useState(false);

  // New University form
  const [newUniversityName, setNewUniversityName] = useState('');
  const [creatingUniversity, setCreatingUniversity] = useState(false);

  const roles = [
    { value: 'org_admin', label: 'Organization Admin (All Access)' },
    { value: 'PM', label: 'Program Manager (University Editor)' },
    { value: 'COS', label: 'Chief of Staff (University Editor)' },
    { value: 'teacher', label: 'Teacher (Can Edit)' },
    { value: 'student', label: 'Student (Read Only)' },
    { value: 'program_ops', label: 'Program Ops' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch universities
      const { data: univData, error: univErr } = await supabase
        .from('universities')
        .select('*')
        .order('name');
      if (univErr) throw univErr;
      setUniversities(univData || []);

      // Fetch users
      const { data: userData, error: userErr } = await supabase
        .from('profiles')
        .select('*, universities(name)')
        .order('email');
      if (userErr) throw userErr;
      setUsers(userData || []);
    } catch (error: any) {
      console.error('Error fetching data in AdminPanel:', error);
      alert('Error fetching admin data: ' + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          email: newEmail.toLowerCase(),
          display_name: newName || newEmail.split('@')[0],
          role: newRole,
          university_id: newUniversityId || null,
        });

      if (error) throw error;

      alert('User added successfully! They can now login with Google.');
      setNewEmail('');
      setNewName('');
      setNewRole('student');
      setNewUniversityId('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding user:', error);
      alert('Error adding user: ' + (error.message || JSON.stringify(error)));
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      alert('User updated successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      alert('User deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Error deleting user: ' + (error.message || JSON.stringify(error)));
    }
  };

  // --- New: Create University + default calendars ---
  const handleCreateUniversity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newUniversityName.trim();
    if (!name) {
      alert('Please enter a university name.');
      return;
    }

    setCreatingUniversity(true);
    try {
    // 1) Insert university (idempotent - using onConflict name to avoid duplicates if DB supports it)
        let { data: createdUniv, error: univErr } = await supabase
            .from('universities')
            .insert({ name })
            .select('*')
            .single();
    
          if (univErr) {
            // If name uniqueness causes conflict, try to fetch the existing one
            console.warn('University insert error, attempting to fetch existing:', univErr);
            const { data: existing, error: existErr } = await supabase
              .from('universities')
              .select('*')
              .ilike('name', name)
              .limit(1)
              .single();
            if (existErr) throw univErr; // throw original if cannot fetch
    
            // set createdUniv fallback
            createdUniv = existing as any;
        }
    
        const uniId = (createdUniv as any)?.id;
        if (!uniId) throw new Error('Failed to create or locate university');
    
      if (!uniId) throw new Error('Failed to create or locate university');

      // 2) Create default calendars for the new university (academic + event)
      // Try academic calendar insert (if not exists)
      const { error: acadErr } = await supabase
        .from('calendars')
        .insert({
          name: `${name} - Academic Calendar`,
          description: `Academic calendar for ${name}`,
          category: 'academic',
          university_id: uniId,
          is_public: false,
        })
        .select();

      if (acadErr) {
        // log but continue — sometimes policies or conflicts prevent it
        console.warn('Academic calendar insert returned error:', acadErr);
      }

      // Try events calendar insert
      const { error: eventErr } = await supabase
        .from('calendars')
        .insert({
          name: `${name} - Events Calendar`,
          description: `Events calendar for ${name}`,
          category: 'event',
          university_id: uniId,
          is_public: false,
        })
        .select();

      if (eventErr) {
        console.warn('Events calendar insert returned error:', eventErr);
      }

      alert(`University "${name}" created successfully.`);
      setNewUniversityName('');
      // refresh lists
      fetchData();
    } catch (error: any) {
      console.error('Error creating university:', error);
      alert('Error creating university: ' + (error.message || JSON.stringify(error)));
    } finally {
      setCreatingUniversity(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">👥 User Management Panel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create University */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🏫 Create New University</h3>
            <form onSubmit={handleCreateUniversity} className="flex flex-col md:flex-row gap-3 items-start">
              <input
                type="text"
                value={newUniversityName}
                onChange={(e) => setNewUniversityName(e.target.value)}
                placeholder="University Name (e.g. New University)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={creatingUniversity}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {creatingUniversity ? 'Creating...' : '➕ Create University'}
              </button>
            </form>
            <p className="mt-3 text-sm text-gray-600">This will create a new university row and add default Academic & Events calendars.</p>
          </div>

          {/* Add New User Form */}
          <div className="bg-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">➕ Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@nxtwave.co.in"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {roles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <select
                    value={newUniversityId}
                    onChange={(e) => setNewUniversityId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No University (Org Admin)</option>
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={adding}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {adding ? 'Adding...' : '➕ Add User'}
              </button>
            </form>
          </div>

          {/* Users List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Existing Users ({users.length})</h3>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">University</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.display_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            {roles.map(r => (
                              <option key={r.value} value={r.value}>{r.value}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={user.university_id || ''}
                            onChange={(e) => handleUpdateUser(user.id, { university_id: e.target.value || null })}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">None</option>
                            {universities.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
