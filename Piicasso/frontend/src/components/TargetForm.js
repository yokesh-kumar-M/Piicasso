import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import {
    User, Heart, Briefcase, MapPin, Film, CreditCard,
    Shield, Check, Hash, Zap, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Configuration ---
const CATEGORIES = [
    {
        id: 'identity',
        label: 'Identity',
        subtext: 'Primary Subject Data',
        icon: User,
        color: 'text-blue-500',
        borderColor: 'border-blue-500/50',
        bgGradient: 'from-blue-900/20'
    },
    {
        id: 'family',
        label: 'Family',
        subtext: 'Kinship & Associations',
        icon: Heart,
        color: 'text-pink-500',
        borderColor: 'border-pink-500/50',
        bgGradient: 'from-pink-900/20'
    },
    {
        id: 'work',
        label: 'Work',
        subtext: 'Employment & Education',
        icon: Briefcase,
        color: 'text-amber-500',
        borderColor: 'border-amber-500/50',
        bgGradient: 'from-amber-900/20'
    },
    {
        id: 'location',
        label: 'Location',
        subtext: 'Movement Patterns',
        icon: MapPin,
        color: 'text-emerald-500',
        borderColor: 'border-emerald-500/50',
        bgGradient: 'from-emerald-900/20'
    },
    {
        id: 'interests',
        label: 'Interests',
        subtext: 'Likes & Preferences',
        icon: Film,
        color: 'text-purple-500',
        borderColor: 'border-purple-500/50',
        bgGradient: 'from-purple-900/20'
    },
    {
        id: 'assets',
        label: 'Assets',
        subtext: 'Ownership & Status',
        icon: CreditCard,
        color: 'text-cyan-500',
        borderColor: 'border-cyan-500/50',
        bgGradient: 'from-cyan-900/20'
    },
];

const FIELDS = {
    identity: [
        { name: 'full_name', label: 'Full Name', placeholder: 'ex: JOHN DOE' },
        { name: 'dob', label: 'Birth Year', placeholder: 'ex: 1990' },
        { name: 'phone_digits', label: 'Phone Number', placeholder: 'ex: 9876' },
        { name: 'username', label: 'Username', placeholder: 'ex: jdoe99' },
        { name: 'email', label: 'Email', placeholder: 'ex: jdoe@gmail.com' },
        { name: 'ssn_last4', label: 'SSN Last 4', placeholder: 'ex: 1234' },
        { name: 'blood_type', label: 'Blood Type', placeholder: 'ex: O+' },
        { name: 'height', label: 'Height (cm)', placeholder: 'ex: 180' }
    ],
    family: [
        { name: 'spouse_name', label: 'Spouse/Partner', placeholder: 'ex: JANE' },
        { name: 'child_names', label: 'Children', placeholder: 'ex: TOM, JERRY' },
        { name: 'pet_names', label: 'Pets', placeholder: 'ex: REX' },
        { name: 'mother_maiden', label: "Mother's Maiden Name", placeholder: 'ex: SMITH' },
        { name: 'father_name', label: "Father's Name", placeholder: 'ex: ROBERT' },
        { name: 'sibling_names', label: 'Siblings', placeholder: 'ex: MARY, DAN' },
        { name: 'best_friend', label: 'Best Friend', placeholder: 'ex: MIKE' }
    ],
    work: [
        { name: 'company', label: 'Company Name', placeholder: 'ex: ACME INC' },
        { name: 'job_title', label: 'Job Title', placeholder: 'ex: ENGINEER' },
        { name: 'department', label: 'Department', placeholder: 'ex: R&D' },
        { name: 'employee_id', label: 'Employee ID', placeholder: 'ex: E-4421' },
        { name: 'boss_name', label: 'Manager/Boss', placeholder: 'ex: MR. SMITH' },
        { name: 'past_company', label: 'Past Company', placeholder: 'ex: GLOBEX' },
        { name: 'university', label: 'University', placeholder: 'ex: MIT' },
        { name: 'degree', label: 'Degree', placeholder: 'ex: CS' }
    ],
    location: [
        { name: 'current_city', label: 'Current City', placeholder: 'ex: NEW YORK' },
        { name: 'hometown', label: 'Hometown', placeholder: 'ex: DETROIT' },
        { name: 'street_name', label: 'Street Name', placeholder: 'ex: MAIN ST' },
        { name: 'zip_code', label: 'Zip Code', placeholder: 'ex: 10001' },
        { name: 'state', label: 'State', placeholder: 'ex: NY' },
        { name: 'country', label: 'Country', placeholder: 'ex: USA' },
        { name: 'vacation_spot', label: 'Vacation Spot', placeholder: 'ex: HAWAII' }
    ],
    interests: [
        { name: 'sports_team', label: 'Sports Team', placeholder: 'ex: LAKERS' },
        { name: 'musician', label: 'Musician/Band', placeholder: 'ex: NIRVANA' },
        { name: 'movies', label: 'Favorite Movies', placeholder: 'ex: MATRIX' },
        { name: 'hobbies', label: 'Hobbies', placeholder: 'ex: CHESS' },
        { name: 'books', label: 'Books', placeholder: 'ex: 1984' },
        { name: 'games', label: 'Video Games', placeholder: 'ex: COD' },
        { name: 'food', label: 'Favorite Food', placeholder: 'ex: PIZZA' }
    ],
    assets: [
        { name: 'car_model', label: 'Car Model', placeholder: 'ex: MODEL 3' },
        { name: 'license_plate', label: 'License Plate', placeholder: 'ex: ABC-123' },
        { name: 'bank_name', label: 'Bank Name', placeholder: 'ex: CHASE' },
        { name: 'brand_affinity', label: 'Brand Affinity', placeholder: 'ex: APPLE' },
        { name: 'device_type', label: 'Device Type', placeholder: 'ex: IPHONE 15' },
        { name: 'crypto_wallet', label: 'Crypto Wallet', placeholder: 'ex: 0x...' },
        { name: 'subscription', label: 'Subscriptions', placeholder: 'ex: NETFLIX' }
    ]
};

const TargetForm = ({ onFormUpdate }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial load
    useEffect(() => {
        setSelectedCategory('identity');
    }, []);

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
            if (Object.keys(payload).length === 0) throw new Error("INSUFFICIENT DATA POINTS");

            const res = await axiosInstance.post('submit-pii/', payload);
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

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Header / Stats Bar - Removed redundant block */}


            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

                {/* 1. Category Sidebar (The "Modules") */}
                <div className="w-full md:w-1/4 flex md:flex-col bg-[#0f0f0f] overflow-x-auto md:overflow-x-hidden md:overflow-y-auto border-b md:border-b-0 md:border-r border-zinc-900 custom-scrollbar shrink-0">
                    {CATEGORIES.map((cat) => {
                        const completion = getFieldCompletion(cat.id);
                        const isSelected = selectedCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`min-w-[130px] md:w-full text-left p-3 md:p-4 border-r md:border-r-0 md:border-b border-zinc-900 relative group transition-all duration-300 flex-shrink-0 ${isSelected ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'
                                    }`}
                            >
                                {/* Active Indicator Bar */}
                                {isSelected && (
                                    <motion.div
                                        layoutId="activeBar"
                                        className="absolute left-0 bottom-0 top-auto md:top-0 md:bottom-auto w-full md:w-1 h-1 md:h-full bg-netflix-red shadow-[0_0_10px_rgba(229,9,20,0.8)]"
                                    />
                                )}

                                <div className="flex justify-between items-start mb-1">
                                    <cat.icon className={`w-4 h-4 ${isSelected ? cat.color : 'text-gray-600 group-hover:text-gray-400'}`} />
                                    {completion > 0 && <span className="text-[10px] font-bold text-green-500">{Math.round(completion)}%</span>}
                                </div>
                                <div className={`font-bold text-xs tracking-wider transition-colors ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                    {cat.label}
                                </div>
                                <div className="text-[9px] text-gray-600 uppercase mt-1 truncate">
                                    {cat.subtext}
                                </div>

                                {/* Mini Progress Bar */}
                                <div className="h-[2px] w-full bg-zinc-800 mt-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${isSelected ? 'bg-netflix-red' : 'bg-gray-700'}`}
                                        style={{ width: `${completion}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 2. Input Canvas (The "Interactive Panel") */}
                <div className="flex-1 bg-black relative flex flex-col">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                    {selectedCategory && (
                        <motion.div
                            key={selectedCategory}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 p-6 z-10 overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex items-end gap-3 mb-8 border-b border-zinc-800 pb-4">
                                <h2 className="text-2xl font-bold font-heading tracking-widest text-white flex gap-2 items-center">
                                    {/* Find icon dynamically */}
                                    {(() => {
                                        const CatIcon = CATEGORIES.find(c => c.id === selectedCategory).icon;
                                        return <CatIcon className="w-8 h-8 text-netflix-red" />;
                                    })()}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                        {CATEGORIES.find(c => c.id === selectedCategory).label}
                                    </span>
                                </h2>
                                <span className="text-xs font-mono text-gray-500 mb-1 ml-auto">
                                    Input Data
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {FIELDS[selectedCategory].map((field, idx) => (
                                    <div key={field.name} className="group relative">
                                        <label className="block text-[10px] font-bold text-netflix-red/70 mb-2 uppercase tracking-widest font-mono flex items-center gap-2">
                                            <Hash className="w-3 h-3 opacity-50" /> {field.label}
                                        </label>
                                        <div className="relative">
                                            {/* Corner Accents */}
                                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-600 transition-all group-focus-within:border-netflix-red"></div>
                                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-600 transition-all group-focus-within:border-netflix-red"></div>

                                            <input
                                                type="text"
                                                name={field.name}
                                                value={formData[field.name] || ''}
                                                onFocus={(e) => e.target.select()}
                                                onChange={handleInputChange}
                                                placeholder={field.placeholder}
                                                className="w-full bg-zinc-900/30 border-b-2 border-zinc-800 p-3 text-sm text-white font-mono placeholder-gray-700 outline-none focus:border-netflix-red focus:bg-zinc-900/80 transition-all"
                                                autoComplete="off"
                                            />
                                            {/* Blinking Cursor Simulation (only visual logic needed, css handles caret often) */}
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                {formData[field.name] && <Check className="w-4 h-4 text-green-500 animate-in zoom-in duration-200" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Contextual decorative elements */}
                            <div className="mt-12 opacity-20 pointer-events-none">
                                <div className="h-32 border border-dashed border-gray-600 rounded flex items-center justify-center font-mono text-xs">
                                    Waiting for input...
                                </div>
                            </div>

                        </motion.div>
                    )}
                </div>
            </div>

            {/* Footer / Submit Area */}
            <div className="p-4 border-t border-zinc-900 bg-[#0f0f0f] flex flex-col sm:flex-row justify-between items-center z-20 gap-4 sm:gap-0 mt-auto">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span>Status Check: <span className="text-green-500">READY</span></span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    {error && <span className="text-xs text-red-500 font-mono animate-pulse">{error}</span>}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full sm:w-auto bg-netflix-red hover:bg-red-700 text-white px-6 py-3 sm:py-2 rounded-sm font-bold font-mono text-sm tracking-widest shadow-[0_0_15px_rgba(229,9,20,0.4)] hover:shadow-[0_0_25px_rgba(229,9,20,0.6)] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {loading ? 'Submitting...' : 'Generate Wordlist'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TargetForm;
