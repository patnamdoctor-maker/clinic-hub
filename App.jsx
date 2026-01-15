import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, 
  serverTimestamp, deleteDoc, getDocs, query, setDoc, getDoc, where
} from 'firebase/firestore';
import { 
  Activity, User, Stethoscope, Calendar, FileText, 
  Video, DollarSign, Printer, CheckCircle, 
  ChevronRight, LogOut, Plus, Upload, Pill, Pencil, X,
  Trash2, Settings, Search, Clock, CreditCard, History, Save, Briefcase, Filter, Mail, LayoutDashboard, Phone, Lock, AlertCircle
} from 'lucide-react';

/* --- FIREBASE CONFIGURATION --- */
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'patnam-clinic-default';

/* --- CONSTANTS --- */
const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/3063/3063822.png";
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const CLINIC_DETAILS = {
  name: "PATNAM DOCTOR SUPERSPECIALITY CLINIC",
  address: "123 Healthcare Blvd, Medicity, Hyderabad, Telangana 500081",
  phone: "+91 40 1234 5678",
  email: "info@patnamclinic.com",
};

// --- UTILS ---
const generateMeetingLink = (patientName) => {
  const safeName = patientName.replace(/\s+/g, '');
  const randomId = Math.random().toString(36).substring(7);
  return `https://meet.jit.si/PatnamClinic-${safeName}-${randomId}`;
};

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
};

