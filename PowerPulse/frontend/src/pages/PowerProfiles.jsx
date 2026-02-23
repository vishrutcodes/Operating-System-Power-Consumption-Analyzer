import { useContext, useState, useEffect, useMemo } from 'react';
import { MetricsContext } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Battery, Cpu, MemoryStick, Shield, Flame, Leaf, Settings,
    Check, X, Plus, Trash2, Play, Pause, Edit3, Save, AlertTriangle,
    Monitor, Moon, Sun, Activity, Power, Clock, Gauge
} from 'lucide-react';

const DEFAULT_PROFILES = [
    {
        id: 'power-saver',
        name: 'Power Saver',
        icon: 'Leaf',
        color: 'green',
        description: 'Maximum battery life. Reduces performance to conserve energy.',
        settings: {
            cpuLimit: 50,
            suspendIdleAfter: 5,
            dimDisplayAfter: 2,
            sleepAfter: 15,
            reduceBrightness: true,
            disableAnimations: true,
            networkThrottle: true,
        },
        autoTrigger: { type: 'battery_below', value: 30 },
        isDefault: true,
    },
    {
        id: 'balanced',
        name: 'Balanced',
        icon: 'Gauge',
        color: 'cyan',
        description: 'Good balance between performance and power consumption.',
        settings: {
            cpuLimit: 80,
            suspendIdleAfter: 15,
            dimDisplayAfter: 5,
            sleepAfter: 30,
            reduceBrightness: false,
            disableAnimations: false,
            networkThrottle: false,
        },
        autoTrigger: null,
        isDefault: true,
    },
    {
        id: 'performance',
        name: 'High Performance',
        icon: 'Flame',
        color: 'red',
        description: 'Maximum performance. Higher power consumption.',
        settings: {
            cpuLimit: 100,
            suspendIdleAfter: 0,
            dimDisplayAfter: 0,
            sleepAfter: 0,
            reduceBrightness: false,
            disableAnimations: false,
            networkThrottle: false,
        },
        autoTrigger: { type: 'plugged_in', value: true },
        isDefault: true,
    },
];

const ICON_MAP = {
    Leaf, Gauge, Flame, Shield, Moon, Sun, Zap, Battery, Power,
};

const COLOR_CLASSES = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', ring: 'ring-green-500/50', glow: 'shadow-green-500/20' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-500/50', glow: 'shadow-cyan-500/20' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', ring: 'ring-red-500/50', glow: 'shadow-red-500/20' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', ring: 'ring-purple-500/50', glow: 'shadow-purple-500/20' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', ring: 'ring-yellow-500/50', glow: 'shadow-yellow-500/20' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500/50', glow: 'shadow-blue-500/20' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', ring: 'ring-pink-500/50', glow: 'shadow-pink-500/20' },
};

