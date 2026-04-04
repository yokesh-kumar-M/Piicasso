import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ModeContext } from '../context/ModeContext';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import {
    User, Heart, Briefcase, MapPin, Film, CreditCard,
    Shield, Check, Hash, Zap, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const CATEGORIES = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'family', label: 'Family', icon: Heart },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'interests', label: 'Interests', icon: Film },
    { id: 'assets', label: 'Assets', icon: CreditCard },
];

const FIELDS = {
    identity: [
        { name: 'full_name', label: 'Full Name', placeholder: 'ex: JOHN DOE' },
        { name: 'dob', label: 'Birth Year', placeholder: 'ex: 1990' },
        { name: 'phone_digits', label: 'Phone', placeholder: 'ex: 9876' },
        { name: 'username', label: 'Username', placeholder: 'ex: jdoe99' },
        { name: 'email', label: 'Email', placeholder: 'ex: jdoe@mail' },
        { name: 'ssn_last4', label: 'SSN Last 4', placeholder: 'ex: 1234' },
        { name: 'blood_type', label: 'Blood', placeholder: 'ex: O+' },
        { name: 'height', label: 'Height (cm)', placeholder: 'ex: 180' }
    ],
    family: [
        { name: 'spouse_name', label: 'Spouse', placeholder: 'ex: JANE' },
        { name: 'child_names', label: 'Children', placeholder: 'ex: TOM' },
        { name: 'pet_names', label: 'Pets', placeholder: 'ex: REX' },
        { name: 'mother_maiden', label: "Mother's Maiden", placeholder: 'ex: SMITH' },
        { name: 'father_name', label: "Father's Name", placeholder: 'ex: ROBERT' },
        { name: 'sibling_names', label: 'Siblings', placeholder: 'ex: MARY' },
        { name: 'best_friend', label: 'Best Friend', placeholder: 'ex: MIKE' }
    ],
    work: [
        { name: 'company', label: 'Company', placeholder: 'ex: ACME' },
        { name: 'job_title', label: 'Job Title', placeholder: 'ex: ENGINEER' },
        { name: 'department', label: 'Department', placeholder: 'ex: R&D' },
        { name: 'employee_id', label: 'Emp ID', placeholder: 'ex: E-4421' },
        { name: 'boss_name', label: 'Manager', placeholder: 'ex: MR. SMITH' },
        { name: 'past_company', label: 'Past Co.', placeholder: 'ex: GLOBEX' },
        { name: 'university', label: 'University', placeholder: 'ex: MIT' },
        { name: 'degree', label: 'Degree', placeholder: 'ex: CS' }
    ],
    location: [
        { name: 'current_city', label: 'Current City', placeholder: 'ex: NYC' },
        { name: 'hometown', label: 'Hometown', placeholder: 'ex: DETROIT' },
        { name: 'street_name', label: 'Street', placeholder: 'ex: MAIN ST' },
        { name: 'zip_code', label: 'Zip', placeholder: 'ex: 10001' },
        { name: 'state', label: 'State', placeholder: 'ex: NY' },
        { name: 'country', label: 'Country', placeholder: 'ex: USA' },
        { name: 'vacation_spot', label: 'Vacation', placeholder: 'ex: HAWAII' }
    ],
    interests: [
        { name: 'sports_team', label: 'Sports', placeholder: 'ex: LAKERS' },
        { name: 'musician', label: 'Musician', placeholder: 'ex: NIRVANA' },
        { name: 'movies', label: 'Movies', placeholder: 'ex: MATRIX' },
        { name: 'hobbies', label: 'Hobbies', placeholder: 'ex: CHESS' },
        { name: 'books', label: 'Books', placeholder: 'ex: 1984' },
        { name: 'games', label: 'Games', placeholder: 'ex: COD' },
        { name: 'food', label: 'Food', placeholder: 'ex: PIZZA' }
    ],
    assets: [
        { name: 'car_model', label: 'Car Model', placeholder: 'ex: MODEL 3' },
        { name: 'license_plate', label: 'Plate', placeholder: 'ex: ABC-123' },
        { name: 'bank_name', label: 'Bank Name', placeholder: 'ex: CHASE' },
        { name: 'brand_affinity', label: 'Brands', placeholder: 'ex: APPLE' },
        { name: 'device_type', label: 'Device', placeholder: 'ex: IPHONE' },
        { name: 'crypto_wallet', label: 'Crypto', placeholder: 'ex: 0x...' },
        { name: 'subscription', label: 'Subs', placeholder: 'ex: NETFLIX' }
    ]
};

