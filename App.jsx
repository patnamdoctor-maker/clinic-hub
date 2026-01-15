import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Activity, Stethoscope, Microscope, 
  History, Send, Loader2, Weight,
  RefreshCw, Eye, Info, BarChart3, Table as TableIcon, 
  UserPlus, Clock, CheckCircle2, Calendar, Filter, ClipboardCheck,
  IndianRupee, Pill, Save, FileText, Check, X, Search, UserCheck, 
  Droplets, CreditCard, Wallet, Users, Trash2, Plus
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, 
  onSnapshot, updateDoc, query, where, getDocs, deleteDoc, addDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';

// --- Firebase Initialization ---
// Fixed: Renamed defaultConfig to firebaseConfig and added a check for the environment variable
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyCttsHAE-UPhhBbSwafpt-kxa_priQZkyI",
      authDomain: "patnam-clinic-hub.firebaseapp.com",
      projectId: "patnam-clinic-hub",
      storageBucket: "patnam-clinic-hub.firebasestorage.app",
      messagingSenderId: "819118122911",
      appId: "1:819118122911:web:e3b9f8ebad901db1bbbfaa",
      measurementId: "G-DYHEGBH36V"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'clinic-app-v2';

// --- Shared Component: Past Records List ---
const PastRecordsTimeline = ({ records, onSelectPrescription, onSelectReports }) => (
  <div className="space-y-2">
    {records.length === 0 ? (
      <p className="text-xs text-slate-400 italic p-4 text-center border rounded-xl border-dashed bg-slate-50/50">No previous records found.</p>
    ) : (
      records.sort((a,b) => b.date.localeCompare(a.date)).map((rec) => (
        <div key={rec.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{rec.date}</span>
            <span className="text-xs font-semibold text-slate-800">{rec.provisionalDiagnosis || "General Checkup"}</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => onSelectPrescription(rec)} className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase underline text-left">Prescription</button>
            <button onClick={() => onSelectReports(rec)} className="text-[10px] text-slate-600 hover:text-slate-900 font-bold uppercase underline text-left">Reports</button>
          </div>
        </div>
      ))
    )}
  </div>
);

// --- Shared Component: Prescription Preview ---
const PrescriptionPreview = ({ data, doctors }) => {
  const selectedDoctor = doctors.find(d => d.id === data.doctorId || d.name === data.doctorName);
  
  return (
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] mx-auto p-12 relative font-serif border border-slate-100 shadow-sm">
      <div className="text-center border-b-[2px] border-slate-900 pb-6 mb-8">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">SUPER SPECIALITY CLINIC</h1>
        <h2 className="text-lg font-bold text-slate-600">PATNAM DOCTOR</h2>
      </div>

      <div className="flex justify-between text-[11px] mb-8 pb-3 border-b border-slate-100 font-sans uppercase text-slate-500">
        <div>
          <p>Date: <span className="text-slate-900 font-bold">{data.date}</span></p>
          <p>ID: <span className="text-slate-900 font-bold">{data.patientId || "---"}</span></p>
        </div>
        <div className="text-right">
          <p>Provider: <span className="text-slate-900 font-bold">{selectedDoctor?.name || data.doctorName || "---"}</span></p>
          <p className="text-[9px] opacity-60">Reg No: {selectedDoctor?.registration || "---"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 text-[12px] bg-slate-50 p-6 border border-slate-100 rounded-xl font-sans text-left">
        <p className="flex justify-between border-b border-slate-200 pb-1"><span>Patient</span> <span className="font-bold">{data.patientName || "---"}</span></p>
        <p className="flex justify-between border-b border-slate-200 pb-1"><span>Age/Sex</span> <span className="font-bold">{data.age || "---"} / {data.gender}</span></p>
        <p className="flex justify-between border-b border-slate-200 pb-1"><span>Weight</span> <span className="font-bold">{data.weight ? `${data.weight} kg` : "---"}</span></p>
        <p className="flex justify-between border-b border-slate-200 pb-1"><span>Vitals</span> <span className="font-bold">{data.bp || "---"} BP | {data.grbs || "---"} GRBS</span></p>
      </div>

      <div className="space-y-6 text-[13px] font-sans text-left">
        <section><h4 className="font-bold text-[10px] uppercase text-slate-400 border-b mb-2">History</h4><p className="text-slate-700">{data.history || "---"}</p></section>
        <section><h4 className="font-bold text-[10px] uppercase text-slate-400 border-b mb-2">Findings</h4><p className="text-slate-700 italic">{data.examination || "---"}</p></section>
        <section><h4 className="font-bold text-[10px] uppercase text-slate-400 border-b mb-2">Diagnosis</h4><p className="font-bold text-slate-800">{data.provisionalDiagnosis || "---"}</p></section>
        <section className="pt-4">
          <p className="text-2xl font-serif italic text-slate-300 mb-2">Rx</p>
          <div className="pl-4 font-mono text-[13px] whitespace-pre-wrap">{data.medications || "No medications prescribed."}</div>
        </section>
        <section className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-[9px] uppercase text-slate-400 mb-1">Instructions</h4>
          <p>{data.advice || "Standard monitoring advised."}</p>
        </section>
      </div>
    </div>
  );
};