function PowerProfiles() {
    const { data } = useContext(MetricsContext);
    const [profiles, setProfiles] = useState(() => {
        const saved = localStorage.getItem('powerpulse_profiles');
        return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
    });
    const [activeProfileId, setActiveProfileId] = useState(() =>
        localStorage.getItem('powerpulse_active_profile') || 'balanced'
    );
    const [editingProfile, setEditingProfile] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newProfile, setNewProfile] = useState({
        name: '',
        icon: 'Shield',
        color: 'purple',
        description: '',
        settings: {
            cpuLimit: 75,
            suspendIdleAfter: 10,
            dimDisplayAfter: 5,
            sleepAfter: 20,
            reduceBrightness: false,
            disableAnimations: false,
            networkThrottle: false,
        },
        autoTrigger: null,
    });

    const battery = data?.battery;
    const cpuUsage = data?.cpu?.usage_percent || 0;

    useEffect(() => {
        localStorage.setItem('powerpulse_profiles', JSON.stringify(profiles));
    }, [profiles]);

    useEffect(() => {
        localStorage.setItem('powerpulse_active_profile', activeProfileId);
    }, [activeProfileId]);

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
    const colors = COLOR_CLASSES[activeProfile.color] || COLOR_CLASSES.cyan;

    const estimatedSavings = useMemo(() => {
        const profile = activeProfile;
        let savingPercent = 0;
        if (profile.settings.cpuLimit < 100) savingPercent += (100 - profile.settings.cpuLimit) * 0.3;
        if (profile.settings.reduceBrightness) savingPercent += 15;
        if (profile.settings.disableAnimations) savingPercent += 5;
        if (profile.settings.networkThrottle) savingPercent += 8;
        return Math.min(savingPercent, 60).toFixed(0);
    }, [activeProfile]);

    const handleActivate = (profileId) => {
        setActiveProfileId(profileId);
    };

    const handleDelete = (profileId) => {
        const profile = profiles.find(p => p.id === profileId);
        if (profile?.isDefault) return;
        setProfiles(prev => prev.filter(p => p.id !== profileId));
        if (activeProfileId === profileId) setActiveProfileId('balanced');
    };

    const handleCreate = () => {
        if (!newProfile.name.trim()) return;
        const id = `custom-${Date.now()}`;
        const profile = { ...newProfile, id, isDefault: false };
        setProfiles(prev => [...prev, profile]);
        setShowCreate(false);
        setNewProfile({
            name: '', icon: 'Shield', color: 'purple', description: '',
            settings: { cpuLimit: 75, suspendIdleAfter: 10, dimDisplayAfter: 5, sleepAfter: 20, reduceBrightness: false, disableAnimations: false, networkThrottle: false },
            autoTrigger: null,
        });
    };

    const handleSaveEdit = () => {
        if (!editingProfile) return;
        setProfiles(prev => prev.map(p => p.id === editingProfile.id ? editingProfile : p));
        setEditingProfile(null);
    };

    if (!data) return null;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                        <Power className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Power Profiles</h1>
                        <p className="text-sm text-slate-400">Manage power plans and auto-optimization rules</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-medium text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
                >
                    <Plus size={16} />
                    Create Profile
                </button>
            </motion.div>

            {/* Active Profile Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-panel p-6 border ${colors.border} ${colors.bg}`}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                            {(() => { const Icon = ICON_MAP[activeProfile.icon] || Shield; return <Icon size={28} className={colors.text} />; })()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-100">{activeProfile.name}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>Active</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{activeProfile.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-xs text-slate-500 uppercase">CPU Limit</div>
                            <div className={`text-2xl font-bold ${colors.text}`}>{activeProfile.settings.cpuLimit}%</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-slate-500 uppercase">Est. Savings</div>
                            <div className="text-2xl font-bold text-green-400">{estimatedSavings}%</div>
                        </div>
                    </div>
                </div>

                {/* Active Profile Settings Summary */}
                <div className="mt-4 pt-4 border-t border-slate-700/30">
                    <div className="flex flex-wrap gap-3">
                        {activeProfile.settings.cpuLimit < 100 && (
                            <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800/50 text-slate-300 flex items-center gap-1.5">
                                <Cpu size={12} /> CPU capped at {activeProfile.settings.cpuLimit}%
                            </span>
                        )}
                        {activeProfile.settings.suspendIdleAfter > 0 && (
                            <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800/50 text-slate-300 flex items-center gap-1.5">
                                <Clock size={12} /> Suspend idle after {activeProfile.settings.suspendIdleAfter}m
                            </span>
                        )}
                        {activeProfile.settings.reduceBrightness && (
                            <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800/50 text-slate-300 flex items-center gap-1.5">
                                <Monitor size={12} /> Reduced brightness
                            </span>
                        )}
                        {activeProfile.settings.disableAnimations && (
                            <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800/50 text-slate-300 flex items-center gap-1.5">
                                <Activity size={12} /> Animations disabled
                            </span>
                        )}
                        {activeProfile.settings.networkThrottle && (
                            <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800/50 text-slate-300 flex items-center gap-1.5">
                                <Zap size={12} /> Network throttled
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* System Context */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4">
                    <div className="text-xs text-slate-500 uppercase mb-1">CPU Usage</div>
                    <div className={`text-2xl font-bold ${cpuUsage > 80 ? 'text-red-400' : cpuUsage > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {cpuUsage.toFixed(0)}%
                    </div>
                    {cpuUsage > activeProfile.settings.cpuLimit && (
                        <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                            <AlertTriangle size={10} /> Above profile limit
                        </div>
                    )}
                </div>
                <div className="glass-panel p-4">
                    <div className="text-xs text-slate-500 uppercase mb-1">Battery</div>
                    <div className="text-2xl font-bold text-cyan-400">{battery?.percent?.toFixed(0) || 'N/A'}%</div>
                    <div className="text-[10px] text-slate-500 mt-1">{battery?.power_plugged ? 'Plugged in' : 'On battery'}</div>
                </div>
                <div className="glass-panel p-4">
                    <div className="text-xs text-slate-500 uppercase mb-1">Profile</div>
                    <div className={`text-xl font-bold ${colors.text}`}>{activeProfile.name}</div>
                </div>
                <div className="glass-panel p-4">
                    <div className="text-xs text-slate-500 uppercase mb-1">Profiles</div>
                    <div className="text-2xl font-bold text-slate-200">{profiles.length}</div>
                </div>
            </div>

            {/* Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((profile, idx) => {
                    const pColors = COLOR_CLASSES[profile.color] || COLOR_CLASSES.cyan;
                    const Icon = ICON_MAP[profile.icon] || Shield;
                    const isActive = profile.id === activeProfileId;

                    return (
                        <motion.div
                            key={profile.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`glass-panel p-5 relative overflow-hidden group transition-all ${isActive ? `ring-2 ${pColors.ring} shadow-lg ${pColors.glow}` : 'hover:border-slate-600'}`}
                        >
                            {isActive && (
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${profile.color === 'green' ? 'from-green-500 to-emerald-400' : profile.color === 'red' ? 'from-red-500 to-orange-400' : profile.color === 'cyan' ? 'from-cyan-500 to-blue-400' : 'from-purple-500 to-pink-400'}`} />
                            )}

                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${pColors.bg} border ${pColors.border}`}>
                                    <Icon size={20} className={pColors.text} />
                                </div>
                                <div className="flex gap-1.5">
                                    {!profile.isDefault && (
                                        <button onClick={() => handleDelete(profile.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <button onClick={() => setEditingProfile({ ...profile })} className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                        <Edit3 size={14} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-slate-100 mb-1">{profile.name}</h3>
                            <p className="text-xs text-slate-500 mb-4">{profile.description}</p>

                            {/* Settings Preview */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">CPU Limit</span>
                                    <span className="text-slate-300 font-mono">{profile.settings.cpuLimit}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${profile.color === 'green' ? 'bg-green-500' : profile.color === 'red' ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${profile.settings.cpuLimit}%` }} />
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Sleep After</span>
                                    <span className="text-slate-300 font-mono">{profile.settings.sleepAfter || 'Never'}m</span>
                                </div>
                            </div>

                            {/* Auto Trigger */}
                            {profile.autoTrigger && (
                                <div className="text-[10px] text-slate-500 mb-3 flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded">
                                    <Zap size={10} />
                                    Auto: {profile.autoTrigger.type === 'battery_below' ? `Battery < ${profile.autoTrigger.value}%` : profile.autoTrigger.type === 'plugged_in' ? 'When plugged in' : 'Manual'}
                                </div>
                            )}

                            <button
                                onClick={() => handleActivate(profile.id)}
                                disabled={isActive}
                                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? `${pColors.bg} ${pColors.text} border ${pColors.border} cursor-default`
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                    }`}
                            >
                                {isActive ? (
                                    <span className="flex items-center justify-center gap-2"><Check size={14} /> Active</span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2"><Play size={14} /> Activate</span>
                                )}
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            {/* Create Profile Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                    <Plus size={20} className="text-cyan-400" /> Create Power Profile
                                </h2>
                                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-200">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase mb-1.5 block">Profile Name</label>
                                    <input
                                        value={newProfile.name}
                                        onChange={e => setNewProfile(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g., Night Mode"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 uppercase mb-1.5 block">Description</label>
                                    <input
                                        value={newProfile.description}
                                        onChange={e => setNewProfile(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Brief description..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase mb-1.5 block">Icon</label>
                                        <select
                                            value={newProfile.icon}
                                            onChange={e => setNewProfile(p => ({ ...p, icon: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                                        >
                                            {Object.keys(ICON_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase mb-1.5 block">Color</label>
                                        <select
                                            value={newProfile.color}
                                            onChange={e => setNewProfile(p => ({ ...p, color: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                                        >
                                            {Object.keys(COLOR_CLASSES).map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 uppercase mb-1.5 block">CPU Limit: {newProfile.settings.cpuLimit}%</label>
                                    <input
                                        type="range" min="10" max="100" step="5"
                                        value={newProfile.settings.cpuLimit}
                                        onChange={e => setNewProfile(p => ({ ...p, settings: { ...p.settings, cpuLimit: parseInt(e.target.value) } }))}
                                        className="w-full accent-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 uppercase mb-1.5 block">Sleep After (minutes, 0 = never)</label>
                                    <input
                                        type="number" min="0" max="120"
                                        value={newProfile.settings.sleepAfter}
                                        onChange={e => setNewProfile(p => ({ ...p, settings: { ...p.settings, sleepAfter: parseInt(e.target.value) || 0 } }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {['reduceBrightness', 'disableAnimations', 'networkThrottle'].map(key => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newProfile.settings[key]}
                                                onChange={e => setNewProfile(p => ({ ...p, settings: { ...p.settings, [key]: e.target.checked } }))}
                                                className="accent-cyan-500"
                                            />
                                            <span className="text-sm text-slate-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newProfile.name.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={16} /> Create
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {editingProfile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setEditingProfile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                    <Edit3 size={20} className="text-cyan-400" /> Edit: {editingProfile.name}
                                </h2>
                                <button onClick={() => setEditingProfile(null)} className="text-slate-400 hover:text-slate-200"><X size={20} /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase mb-1.5 block">CPU Limit: {editingProfile.settings.cpuLimit}%</label>
                                    <input
                                        type="range" min="10" max="100" step="5"
                                        value={editingProfile.settings.cpuLimit}
                                        onChange={e => setEditingProfile(p => ({ ...p, settings: { ...p.settings, cpuLimit: parseInt(e.target.value) } }))}
                                        className="w-full accent-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 uppercase mb-1.5 block">Sleep After (minutes)</label>
                                    <input
                                        type="number" min="0" max="120"
                                        value={editingProfile.settings.sleepAfter}
                                        onChange={e => setEditingProfile(p => ({ ...p, settings: { ...p.settings, sleepAfter: parseInt(e.target.value) || 0 } }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {['reduceBrightness', 'disableAnimations', 'networkThrottle'].map(key => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingProfile.settings[key]}
                                                onChange={e => setEditingProfile(p => ({ ...p, settings: { ...p.settings, [key]: e.target.checked } }))}
                                                className="accent-cyan-500"
                                            />
                                            <span className="text-sm text-slate-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setEditingProfile(null)} className="px-4 py-2 text-slate-400 hover:text-slate-200">Cancel</button>
                                <button onClick={handleSaveEdit} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-medium text-white">
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PowerProfiles;
