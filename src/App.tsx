import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, where, orderBy, limit, serverTimestamp, increment } from 'firebase/firestore';
import { auth, db, signIn, logOut, handleFirestoreError, OperationType } from './lib/firebase';
import { UserProfile, School, Need, Pledge, NeedCategory } from './types';
import { LogIn, LogOut, School as SchoolIcon, Heart, LayoutDashboard, Plus, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Context ---
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, setProfile: () => {}, loading: true });

export const useAuth = () => useContext(AuthContext);

// --- Components ---

const Navbar = () => {
  const { user, profile } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-xl text-brand-primary shadow-inner transition-transform group-hover:rotate-12">
            SV
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Shaale-Vikas</h1>
            <p className="text-[10px] text-brand-accent mt-1 uppercase tracking-widest font-medium opacity-80">School-Alumni Bridge</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-8">
          <Link to="/needs" className="text-xs font-bold uppercase tracking-widest hover:text-brand-accent transition-colors">Find Needs</Link>
          {user ? (
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <button onClick={logOut} className="text-white/60 hover:text-white transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={signIn} className="bg-white text-brand-primary px-5 py-2 rounded-full font-bold text-xs uppercase hover:bg-brand-accent transition-colors">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="h-14 bg-white border-t border-slate-200 flex items-center justify-between px-8 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
    <div className="flex items-center gap-6">
      <span>Shaale-Vikas Governance System</span>
      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
      <span>Session 2024-25</span>
    </div>
    <div className="flex gap-6">
      <Link to="/about" className="hover:text-brand-accent">About</Link>
      <Link to="/needs" className="hover:text-brand-accent">Needs</Link>
      <Link to="/dashboard" className="hover:text-brand-accent">Impact</Link>
    </div>
  </footer>
);

// --- Pages ---

const formatDate = (dateVal: any) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') return new Date(dateVal).toLocaleDateString();
  if (dateVal.toDate) return dateVal.toDate().toLocaleDateString();
  return new Date(dateVal).toLocaleDateString();
};

const DonorHallOfFame = () => {
  const [pledges, setPledges] = useState<Pledge[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'pledges'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pledge));
      setPledges(data);
    });
    return () => unsubscribe();
  }, []);

  if (pledges.length === 0) return null;

  return (
    <section className="py-32 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <span className="w-2 h-8 bg-brand-accent rounded-full"></span>
            Donor Hall of Fame
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-200">Gratitude & recognition</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {pledges.map(pledge => (
            <motion.div 
              key={pledge.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card-warm p-8 flex flex-col items-center min-w-[240px] border-slate-100"
            >
              <div className="w-16 h-16 bg-emerald-50 text-brand-accent rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-sm">
                {pledge.donorName.charAt(0)}
              </div>
              <p className="font-bold text-slate-900 mb-1">{pledge.donorName}</p>
              <p className="text-sm text-brand-accent font-bold uppercase tracking-tighter">Pledged ₹{pledge.amount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 pt-4 border-t border-slate-50 w-full text-center">{formatDate(pledge.createdAt)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <div className="pt-20">
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-brand-primary">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1546733036-745277be95ca?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover"
            alt="Rural classroom"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-20 text-white">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="w-12 h-[2px] bg-brand-accent"></span>
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-brand-accent">
                Empowering Rural Education
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-[1] tracking-tight">
              Invest in the Future of <span className="text-brand-accent bg-white/5 px-4 rounded-2xl italic">our Village.</span>
            </h1>
            <p className="text-xl text-white/70 mb-12 leading-relaxed max-w-xl">
              Your rural school shaped who you are today. Now, help it shape the next generation. Join Shaale-Vikas to fulfill critical infrastructure needs.
            </p>
            <div className="flex gap-6">
              <Link to="/needs" className="bg-brand-accent text-brand-primary px-10 py-5 rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95">See Priority Needs</Link>
              <Link to="/about" className="bg-white/10 text-white px-10 py-5 rounded-xl font-bold uppercase tracking-widest hover:bg-white/20 transition-all border border-white/20">How it Works</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="group text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-accent ring-1 ring-emerald-100 transition-transform group-hover:scale-110">
                <Plus size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Identify Needs</h3>
              <p className="text-slate-500 leading-relaxed">Headmasters list micro-needs from leaking roofs to missing textbooks with full transparency.</p>
            </div>
            <div className="group text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-600 ring-1 ring-blue-100 transition-transform group-hover:scale-110">
                <Heart size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Alumni Pledges</h3>
              <p className="text-slate-500 leading-relaxed">Alumni choose needs to fulfill, pledging funds or items directly to their alma mater.</p>
            </div>
            <div className="group text-center">
              <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-purple-600 ring-1 ring-purple-100 transition-transform group-hover:scale-110">
                <MessageCircle size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Visual Proof</h3>
              <p className="text-slate-500 leading-relaxed">Accountability through Before & After photos uploaded by the school once work completes.</p>
            </div>
          </div>
        </div>
      </section>

      <DonorHallOfFame />
    </div>
  );
};

const NeedsList = () => {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'needs'), where('status', '==', 'open'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const needsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Need));
      setNeeds(needsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'needs');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h2 className="text-4xl font-bold flex items-center gap-3">
            <span className="w-2 h-8 bg-brand-accent rounded-full"></span>
            Current Priority Needs
          </h2>
          <p className="text-slate-500 mt-2 max-w-xl">Every pledge matters. Choose a need that resonates with you and help a school thrive.</p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200">
          {needs.length} Active Requests
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-[400px] bg-white rounded-xl animate-pulse border border-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {needs.map(need => (
            <Link key={need.id} to={`/need/${need.id}`} className="card-warm group">
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {need.beforePhotoUrl ? (
                  <img src={need.beforePhotoUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={need.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  </div>
                )}
                <div className="absolute top-4 right-4 px-2 py-1 bg-white/90 backdrop-blur rounded text-[9px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                  {need.category}
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-brand-accent transition-colors">{need.title}</h3>
                <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed">{need.description}</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>₹{need.amountCollected.toLocaleString()} pledged</span>
                    <span className="text-brand-accent">{Math.round((need.amountCollected / need.costEstimate) * 100)}%</span>
                  </div>
                  <div className="progress-track h-2">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.min(100, (need.amountCollected / need.costEstimate) * 100)}%` }} 
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <span className="btn-primary w-full text-center py-2">View & Help</span>
                </div>
              </div>
            </Link>
          ))}
          {needs.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
              No active needs found at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { useParams } from 'react-router-dom';
import { addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

// --- Additional Components ---

const NeedDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [need, setNeed] = useState<Need | null>(null);
  const [pledging, setPledging] = useState(false);
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'needs', id), (doc) => {
      if (doc.exists()) setNeed({ id: doc.id, ...doc.data() } as Need);
    });
    return () => unsubscribe();
  }, [id]);

  const handlePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !need || !id) return;

    try {
      const pledgeVal = parseFloat(amount);
      if (isNaN(pledgeVal) || pledgeVal <= 0) return;

      const pledgeRef = doc(collection(db, 'pledges'));
      await setDoc(pledgeRef, {
        id: pledgeRef.id,
        needId: id,
        donorUid: user.uid,
        donorName: donorName || user.displayName || 'Anonymous',
        amount: pledgeVal,
        pledgeType: 'funds',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'needs', id), {
        amountCollected: increment(pledgeVal),
        status: (need.amountCollected + pledgeVal) >= need.costEstimate ? 'pledged' : 'open',
        updatedAt: serverTimestamp(),
      });

      setPledging(false);
      setAmount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pledges/${id}`);
    }
  };

  if (!need) return <div className="pt-40 text-center text-2xl font-bold">Loading need...</div>;

  const percent = Math.min(100, (need.amountCollected / need.costEstimate) * 100);

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div>
          <Link to="/needs" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-brand-accent transition-colors mb-8 inline-block">← Back to priority needs</Link>
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-12 bg-slate-100 border border-slate-200 shadow-sm">
             <img src={need.beforePhotoUrl || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop'} className="w-full h-full object-cover" alt={need.title} />
             <div className="absolute bottom-6 left-6 px-4 py-2 bg-brand-primary/80 backdrop-blur text-white text-xs font-bold uppercase tracking-widest rounded-lg">
               Current Status Photo
             </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Category</h4>
              <p className="font-bold text-slate-900 capitalize">{need.category}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Requirement Status</h4>
              <p className="font-bold text-brand-accent capitalize">{need.status}</p>
            </div>
          </div>
        </div>

        <div>
           <div className="flex items-center gap-3 mb-6">
            <span className="w-2 h-6 bg-brand-accent rounded-full"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School Development Request</span>
          </div>
          <h1 className="text-4xl font-bold mb-6 leading-tight text-slate-900">{need.title}</h1>
          <p className="text-lg text-slate-500 mb-12 leading-relaxed">{need.description}</p>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-10 mb-12 shadow-xl shadow-slate-200/50">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Pledged</p>
                <span className="text-4xl font-bold text-slate-900 font-mono tracking-tighter">₹{need.amountCollected.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Target Goal</p>
                <span className="text-xl font-bold text-brand-accent">₹{need.costEstimate.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="progress-track h-4 mb-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                className="progress-fill"
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <span>{Math.round(percent)}% Collected</span>
              <span>₹{(need.costEstimate - need.amountCollected).toLocaleString()} Remaining</span>
            </div>

            <div className="mt-10">
              {need.status === 'completed' ? (
                <div className="bg-emerald-50 text-emerald-700 py-4 px-8 rounded-xl font-bold text-center border border-emerald-100 shadow-inner">
                  Project Goal Reached!
                </div>
              ) : (
                <button 
                  onClick={() => user ? setPledging(true) : signIn()}
                  className="btn-primary w-full text-base py-4 shadow-emerald-900/20"
                >
                  {user ? 'Pledge Contribution' : 'Sign in to Support'}
                </button>
              )}
            </div>
          </div>

          <div className="card-warm p-8 bg-slate-50 border-slate-100 shadow-none">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-6">Recent Impact List</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 font-bold border border-slate-200 text-xs">SV</div>
                <div>
                  <p className="text-sm font-bold">Community Support</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Active involvement growing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pledging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white max-w-md w-full rounded-2xl p-10 shadow-2xl relative"
            >
              <button onClick={() => setPledging(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">✕</button>
              <h3 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-50 pb-4">Pledge Support</h3>
              <form onSubmit={handlePledge} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Display Name / Batch</label>
                  <input 
                    type="text" 
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Alumnus Batch '98"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Contribution Amount (₹)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-2xl font-bold text-slate-900 focus:outline-none focus:border-brand-accent transition-colors"
                    required
                  />
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-amber-800 font-medium italic">This pledge is a commitment. The school administration will contact you regarding fulfillment of this need.</p>
                </div>
                <button type="submit" className="btn-primary w-full py-4">Confirm My Pledge</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const { user, profile, setProfile } = useAuth();
  const [needs, setNeeds] = useState<Need[]>([]);
  const [isAddingNeed, setIsAddingNeed] = useState(false);
  const [newNeed, setNewNeed] = useState({ title: '', description: '', costEstimate: '', category: 'infrastructure' as NeedCategory });

  useEffect(() => {
    if (!user || !profile) return;
    
    let q;
    if (profile.userType === 'headmaster') {
      q = query(collection(db, 'needs'), where('schoolId', '==', profile.schoolId || ''), orderBy('createdAt', 'desc'));
    } else {
      // For alumni, show needs they pledged to (requires more complex query/mapping)
      q = query(collection(db, 'needs'), orderBy('createdAt', 'desc'), limit(10)); // Just show recent for now
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const needsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Need));
      setNeeds(needsData);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const handleAddNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !profile.schoolId) return;

    try {
      const needRef = doc(collection(db, 'needs'));
      await setDoc(needRef, {
        id: needRef.id,
        schoolId: profile.schoolId,
        title: newNeed.title,
        description: newNeed.description,
        costEstimate: parseFloat(newNeed.costEstimate),
        amountCollected: 0,
        status: 'open',
        category: newNeed.category,
        createdAt: serverTimestamp(),
      });
      setIsAddingNeed(false);
      setNewNeed({ title: '', description: '', costEstimate: '', category: 'infrastructure' });
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'needs');
    }
  };

  const toggleRole = async () => {
    if (!user || !profile) return;
    const newType = profile.userType === 'alumni' ? 'headmaster' : 'alumni';
    await updateDoc(doc(db, 'users', user.uid), { userType: newType });
    setProfile({ ...profile, userType: newType });
  };

  const createSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    const schoolId = user.uid + '_school'; // Simple demo logic
    const schoolData: School = {
      id: schoolId,
      name: 'Sunrise Rural Secondary',
      location: 'Chikkamagaluru, Karnataka',
      description: 'A school dedicated to empowering children from farming communities.',
      headmasterUid: user.uid,
    };
    await setDoc(doc(db, 'schools', schoolId), schoolData);
    await updateDoc(doc(db, 'users', user.uid), { schoolId });
    setProfile({ ...profile, schoolId });
  };

  if (!user) return <div className="pt-40 text-center text-3xl font-bold">Please sign in to view dashboard</div>;

  if (profile?.userType === 'headmaster' && !profile.schoolId) {
    return (
      <div className="pt-40 pb-20 max-w-xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-6">Register Your School</h2>
        <p className="text-slate-500 mb-8">Before you can post needs, we need some details about your institution.</p>
        <button onClick={createSchool} className="btn-primary w-full shadow-lg">Set up Sunset Rural Secondary (Demo)</button>
        <button onClick={toggleRole} className="mt-8 text-xs font-bold uppercase tracking-widest text-brand-primary underline underline-offset-4">I'm actually an Alumnus</button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h2 className="text-5xl font-bold mb-3">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">{profile?.userType}</span>
            <p className="text-slate-400 font-medium">Welcome back, {profile?.name || user.displayName}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={toggleRole} className="btn-secondary py-2 text-[10px]">Switch Role (Debug)</button>
          {profile?.userType === 'headmaster' && (
            <button 
              onClick={() => setIsAddingNeed(true)}
              className="bg-brand-accent text-brand-primary px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-brand-primary hover:text-white shadow-md"
            >
              <Plus size={16} />
              Post New Need
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="card-warm p-10 bg-white border-slate-200 text-slate-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-8 -mt-8" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Active Needs</p>
          <p className="text-6xl font-bold font-mono tracking-tighter">{needs.length}</p>
        </div>
        <div className="card-warm p-10 flex flex-col justify-center border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Total Support</p>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">₹{needs.reduce((acc, n) => acc + n.amountCollected, 0).toLocaleString()}</p>
        </div>
        <div className="card-warm p-10 flex flex-col justify-center border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Completed Projects</p>
          <p className="text-4xl font-bold text-brand-accent tracking-tight">{needs.filter(n => n.status === 'completed').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8">
          <div className="card-warm bg-white border border-slate-200 p-10">
            <h3 className="text-lg font-bold uppercase tracking-widest text-slate-400 mb-8 border-b border-slate-50 pb-4">Managed School Needs</h3>
            <div className="space-y-4">
              {needs.map(need => (
                <div key={need.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-100/50 rounded-xl border border-slate-100 transition-all hover:border-brand-accent/30 group">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-brand-accent shadow-sm border border-slate-100">
                        <SchoolIcon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 mb-1">{need.title}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-white bg-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">{need.category}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${need.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{need.status}</span>
                        </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-8 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">₹{need.amountCollected.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target ₹{need.costEstimate.toLocaleString()}</p>
                      </div>
                      <Link to={`/need/${need.id}`} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
                        Details
                      </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-4 space-y-8">
          <div className="card-warm p-8 bg-white border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Latest Impact</h3>
            <div className="space-y-6">
              <div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="impact-img relative">
                    <img 
                      src="https://images.unsplash.com/photo-1546733036-745277be95ca?auto=format&fit=crop&q=80&w=500" 
                      className="w-full h-full object-cover grayscale" 
                      alt="Before" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[8px] font-black text-white uppercase tracking-tighter">Initially</span>
                    </div>
                  </div>
                  <div className="impact-img relative border-2 border-brand-accent/20">
                    <img 
                      src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=500" 
                      className="w-full h-full object-cover" 
                      alt="After" 
                    />
                    <div className="absolute inset-0 bg-brand-accent/10 flex items-center justify-center">
                      <span className="text-[8px] font-black text-white uppercase tracking-tighter">Restored</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-900">Block A Facade Painting</p>
                  <span className="text-[9px] font-bold text-slate-400">Apr 2024</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed italic">\"The children feel proud to walk into their school every morning now.\""</p>
              </div>
              <button className="text-[10px] font-bold text-brand-accent uppercase tracking-widest hover:underline pt-4 border-t border-slate-50 w-full text-left">View Impact Gallery →</button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingNeed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white max-w-2xl w-full rounded-2xl p-10 shadow-2xl relative overflow-y-auto max-h-[90vh]"
            >
              <button onClick={() => setIsAddingNeed(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800">✕</button>
              <h3 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-50 pb-4">Post a School Need</h3>
              <form onSubmit={handleAddNeed} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Title</label>
                    <input 
                      type="text" 
                      value={newNeed.title}
                      onChange={(e) => setNewNeed({...newNeed, title: e.target.value})}
                      placeholder="e.g. Roof Repair for Block A"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Category</label>
                    <select 
                      value={newNeed.category}
                      onChange={(e) => setNewNeed({...newNeed, category: e.target.value as NeedCategory})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                    >
                      <option value="infrastructure">Infrastructure</option>
                      <option value="supplies">Supplies</option>
                      <option value="tech">Technology</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Estimate Cost (₹)</label>
                  <input 
                    type="number" 
                    value={newNeed.costEstimate}
                    onChange={(e) => setNewNeed({...newNeed, costEstimate: e.target.value})}
                    placeholder="15000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-accent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Detailed Description</label>
                  <textarea 
                    value={newNeed.description}
                    onChange={(e) => setNewNeed({...newNeed, description: e.target.value})}
                    rows={4}
                    placeholder="Describe what is needed and how it will impact the students..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-4 uppercase tracking-widest">Create Need Awareness</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- App Root ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Auto-create profile for new users as Alumni by default
          const newProfile: UserProfile = {
            id: user.uid,
            name: user.displayName || 'Anonymous',
            email: user.email || '',
            photoUrl: user.photoURL || '',
            userType: 'alumni',
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/needs" element={<NeedsList />} />
              <Route path="/need/:id" element={<NeedDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