// --- Component: Administrative Dashboard ---
const AdminModule = ({ 
  formData, handleInputChange, onInitiate, onUpdate, status, 
  consultationsList, updateBillingStatus, doctors,
  patientHistory, setViewingOldRecord, setViewingOldReports, activeTab, setActiveTab, setFormData, setStatus, setConsultationId, consultationId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [adminMode, setAdminMode] = useState('registration');
  const [newDoctor, setNewDoctor] = useState({ name: '', registration: '', qualification: '', email: '' });
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const setShortcut = (days) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
    setDateRange({ start, end });
  };

  const filteredConsultations = useMemo(() => {
    return consultationsList.filter(c => {
      if (!c.date) return false;
      return c.date >= dateRange.start && c.date <= dateRange.end;
    });
  }, [consultationsList, dateRange]);

  const handleSearch = () => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return;

    const match = consultationsList.find(c => 
      c.aadharNo?.includes(term) ||
      c.mobileNo?.includes(term) ||
      c.patientName?.toLowerCase().includes(term) ||
      c.patientId?.toLowerCase().includes(term)
    );

    if (match) {
      setFormData({
        ...formData,
        patientName: match.patientName,
        aadharNo: match.aadharNo,
        patientEmail: match.patientEmail,
        mobileNo: match.mobileNo,
        age: match.age,
        gender: match.gender,
        permanentHistory: match.permanentHistory || "",
        address: match.address || ""
      });
      setStatus('idle');
      setConsultationId(null);
      setAdminMode('consultation');
    } else {
      alert("No match found. Proceed with Registration.");
      setAdminMode('registration');
    }
  };

  const addDoctorToDb = async () => {
    if (!newDoctor.name || !newDoctor.registration) return;
    try {
      const docRef = collection(db, 'artifacts', appId, 'public', 'data', 'doctors');
      await addDoc(docRef, { ...newDoctor, id: `DOC-${Date.now()}` });
      setNewDoctor({ name: '', registration: '', qualification: '', email: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const removeDoctorFromDb = async (id) => {
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), where("id", "==", id));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'doctors', d.id));
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <nav className="flex bg-white p-1 rounded-xl mb-8 border border-slate-200 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'metrics', label: 'Overview', icon: BarChart3 },
          { id: 'register', label: 'Patient Page', icon: UserPlus },
          { id: 'followup', label: 'Follow-ups', icon: ClipboardCheck },
          { id: 'table', label: 'Case Log', icon: TableIcon },
          { id: 'staff', label: 'Staff Management', icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[10px] font-bold uppercase transition-all ${
              activeTab === tab.id ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4">
             <div className="flex gap-2">
              {[{ label: 'Today', d: 0 }, { label: '1W', d: 7 }, { label: '1M', d: 30 }, { label: '1Y', d: 365 }].map(s => (
                <button key={s.label} onClick={() => setShortcut(s.d)} className="px-3 py-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold uppercase transition-all">{s.label}</button>
              ))}
            </div>
            <div className="flex flex-1 gap-2">
               <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none" />
               <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'followup', label: 'Follow-ups', count: filteredConsultations.filter(c => c.investigationsAdvised?.trim()).length, icon: Microscope },
              { id: 'metrics', label: 'Visits', count: filteredConsultations.length, icon: User },
              { id: 'metrics', label: 'Waiting', count: filteredConsultations.filter(c => c.status === 'pending').length, icon: Clock },
              { id: 'metrics', label: 'Revenue', count: `₹${filteredConsultations.reduce((acc, curr) => acc + (Number(curr.consultationAmount) || 0) + (Number(curr.medicineAmount) || 0) + (Number(curr.diagnosticsAmount) || 0), 0)}`, icon: IndianRupee }
            ].map(m => (
              <div key={m.label} onClick={() => m.id === 'followup' && setActiveTab('followup')} className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col items-center text-center hover:border-slate-400 transition-all cursor-pointer">
                <m.icon className="text-slate-400 mb-3" size={20} />
                <p className="text-[10px] font-bold uppercase text-slate-500">{m.label}</p>
                <h4 className={`text-2xl font-bold text-slate-900 mt-1`}>{m.count}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'register' && (
        <div className="space-y-6 pb-24 max-w-4xl mx-auto">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-3">
             <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                type="text" 
                placeholder="Search patient record to skip registration..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-semibold focus:border-slate-400"
               />
             </div>
             <button onClick={handleSearch} className="px-8 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-wide hover:bg-black transition-all">Find</button>
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={() => setAdminMode('registration')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-bold uppercase transition-all ${adminMode === 'registration' ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-50'}`}>
              <User size={15} /> 1. Registration
            </button>
            <button onClick={() => setAdminMode('consultation')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-bold uppercase transition-all ${adminMode === 'consultation' ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-50'}`}>
              <Stethoscope size={15} /> 2. Consultation
            </button>
          </div>

          {adminMode === 'registration' && (
            <section className="p-8 bg-white rounded-2xl border border-slate-200 animate-in slide-in-from-left-4 duration-300">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 border-b pb-4 flex items-center gap-2 tracking-widest"><User size={14} /> Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Patient Name</label>
                  <input type="text" name="patientName" placeholder="Full Name" value={formData.patientName} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Aadhar / ID Number</label>
                  <input type="text" name="aadharNo" placeholder="UID" value={formData.aadharNo} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Age</label>
                    <input type="text" name="age" value={formData.age} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"><option>Male</option><option>Female</option><option>Other</option></select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Mobile Number</label>
                  <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                </div>
                <div className="md:col-span-2 mt-4">
                  <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Permanent Medical History</label>
                  <textarea name="permanentHistory" placeholder="List known conditions, allergies..." value={formData.permanentHistory} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm italic outline-none h-24 resize-none focus:border-slate-400" />
                </div>
              </div>
            </section>
          )}

          {adminMode === 'consultation' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <section className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><History size={14} /> Historical Archive</h3>
                    <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-1 border rounded uppercase">{patientHistory.length} Past Visits Found</span>
                  </div>
                  <PastRecordsTimeline records={patientHistory} onSelectPrescription={setViewingOldRecord} onSelectReports={setViewingOldReports} />
               </section>

               <section className="p-8 bg-white rounded-2xl border border-slate-200">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 border-b pb-4 flex items-center gap-2 tracking-widest"><Activity size={14} /> Intake & Vitals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-bold uppercase text-slate-500 ml-1 mb-2 block">Assign Attending Specialist</label>
                      <select name="doctorId" value={formData.doctorId} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-slate-400 appearance-none">
                        <option value="">-- Choose Specialist --</option>
                        {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
                       <input type="text" name="weight" placeholder="Wt (kg)" value={formData.weight} onChange={handleInputChange} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold outline-none" />
                       <input type="text" name="bp" placeholder="BP" value={formData.bp} onChange={handleInputChange} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold outline-none" />
                       <input type="text" name="pulse" placeholder="Pulse" value={formData.pulse} onChange={handleInputChange} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold outline-none" />
                       <input type="text" name="grbs" placeholder="GRBS" value={formData.grbs} onChange={handleInputChange} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-red-700 outline-none" />
                    </div>
                  </div>
               </section>

               <section className="p-8 bg-white rounded-2xl border border-slate-200 space-y-6 text-left">
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><Stethoscope size={14} /> Specialist Feedback Summary</h3>
                    {status === 'pending' && <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Session in Progress</span>}
                  </div>
                  
                  {status === 'idle' ? (
                    <div className="p-10 text-center text-slate-300 text-xs italic border border-dashed rounded-xl">Specialist notes will appear once session begins.</div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in">
                       <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Primary Diagnosis & Findings</p>
                          <p className="text-sm font-bold text-slate-900 leading-snug">{formData.provisionalDiagnosis || "Assessment pending..."}</p>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Investigations Advised</p>
                             <p className="text-xs font-bold text-red-700 italic">{formData.investigationsAdvised || "None recorded."}</p>
                          </div>
                          <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Clinic Advice</p>
                             <p className="text-xs font-medium text-slate-700">{formData.advice || "Standard care monitoring."}</p>
                          </div>
                       </div>

                       {formData.medications && (
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Pill size={12} /> Prescribed Treatment (Rx)</p>
                          <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">{formData.medications}</pre>
                        </div>
                       )}
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4">Financial Coordination</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase">Consultation (₹)</label>
                        <input type="number" name="consultationAmount" value={formData.consultationAmount} onChange={handleInputChange} placeholder="0" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-slate-400 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase">Medicine (₹)</label>
                        <input type="number" name="medicineAmount" value={formData.medicineAmount} onChange={handleInputChange} placeholder="0" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-slate-400 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase">Diagnostics (₹)</label>
                        <input type="number" name="diagnosticsAmount" value={formData.diagnosticsAmount} onChange={handleInputChange} placeholder="0" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-slate-400 outline-none" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                        <select name="paymentMode" value={formData.paymentMode || "Paid"} onChange={handleInputChange} className="bg-white border border-slate-200 text-[10px] font-bold uppercase p-1.5 rounded-lg outline-none">
                          <option value="Paid">Paid</option>
                          <option value="Credit">Credit</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                         {[{ id: 'feePaid', label: 'Cons' }, { id: 'diagPaid', label: 'Labs' }, { id: 'medsPaid', label: 'Meds' }].map(p => (
                           <button 
                            key={p.id} 
                            onClick={() => updateBillingStatus(p.id, !formData[p.id])}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${formData[p.id] ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                           >
                             {formData[p.id] ? 'Collected' : p.label}
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>
               </section>
            </div>
          )}

          <div className="fixed bottom-6 left-0 right-0 px-6 z-20 pointer-events-none">
            <div className="max-w-4xl mx-auto flex justify-center pointer-events-auto">
              <button 
                onClick={status === 'idle' && adminMode === 'consultation' ? onInitiate : onUpdate} 
                className="w-full sm:w-80 bg-slate-900 text-white py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-wide shadow-md active:scale-95 transition-all hover:bg-black"
              >
                {status === 'idle' && adminMode === 'consultation' ? 'Start Consultation' : 'Save Patient Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-6 pb-24 max-w-4xl mx-auto animate-in fade-in">
          <section className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-left">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 border-b pb-4 flex items-center gap-2 tracking-widest"><Users size={14} /> Add New Specialist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Doctor Name" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              <input type="text" placeholder="Registration No." value={newDoctor.registration} onChange={e => setNewDoctor({...newDoctor, registration: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              <input type="text" placeholder="Qualification" value={newDoctor.qualification} onChange={e => setNewDoctor({...newDoctor, qualification: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              <input type="email" placeholder="Email" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <button onClick={addDoctorToDb} className="mt-4 flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wide hover:bg-black">
              <Plus size={14} /> Add Doctor
            </button>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left text-[11px]">
               <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase border-b tracking-widest">
                 <tr>
                   <th className="px-6 py-4">Name</th>
                   <th className="px-6 py-4">Registration</th>
                   <th className="px-6 py-4">Qualification</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {doctors.map(d => (
                   <tr key={d.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-bold text-slate-800">{d.name}</td>
                     <td className="px-6 py-4 text-slate-500">{d.registration}</td>
                     <td className="px-6 py-4 text-slate-500">{d.qualification}</td>
                     <td className="px-6 py-4 text-right">
                       <button onClick={() => removeDoctorFromDb(d.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </section>
        </div>
      )}

      {activeTab === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase border-b tracking-widest">
                <tr>
                  <th className="px-4 py-4">Date & ID</th>
                  <th className="px-4 py-4">Patient Name</th>
                  <th className="px-4 py-4">Specialist</th>
                  <th className="px-4 py-4">Total Fee</th>
                  <th className="px-4 py-4">Mode</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConsultations.sort((a,b) => b.date.localeCompare(a.date)).map((c) => {
                  const total = (Number(c.consultationAmount) || 0) + (Number(c.medicineAmount) || 0) + (Number(c.diagnosticsAmount) || 0);
                  const docName = doctors.find(d => d.id === c.doctorId || d.name === c.doctorName)?.name || "---";
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-800">{c.date}</div>
                        <div className="text-[9px] text-slate-400">{c.patientId || "---"}</div>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-800 uppercase">{c.patientName}</td>
                      <td className="px-4 py-4 text-slate-600">{docName}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">₹{total}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase border ${c.paymentMode === 'Credit' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                          {c.paymentMode || 'Paid'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => { setConsultationId(c.id); setFormData(c); setStatus(c.status); setActiveTab('register'); setAdminMode('consultation'); }} className="text-slate-900 font-bold uppercase text-[10px] hover:underline">Open Session</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'followup' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase border-b tracking-widest"><tr><th className="px-6 py-4">Patient</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsultations.filter(c => c.investigationsAdvised?.trim()).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 uppercase">{c.patientName}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => { setConsultationId(c.id); setFormData(c); setStatus(c.status); setActiveTab('register'); setAdminMode('consultation'); }} className="text-slate-900 font-bold uppercase text-[10px] hover:underline text-left">Review Case</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Component: Specialist Portal ---
const DoctorModule = ({ formData, handleInputChange, onSubmit, mailingStatus, doctors, patientHistory, setViewingOldRecord, setViewingOldReports }) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in">
      <div className="p-6 bg-slate-100 border border-slate-200 rounded-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-2"><Info size={14} /> Clinical Summary</h4>
          {patientHistory.length > 0 && (
             <button onClick={() => setShowHistory(!showHistory)} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 hover:bg-slate-50">{showHistory ? "Back to Current" : `History (${patientHistory.length})`}</button>
          )}
        </div>
        
        {showHistory ? (
          <div className="mb-4 max-h-96 overflow-y-auto bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
             <PastRecordsTimeline records={patientHistory} onSelectPrescription={setViewingOldRecord} onSelectReports={setViewingOldReports} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 mb-6 text-left">
            <div><p className="text-xl font-bold uppercase text-slate-900">{formData.patientName || "---"}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{formData.age}Y / {formData.gender}</p></div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-slate-600">{formData.bp || "---"} BP | {formData.pulse || "---"} HR</span>
              <span className="text-[10px] font-bold text-slate-600">{formData.grbs || "---"} GRBS | {formData.weight || "---"} kg</span>
            </div>
          </div>
        )}
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-500 italic text-left">{formData.history || "No notes available."}</div>
      </div>

      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 text-left">
        <textarea name="examination" placeholder="Findings..." rows="4" value={formData.examination} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-slate-400" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea name="provisionalDiagnosis" placeholder="Diagnosis..." rows="3" value={formData.provisionalDiagnosis} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-sm focus:border-slate-400" />
          <textarea name="investigationsAdvised" placeholder="Tests..." rows="3" value={formData.investigationsAdvised} onChange={handleInputChange} className="w-full p-4 bg-red-50/20 border border-red-100 rounded-xl font-bold text-red-900 outline-none text-sm" />
        </div>
        <textarea name="reportsSummary" placeholder="Archive Analysis..." rows="3" value={formData.reportsSummary} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs italic outline-none focus:border-slate-400" />
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-[10px] uppercase text-slate-400 mb-4 tracking-widest"><Stethoscope size={18} className="inline mr-2" /> Current Prescription</h4>
          <textarea name="medications" rows="10" placeholder="1. Medicine - Dose" value={formData.medications} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none font-mono text-sm leading-6" />
        </div>
        <textarea name="advice" placeholder="General Advice..." rows="2" value={formData.advice} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
        <button onClick={onSubmit} disabled={mailingStatus === 'sending'} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase text-[11px] tracking-widest hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          {mailingStatus === 'sending' ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Finalize Session
        </button>
      </div>
    </div>
  );
};

// --- App Root Controller ---
const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(true);
  const [consultationId, setConsultationId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [mailingStatus, setMailingStatus] = useState(null);
  const [consultationsList, setConsultationsList] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [viewingOldRecord, setViewingOldRecord] = useState(null);
  const [viewingOldReports, setViewingOldReports] = useState(null);
  const [adminActiveTab, setAdminActiveTab] = useState('register');
  const [doctors, setDoctors] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    doctorId: "", doctorName: "", patientId: "", patientName: "", patientEmail: "",
    age: "", gender: "Male", weight: "", mobileNo: "", aadharNo: "", address: "",
    bp: "", pulse: "", history: "", examination: "", provisionalDiagnosis: "",
    investigationsAdvised: "", medications: "", advice: "", permanentHistory: "",
    grbs: "", reportsSummary: "", paymentMode: "Paid",
    consultationAmount: 0, medicineAmount: 0, diagnosticsAmount: 0,
    feePaid: false, diagPaid: false, medsPaid: false
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { 
          await signInWithCustomToken(auth, __initial_auth_token); 
        } else { 
          await signInAnonymously(auth); 
        }
      } catch (err) {}
    };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false);
      const params = new URLSearchParams(window.location.search);
      const cId = params.get('consultationId');
      if (cId) { 
        setConsultationId(cId); 
        setRole('doctor'); 
      }
    });
    return () => unsubAuth();
  }, []);

  // Fetch Doctors List
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), (snap) => {
      setDoctors(snap.docs.map(doc => ({ ...doc.data(), dbId: doc.id })));
    }, (err) => console.error(err));
    return () => unsub();
  }, [user]);

  // Fetch Consultations
  useEffect(() => {
    if (!user || role !== 'admin') return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'consultations'), (snap) => {
      setConsultationsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error(err));
    return () => unsub();
  }, [user, role]);

  // Patient History Logic
  useEffect(() => {
    if (!user || (!formData.mobileNo && !formData.aadharNo)) { 
      setPatientHistory([]); 
      return; 
    }
    const history = consultationsList.filter(c => 
      c.id !== consultationId && (
        (formData.aadharNo && c.aadharNo === formData.aadharNo) || 
        (formData.mobileNo && c.mobileNo === formData.mobileNo)
      )
    );
    setPatientHistory(history);
  }, [formData.mobileNo, formData.aadharNo, consultationsList, consultationId]);

  // Sync Current Consultation
  useEffect(() => {
    if (!user || !consultationId) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', consultationId), (snap) => {
      if (snap.exists()) { 
        setFormData(snap.data()); 
        setStatus(snap.data().status); 
      }
    }, (err) => console.error(err));
    return () => unsub();
  }, [user, consultationId]);

  const handleInputChange = (e) => { 
    if (status === 'completed' && role === 'doctor') return; 
    const { name, value } = e.target;
    if (name === 'doctorId') {
      const doc = doctors.find(d => String(d.id) === String(value));
      setFormData(prev => ({ ...prev, doctorId: value, doctorName: doc?.name || "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value })); 
    }
  };

  const updateBillingStatus = async (field, value) => {
    if (!consultationId) { 
      setFormData(prev => ({ ...prev, [field]: value })); 
      return; 
    }
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', consultationId), { [field]: value });
  };

  const initiateConsultation = async () => {
    if (!formData.doctorId || !formData.patientName) { 
      alert("Doctor assignment and Patient Name required."); 
      return; 
    }
    const cId = `CASE-${Date.now()}`;
    const selectedDoc = doctors.find(d => String(d.id) === String(formData.doctorId));
    const newCase = { ...formData, patientId: `PAT-${Date.now()}`, status: 'pending', id: cId, doctorName: selectedDoc?.name || "" };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', cId), newCase);
    setConsultationId(cId);
    setStatus('pending');
    alert("Session Link: " + window.location.origin + window.location.pathname + "?consultationId=" + cId);
  };

  const updateCaseData = async () => {
    if (!consultationId) { 
      alert("Record details loaded locally. Start a session to save permanently."); 
      return; 
    }
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', consultationId), formData);
    alert("Record updated.");
  };

  const submitPrescription = async () => {
    if (!consultationId) return;
    setMailingStatus('sending');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', consultationId), { ...formData, status: 'completed' });
    setTimeout(() => { 
      setMailingStatus('sent'); 
      setStatus('completed'); 
    }, 1500);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 font-sans"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Historical Viewer Modals */}
      {viewingOldRecord && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-10 relative shadow-xl">
            <button onClick={() => setViewingOldRecord(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all z-10"><X size={24} /></button>
            <PrescriptionPreview data={viewingOldRecord} doctors={doctors} />
          </div>
        </div>
      )}
      {viewingOldReports && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-10 relative shadow-xl animate-in zoom-in-95">
            <button onClick={() => setViewingOldReports(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"><X size={24} /></button>
            <div className="p-8 border border-slate-200 rounded-xl min-h-[12rem] text-left">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Past Analysis ({viewingOldReports.date})</p>
               <p className="text-sm italic text-slate-700 leading-relaxed font-medium">{viewingOldReports.reportsSummary || "No summary recorded."}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white text-slate-900 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="flex items-center gap-3"><Stethoscope className="text-slate-900" size={20} /><h1 className="text-lg font-black uppercase tracking-tight">Clinic Hub</h1></div>
        <div className="flex items-center gap-3">
           <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold uppercase text-slate-600">{role === 'admin' ? 'Admin Hub' : 'Doctor Portal'}</div>
           {role === 'admin' && <button onClick={() => { window.location.search = ''; setConsultationId(null); setStatus('idle'); setAdminActiveTab('metrics'); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><RefreshCw size={18} /></button>}
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {status === 'completed' && role === 'doctor' ? (
          <div className="text-center p-20 bg-white rounded-3xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mx-auto mb-10 border border-slate-100"><Check size={32} /></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 uppercase">Case Finalized</h2>
            <button onClick={() => { window.location.search = ''; }} className="px-10 bg-slate-900 text-white py-3.5 rounded-xl font-bold uppercase text-[10px] hover:bg-black shadow-md">Back to Dashboard</button>
          </div>
        ) : role === 'admin' ? (
          <AdminModule 
            formData={formData} handleInputChange={handleInputChange} onInitiate={initiateConsultation} onUpdate={updateCaseData}
            status={status} consultationId={consultationId} consultationsList={consultationsList} updateBillingStatus={updateBillingStatus} 
            doctors={doctors}
            patientHistory={patientHistory} setViewingOldRecord={setViewingOldRecord} setViewingOldReports={setViewingOldReports}
            activeTab={adminActiveTab} setActiveTab={setAdminActiveTab} setFormData={setFormData} setStatus={setStatus} setConsultationId={setConsultationId}
          />
        ) : (
          <DoctorModule 
            formData={formData} handleInputChange={handleInputChange} onSubmit={submitPrescription} 
            mailingStatus={mailingStatus} status={status} doctors={doctors}
            patientHistory={patientHistory} setViewingOldRecord={setViewingOldRecord} setViewingOldReports={setViewingOldReports}
          />
        )}
      </main>
      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
