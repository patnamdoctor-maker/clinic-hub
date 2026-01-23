import React, { useState, useEffect } from 'react';
import { 
  Settings, CreditCard, Briefcase, Pencil, Trash2, Mail, Phone, Save, Eye
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, appId } from '../firebase/config';
import { DEFAULT_CLINIC_DETAILS, DEFAULT_LOGO } from '../constants';
import { convertFileToBase64, formatDate } from '../utils';
import AvailabilityEditor from '../components/AvailabilityEditor';
import PrescriptionPreview from '../components/PrescriptionPreview';

const AdminView = ({ appLogo, setAppLogo, prescriptionLogo, setPrescriptionLogo, clinicSettings, setClinicSettings }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [doctors, setDoctors] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('today'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const [editingDocId, setEditingDocId] = useState(null);
  const [editingRecId, setEditingRecId] = useState(null);
  
  const [docForm, setDocForm] = useState({ 
    name: '', spec: '', designation: '', email: '', password: '', googleMeetUrl: '', 
    qualification: '', registration: '', signatureUrl: '', availability: {},
    signatureSize: 30, signaturePosition: 85, signatureColor: '#000000'
  });
  const [showPreview, setShowPreview] = useState(false);
  const [recForm, setRecForm] = useState({ username: '', email: '', password: '', mobile: '', address: '' });
  
  const [clinicForm, setClinicForm] = useState(() => clinicSettings || DEFAULT_CLINIC_DETAILS);

  useEffect(() => {
    const unsubDocs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), (snap) => setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRecs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'receptionists'), (snap) => setReceptionists(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCons = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'consultations'), (snap) => setAllConsultations(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubDocs(); unsubRecs(); unsubCons(); };
  }, []);

  // Sync clinicForm when clinicSettings changes
  useEffect(() => {
    if (clinicSettings) {
      setClinicForm({ ...DEFAULT_CLINIC_DETAILS, ...clinicSettings });
    } else {
      setClinicForm(DEFAULT_CLINIC_DETAILS);
    }
  }, [clinicSettings]);

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
      if (editingDocId) { 
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'doctors', editingDocId), docForm); 
        alert("Doctor updated"); 
        setEditingDocId(null); 
      } else { 
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), docForm); 
        alert("Doctor added"); 
      }
      setDocForm({ 
        name: '', spec: '', designation: '', email: '', password: '', googleMeetUrl: '', 
        qualification: '', registration: '', signatureUrl: '', availability: {},
        signatureSize: 30, signaturePosition: 85, signatureColor: '#000000'
      });
    } catch (error) { console.error(error); alert("Operation failed."); }
  };

  const handleEditDoctor = (d) => {
     setEditingDocId(d.id);
     setDocForm({ 
       name: d.name, spec: d.spec, designation: d.designation || '', email: d.email, 
       password: d.password, googleMeetUrl: d.googleMeetUrl || '', qualification: d.qualification, 
       registration: d.registration, signatureUrl: d.signatureUrl || '', availability: d.availability || {},
       signatureSize: d.signatureSize || 30, 
       signaturePosition: d.signaturePosition !== undefined ? d.signaturePosition : (d.signaturePlacement === 'left' ? 10 : d.signaturePlacement === 'center' ? 50 : 85),
       signatureColor: d.signatureColor || '#000000'
     });
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecSubmit = async (e) => {
    e.preventDefault();
    try {
        if (editingRecId) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'receptionists', editingRecId), recForm);
            alert("Receptionist updated");
            setEditingRecId(null);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'receptionists'), recForm);
            alert("Receptionist added");
        }
        setRecForm({ username: '', email: '', password: '', mobile: '', address: '' });
    } catch (error) { console.error(error); alert("Operation failed."); }
  };

  const handleEditReceptionist = (r) => {
     setEditingRecId(r.id);
     setRecForm({ username: r.username, email: r.email, password: r.password, mobile: r.mobile || '', address: r.address || '' });
  };

  const handleSaveClinicDetails = async (e) => {
     e.preventDefault();
     try {
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), { clinicDetails: clinicForm }, { merge: true });
         setClinicSettings(clinicForm);
         alert("Clinic details updated successfully!");
     } catch (error) {
         console.error(error);
         alert("Failed to save clinic details.");
     }
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
  const totalPharmacy = filteredConsults.reduce((acc, curr) => acc + (Number(curr.pharmacyAmount) || 0), 0);
  const totalDiagnostics = filteredConsults.reduce((acc, curr) => acc + (Number(curr.diagnosticsAmount) || 0), 0);

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
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                   <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/20">
                       <p className="text-xs font-bold uppercase opacity-80">Total Revenue</p>
                       <p className="text-3xl font-bold mt-2">₹{totalRevenue.toLocaleString()}</p>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
                       <p className="text-xs font-bold uppercase text-green-600">Pharmacy Revenue</p>
                       <p className="text-2xl font-bold text-slate-800 mt-2">₹{totalPharmacy.toLocaleString()}</p>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-purple-500">
                       <p className="text-xs font-bold uppercase text-purple-600">Diagnostics Revenue</p>
                       <p className="text-2xl font-bold text-slate-800 mt-2">₹{totalDiagnostics.toLocaleString()}</p>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                       <p className="text-xs font-bold uppercase text-slate-500">Total Consultations</p>
                       <p className="text-3xl font-bold text-slate-800 mt-2">{filteredConsults.length}</p>
                   </div>
               </div>

               <div className="overflow-x-auto rounded-xl border border-slate-200">
                   <table className="min-w-full divide-y divide-slate-200 text-sm">
                       <thead className="bg-slate-50">
                           <tr>
                               <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Date</th>
                               <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Patient</th>
                               <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Doctor</th>
                               <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Total Bill</th>
                               <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Pharmacy</th>
                               <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs">Diagnostics</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200 bg-white">
                            {filteredConsults.map(c => (
                                <tr key={c.id} className="hover:bg-blue-50/50 transition">
                                    <td className="px-6 py-4 text-slate-600">{formatDate(c.createdAt?.seconds)}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">{c.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{c.doctorName}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">₹{c.paymentAmount || 0}</td>
                                    <td className="px-6 py-4 font-mono text-green-600">₹{c.pharmacyAmount || 0}</td>
                                    <td className="px-6 py-4 font-mono text-purple-600">₹{c.diagnosticsAmount || 0}</td>
                                </tr>
                            ))}
                       </tbody>
                   </table>
               </div>
            </div>
        </div>
      )}

      {/* DOCTORS TAB */}
      {activeTab === 'doctors' && (
        <>
        {/* Prescription Preview Modal */}
        {showPreview && docForm.name && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 overflow-auto">
            <div className="bg-white rounded-xl w-full max-w-7xl relative flex flex-col max-h-[95vh]">
              <div className="flex justify-between items-center p-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Eye size={20} className="text-purple-600"/> Prescription Preview with Signature Settings
                </h3>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-bold"
                >
                  Close Preview
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                <PrescriptionPreview
                  patient={{
                    name: 'Sample Patient',
                    age: '35',
                    sex: 'Male',
                    phone: '9876543210',
                    weight: '70 kg',
                    bp: '120/80',
                    pulse: '72',
                    uhid: 'PID-123456',
                    createdAt: { seconds: Math.floor(Date.now() / 1000) }
                  }}
                  doctor={docForm}
                  clinicalData={{
                    chiefComplaint: 'Fever and cough for 3 days',
                    history: 'No significant past medical history',
                    examFindings: 'Temperature: 38.5°C, Chest clear',
                    provisionalDiagnosis: 'Upper Respiratory Tract Infection',
                    medications: 'Tab. Paracetamol 500mg - 1-0-1 - After meals - 5 days\nTab. Azithromycin 500mg - 1-0-0 - After meals - 3 days',
                    followUp: 'Review after 5 days if symptoms persist',
                    followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  }}
                  onClose={() => setShowPreview(false)}
                  onPrint={() => window.print()}
                  readOnly={true}
                  logo={prescriptionLogo}
                  clinicSettings={clinicSettings}
                  showSignatureSettings={true}
                  onSignatureSettingsChange={(updatedDoctor) => setDocForm(updatedDoctor)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
            <h3 className="font-bold text-lg mb-6 text-slate-800 flex items-center gap-2 border-b pb-2"><Briefcase size={20} className="text-blue-600"/> {editingDocId ? 'Edit Doctor' : 'Register Doctor'}</h3>
            <form onSubmit={handleDocSubmit} className="space-y-4">
             <input required placeholder="Dr. Name" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} />
             <input required placeholder="Designation" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.designation} onChange={e => setDocForm({...docForm, designation: e.target.value})} />
             <input required placeholder="Specialization" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.spec} onChange={e => setDocForm({...docForm, spec: e.target.value})} />
             <input required placeholder="Qualification" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.qualification} onChange={e => setDocForm({...docForm, qualification: e.target.value})} />
             <input required placeholder="Registration No." className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.registration} onChange={e => setDocForm({...docForm, registration: e.target.value})} />
             <input placeholder="Permanent Google Meet Link (Optional)" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.googleMeetUrl} onChange={e => setDocForm({...docForm, googleMeetUrl: e.target.value})} />
             <input required type="email" placeholder="Email" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.email} onChange={e => setDocForm({...docForm, email: e.target.value})} />
              <div className="relative">
                 <input required type="text" placeholder="Password (Visible to Admin)" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white transition outline-none focus:ring-2 ring-blue-500" value={docForm.password} onChange={e => setDocForm({...docForm, password: e.target.value})} />
                 <span className="absolute right-3 top-3 text-gray-400 text-xs">Visible</span>
             </div>
             <AvailabilityEditor availability={docForm.availability} onChange={(newAvail) => setDocForm({...docForm, availability: newAvail})} />
             
             {/* Signature Upload */}
             <div className="border border-dashed border-slate-300 p-4 rounded-lg bg-slate-50">
               <label className="block text-xs font-bold mb-2 text-slate-500 uppercase">Upload Signature</label>
               <input type="file" accept="image/*" onChange={(e) => {const file=e.target.files[0]; if(file) convertFileToBase64(file).then(b=>setDocForm({...docForm, signatureUrl:b}))}} className="text-sm w-full mb-3" />
               {docForm.signatureUrl && (
                 <div className="mt-3 p-2 bg-white rounded border border-slate-200">
                   <img src={docForm.signatureUrl} alt="Signature Preview" className="max-h-16 mx-auto object-contain" />
                 </div>
               )}
             </div>

             {/* Signature Customization */}
             {docForm.signatureUrl && (
               <div className="border border-blue-200 p-4 rounded-lg bg-blue-50/30 space-y-4">
                 <label className="block text-xs font-bold text-slate-700 uppercase">Signature Settings</label>
                 
                 <div>
                   <label className="block text-xs font-semibold text-slate-600 mb-1">Size (px): {docForm.signatureSize}</label>
                   <input 
                     type="range" 
                     min="20" 
                     max="80" 
                     value={docForm.signatureSize} 
                     onChange={e => setDocForm({...docForm, signatureSize: parseInt(e.target.value)})}
                     className="w-full"
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-semibold text-slate-600 mb-1">
                     Horizontal Position: {docForm.signaturePosition}%
                     <span className="ml-2 text-xs text-slate-400">
                       ({docForm.signaturePosition < 33 ? 'Left' : docForm.signaturePosition < 67 ? 'Center' : 'Right'})
                     </span>
                   </label>
                   <div className="relative">
                     <input 
                       type="range" 
                       min="0" 
                       max="100" 
                       value={docForm.signaturePosition} 
                       onChange={e => setDocForm({...docForm, signaturePosition: parseInt(e.target.value)})}
                       className="w-full"
                     />
                     <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                       <span>Left</span>
                       <span>Center</span>
                       <span>Right</span>
                     </div>
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-semibold text-slate-600 mb-1">Color:</label>
                   <div className="flex gap-2 items-center">
                     <input 
                       type="color" 
                       value={docForm.signatureColor} 
                       onChange={e => setDocForm({...docForm, signatureColor: e.target.value})}
                       className="w-12 h-8 border rounded cursor-pointer"
                     />
                     <input 
                       type="text" 
                       value={docForm.signatureColor} 
                       onChange={e => setDocForm({...docForm, signatureColor: e.target.value})}
                       className="flex-1 border p-2 rounded-lg text-sm bg-white font-mono"
                       placeholder="#000000"
                     />
                   </div>
                 </div>

                 <button 
                   type="button"
                   onClick={() => setShowPreview(true)}
                   className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-bold text-sm flex items-center justify-center gap-2"
                 >
                   <Eye size={16}/> Open Preview
                 </button>
               </div>
             )}

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg">{editingDocId ? 'Update' : 'Register'}</button>
                {editingDocId && <button type="button" onClick={() => {
                  setEditingDocId(null); 
                  setDocForm({ 
                    name: '', spec: '', designation: '', email: '', password: '', 
                    qualification: '', registration: '', signatureUrl: '', availability: {},
                    signatureSize: 30, signaturePosition: 85, signatureColor: '#000000'
                  });
                  setShowPreview(false);
                }} className="flex-1 bg-slate-500 text-white py-3 rounded-lg hover:bg-slate-600 font-bold">Cancel</button>}
              </div>
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
        </>
      )}

      {/* RECEPTIONIST TAB */}
      {activeTab === 'reception' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xl h-fit border border-slate-200">
                <h3 className="font-bold text-lg mb-6 text-slate-800 border-b pb-2">{editingRecId ? 'Edit Receptionist' : 'Add Receptionist'}</h3>
               <form onSubmit={handleRecSubmit} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                      <input required className="w-full border p-3 rounded-lg bg-slate-50 outline-none focus:ring-2 ring-blue-500" value={recForm.username} onChange={e => setRecForm({...recForm, username: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                       <input required type="email" className="w-full border p-3 rounded-lg bg-slate-50 outline-none focus:ring-2 ring-blue-500" value={recForm.email} onChange={e => setRecForm({...recForm, email: e.target.value})} />
                  </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile No.</label>
                      <input required type="tel" className="w-full border p-3 rounded-lg bg-slate-50 outline-none focus:ring-2 ring-blue-500" value={recForm.mobile} onChange={e => setRecForm({...recForm, mobile: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                      <textarea className="w-full border p-3 rounded-lg bg-slate-50 outline-none focus:ring-2 ring-blue-500" rows="2" value={recForm.address} onChange={e => setRecForm({...recForm, address: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                      <input required type="text" className="w-full border p-3 rounded-lg bg-slate-50 outline-none focus:ring-2 ring-blue-500" value={recForm.password} onChange={e => setRecForm({...recForm, password: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition">{editingRecId ? 'Update' : 'Register'}</button>
                      {editingRecId && <button type="button" onClick={() => {setEditingRecId(null); setRecForm({username:'', email: '', password: '', mobile: '', address: ''})}} className="flex-1 bg-slate-500 text-white py-3 rounded-lg hover:bg-slate-600 font-bold">Cancel</button>}
                  </div>
               </form>
             </div>
             <div className="lg:col-span-2 space-y-4">
               {receptionists.map(r => (
                   <div key={r.id} className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center border border-slate-100">
                       <div>
                           <span className="font-bold text-lg text-slate-800 block">{r.username}</span>
                           <div className="text-xs text-slate-500 flex flex-col gap-1 mt-1">
                               <span className="flex items-center gap-1"><Mail size={12}/> {r.email}</span>
                                {r.mobile && <span className="flex items-center gap-1"><Phone size={12}/> {r.mobile}</span>}
                                {r.address && <span className="flex items-center gap-1 opacity-75">{r.address}</span>}
                           </div>
                       </div>
                       <div className="flex items-center gap-2">
                           <button onClick={() => handleEditReceptionist(r)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg border border-blue-100"><Pencil size={18}/></button>
                           <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'receptionists', r.id))} className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition"><Trash2 size={18}/></button>
                       </div>
                   </div>
                ))}
            </div>
          </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl mx-auto animate-fade-in border border-slate-200">
              <h3 className="font-bold text-2xl mb-8 text-slate-800 flex items-center gap-2"><Settings className="text-blue-600"/> System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                 <div className="space-y-4"><label className="block font-bold text-slate-700">App Logo (Header)</label><div className="bg-slate-100 p-6 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center"><img src={appLogo || DEFAULT_LOGO} alt="Current App Logo" className="h-20 w-auto object-contain mb-4 shadow-sm rounded" /><input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'appLogo')} className="text-xs w-full text-slate-500"/></div></div>
                 <div className="space-y-4"><label className="block font-bold text-slate-700">Prescription Header Logo</label><div className="bg-slate-100 p-6 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center"><img src={prescriptionLogo || DEFAULT_LOGO} alt="Current Rx Logo" className="h-20 w-auto object-contain mb-4 shadow-sm rounded" /><input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'prescriptionLogo')} className="text-xs w-full text-slate-500"/></div></div>
              </div>

              <div className="border-t border-slate-200 pt-8">
                 <h4 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20}/> Clinic Details</h4>
                 <form onSubmit={handleSaveClinicDetails} className="space-y-5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Clinic Name</label>
                             <input type="text" required className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={clinicForm.name} onChange={e => setClinicForm({...clinicForm, name: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location / City</label>
                              <input type="text" required className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={clinicForm.location} onChange={e => setClinicForm({...clinicForm, location: e.target.value})} />
                          </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile No</label>
                             <input type="text" required className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={clinicForm.phone} onChange={e => setClinicForm({...clinicForm, phone: e.target.value})} />
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Address</label>
                             <textarea rows="2" required className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={clinicForm.address} onChange={e => setClinicForm({...clinicForm, address: e.target.value})} />
                         </div>
                         <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alt. Contact No</label>
                             <input type="text" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={clinicForm.altPhone} onChange={e => setClinicForm({...clinicForm, altPhone: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                             <input type="email" className="w-full border p-3 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" value={clinicForm.email} onChange={e => setClinicForm({...clinicForm, email: e.target.value})} />
                         </div>
                     </div>
                     <div className="flex justify-end pt-4">
                         <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2"><Save size={18}/> Save Details</button>
                     </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminView;
