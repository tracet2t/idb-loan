import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Briefcase, Phone, GraduationCap, MapPin, Lock, Save } from 'lucide-react';

const MyProfile = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        designation: '',
        email: '',
        phone: '',
        qualification: '',
        address: '',
        password: '', // Leave blank unless changing
        username: '', // Read-only
        role: ''      // Read-only
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch user data on load
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('http://localhost:5000/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setFormData({
                    fullName: data.profile?.fullName || '',
                    designation: data.profile?.designation || '',
                    email: data.email || '',
                    phone: data.profile?.phone || '',
                    qualification: data.profile?.studies || '', // Map 'studies' back to 'qualification'
                    address: data.profile?.address || '',
                    username: data.username,
                    role: data.role,
                    password: ''
                });
                setLoading(false);
            } catch (error) {
               console.error("Profile Load Error:", error); 
               setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load profile.' });
               setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        
        try {
            const token = localStorage.getItem('token');
            await axios.patch('http://localhost:5000/api/users/me', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
        // We use 'err' here to satisfy the ESLint rule you saw earlier
        const errorMsg = err.response?.data?.message || 'Update failed.';
        setMessage({ type: 'error', text: errorMsg }); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                <p className="text-gray-500 text-sm">View and update your account information.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Info (Read-Only Section) */}
                <div className="bg-gray-50/50 p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <User size={16} /> <span className="font-semibold text-gray-700">Edit Profile</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        Username <span className="font-bold">({formData.username})</span> and role 
                        <span className="font-bold"> ({formData.role})</span> cannot be changed here.
                    </p>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <User size={14} /> Full Name
                        </label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {/* Designation */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Briefcase size={14} /> Designation
                        </label>
                        <input type="text" name="designation" value={formData.designation} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Mail size={14} /> Email Address
                        </label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Phone size={14} /> Phone Number
                        </label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {/* Qualification */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <GraduationCap size={14} /> Highest Qualification
                        </label>
                        <input type="text" name="qualification" value={formData.qualification} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <MapPin size={14} /> Official Address
                        </label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {/* New Password */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Lock size={14} /> New Password
                        </label>
                        <input type="password" name="password" placeholder="Leave blank to keep current password"
                            value={formData.password} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                </div>

                {/* Footer / Submit */}
                <div className="bg-gray-50 p-6 flex items-center justify-between">
                    <div>
                        {message.text && (
                            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                    <button type="submit" 
                        className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-800 transition-all font-semibold shadow-md">
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MyProfile;