const formatDate = (seconds) => {
    if (!seconds) return 'N/A';
    return new Date(seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// --- COMPONENTS ---

// 1. Availability Editor
const AvailabilityEditor = ({ availability = {}, onChange }) => {
    const addSlot = (day) => {
        const currentSlots = availability[day] || [];
        onChange({ ...availability, [day]: [...currentSlots, { start: "09:00", end: "13:00" }] });
    };
    const removeSlot = (day, index) => {
        const currentSlots = availability[day] || [];
        onChange({ ...availability, [day]: currentSlots.filter((_, i) => i !== index) });
    };
    const updateSlot = (day, index, field, value) => {
        const currentSlots = availability[day] || [];
        onChange({ ...availability, [day]: currentSlots.map((slot, i) => i === index ? { ...slot, [field]: value } : slot) });
    };

    return (
        <div className="space-y-4 border p-4 rounded-xl bg-slate-50/50 backdrop-blur-sm shadow-inner">
            <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-wider"><Clock size={16}/> Weekly Schedule</h4>
            {DAYS_OF_WEEK.map(day => {
                const slots = availability[day] || [];
                return (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-start gap-4 text-sm border-b border-slate-200 pb-2 last:border-0">
                        <div className="w-28 pt-2 font-semibold text-slate-800">{day}</div>
                        <div className="flex-1 space-y-2">
                            {slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input type="time" value={slot.start} onChange={(e) => updateSlot(day, idx, 'start', e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-2 ring-blue-500 outline-none" />
                                    <span className="text-slate-400 text-xs">to</span>
                                    <input type="time" value={slot.end} onChange={(e) => updateSlot(day, idx, 'end', e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-2 ring-blue-500 outline-none" />
                                    <button type="button" onClick={() => removeSlot(day, idx)} className="text-red-500 hover:text-red-700 p-1"><X size={14}/></button>
                                </div>
                            ))}
                            {slots.length === 0 && <span className="text-xs text-slate-400 italic pt-2 block">Unavailable</span>}
                            <button type="button" onClick={() => addSlot(day)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-1"><Plus size={12}/> Add Slot</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// 2. Header
const Header = ({ userRole, userName, onLogout, logo }) => (
  <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 shadow-lg shadow-blue-900/20 flex justify-between items-center print:hidden sticky top-0 z-50">
    <div className="flex items-center space-x-4">
      <div className="bg-white p-1.5 rounded-lg shadow-inner w-12 h-12 flex items-center justify-center">
        <img src={logo || DEFAULT_LOGO} alt="App Logo" className="w-full h-full object-contain" />
      </div>
      <div>
        <h1 className="font-bold text-lg md:text-xl tracking-widest uppercase font-sans text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white">{CLINIC_DETAILS.name}</h1>
        <p className="text-[10px] text-blue-200 tracking-wider uppercase">Premium Teleconsultation Suite</p>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      {userName && <span className="hidden md:inline text-xs font-medium text-blue-200 bg-white/5 px-3 py-1 rounded-full border border-white/10">Welcome, {userName}</span>}
      <span className="bg-blue-600/80 backdrop-blur-sm px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-400/30 shadow-lg">
        {userRole === 'admin' ? 'Master Admin' : userRole === 'reception' ? 'Reception Desk' : 'Doctor Panel'}
      </span>
      <button onClick={onLogout} className="text-blue-200 hover:text-white flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition border border-white/5"><LogOut size={14} /> Logout</button>
    </div>
  </div>
);

// 3. Prescription Preview - EXACT TEMPLATE MATCH
const PrescriptionPreview = ({ patient, doctor, clinicalData, onClose, onPrint, onEdit, readOnly, logo }) => {
  if (!patient || !doctor || !clinicalData) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-slate-900/80 backdrop-blur-sm z-[9999] overflow-auto flex justify-center py-8">
       <div 
         className="bg-white max-w-[210mm] w-full min-h-[297mm] p-8 print:p-0 relative shadow-2xl print:shadow-none print:m-0 print:w-full print:absolute print:top-0 print:left-0 flex flex-col"
         style={{ fontFamily: '"Aptos Body", "Calibri", "Arial", sans-serif' }} 
       >
        
        {/* Controls */}
        <div className="print:hidden flex justify-between mb-8 border-b pb-4 sticky top-0 bg-white z-10 font-sans">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600"/> Prescription Preview</h2>
            <div className="flex gap-3">
                {!readOnly && onEdit && <button onClick={onEdit} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 font-medium text-slate-700">Edit</button>}
                <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 font-medium text-slate-700">Close</button>
                <button onClick={onPrint} className="px-6 py-2 text-sm bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 shadow-lg shadow-blue-500/30"><Printer size={16}/> Print</button>
            </div>
        </div>

        {/* --- EXACT TEMPLATE STRUCTURE START (Using Table for Sticky Header/Footer) --- */}
        <table className="w-full text-black text-sm leading-snug">
            {/* Table Header: Repeats on every page */}
            <thead>
                <tr>
                    <td>
                        <div className="flex flex-col justify-center items-center border-b-2 border-black mb-4 pb-2">
                             <img src={logo || DEFAULT_LOGO} alt="Header" className="h-20 w-auto object-contain mb-2" />
                             <h2 className="font-bold text-lg uppercase tracking-wide">TELE CONSULTATION</h2>
                        </div>
                    </td>
                </tr>
            </thead>

            {/* Table Footer: Repeats on every page */}
            <tfoot>
                <tr>
                    <td>
                        <div className="h-auto pt-4 border-t-2 border-black text-xs text-center text-gray-600 mt-auto">
                            <p className="mb-1">{CLINIC_DETAILS.address} | Ph: {CLINIC_DETAILS.phone}</p>
                            <p className="italic">Remark: This is an electronically generated prescription.</p>
                        </div>
                    </td>
                </tr>
            </tfoot>

            {/* Table Body: Main Content */}
            <tbody>
                <tr>
                    <td className="align-top">
                        <div className="px-2">
                            {/* Metadata Row */}
                            <div className="flex justify-between items-start mb-4 text-sm">
                                <div className="w-1/3 pt-2">
                                <p><span className="font-bold">Date:</span> {patient.createdAt ? new Date(patient.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                </div>
                                <div className="w-2/3 text-right">
                                    <p className="font-bold text-lg uppercase">{doctor.name}</p>
                                    {doctor.designation && <p className="font-bold text-sm uppercase">{doctor.designation}</p>}
                                    <p className="text-sm">{doctor.qualification}</p>
                                    <p className="text-sm">{doctor.registration}</p>
                                </div>
                            </div>

                            {/* Patient Details Row */}
                            <div className="flex justify-between mb-2 text-sm font-medium">
                                <div className="flex-1"><span className="font-bold">Name:</span> {patient.name}</div>
                                <div className="flex-1 text-center"><span className="font-bold">Age/Sex:</span> {patient.age} / {patient.sex}</div>
                                <div className="flex-1 text-right"><span className="font-bold">Weight:</span> {patient.weight}</div>
                            </div>

                            {/* Vitals Row */}
                            <div className="flex justify-between mb-4 text-sm font-medium border-b border-black pb-2">
                                <div className="flex-1"><span className="font-bold">BP:</span> {patient.bp}</div>
                                <div className="flex-1 text-center"><span className="font-bold">Ph:</span> {patient.phone}</div>
                                <div className="flex-1 text-right"><span className="font-bold">Pulse:</span> {patient.pulse}</div>
                            </div>

                            {/* Clinical Body */}
                            <div className="space-y-3 text-sm">
                                
                                {patient.chronicConditions && (
                                    <div>
                                        <h3 className="font-bold underline mb-0.5 uppercase text-xs">History / Chronic Conditions:</h3>
                                        <p className="whitespace-pre-wrap pl-1 italic">{patient.chronicConditions}</p>
                                    </div>
                                )}

                                {clinicalData.chiefComplaint && (
                                    <div>
                                        <h3 className="font-bold underline mb-0.5">Chief Complaints:</h3>
                                        <p className="whitespace-pre-wrap pl-1">{clinicalData.chiefComplaint}</p>
                                    </div>
                                )}
                                
                                {clinicalData.history && (
                                    <div>
                                        <h3 className="font-bold underline mb-0.5">History:</h3>
                                        <p className="whitespace-pre-wrap pl-1">{clinicalData.history}</p>
                                    </div>
                                )}

                                {clinicalData.examFindings && (
                                    <div>
                                        <h3 className="font-bold underline mb-0.5">Examination:</h3>
                                        <p className="whitespace-pre-wrap pl-1">{clinicalData.examFindings}</p>
                                    </div>
                                )}

                                {clinicalData.provisionalDiagnosis && (
                                    <div>
                                        <h3 className="font-bold underline mb-0.5">Provisional Diagnosis:</h3>
                                        <p className="whitespace-pre-wrap pl-1">{clinicalData.provisionalDiagnosis}</p>
                                    </div>
                                )}

                                {clinicalData.prevInvestigations && (
                                    <div>
                                        <h3 className="font-bold underline mb-0.5">Previous Investigations:</h3>
                                        <p className="whitespace-pre-wrap pl-1">{clinicalData.prevInvestigations}</p>
                                    </div>
                                )}

                                {clinicalData.advisedInvestigations && (
                                    <div>
                                        <h3 className="font-bold underline mb-0.5">Investigations advised:</h3>
                                        <p className="whitespace-pre-wrap pl-1">{clinicalData.advisedInvestigations}</p>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <h3 className="font-bold underline mb-1 text-lg">Medications:</h3>
                                    <div className="whitespace-pre-wrap pl-1 font-mono text-sm min-h-[100px]">
                                        {clinicalData.medications}
                                    </div>
                                </div>

                                {clinicalData.followUp && (
                                    <div className="mt-4">
                                        <h3 className="font-bold underline mb-0.5">Advise:</h3>
                                        <p className="whitespace-pre-wrap pl-1">{clinicalData.followUp}</p>
                                    </div>
                                )}
                            </div>

                            {/* Signature Area */}
                            <div className="mt-8 flex flex-col items-end">
                                {doctor.signatureUrl ? (
                                    <img src={doctor.signatureUrl} alt="Signature" className="h-14 object-contain mb-1" />
                                ) : (
                                    <div className="h-14 mb-1 flex items-end font-cursive text-xl">Sign: ________________</div>
                                )}
                                <p className="font-bold text-center min-w-[200px]">({doctor.name})</p>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        {/* --- EXACT TEMPLATE STRUCTURE END --- */}
       </div>
    </div>
  );
};

// --- ADMIN VIEW ---

const AdminView = ({ appLogo, setAppLogo, prescriptionLogo, setPrescriptionLogo }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [doctors, setDoctors] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Date Filters
  const [filterType, setFilterType] = useState('today'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const [editingDocId, setEditingDocId] = useState(null);
  
  const [docForm, setDocForm] = useState({ name: '', spec: '', designation: '', email: '', password: '', qualification: '', registration: '', signatureUrl: '', availability: {} });
  const [recForm, setRecForm] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    const unsubDocs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), (snap) => setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRecs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'receptionists'), (snap) => setReceptionists(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCons = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'consultations'), (snap) => setAllConsultations(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubDocs(); unsubRecs(); unsubCons(); };
  }, []);

  // ... (Logo Upload & Handlers remain same)
  const handleLogoUpload = async (e, type) => {
      const file = e.target.files[0];
      if (file) {
          try {
            const base64 = await convertFileToBase64(file);
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), { [type]: base64 }, { merge: true });
            if(type === 'appLogo') setAppLogo(base64);
            if(type === 'prescriptionLogo') setPrescriptionLogo(base64);
            alert("Logo updated!");
          } catch (e) { console.error("Error", e); alert("Upload failed"); }
      }
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDocId) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'doctors', editingDocId), docForm); alert("Doctor updated"); setEditingDocId(null); } 
      else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), docForm); alert("Doctor added"); }
      setDocForm({ name: '', spec: '', designation: '', email: '', password: '', qualification: '', registration: '', signatureUrl: '', availability: {} });
    } catch (error) { console.error(error); alert("Operation failed."); }
  };

  const handleEditDoctor = (d) => {
      setEditingDocId(d.id);
      setDocForm({ name: d.name, spec: d.spec, designation: d.designation || '', email: d.email, password: d.password, qualification: d.qualification, registration: d.registration, signatureUrl: d.signatureUrl || '', availability: d.availability || {} });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredConsults = allConsultations.filter(c => {
      const docMatch = filterDoctor === 'all' || c.doctorId === filterDoctor;
      const statusMatch = filterStatus === 'all' || c.status === filterStatus;
      
      const pDate = c.createdAt ? new Date(c.createdAt.seconds * 1000) : new Date();
      const today = new Date();
      today.setHours(0,0,0,0);
      let dateMatch = true;
      
      if (filterType === 'today') dateMatch = pDate >= today;
      if (filterType === '7days') { const d = new Date(); d.setDate(d.getDate()-7); dateMatch = pDate >= d; }
      if (filterType === '30days') { const d = new Date(); d.setDate(d.getDate()-30); dateMatch = pDate >= d; }
      if (filterType === 'custom' && customRange.start && customRange.end) {
          dateMatch = pDate >= new Date(customRange.start) && pDate <= new Date(customRange.end);
      }

      return docMatch && statusMatch && dateMatch;
  });
  
  const totalRevenue = filteredConsults.reduce((acc, curr) => acc + (Number(curr.paymentAmount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3"><Settings className="text-blue-600"/> Master Administration</h2>
      <div className="flex flex-wrap gap-4 mb-8">
        {['dashboard', 'doctors', 'reception', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all shadow-sm ${activeTab === tab ? 'bg-blue-600 text-white shadow-blue-500/40 scale-105' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-xl border border-white/20">
                <div className="flex flex-wrap justify-between items-end mb-6 gap-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CreditCard size={24} className="text-blue-600"/> Financial & Ops Overview</h3>
                    <div className="flex gap-2 flex-wrap items-end">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1">Date Range</label>
                            <select className="border border-slate-200 p-2 rounded-lg bg-white text-sm font-medium focus:ring-2 ring-blue-500 outline-none" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="today">Today</option>
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        {filterType === 'custom' && (
                            <div className="flex gap-2">
                                <input type="date" className="border p-2 rounded-lg text-sm" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} />
                                <input type="date" className="border p-2 rounded-lg text-sm" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1">Filter by Doctor</label>
                            <select className="border border-slate-200 p-2 rounded-lg bg-white text-sm font-medium focus:ring-2 ring-blue-500 outline-none" value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)}><option value="all">All Doctors</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1">Status</label>
                            <select className="border border-slate-200 p-2 rounded-lg bg-white text-sm font-medium focus:ring-2 ring-blue-500 outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option></select>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/20"><p className="text-xs font-bold uppercase opacity-80">Total Revenue</p><p className="text-4xl font-bold mt-2">₹{totalRevenue.toLocaleString()}</p></div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100"><p className="text-xs font-bold uppercase text-slate-500">Consultations</p><p className="text-4xl font-bold text-slate-800 mt-2">{filteredConsults.length}</p></div>
                     <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100"><p className="text-xs font-bold uppercase text-slate-500">Active Doctors</p><p className="text-4xl font-bold text-slate-800 mt-2">{doctors.length}</p></div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50"><tr><th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Date</th><th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Patient</th><th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Doctor</th><th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Receptionist</th><th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Status</th><th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Payment</th></tr></thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {filteredConsults.map(c => (<tr key={c.id} className="hover:bg-blue-50/50 transition"><td className="px-6 py-4 text-slate-600">{formatDate(c.createdAt?.seconds)}</td><td className="px-6 py-4 font-semibold text-slate-800">{c.name}</td><td className="px-6 py-4 text-slate-600">{c.doctorName}</td><td className="px-6 py-4 text-slate-500">{c.receptionistName || 'Unknown'}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td><td className="px-6 py-4 font-bold text-slate-700">₹{c.paymentAmount}</td></tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* DOCTORS TAB */}
      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
            <h3 className="font-bold text-lg mb-6 text-slate-800 flex items-center gap-2 border-b pb-2"><Briefcase size={20} className="text-blue-600"/> {editingDocId ? 'Edit Doctor' : 'Register Doctor'}</h3>
            <form onSubmit={handleDocSubmit} className="space-y-4">
              <input required placeholder="Dr. Name" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} />
              <input required placeholder="Designation" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.designation} onChange={e => setDocForm({...docForm, designation: e.target.value})} />
              <input required placeholder="Specialization" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.spec} onChange={e => setDocForm({...docForm, spec: e.target.value})} />
              <input required placeholder="Qualification" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.qualification} onChange={e => setDocForm({...docForm, qualification: e.target.value})} />
              <input required placeholder="Registration No." className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.registration} onChange={e => setDocForm({...docForm, registration: e.target.value})} />
              <input required type="email" placeholder="Email" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.email} onChange={e => setDocForm({...docForm, email: e.target.value})} />
              <div className="relative">
                  <input required type="text" placeholder="Password (Visible to Admin)" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.password} onChange={e => setDocForm({...docForm, password: e.target.value})} />
                  <span className="absolute right-3 top-3 text-gray-400 text-xs">Visible</span>
              </div>
              
              <AvailabilityEditor availability={docForm.availability} onChange={(newAvail) => setDocForm({...docForm, availability: newAvail})} />
              <div className="border border-dashed border-slate-300 p-4 rounded-lg bg-slate-50"><label className="block text-xs font-bold mb-2 text-slate-500 uppercase">Upload Signature</label><input type="file" accept="image/*" onChange={(e) => {const file=e.target.files[0]; if(file) convertFileToBase64(file).then(b=>setDocForm({...docForm, signatureUrl:b}))}} className="text-sm w-full" /></div>
              <div className="flex gap-2 pt-2"><button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg">{editingDocId ? 'Update' : 'Register'}</button>{editingDocId && <button type="button" onClick={() => {setEditingDocId(null); setDocForm({ name: '', spec: '', designation: '', email: '', password: '', qualification: '', registration: '', signatureUrl: '', availability: {} })}} className="flex-1 bg-slate-500 text-white py-3 rounded-lg hover:bg-slate-600 font-bold">Cancel</button>}</div>
            </form>
          </div>
          <div className="lg:col-span-2 space-y-4">
             {doctors.map(d => (
               <div key={d.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition">
                 <div><h4 className="font-bold text-lg text-slate-800">{d.name}</h4><p className="text-sm font-semibold text-blue-600">{d.designation}</p><p className="text-xs text-slate-500 uppercase tracking-wide">{d.spec}</p></div>
                 <div className="flex items-center gap-2"><button onClick={() => handleEditDoctor(d)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg border border-blue-100"><Pencil size={18}/></button><button onClick={() => {if(window.confirm("Delete?")) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'doctors', d.id))}} className="text-red-500 hover:bg-red-50 p-2 rounded-lg border border-red-100"><Trash2 size={18}/></button></div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto animate-fade-in border border-slate-200">
              <h3 className="font-bold text-2xl mb-8 text-slate-800 flex items-center gap-2"><Settings className="text-blue-600"/> System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4"><label className="block font-bold text-slate-700">App Logo (Header)</label><div className="bg-slate-100 p-6 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center"><img src={appLogo || DEFAULT_LOGO} alt="Current App Logo" className="h-20 w-auto object-contain mb-4 shadow-sm rounded" /><input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'appLogo')} className="text-xs w-full text-slate-500"/></div></div>
                  <div className="space-y-4"><label className="block font-bold text-slate-700">Prescription Header Logo</label><div className="bg-slate-100 p-6 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center"><img src={prescriptionLogo || DEFAULT_LOGO} alt="Current Rx Logo" className="h-20 w-auto object-contain mb-4 shadow-sm rounded" /><input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'prescriptionLogo')} className="text-xs w-full text-slate-500"/></div></div>
              </div>
          </div>
      )}

      {/* RECEPTIONIST TAB */}
      {activeTab === 'reception' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xl h-fit border border-slate-200">
                <h3 className="font-bold text-lg mb-6 text-slate-800 border-b pb-2">Add Receptionist</h3>
                <form onSubmit={async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'receptionists'), recForm); alert('Added'); setRecForm({username:'', email: '', password:''}); }}>
                   <input required placeholder="Username" className="w-full border p-3 rounded-lg bg-slate-50 mb-4 outline-none focus:ring-2 ring-blue-500" value={recForm.username} onChange={e => setRecForm({...recForm, username: e.target.value})} />
                   <input required type="email" placeholder="Email (for notifications)" className="w-full border p-3 rounded-lg bg-slate-50 mb-4 outline-none focus:ring-2 ring-blue-500" value={recForm.email} onChange={e => setRecForm({...recForm, email: e.target.value})} />
                   <input required type="password" placeholder="Password" className="w-full border p-3 rounded-lg bg-slate-50 mb-4 outline-none focus:ring-2 ring-blue-500" value={recForm.password} onChange={e => setRecForm({...recForm, password: e.target.value})} />
                   <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition">Register User</button>
                </form>
             </div>
             <div className="lg:col-span-2 space-y-4">
                {receptionists.map(r => (<div key={r.id} className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center border border-slate-100"><div><span className="font-bold text-lg text-slate-800 block">{r.username}</span><span className="text-xs text-slate-500">{r.email}</span></div><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'receptionists', r.id))} className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition"><Trash2 size={18}/></button></div>))}
             </div>
          </div>
      )}
    </div>
  );
};

