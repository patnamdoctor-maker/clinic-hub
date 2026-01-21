import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, FileText, Video, Printer, CheckCircle, 
  Settings, Clock, User, History, LayoutDashboard, Eye, Pencil, Pill
} from 'lucide-react';
import { collection, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase/config';
import { formatDate } from '../utils';
import PrescriptionPreview from '../components/PrescriptionPreview';
import PatientProfile from '../components/PatientProfile';
import AvailabilityEditor from '../components/AvailabilityEditor';

const DoctorView = ({ user, currentDoctor, logo, prescriptionLogo, clinicSettings }) => {
  const [patients, setPatients] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]); // Needed for Previewing history of other doctors
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
  
  // Patient Profile Viewing
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewingProfileHistory, setViewingProfileHistory] = useState([]);
  const [viewingProfilePrescription, setViewingProfilePrescription] = useState(null);

  const [clinicalData, setClinicalData] = useState({ chiefComplaint: '', history: '', examFindings: '', provisionalDiagnosis: '', prevInvestigations: '', advisedInvestigations: '', medications: '', followUp: '' });

  useEffect(() => {
    if (!user) return;
    const unsubDocs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), (snap) => setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'consultations');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllConsultations(data);
      const myPatients = data.filter(d => d.doctorId === currentDoctor.id);
      myPatients.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPatients(myPatients);
    });
    return () => { unsubscribe(); unsubDocs(); };
  }, [user, currentDoctor]);

  const handleStartConsult = (patient) => {
    setSelectedPatient(patient);
    setIsPreviewMode(patient.status === 'completed');
    if (patient.clinicalData) setClinicalData(patient.clinicalData);
    else setClinicalData({ chiefComplaint: '', history: '', examFindings: '', provisionalDiagnosis: '', prevInvestigations: '', advisedInvestigations: '', medications: '', followUp: '' });
    setActiveView('consult');
  };
  
  const handleViewProfile = (patientData) => {
      const history = allConsultations.filter(c => 
          c.uhid === patientData.uhid || 
          (c.name === patientData.name && c.phone === patientData.phone)
      );
      history.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setViewingProfileHistory(history);
      setViewingProfile(patientData);
  };

  const handleSaveConsult = async (status = 'completed') => {
    if (!selectedPatient) return;
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'consultations', selectedPatient.id);
      await updateDoc(ref, { clinicalData, status, completedAt: serverTimestamp() });
      
      if (status === 'completed') {
          setIsPreviewMode(true);
          
          setTimeout(() => {
              if (confirm("Consultation Finalized.\n\nSTEP 1: An email draft will open. Please ATTACH the prescription PDF to it.\nSTEP 2: The Print window will open. Save as PDF to your device.\n\nProceed?")) {
                 setTimeout(() => window.print(), 1000);
              }
          }, 500);
      } else {
          alert("Draft Saved Successfully");
      }
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
  
  if (viewingProfile) {
      return (
          <div className="max-w-7xl mx-auto p-4">
               {viewingProfilePrescription && (
                   <PrescriptionPreview 
                        patient={viewingProfilePrescription} 
                        doctor={doctors.find(d => d.id === viewingProfilePrescription.doctorId) || currentDoctor} 
                        clinicalData={viewingProfilePrescription.clinicalData}
                        onClose={() => setViewingProfilePrescription(null)}
                        onPrint={() => window.print()}
                        readOnly={true}
                        logo={prescriptionLogo}
                        clinicSettings={clinicSettings}
                   />
               )}
               <PatientProfile 
                  patient={viewingProfile} 
                  history={viewingProfileHistory} 
                  onClose={() => setViewingProfile(null)} 
                  onViewPrescription={(consult) => setViewingProfilePrescription(consult)}
               />
          </div>
      );
  }

  if (activeView === 'list') return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition"><LayoutDashboard size={20}/> Back to Dashboard</button><h2 className="text-2xl font-bold text-slate-800">All Patients List</h2></div>
        
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xl">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">UHID</th>
                        <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Name</th>
                        <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Mobile</th>
                        <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Visit Date</th>
                        <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Status</th>
                        <th className="px-6 py-4 text-right font-bold text-slate-600 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {patients.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono text-blue-600 font-medium">{p.uhid || 'N/A'}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                            <td className="px-6 py-4 text-slate-600">{p.phone}</td>
                            <td className="px-6 py-4 text-slate-600">{formatDate(p.createdAt?.seconds)}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] uppercase border ${p.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>{p.status}</span></td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <button onClick={() => handleViewProfile(p)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="View History"><History size={16}/></button>
                                <button onClick={() => handleStartConsult(p)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-xs flex items-center gap-1">
                                    {p.status === 'completed' ? <><Eye size={16}/> View</> : <><Pencil size={16}/> Consult</>}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {patients.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">No patients found.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {isPreviewMode && selectedPatient && (
       <PrescriptionPreview 
           patient={selectedPatient} 
           doctor={currentDoctor} 
           clinicalData={clinicalData} 
           onClose={() => setActiveView('list')} 
           onPrint={() => window.print()} 
           onEdit={selectedPatient.status === 'completed' ? null : () => setIsPreviewMode(false)} 
           readOnly={selectedPatient.status === 'completed'} 
           logo={prescriptionLogo} 
           clinicSettings={clinicSettings} 
        />
      )}
      <div className={`${isPreviewMode ? 'hidden' : 'block'} print:hidden`}>
          <div className="flex justify-between items-center mb-6"><button onClick={() => setActiveView('list')} className="text-slate-500 font-bold hover:text-blue-600 flex items-center gap-2 transition">&larr; Back to Patient List</button><a href={selectedPatient?.meetingLink} target="_blank" rel="noreferrer" className="bg-emerald-500 text-white px-6 py-2 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-105 transition"><Video size={18}/> Join Video Room</a></div>
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 border border-slate-100">
             <div className="space-y-6">
               <div className="flex justify-between items-center border-b pb-4">
                   <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Activity className="text-blue-500"/> Clinical Findings</h3>
                   <button onClick={() => handleViewProfile(selectedPatient)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><History size={14}/> View History</button>
               </div>
               
               {selectedPatient?.chronicConditions && <div className="bg-amber-50 p-4 rounded-xl border border-amber-100"><label className="block text-xs font-bold text-amber-700 uppercase mb-1">Reception Notes / History</label><p className="text-sm text-slate-700">{selectedPatient.chronicConditions}</p></div>}
               
               {/* Doctor View: Reports Section */}
               {selectedPatient?.reports && selectedPatient.reports.length > 0 && (
                   <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                       <h3 className="font-bold text-purple-800 flex items-center gap-2 mb-2"><FileText size={18}/> Patient Reports</h3>
                       <div className="flex flex-wrap gap-2">
                           {selectedPatient.reports.map((report, idx) => (
                                <a key={idx} href={report.data} download={report.name} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-purple-200 text-sm font-bold text-purple-700 hover:bg-purple-100 transition shadow-sm">
                                    <FileText size={14}/> {report.name}
                                 </a>
                           ))}
                       </div>
                   </div>
               )}

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

export default DoctorView;
