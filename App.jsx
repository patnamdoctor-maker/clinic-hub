import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, appId } from './firebase/config';
import { DEFAULT_LOGO, DEFAULT_CLINIC_DETAILS } from './constants';
import Header from './components/Header';
import AdminView from './views/AdminView';
import ReceptionistView from './views/ReceptionistView';
import DoctorView from './views/DoctorView';
import LoginScreen from './views/LoginScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('patnam_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appLogo, setAppLogo] = useState(DEFAULT_LOGO);
  const [prescriptionLogo, setPrescriptionLogo] = useState(DEFAULT_LOGO);
  const [clinicSettings, setClinicSettings] = useState(DEFAULT_CLINIC_DETAILS);

  useEffect(() => {
    const initAuth = async () => { 
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token); 
        } else {
            await signInAnonymously(auth); 
        }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, u => setFirebaseUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) localStorage.setItem('patnam_user', JSON.stringify(currentUser));
    else localStorage.removeItem('patnam_user');
  }, [currentUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const fetchLogo = async () => {
        try {
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'));
            if (docSnap.exists()) {
                const data = docSnap.data();
               if(data.appLogo) setAppLogo(data.appLogo);
               if(data.prescriptionLogo) setPrescriptionLogo(data.prescriptionLogo);
               if(data.clinicDetails) setClinicSettings(data.clinicDetails);
            }
        } catch (e) { console.error("Logo fetch error", e); }
    };
    fetchLogo();
  }, [firebaseUser]);

  if (!firebaseUser) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} logo={appLogo} clinicSettings={clinicSettings} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header userRole={currentUser.role} userName={currentUser.name || currentUser.username} onLogout={() => setCurrentUser(null)} logo={appLogo} clinicSettings={clinicSettings} />
      <main className="py-8 px-4 print:p-0 print:m-0">
       {currentUser.role === 'admin' && <AdminView appLogo={appLogo} setAppLogo={setAppLogo} prescriptionLogo={prescriptionLogo} setPrescriptionLogo={setPrescriptionLogo} clinicSettings={clinicSettings} setClinicSettings={setClinicSettings} />}
       {currentUser.role === 'reception' && <ReceptionistView user={firebaseUser} currentUser={currentUser} logo={appLogo} prescriptionLogo={prescriptionLogo} clinicSettings={clinicSettings} />}
       {currentUser.role === 'doctor' && <DoctorView user={firebaseUser} currentDoctor={currentUser} logo={appLogo} prescriptionLogo={prescriptionLogo} clinicSettings={clinicSettings} />}
      </main>
      <style>{`
        @media print { @page { margin: 0; } body { background: white; } body > *:not(#root) { display: none; } #root > div { min-height: 0; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
