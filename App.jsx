import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Activity, Stethoscope, Microscope, History, Loader2, 
  BarChart3, Table, UserPlus, CheckCircle2, IndianRupee, Pill, 
  Save, X, Search, UserCheck, ExternalLink, Printer, Layout, 
  Users, Trash2, Edit3, ClipboardCheck, Clock, AlertCircle
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, 
  onSnapshot, updateDoc, deleteDoc, query 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- STEP 1: FIREBASE CONFIGURATION ---
// The environment provides __firebase_config automatically in the preview.
// For Vercel hosting, replace the strings below with your keys.
const defaultConfig = {
    apiKey: "AIzaSyCttsHAE-UPhhBbSwafpt-kxa_priQZkyI",
    authDomain: "patnam-clinic-hub.firebaseapp.com",
    projectId: "patnam-clinic-hub",
    storageBucket: "patnam-clinic-hub.firebasestorage.app",
    messagingSenderId: "819118122911",
    appId: "1:819118122911:web:e3b9f8ebad901db1bbbfaa",
    measurementId: "G-DYHEGBH36V"
};

const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    return JSON.parse(__firebase_config);
  }
  return defaultConfig;
};

const firebaseConfig = getFirebaseConfig();

// Validate if we have a real API key before initializing
const isConfigValid = firebaseConfig.apiKey && 
                     firebaseConfig.apiKey !== "" && 
                     firebaseConfig.apiKey !== "YOUR_API_KEY";

let app, db, auth;
const appId = typeof __app_id !== 'undefined' ? __app_id : "patnam-clinic-v1";

if (isConfigValid) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

// --- COMPONENT: OFFICIAL PRESCRIPTION TEMPLATE ---
const GeneratedPrescription = ({ data, doctor }) => (
  <div className="bg-white w-full max-w-[210mm] min-h-[297mm] mx-auto p-12 relative font-serif border border-slate-100 shadow-sm print:shadow-none print:border-none flex flex-col prescription-container">
    {/* Header */}
    <div className="text-center mb-6">
      <div className="flex justify-center mb-2">
        <img src="image_6b6046.png" className="h-20 w-auto grayscale" alt="Logo" />
      </div>
      <h1 className="text-2xl font-bold uppercase tracking-tight font-sans">SUPER SPECIALITY CLINIC</h1>
      <h2 className="text-xl font-bold text-slate-700 font-sans">Patnam Doctor</h2>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mt-1 font-sans">Teleconsultation</p>
    </div>

    {/* Doctor Info Row */}
    <div className="flex justify-between text-[11px] mb-8 pb-3 border-b border-slate-100 font-sans">
      <div><p className="font-bold">Date: <span className="font-normal underline underline-offset-4 decoration-slate-300">{data.date}</span></p></div>
      <div className="text-right leading-snug">
        <p className="font-bold text-[14px]">{doctor?.name || "---"}</p>
        <p>{doctor?.qualification || "---"}</p>
        <p className="text-[10px] font-bold uppercase italic text-slate-600">{doctor?.designation || "---"}</p>
        <p>Reg No: {doctor?.registration || "---"}</p>
      </div>
    </div>

    {/* Vitals Grid */}
    <div className="grid grid-cols-3 gap-4 mb-8 text-[12px] py-4 border-y border-slate-100 font-sans">
      <p><b>Name:</b> {data.patientName || "---"}</p>
      <p className="text-center"><b>Age/Sex:</b> {data.age || "---"}/{data.gender}</p>
      <p className="text-right"><b>Wt:</b> {data.weight || "---"} kg</p>
      <p><b>BP:</b> {data.bp || "---"}</p>
      <p className="text-center"><b>Pulse:</b> {data.pulse || "---"}</p>
      <p className="text-right"><b>GRBS:</b> {data.grbs || "---"}</p>
    </div>

    {/* Clinical Content Section */}
    <div className="flex-grow space-y-4 text-[13.5px] font-sans leading-relaxed">
      <div className="mb-2"><b>Chief Complaints:</b><p className="pl-4 whitespace-pre-wrap">{data.chiefComplaint || "---"}</p></div>
      <div className="mb-2"><b>History:</b><p className="pl-4 whitespace-pre-wrap">{data.history || "---"}</p></div>
      <div className="mb-2"><b>Examination:</b><p className="pl-4 italic">{data.examination || "---"}</p></div>
      
      {/* Clinically Requested Order: Previous Investigations ABOVE Provisional Diagnosis */}
      <div><b>Previous Investigations:</b><p className="pl-4 italic text-slate-500">{data.reportsSummary || "---"}</p></div>
      <div><b>Provisional Diagnosis:</b><p className="pl-4 font-bold text-lg">{data.provisionalDiagnosis || "---"}</p></div>
      <div><b className="text-red-800">Investigations advised:</b><p className="pl-4 font-bold text-red-900 italic">{data.investigationsAdvised || "---"}</p></div>
      
      <div className="pt-2 border-t border-slate-50">
        <b>Medications (Rx):</b>
        <div className="pl-4 font-mono text-[14px] whitespace-pre-wrap leading-7">{data.medications || "---"}</div>
      </div>
      <div><b>Advise:</b><p className="pl-4 whitespace-pre-wrap">{data.advice || "---"}</p></div>
    </div>

    {/* Footer Section */}
    <div className="mt-8">
      <div className="flex flex-col items-end mb-4 font-sans">
        <div className="text-center w-64">
          <div className="h-10 flex items-center justify-center mb-1 text-2xl italic opacity-80" style={{fontFamily: 'cursive'}}>Shiva</div>
          <p className="font-bold text-[13px]">{doctor?.name}</p>
          <p className="text-[10px] uppercase text-slate-400">Patnam Doctor Clinic</p>
        </div>
      </div>
      <div className="border-t border-black pt-2 text-center font-sans">
        <p className="text-[9px] text-slate-600">
          {doctor?.address || "Clinic Address"} | Ph: {doctor?.phone || "Phone Number"} | Remark: Electronically generated prescription.
        </p>
      </div>
    </div>
  </div>
);