// --- RECEPTIONIST VIEW ---

const ReceptionistView = ({ user, currentUser, logo, prescriptionLogo }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [loading, setLoading] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Dashboard Filters
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('today'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  
  // Patient History State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState([]);
  const [selectedPatientName, setSelectedPatientName] = useState('');

  const [formData, setFormData] = useState({ name: '', age: '', sex: 'Male', phone: '', aadhaar: '', chronicConditions: '', bp: '', pulse: '', grbs: '', weight: '', doctorId: '', paymentMode: 'Cash', paymentAmount: '500' });

  useEffect(() => {
    const unsubDocs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), (snap) => setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCons = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'consultations')), (snap) => { const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); setConsultations(data); });
    const unsubPatients = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'patients'), (snap) => setPatients(snap.docs.map(d => d.data())));
    return () => { unsubDocs(); unsubCons(); unsubPatients(); };
  }, []);

  const handleSearch = (e) => { const query = e.target.value.toLowerCase(); setSearchQuery(query); if(query.length>2) setSearchResults(patients.filter(p => p.name.toLowerCase().includes(query) || (p.aadhaar && p.aadhaar.includes(query)) || (p.phone && p.phone.includes(query)))); else setSearchResults([]); };
  const selectPatient = (p) => { setFormData({ ...formData, name: p.name, age: p.age, sex: p.sex, aadhaar: p.aadhaar || '', chronicConditions: p.chronicConditions || '', phone: p.phone || '' }); setSearchQuery(''); setSearchResults([]); };

  const openPatientHistory = (patientName) => {
      const history = consultations.filter(c => c.name === patientName && c.status === 'completed');
      setSelectedPatientHistory(history);
      setSelectedPatientName(patientName);
      setHistoryModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId) return alert("Please select a doctor");
    setLoading(true);
    try {
      const doctor = doctors.find(d => d.id === formData.doctorId);
      const meetingLink = generateMeetingLink(formData.name); 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'consultations'), {
        ...formData, doctorName: doctor.name, doctorSpec: doctor.spec, doctorEmail: doctor.email, doctorId: doctor.id,
        receptionistId: currentUser.id, receptionistName: currentUser.username, status: 'pending', meetingLink, createdAt: serverTimestamp(), clinicalData: null
      });
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patients', `${formData.name}-${formData.aadhaar||Math.random()}`), { name: formData.name, age: formData.age, sex: formData.sex, aadhaar: formData.aadhaar, phone: formData.phone, chronicConditions: formData.chronicConditions });
      
      if (confirm(`Consultation Created! Send notifications?`)) {
          window.open(`mailto:${doctor.email},${currentUser.email || ''}?subject=New Consultation&body=Patient: ${formData.name}`);
      }
      setFormData({ name: '', age: '', sex: 'Male', phone: '', aadhaar: '', chronicConditions: '', bp: '', pulse: '', grbs: '', weight: '', doctorId: '', paymentMode: 'Cash', paymentAmount: '500' });
      setActiveTab('dashboard');
    } catch (err) { console.error(err); alert("Error"); } finally { setLoading(false); }
  };

  const filteredConsults = consultations.filter(c => {
      const docMatch = filterDoctor === 'all' || c.doctorId === filterDoctor;
      const statusMatch = filterStatus === 'all' || c.status === filterStatus;
      
      const pDate = c.createdAt ? new Date(c.createdAt.seconds * 1000) : new Date();
      const today = new Date();
      today.setHours(0,0,0,0);
      let dateMatch = true;
      
      if (filterType === 'today') dateMatch = pDate >= today;
      if (filterType === '7days') { const d = new Date(); d.setDate(d.getDate()-7); dateMatch = pDate >= d; }
      if (filterType === '30days') { const d = new Date(); d.setDate(d.getDate()-30); dateMatch = pDate >= d; }
      if (filterType === 'custom' && customRange.start && customRange.end) {
          dateMatch = pDate >= new Date(customRange.start) && pDate <= new Date(customRange.end);
      }

      return docMatch && statusMatch && dateMatch;
  });
  
  const totalRevenue = filteredConsults.reduce((acc, curr) => acc + (Number(curr.paymentAmount) || 0), 0);
  const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="max-w-7xl mx-auto p-4">
      {viewingPatient && viewingDoctor && <PrescriptionPreview patient={viewingPatient} doctor={viewingDoctor} clinicalData={viewingPatient.clinicalData} onClose={() => {setViewingPatient(null); setViewingDoctor(null)}} onPrint={() => window.print()} readOnly={true} logo={prescriptionLogo} />}
      
      {/* Patient History Modal */}
      {historyModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800">History: {selectedPatientName}</h3>
                      <button onClick={() => setHistoryModalOpen(false)}><X size={20}/></button>
                  </div>
                  {selectedPatientHistory.length === 0 ? <p className="text-slate-500 italic">No past prescriptions found.</p> : (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                          {selectedPatientHistory.map(h => (
                              <div key={h.id} className="border p-4 rounded-lg flex justify-between items-center bg-slate-50">
                                  <div>
                                      <p className="font-bold text-slate-700">{formatDate(h.createdAt?.seconds)}</p>
                                      <p className="text-sm text-slate-500">Dr. {h.doctorName}</p>
                                  </div>
                                  <button onClick={() => {setHistoryModalOpen(false); setViewingPatient(h); setViewingDoctor(doctors.find(d=>d.id===h.doctorId))}} className="text-blue-600 font-bold text-sm border px-3 py-1 rounded hover:bg-blue-100">View Rx</button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6 print:hidden">
        {['dashboard', 'new', 'patients'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all shadow-sm ${activeTab === tab ? 'bg-blue-600 text-white shadow-blue-500/40 scale-105' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{tab === 'new' ? 'New Patient' : tab === 'patients' ? 'Registered Patients' : 'Consultations'}</button>))}
      </div>

      {activeTab === 'new' && (
        <div className="bg-white/90 backdrop-blur p-8 rounded-3xl shadow-2xl border border-white/20 animate-fade-in relative">
          <div className="mb-8 relative">
              <div className="flex items-center border-2 border-blue-100 rounded-2xl overflow-hidden bg-blue-50/50"><span className="pl-4 text-blue-400"><Search size={22}/></span><input type="text" placeholder="Search existing patient by Name, Phone or Aadhaar..." className="w-full p-4 bg-transparent outline-none font-medium text-slate-700" value={searchQuery} onChange={handleSearch} /></div>
              {searchResults.length > 0 && (<div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-blue-100 rounded-b-2xl z-50 max-h-60 overflow-y-auto">{searchResults.map((p, idx) => (<div key={idx} onClick={() => selectPatient(p)} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"><p className="font-bold text-slate-800">{p.name} <span className="text-slate-500 font-normal">({p.age}/{p.sex})</span></p><p className="text-xs text-blue-500 font-mono mt-1">AADHAAR: {p.aadhaar || 'N/A'} | PH: {p.phone || 'N/A'}</p></div>))}</div>)}
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Patient Name</label><input required className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Age</label><input required type="number" className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
               <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Sex</label><select className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})}><option>Male</option><option>Female</option></select></div>
               <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Phone Number</label><input required type="tel" className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
               <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Aadhaar</label><input className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.aadhaar} onChange={e => setFormData({...formData, aadhaar: e.target.value})} /></div>
               <div className="col-span-full"><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">History</label><textarea rows="1" className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.chronicConditions} onChange={e => setFormData({...formData, chronicConditions: e.target.value})} /></div>
            </div>
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
               <h3 className="text-sm font-bold text-blue-700 uppercase mb-4 flex items-center gap-2"><Activity size={18}/> Vitals</h3>
               <div className="grid grid-cols-4 gap-6"><input placeholder="BP" className="p-3 border rounded-xl" value={formData.bp} onChange={e => setFormData({...formData, bp: e.target.value})} /><input placeholder="Pulse" className="p-3 border rounded-xl" value={formData.pulse} onChange={e => setFormData({...formData, pulse: e.target.value})} /><input placeholder="GRBS" className="p-3 border rounded-xl" value={formData.grbs} onChange={e => setFormData({...formData, grbs: e.target.value})} /><input placeholder="Weight" className="p-3 border rounded-xl" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Doctor</label>
                  <select className="w-full p-4 border-2 rounded-xl" value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}><option value="">Select Doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                  {selectedDoctor && selectedDoctor.availability && selectedDoctor.availability[currentDayName] && (
                        <div className="mt-4 bg-blue-50 text-blue-900 p-4 rounded-xl border border-blue-100 shadow-inner">
                            <span className="font-bold flex items-center gap-2 mb-2 text-xs uppercase tracking-wider"><Clock size={14}/> Doctor's Availability ({currentDayName})</span> 
                            <div className="text-sm font-semibold">
                                {selectedDoctor.availability[currentDayName].length > 0 ? (
                                    selectedDoctor.availability[currentDayName].map((slot, i) => (
                                        <div key={i} className="flex justify-between border-b border-blue-200/50 pb-1 last:border-0">
                                            <span>Slot {i+1}:</span>
                                            <span>{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-red-500">Not Available Today</span>
                                )}
                            </div>
                        </div>
                    )}
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Amount</label><input type="number" className="w-full p-4 border-2 rounded-xl" value={formData.paymentAmount} onChange={e => setFormData({...formData, paymentAmount: e.target.value})} /></div>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">Register & Generate</button>
          </form>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date Range</label>
                    <select className="border p-2 rounded-lg text-sm bg-slate-50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
                {filterType === 'custom' && (
                    <div className="flex gap-2">
                        <input type="date" className="border p-2 rounded-lg text-sm" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} />
                        <input type="date" className="border p-2 rounded-lg text-sm" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} />
                    </div>
                )}
            </div>

            {/* Reception Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500"><p className="text-xs font-bold uppercase text-slate-500">Total</p><h3 className="text-2xl font-bold text-slate-800">{filteredConsults.length}</h3></div>
                <div className="bg-white p-4 rounded-xl shadow border-l-4 border-amber-500"><p className="text-xs font-bold uppercase text-slate-500">Pending</p><h3 className="text-2xl font-bold text-amber-600">{filteredConsults.filter(c => c.status === 'pending').length}</h3></div>
                <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500"><p className="text-xs font-bold uppercase text-slate-500">Completed</p><h3 className="text-2xl font-bold text-green-600">{filteredConsults.filter(c => c.status === 'completed').length}</h3></div>
                <div className="bg-white p-4 rounded-xl shadow border-l-4 border-teal-500"><p className="text-xs font-bold uppercase text-slate-500">Revenue</p><h3 className="text-2xl font-bold text-teal-600">₹{totalRevenue.toLocaleString()}</h3></div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Consultations</h2>
                    <div className="flex gap-2">
                        <select className="border p-2 rounded-lg" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}><option value="all">All Doctors</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                        <select className="border p-2 rounded-lg" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option></select>
                    </div>
                </div>
                <table className="min-w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-6 py-4 text-left">Date & Time</th><th className="px-6 py-4 text-left">Patient</th><th className="px-6 py-4 text-left">Details</th><th className="px-6 py-4 text-left">Doctor</th><th className="px-6 py-4 text-left">Status</th><th className="px-6 py-4">Action</th></tr></thead><tbody>{filteredConsults.map(c => (<tr key={c.id} className="hover:bg-blue-50"><td className="px-6 py-4 text-slate-500">{c.createdAt ? new Date(c.createdAt.seconds*1000).toLocaleString() : 'N/A'}</td><td className="px-6 py-4 font-bold">{c.name}</td><td className="px-6 py-4 text-xs text-slate-500"><div>{c.age} / {c.sex}</div><div className="font-mono">{c.phone}</div></td><td className="px-6 py-4">{c.doctorName}</td><td className="px-6 py-4">{c.status}</td><td className="px-6 py-4">{c.status === 'completed' ? <button onClick={() => {setViewingPatient(c); setViewingDoctor(doctors.find(d=>d.id===c.doctorId))}} className="text-blue-600"><Printer size={16}/></button> : <a href={c.meetingLink} target="_blank" className="text-blue-600">Join</a>}</td></tr>))}</tbody></table>
            </div>
        </div>
      )}
      
      {activeTab === 'patients' && (
          <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-blue-600"/> Patient Registry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patients.map((p, i) => (
                      <div key={i} onClick={() => openPatientHistory(p.name)} className="p-5 border rounded-xl hover:shadow-lg transition bg-slate-50 relative group border-slate-200 cursor-pointer">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <h4 className="font-bold text-slate-800 text-lg">{p.name}</h4>
                                  <p className="text-sm text-slate-500 font-medium">{p.age} Yrs / {p.sex}</p>
                              </div>
                              <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><History size={12}/> History</div>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                              <p className="text-sm text-slate-600 flex items-center gap-2"><Phone size={14}/> {p.phone || 'N/A'}</p>
                              <p className="text-sm text-slate-600 font-mono flex items-center gap-2"><CreditCard size={14}/> {p.aadhaar || 'N/A'}</p>
                          </div>
                          {p.chronicConditions && (
                              <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 flex items-start gap-1">
                                  <History size={12} className="mt-0.5 shrink-0"/> <span>{p.chronicConditions}</span>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

// --- DOCTOR VIEW ---

const DoctorView = ({ user, currentDoctor, logo, prescriptionLogo }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // Default to Dashboard
  const [isPreviewMode, setIsPreviewMode] = useState(false); 
  const [showSettings, setShowSettings] = useState(false);
  const [myAvailability, setMyAvailability] = useState(currentDoctor.availability || {});
  
  // Dashboard Filters
  const [filterType, setFilterType] = useState('today'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Password Change
  const [newPassword, setNewPassword] = useState('');

  const [clinicalData, setClinicalData] = useState({ chiefComplaint: '', history: '', examFindings: '', provisionalDiagnosis: '', prevInvestigations: '', advisedInvestigations: '', medications: '', followUp: '' });

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'consultations');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const myPatients = data.filter(d => d.doctorId === currentDoctor.id);
      myPatients.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPatients(myPatients);
    });
    return () => unsubscribe();
  }, [user, currentDoctor]);

  const handleStartConsult = (patient) => {
    setSelectedPatient(patient);
    setIsPreviewMode(patient.status === 'completed');
    if (patient.clinicalData) setClinicalData(patient.clinicalData);
    else setClinicalData({ chiefComplaint: '', history: '', examFindings: '', provisionalDiagnosis: '', prevInvestigations: '', advisedInvestigations: '', medications: '', followUp: '' });
    setActiveView('consult');
  };

  const handleSaveConsult = async (status = 'completed') => {
    if (!selectedPatient) return;
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'consultations', selectedPatient.id);
      await updateDoc(ref, { clinicalData, status, completedAt: serverTimestamp() });
      if (status === 'completed') setIsPreviewMode(true);
      else alert("Draft Saved Successfully");
    } catch (err) { console.error(err); alert("Error saving data"); }
  };

  const handleUpdateSettings = async () => {
      try {
          const updateData = { availability: myAvailability };
          if (newPassword) updateData.password = newPassword;
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'doctors', currentDoctor.id), updateData);
          alert("Settings updated!"); setShowSettings(false);
      } catch(e) { console.error(e); alert("Failed to update"); }
  };

  if (showSettings) return (
      <div className="max-w-4xl mx-auto p-8">
          <button onClick={() => setShowSettings(false)} className="mb-4 text-slate-600 flex items-center gap-1 font-bold hover:text-blue-600">&larr; Back to Dashboard</button>
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800"><Settings className="text-blue-600"/> Doctor Settings</h2>
              
              <div className="mb-8 border-b border-slate-100 pb-8">
                  <h3 className="font-bold text-lg mb-4 text-slate-600">Change Password</h3>
                  <input type="text" placeholder="Enter new password" className="w-full border p-3 rounded-lg" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  <p className="text-xs text-gray-400 mt-2">Leave blank to keep current password.</p>
              </div>

              <h3 className="font-bold text-lg mb-4 text-slate-600">Availability</h3>
              <AvailabilityEditor availability={myAvailability} onChange={setMyAvailability} />
              
              <div className="mt-6 flex justify-end"><button onClick={handleUpdateSettings} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">Save Changes</button></div>
          </div>
      </div>
  );

  // Filtered Patients
  const filteredPatients = patients.filter(p => {
      const pDate = p.createdAt ? new Date(p.createdAt.seconds * 1000) : new Date();
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let dateMatch = true;
      if (filterType === 'today') dateMatch = pDate >= today;
      if (filterType === '7days') { const d = new Date(); d.setDate(d.getDate()-7); dateMatch = pDate >= d; }
      if (filterType === '30days') { const d = new Date(); d.setDate(d.getDate()-30); dateMatch = pDate >= d; }
      if (filterType === 'custom' && customRange.start && customRange.end) {
          dateMatch = pDate >= new Date(customRange.start) && pDate <= new Date(customRange.end);
      }

      const statusMatch = filterStatus === 'all' || p.status === filterStatus;
      return dateMatch && statusMatch;
  });

  if (activeView === 'dashboard') {
      const totalPending = filteredPatients.filter(p => p.status === 'pending').length;
      const totalCompleted = filteredPatients.filter(p => p.status === 'completed').length;

      return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Hello, Dr. {currentDoctor.name}</h2>
                    <p className="text-slate-500">Overview</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setActiveView('list')} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition font-bold"><Calendar size={18}/> View All Patients</button>
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-50 shadow-sm font-semibold transition"><Settings size={18}/></button>
                </div>
            </div>

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date Range</label>
                    <select className="border p-2 rounded-lg text-sm bg-slate-50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
                {filterType === 'custom' && (
                    <div className="flex gap-2">
                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Start</label><input type="date" className="border p-2 rounded-lg text-sm" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">End</label><input type="date" className="border p-2 rounded-lg text-sm" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} /></div>
                    </div>
                )}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Status</label>
                    <select className="border p-2 rounded-lg text-sm bg-slate-50" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl shadow-blue-500/20">
                    <div className="flex justify-between items-start"><div><p className="text-xs font-bold uppercase opacity-80 mb-1">Total Patients (Filtered)</p><h3 className="text-4xl font-bold">{filteredPatients.length}</h3></div><User className="text-white/20" size={40}/></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <div className="flex justify-between items-start"><div><p className="text-xs font-bold uppercase text-amber-600 mb-1">Pending</p><h3 className="text-4xl font-bold text-slate-800">{totalPending}</h3></div><Clock className="text-amber-100" size={40}/></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <div className="flex justify-between items-start"><div><p className="text-xs font-bold uppercase text-green-600 mb-1">Completed</p><h3 className="text-4xl font-bold text-slate-800">{totalCompleted}</h3></div><CheckCircle className="text-green-100" size={40}/></div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-blue-500"/> Filtered List</h3></div>
                {filteredPatients.length === 0 ? <div className="text-center py-10 text-slate-400">No appointments found for this filter.</div> : (
                    <div className="space-y-4">
                        {filteredPatients.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition cursor-pointer" onClick={() => handleStartConsult(p)}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-12 rounded-full ${p.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                    <div><h4 className="font-bold text-slate-800">{p.name}</h4><p className="text-xs text-slate-500">{formatDate(p.createdAt?.seconds)}</p></div>
                                </div>
                                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase hover:bg-blue-100">{p.status === 'completed' ? 'View' : 'Start'}</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      );
  }

  if (activeView === 'list') return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition"><LayoutDashboard size={20}/> Back to Dashboard</button><h2 className="text-2xl font-bold text-slate-800">All Patients List</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl shadow-lg border p-6 transition hover:-translate-y-1 ${p.status === 'completed' ? 'border-green-200 opacity-90' : 'border-blue-200 ring-1 ring-blue-100'}`}>
              <div className="flex justify-between items-start mb-4" onClick={() => handleStartConsult(p)}>
                <div><h3 className="font-bold text-xl text-slate-800 cursor-pointer hover:text-blue-600">{p.name}</h3><p className="text-sm text-slate-500 font-medium">{p.age} Yrs / {p.sex}</p></div>
                <span className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{p.status}</span>
              </div>
              {p.chronicConditions && <div className="bg-amber-50 p-3 rounded-xl mb-4 border border-amber-100 text-xs text-amber-800"><strong className="block flex items-center gap-1 mb-1"><History size={12}/> History Note:</strong>{p.chronicConditions}</div>}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-lg mb-4"><p>BP: <span className="font-bold text-slate-800">{p.bp}</span></p><p>Pulse: <span className="font-bold text-slate-800">{p.pulse}</span></p></div>
              <div className="flex items-center justify-between gap-2">
                 <a href={p.meetingLink} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition"><Video size={16}/> Call</a>
                 <button onClick={() => handleStartConsult(p)} className="flex-1 flex justify-center items-center text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 text-sm gap-2 font-bold px-4 py-2.5 rounded-lg border border-slate-200 transition">{p.status === 'completed' ? <><CheckCircle size={16}/> View</> : <><Pencil size={16}/> Consult</>}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {isPreviewMode && selectedPatient && <PrescriptionPreview patient={selectedPatient} doctor={currentDoctor} clinicalData={clinicalData} onClose={() => setActiveView('list')} onPrint={() => window.print()} onEdit={() => setIsPreviewMode(false)} readOnly={false} logo={prescriptionLogo} />}
      <div className={`${isPreviewMode ? 'hidden' : 'block'} print:hidden`}>
          <div className="flex justify-between items-center mb-6"><button onClick={() => setActiveView('list')} className="text-slate-500 font-bold hover:text-blue-600 flex items-center gap-2 transition">&larr; Back to Patient List</button><a href={selectedPatient.meetingLink} target="_blank" rel="noreferrer" className="bg-emerald-500 text-white px-6 py-2 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-105 transition"><Video size={18}/> Join Video Room</a></div>
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 border border-slate-100">
             <div className="space-y-6">
               <h3 className="font-bold text-xl border-b pb-4 text-slate-800 flex items-center gap-2"><Activity className="text-blue-500"/> Clinical Findings</h3>
               {selectedPatient.chronicConditions && <div className="bg-amber-50 p-4 rounded-xl border border-amber-100"><label className="block text-xs font-bold text-amber-700 uppercase mb-1">Reception Notes / History</label><p className="text-sm text-slate-700">{selectedPatient.chronicConditions}</p></div>}
               <div className="space-y-4">
                   {['Chief Complaints', 'History of Present Illness', 'Examination Findings', 'Provisional Diagnosis'].map((label, i) => (
                       <div key={i}>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">{label}</label>
                           <textarea rows={i===3 ? 1 : 2} className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50/50 focus:bg-white focus:border-blue-400 outline-none transition resize-none" 
                            value={i===0?clinicalData.chiefComplaint:i===1?clinicalData.history:i===2?clinicalData.examFindings:clinicalData.provisionalDiagnosis} 
                            onChange={e => setClinicalData({...clinicalData, [i===0?'chiefComplaint':i===1?'history':i===2?'examFindings':'provisionalDiagnosis']: e.target.value})} />
                       </div>
                   ))}
               </div>
             </div>
             <div className="space-y-6">
               <h3 className="font-bold text-xl border-b pb-4 text-slate-800 flex items-center gap-2"><Pill className="text-blue-500"/> Orders & Prescription</h3>
               <div className="space-y-4">
                   {['Previous Investigations', 'Investigations Advised', 'Medications (Rx)', 'Advice / Follow Up'].map((label, i) => (
                       <div key={i}>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">{label}</label>
                           <textarea rows={i===2 ? 6 : 2} className={`w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50/50 focus:bg-white focus:border-blue-400 outline-none transition resize-none ${i===2 ? 'font-mono text-sm' : ''}`}
                            placeholder={i===2 ? 'Tab. Name - Dose - Frequency - Duration' : ''}
                            value={i===0?clinicalData.prevInvestigations:i===1?clinicalData.advisedInvestigations:i===2?clinicalData.medications:clinicalData.followUp} 
                            onChange={e => setClinicalData({...clinicalData, [i===0?'prevInvestigations':i===1?'advisedInvestigations':i===2?'medications':'followUp']: e.target.value})} />
                       </div>
                   ))}
               </div>
               <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                   <button onClick={() => handleSaveConsult('pending')} className="px-6 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">Save Draft</button>
                   <button onClick={() => handleSaveConsult('completed')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-blue-500/30 hover:scale-105 transition-transform flex items-center gap-2"><CheckCircle size={18}/> Finalize & Print</button>
               </div>
             </div>
          </div>
      </div>
    </div>
  );
};

// --- LOGIN ---

const LoginScreen = ({ onLogin, logo }) => {
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
             <h1 className="text-2xl font-black text-blue-900 tracking-wide uppercase">{CLINIC_DETAILS.name}</h1>
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

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appLogo, setAppLogo] = useState(DEFAULT_LOGO);
  const [prescriptionLogo, setPrescriptionLogo] = useState(DEFAULT_LOGO);

  useEffect(() => {
    const initAuth = async () => { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token); else await signInAnonymously(auth); };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, u => setFirebaseUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const fetchLogo = async () => {
        try {
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'));
            if (docSnap.exists()) {
                if(docSnap.data().appLogo) setAppLogo(docSnap.data().appLogo);
                if(docSnap.data().prescriptionLogo) setPrescriptionLogo(docSnap.data().prescriptionLogo);
            }
        } catch (e) { console.error("Logo fetch error", e); }
    };
    fetchLogo();
  }, [firebaseUser]);

  if (!firebaseUser) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div></div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} logo={appLogo} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header userRole={currentUser.role} userName={currentUser.name || currentUser.username} onLogout={() => setCurrentUser(null)} logo={appLogo} />
      <main className="py-8 px-4 print:p-0 print:m-0">
        {currentUser.role === 'admin' && <AdminView appLogo={appLogo} setAppLogo={setAppLogo} prescriptionLogo={prescriptionLogo} setPrescriptionLogo={setPrescriptionLogo} />}
        {currentUser.role === 'reception' && <ReceptionistView user={firebaseUser} currentUser={currentUser} logo={appLogo} prescriptionLogo={prescriptionLogo} />}
        {currentUser.role === 'doctor' && <DoctorView user={firebaseUser} currentDoctor={currentUser} logo={appLogo} prescriptionLogo={prescriptionLogo} />}
      </main>
      <style>{`@media print { @page { margin: 0; } body { background: white; } body > *:not(#root) { display: none; } #root > div { min-height: 0; } }`}</style>
    </div>
  );
}