const TargetForm = ({ onFormUpdate }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const { mode } = useContext(ModeContext);
    const isSecurityMode = mode === 'security';
    const navigate = useNavigate();

    const [selectedCategory, setSelectedCategory] = useState('identity');
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const newData = { ...formData, [e.target.name]: e.target.value };
        setFormData(newData);
        if (onFormUpdate) onFormUpdate(newData);
    };

    const getFieldCompletion = (catId) => {
        const fields = FIELDS[catId];
        const filled = fields.filter(f => formData[f.name] && formData[f.name].length > 0).length;
        return (filled / fields.length) * 100;
    };

    const handleSubmit = async () => {
        if (!isAuthenticated) return navigate('/login');
        setLoading(true);
        setError(null);
        try {
            const payload = { ...formData };
            if (Object.keys(payload).length === 0) throw new Error("INSUFFICIENT DATA");

            const res = await axiosInstance.post('submit/', payload);
            if (res.status === 201) {
                sessionStorage.setItem('generatedWordlist', JSON.stringify(res.data.wordlist));
                sessionStorage.setItem('historyId', res.data.id);
                navigate('/result');
            }
        } catch (err) {
            setError(err.message || 'PROCESS FAILED');
        } finally {
            setLoading(false);
        }
    };

    const theme = {
        accentText: isSecurityMode ? 'text-security-red' : 'text-user-cobalt',
        accentBg: isSecurityMode ? 'bg-security-red' : 'bg-user-cobalt',
        accentGlow: isSecurityMode ? 'shadow-[0_0_15px_rgba(229,9,20,0.6)]' : 'shadow-[0_0_15px_rgba(37,99,235,0.6)]',
        inputBg: isSecurityMode ? 'bg-black/50 focus:bg-zinc-900/80 border-zinc-800 focus:border-security-red' : 'bg-white/5 focus:bg-white/10 border-white/10 focus:border-user-cobalt',
        btnHover: isSecurityMode ? 'hover:bg-red-700' : 'hover:bg-blue-600',
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Top Navigation Tabs */}
            <div className={`flex overflow-x-auto custom-scrollbar border-b ${isSecurityMode ? 'border-zinc-800' : 'border-white/10'} shrink-0 bg-black/40 backdrop-blur-md`}>
                {CATEGORIES.map((cat) => {
                    const completion = getFieldCompletion(cat.id);
                    const isSelected = selectedCategory === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex-1 min-w-[80px] p-3 border-r ${isSecurityMode ? 'border-zinc-800' : 'border-white/10'} relative flex flex-col items-center justify-center gap-1.5 transition-all ${isSelected ? (isSecurityMode ? 'bg-zinc-900' : 'bg-white/10') : 'hover:bg-white/5'}`}
                        >
                            {isSelected && (
                                <motion.div layoutId="navTab" className={`absolute top-0 left-0 w-full h-0.5 ${theme.accentBg} ${theme.accentGlow}`} />
                            )}
                            <cat.icon className={`w-4 h-4 ${isSelected ? theme.accentText : 'text-gray-500'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-500'}`}>{cat.label}</span>
                            
                            {/* Tiny progress dot indicator */}
                            <div className="w-full max-w-[30px] h-0.5 bg-black/50 mt-1 rounded-full overflow-hidden">
                                <div className={`h-full ${completion > 0 ? theme.accentBg : 'bg-transparent'}`} style={{ width: `${completion}%` }} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Input Canvas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative bg-gradient-to-b from-black/20 to-black/60">
                <AnimatePresence mode="wait">
                    {selectedCategory && (
                        <motion.div
                            key={selectedCategory}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {FIELDS[selectedCategory].map((field) => (
                                <div key={field.name} className="group relative">
                                    <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-widest font-mono flex items-center gap-1.5 ${isSecurityMode ? 'text-security-red/80' : 'text-user-cobalt/80'}`}>
                                        <Hash className="w-3 h-3 opacity-60" /> {field.label}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name={field.name}
                                            value={formData[field.name] || ''}
                                            onFocus={(e) => e.target.select()}
                                            onChange={handleInputChange}
                                            placeholder={field.placeholder}
                                            className={`w-full text-white text-xs font-mono placeholder-gray-700 outline-none transition-all rounded-md px-3 py-2.5 border ${theme.inputBg}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Submit Area */}
            <div className={`p-4 border-t ${isSecurityMode ? 'border-zinc-800 bg-black/80' : 'border-white/10 bg-black/40'} shrink-0 backdrop-blur-xl flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${isSecurityMode ? 'text-green-500' : 'text-user-cobalt'}`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Target Ready</span>
                </div>
                
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`px-6 py-2.5 rounded-md font-bold font-mono text-[10px] uppercase tracking-widest text-white transition-all flex items-center gap-2 ${theme.accentBg} ${theme.btnHover} ${theme.accentGlow}`}
                >
                    {loading ? <Zap className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    {loading ? 'Processing...' : 'Run Extraction'}
                </button>
            </div>
            {error && <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-red-900/90 text-white text-xs px-4 py-1 rounded shadow-xl border border-red-500">{error}</div>}
        </div>
    );
};

export default TargetForm;