// --- MAIN APPLICATION ---
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(true);
  const [consultationId, setConsultationId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [consultationsList, setConsultationsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [adminActiveTab, setAdminActiveTab] = useState('register');
  const [viewingOldRecord, setViewingOldRecord] = useState(null);
  const [msg, setMsg] = useState(null);
  const [docForm, setDocForm] = useState({ name: '', qualification: '', designation: '', registration: '', address: '', phone: '', active: true });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], doctorId: "", patientId: "", patientName: "", age: "", gender: "Male", weight: "", mobileNo: "", aadharNo: "", bp: "", pulse: "", history: "", examination: "", provisionalDiagnosis: "", investigationsAdvised: "", medications: "", advice: "", permanentHistory: "", grbs: "", reportsSummary: "", chiefComplaint: "", consultationAmount: 0, medicineAmount: 0
  });

  const showMessage = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  // Rule 3: Auth Initialization
  useEffect(() => {
    if (!isConfigValid) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        
        onAuthStateChanged(auth, (u) => {
          setUser(u);
          setLoading(false);
          const params = new URLSearchParams(window.location.search);
          if (params.get('consultationId')) {
            setConsultationId(params.get('consultationId'));
            setRole('doctor');
          }
        });
      } catch (err) {
        console.error("Auth Error", err);
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Data Listeners gated by user
  useEffect(() => {
    if (!user || !isConfigValid) return;

    const unsubDocs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), (snap) => {
      setDoctorsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error(err));

    const unsubCases = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'consultations'), (snap) => {
      setConsultationsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error(err));

    return () => { unsubDocs(); unsubCases(); };
  }, [user]);

  // Sync Current Case
  useEffect(() => {
    if (!consultationId || !user || !isConfigValid) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', consultationId), (snap) => {
      if (snap.exists()) {
        setFormData(snap.data());
        setStatus(snap.data().status);
      }
    }, (err) => console.error(err));
    return () => unsub();
  }, [consultationId, user]);

  // Filter History in memory
  useEffect(() => {
    if (!formData.mobileNo && !formData.aadharNo) { setPatientHistory([]); return; }
    const history = consultationsList.filter(c => 
      c.id !== consultationId && 
      ((formData.aadharNo && c.aadharNo === formData.aadharNo) || (formData.mobileNo && c.mobileNo === formData.mobileNo))
    );
    setPatientHistory(history);
  }, [formData.mobileNo, formData.aadharNo, consultationsList, consultationId]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const initiateConsultation = async () => {
    if (!user) return showMessage("Authentication required");
    if (!formData.doctorId || !formData.patientName) return showMessage("Please select a Doctor and enter Name");
    const cId = `CASE-${Date.now()}`;
    const newCase = { ...formData, id: cId, status: 'pending', patientId: `PAT-${Date.now()}` };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', cId), newCase);
    setConsultationId(cId);
    setStatus('pending');
    showMessage("Session Started Successfully");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-slate-300 mx-auto mb-4" size={48} />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Waking up database...</p>
      </div>
    </div>
  );

  if (!isConfigValid) return (
    <div className="h-screen flex items-center justify-center p-8 bg-slate-100">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md border border-slate-200 text-center">
        <AlertCircle className="text-red-500 mx-auto mb-6" size={64} />
        <h1 className="text-2xl font-bold mb-4">Setup Required</h1>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">
          Please paste your <b>Firebase Config</b> keys into the <code>firebaseConfig</code> object at the top of <code>prescription_app.jsx</code> to enable the cloud features.
        </p>
        <div className="p-4 bg-slate-50 rounded-xl text-left font-mono text-[10px] text-slate-400">
          apiKey: "AIzaSy..."<br/>
          projectId: "patnam-clinic..."
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {msg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl animate-in slide-in-from-top-4">
          {msg}
        </div>
      )}

      <nav className="bg-white px-8 py-4 flex justify-between items-center shadow-sm border-b no-print sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Stethoscope className="text-slate-900" size={24} />
          <h1 className="font-bold uppercase tracking-tight text-slate-900">Clinic Hub</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRole('admin')} className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all ${role === 'admin' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}>Admin Hub</button>
          <button onClick={() => setRole('doctor')} className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all ${role === 'doctor' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}>Doctor Hub</button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {status === 'completed' && role === 'doctor' ? (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <div className="bg-white p-10 rounded-3xl border shadow-sm text-center mb-10 no-print">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold uppercase text-slate-900">Case Finalized</h2>
              <div className="flex gap-4 justify-center mt-8">
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-3 rounded-2xl text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-black transition-all shadow-lg"><Printer size={16} /> Print Prescription</button>
                <button onClick={() => { window.location.search = ''; }} className="bg-slate-100 text-slate-600 px-10 py-3 rounded-2xl text-[10px] font-bold uppercase">Return to Dashboard</button>
              </div>
            </div>
            <GeneratedPrescription data={formData} doctor={doctorsList.find(d => d.id === formData.doctorId)} />
          </div>
        ) : role === 'admin' ? (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border no-print shadow-sm overflow-x-auto">
              <button onClick={() => setAdminActiveTab('register')} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${adminActiveTab === 'register' ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-400'}`}><UserPlus size={14} /> Patient Entry</button>
              <button onClick={() => setAdminActiveTab('staff')} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${adminActiveTab === 'staff' ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-400'}`}><Users size={14} /> Manage Staff</button>
              <button onClick={() => setAdminActiveTab('table')} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${adminActiveTab === 'table' ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-400'}`}><Table size={14} /> Case Log</button>
            </div>

            {adminActiveTab === 'register' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-10 rounded-3xl border shadow-sm">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 border-b pb-4"><UserCheck size={14} /> Intake Info</h3>
                    <input type="text" name="patientName" placeholder="Full Name" value={formData.patientName} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white transition-all" />
                    <div className="grid grid-cols-2 gap-4">
                       <input type="text" name="age" placeholder="Age" value={formData.age} onChange={handleInputChange} className="p-4 bg-slate-50 border rounded-2xl text-sm outline-none" />
                       <select name="gender" value={formData.gender} onChange={handleInputChange} className="p-4 bg-slate-50 border rounded-2xl text-sm outline-none">
                         <option>Male</option><option>Female</option>
                       </select>
                    </div>
                    <input type="text" name="mobileNo" placeholder="Mobile / Aadhar" value={formData.mobileNo} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none" />
                    <select name="doctorId" value={formData.doctorId} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                      <option value="">-- Assign Specialist --</option>
                      {doctorsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 border-b pb-4"><Activity size={14} /> Vitals</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 ml-2">BP</label><input type="text" name="bp" placeholder="120/80" value={formData.bp} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center outline-none" /></div>
                      <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 ml-2">Pulse</label><input type="text" name="pulse" placeholder="72" value={formData.pulse} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center outline-none" /></div>
                      <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 ml-2">Wt (kg)</label><input type="text" name="weight" placeholder="00.0" value={formData.weight} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center outline-none" /></div>
                      <div className="space-y-1"><label className="text-[8px] font-bold text-red-400 ml-2">GRBS</label><input type="text" name="grbs" placeholder="---" value={formData.grbs} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center outline-none font-bold text-red-600" /></div>
                    </div>
                  </div>
                  <button onClick={initiateConsultation} className="md:col-span-2 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-black transition-all">Start Clinical Session</button>
                </div>
                <div className="bg-slate-100/50 p-6 md:p-8 rounded-3xl border border-dashed border-slate-300">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2"><History size={14} /> Clinical Archive</h3>
                  <div className="space-y-2">
                    {patientHistory.map(h => (
                      <div key={h.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border shadow-sm transition-all hover:border-slate-300">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">{h.date}</span>
                          <span className="text-xs font-semibold text-slate-800">{h.provisionalDiagnosis || "General Checkup"}</span>
                        </div>
                        <button onClick={() => setViewingOldRecord(h)} className="text-[9px] font-black uppercase text-blue-600 underline">View Record</button>
                      </div>
                    ))}
                    {patientHistory.length === 0 && <p className="text-xs text-slate-400 italic text-center p-4">No past records for this ID.</p>}
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'staff' && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
                <div className="bg-white p-8 md:p-10 rounded-3xl border shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase border-b pb-4 tracking-widest flex items-center gap-2 text-slate-400"><Users size={14} /> Specialist Registration</h3>
                  <input type="text" placeholder="Dr. Name" value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Designation" value={docForm.designation} onChange={e => setDocForm({ ...docForm, designation: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
                    <input type="text" placeholder="Qualification" value={docForm.qualification} onChange={e => setDocForm({ ...docForm, qualification: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
                  </div>
                  <input type="text" placeholder="Registration No" value={docForm.registration} onChange={e => setDocForm({ ...docForm, registration: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
                  <input type="text" placeholder="Address (Single Line)" value={docForm.address} onChange={e => setDocForm({ ...docForm, address: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
                  <input type="text" placeholder="Phone" value={docForm.phone} onChange={e => setDocForm({ ...docForm, phone: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
                  <button onClick={async () => {
                    const id = `DOC-${Date.now()}`;
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'doctors', id), { ...docForm, id });
                    setDocForm({ name: '', qualification: '', designation: '', registration: '', address: '', phone: '', active: true });
                    showMessage("Doctor Profile Saved");
                  }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Save Profile to Cloud</button>
                </div>
                <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                  {doctorsList.map(d => (
                    <div key={d.id} className="p-6 border-b flex justify-between items-center transition-colors hover:bg-slate-50/50">
                      <div><p className="font-bold text-slate-900">{d.name}</p><p className="text-slate-400 uppercase text-[9px] font-bold mt-0.5">{d.designation}</p></div>
                      <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'doctors', d.id)); showMessage("Specialist Removed"); }} className="text-red-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminActiveTab === 'table' && (
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b tracking-widest">
                    <tr><th className="px-6 py-5">Date</th><th className="px-6 py-5">Patient Name</th><th className="px-6 py-5">Status</th><th className="px-6 py-5 text-right">Coordination</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consultationsList.sort((a,b) => b.date.localeCompare(a.date)).map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-800">{c.date}</td>
                        <td className="px-6 py-5 uppercase font-bold text-slate-900">{c.patientName}</td>
                        <td className="px-6 py-5 uppercase text-[8px] font-black">
                          <span className={`px-2 py-1 rounded border ${c.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{c.status}</span>
                        </td>
                        <td className="px-6 py-5 text-right"><a href={`?consultationId=${c.id}`} target="_blank" rel="noreferrer" className="text-blue-600 font-black uppercase text-[9px] hover:underline flex items-center justify-end gap-1">Doctor Portal <ExternalLink size={10} /></a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
            <div className="bg-white p-8 md:p-10 rounded-3xl border shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 mb-6">Patient Session</h4>
              <p className="text-3xl font-bold uppercase tracking-tight text-slate-900">{formData.patientName || "Waiting for case..."}</p>
              <div className="grid grid-cols-4 gap-4 md:gap-6 mt-6">
                {['bp', 'pulse', 'weight', 'grbs'].map(f => (
                  <div key={f} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{f}</p>
                    <p className="text-sm font-bold text-slate-900">{formData[f] || "---"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 md:p-10 rounded-3xl border shadow-sm space-y-6">
              <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Chief Complaints</label><textarea name="chiefComplaint" placeholder="..." rows="3" value={formData.chiefComplaint} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:bg-white transition-all" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">History (HPI)</label><textarea name="history" placeholder="..." rows="4" value={formData.history} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:bg-white transition-all" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Physical Examination</label><textarea name="examination" placeholder="..." rows="4" value={formData.examination} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm italic focus:bg-white transition-all" /></div>
              
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Previous Investigations Analysis</label><textarea name="reportsSummary" placeholder="..." rows="2" value={formData.reportsSummary} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm italic" /></div>
                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Provisional Diagnosis</label><textarea name="provisionalDiagnosis" placeholder="..." rows="2" value={formData.provisionalDiagnosis} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" /></div>
                <div className="space-y-1"><label className="text-[9px] font-bold text-red-400 ml-2 uppercase underline">Investigations Advised</label><textarea name="investigationsAdvised" placeholder="..." rows="2" value={formData.investigationsAdvised} onChange={handleInputChange} className="w-full p-5 bg-red-50/10 border border-red-100 rounded-2xl outline-none text-sm font-bold text-red-900" /></div>
              </div>

              <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200">
                <h4 className="text-[10px] font-black uppercase mb-4 tracking-widest flex items-center gap-2 text-slate-400"><Pill size={16} /> Prescription (Rx)</h4>
                <textarea name="medications" placeholder="1. Drug Name - Dosage - Timing - Duration" rows="8" value={formData.medications} onChange={handleInputChange} className="w-full p-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono text-sm leading-7 shadow-inner" />
              </div>

              <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Advice</label><textarea name="advice" placeholder="..." rows="2" value={formData.advice} onChange={handleInputChange} className="w-full p-5 bg-slate-50 border rounded-2xl outline-none text-sm focus:bg-white" /></div>

              <button onClick={async () => {
                if(!consultationId) return;
                try {
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', consultationId), { ...formData, status: 'completed' });
                  showMessage("Dispatched Successfully");
                } catch (e) {
                  showMessage("Update failed");
                }
              }} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-black transition-all">Finalize Session & Dispatch</button>
            </div>
          </div>
        )}
      </main>

      {/* Record Archive Modal */}
      {viewingOldRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-12 relative shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setViewingOldRecord(null)} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X /></button>
            <GeneratedPrescription data={viewingOldRecord} doctor={doctorsList.find(d => d.id === viewingOldRecord.doctorId)} />
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .prescription-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 10mm !important; border: none !important; }
        }
        .signature-area { font-family: 'Brush Script MT', cursive; }
        input::placeholder, textarea::placeholder { color: #cbd5e1; }
      `}</style>
    </div>
  );
}
