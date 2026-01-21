import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../firebase/config';
import { DEFAULT_LOGO, DEFAULT_CLINIC_DETAILS } from '../constants';

const LoginScreen = ({ onLogin, logo, clinicSettings }) => {
  const [role, setRole] = useState('doctor'); 
  const [creds, setCreds] = useState({ id: '', password: '' });
  const [doctors, setDoctors] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const dSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'));
        const rSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'receptionists'));
        setDoctors(dSnap.docs.map(d => ({id: d.id, ...d.data()})));
        setReceptionists(rSnap.docs.map(r => ({id: r.id, ...r.data()})));
      } catch (error) { console.error("Error fetching users:", error); }
    };
    fetchUsers();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (role === 'admin') {
      if (creds.password === 'admin123') onLogin({ role: 'admin', name: 'Master Administrator' });
      else setLoginError("Invalid Admin Password");
    } else if (role === 'doctor') {
      const doc = doctors.find(d => d.id === creds.id);
      if (doc && doc.password === creds.password) onLogin({ role: 'doctor', ...doc });
      else setLoginError("Invalid Credentials");
    } else if (role === 'reception') {
      const rec = receptionists.find(r => r.id === creds.id);
      if (rec && rec.password === creds.password) onLogin({ role: 'reception', ...rec });
      else setLoginError("Invalid Credentials");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
       <div className="bg-white p-10 rounded-3xl shadow-2xl border border-blue-50 w-full max-w-md">
         <div className="text-center mb-10">
             <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <img src={logo || DEFAULT_LOGO} alt="Clinic Logo" className="w-full h-full object-contain" />
            </div>
             <h1 className="text-2xl font-black text-blue-900 tracking-wide uppercase">{clinicSettings?.name || DEFAULT_CLINIC_DETAILS.name}</h1>
             <p className="text-blue-400 mt-2 font-medium tracking-widest text-xs uppercase">Secure Access Portal</p>
         </div>
         
         <div className="flex mb-8 bg-blue-50 p-1 rounded-xl">
            {['admin', 'doctor', 'reception'].map(r => (
                <button key={r} onClick={() => {setRole(r); setLoginError('')}} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${role === r ? 'bg-white text-blue-600 shadow-md' : 'text-blue-400 hover:text-blue-600'}`}>{r}</button>
             ))}
         </div>

         {loginError && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
               <AlertCircle size={16}/> {loginError}
           </div>
         )}

         <form onSubmit={handleLogin} className="space-y-6">
           {role === 'admin' && (
               <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase ml-1">Admin Access Key</label>
                   <input type="password" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition" placeholder="Enter Password" onChange={e => setCreds({...creds, password: e.target.value})} />
               </div>
           )}
           {role === 'doctor' && (
              <>
               <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select Profile</label>
                   <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition" onChange={e => setCreds({...creds, id: e.target.value})}><option value="">-- Choose Doctor --</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
               </div>
               <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                   <input type="password" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition" placeholder="Enter Password" onChange={e => setCreds({...creds, password: e.target.value})} />
               </div>
              </>
           )}
           {role === 'reception' && (
              <>
               <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select User</label>
                   <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition" onChange={e => setCreds({...creds, id: e.target.value})}><option value="">-- Choose Receptionist --</option>{receptionists.map(r => <option key={r.id} value={r.id}>{r.username}</option>)}</select>
               </div>
               <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                   <input type="password" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition" placeholder="Enter Password" onChange={e => setCreds({...creds, password: e.target.value})} />
               </div>
              </>
           )}
           <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-200 transition-all transform hover:scale-[1.02] uppercase tracking-wide text-sm mt-4">Login to Dashboard</button>
         </form>
       </div>
    </div>
  );
};

export default LoginScreen;
