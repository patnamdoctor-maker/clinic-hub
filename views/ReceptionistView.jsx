import React, { useState, useEffect } from 'react';
import { 
  Activity, User, Calendar, FileText, Video, Printer, CheckCircle, 
  ChevronRight, ChevronDown, Plus, Upload, Pencil, X, 
  Trash2, Search, Clock, CreditCard, History, Mail, Receipt, FilePlus
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, query, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, appId } from '../firebase/config';
import { convertFileToBase64, formatTime, formatDate, generateUHID } from '../utils';
import PrescriptionPreview from '../components/PrescriptionPreview';
import PatientProfile from '../components/PatientProfile';
import BillingModal from '../components/BillingModal';

const ReceptionistView = ({ user, currentUser, logo, prescriptionLogo, clinicSettings }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [loading, setLoading] = useState(false);
  const [uploadingReports, setUploadingReports] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Dashboard Filters
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('today'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  // Follow-up Filters
  const [followUpFilterType, setFollowUpFilterType] = useState('today');
  const [followUpCustomRange, setFollowUpCustomRange] = useState({ start: '', end: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [viewingPatient, setViewingPatient] = useState(null);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  
  // New: Patient Profile Viewing
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
  const [profileHistory, setProfileHistory] = useState([]);
  
  // Editing State
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [billingConsultation, setBillingConsultation] = useState(null); // For billing modal
  
  // File Upload State
  const [reportFiles, setReportFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({}); // Track progress for each file

  const [formData, setFormData] = useState({ name: '', age: '', sex: 'Male', phone: '', email: '', aadhaar: '', chronicConditions: '', bp: '', pulse: '', grbs: '', weight: '', doctorId: '', meetingLink: '', paymentMode: 'Cash', paymentAmount: '500' });

  useEffect(() => {
    const unsubDocs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'doctors'), (snap) => setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCons = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'consultations')), (snap) => { const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); setConsultations(data); });
    const unsubPatients = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'patients'), (snap) => setPatients(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    // Verify Storage is initialized
    if (!storage) {
      console.error('Firebase Storage is not initialized!');
      alert('Warning: Firebase Storage is not configured. File uploads will not work.');
    } else {
      console.log('Firebase Storage initialized:', storage.app.options.storageBucket);
    }
    
    return () => { unsubDocs(); unsubCons(); unsubPatients(); };
  }, []);

  const handleSearch = (e) => { 
      const term = e.target.value.toLowerCase(); 
      setSearchQuery(term); 
      if(term.length > 1) { 
         setSearchResults(patients.filter(p => 
              (p.name && p.name.toLowerCase().includes(term)) || 
             (p.aadhaar && String(p.aadhaar).includes(term)) || 
              (p.phone && String(p.phone).includes(term)) ||
              (p.uhid && String(p.uhid).toLowerCase().includes(term))
          )); 
      } else { 
         setSearchResults([]); 
      } 
  };

  const selectPatient = (p) => { setFormData({ ...formData, name: p.name, age: p.age, sex: p.sex, aadhaar: p.aadhaar || '', chronicConditions: p.chronicConditions || '', phone: p.phone || '', email: p.email || '' }); setSearchQuery(''); setSearchResults([]); };

  // Fuzzy match function for doctor search
  const fuzzyMatch = (text, query) => {
    if (!query) return true;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    // Check if query is a substring of text
    if (textLower.includes(queryLower)) return true;
    // Check if all characters of query appear in order in text (fuzzy match)
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  // Filter doctors based on search query (name and specialty)
  const filteredDoctors = doctors.filter(doctor => {
    if (!doctorSearchQuery) return true;
    const nameMatch = fuzzyMatch(doctor.name || '', doctorSearchQuery);
    const specMatch = fuzzyMatch(doctor.spec || '', doctorSearchQuery);
    return nameMatch || specMatch;
  });

  const handleDoctorChange = (e) => {
      const docId = e.target.value;
      const doctor = doctors.find(d => d.id === docId);
      setFormData(prev => ({
          ...prev, 
          doctorId: docId,
          meetingLink: doctor?.googleMeetUrl || '' 
      }));
  };

  const openPatientProfile = (patient) => {
      const history = consultations.filter(c => 
          c.uhid === patient.uhid || 
          (c.name === patient.name && c.phone === patient.phone)
      );
      history.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProfileHistory(history);
      setSelectedPatientProfile(patient);
  };
  
  const handleReportUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        setUploadingReports(true);
        const uploadPromises = [];
        const MAX_FIRESTORE_SIZE = 700 * 1024; // 700KB - safe limit for Firestore
        const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB - limit for Firebase Storage
        
        // Process all files
        for (const file of files) {
            // Check absolute maximum size
            if (file.size > MAX_STORAGE_SIZE) {
               alert(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is ${(MAX_STORAGE_SIZE / 1024 / 1024).toFixed(0)}MB. Please compress or split the file.`);
               continue;
            }
            
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 9);
            const fileId = `${timestamp}_${randomId}`;
            
            // Initialize progress
            setUploadProgress(prev => ({
                ...prev,
                [fileId]: {
                    fileName: file.name,
                    progress: 0,
                    status: 'uploading'
                }
            }));
            
            // Strategy: Use Storage for files > 700KB, Firestore for smaller files
            // If Storage fails (CORS), fallback to Firestore if file is small enough
            const useStorage = file.size > MAX_FIRESTORE_SIZE && storage;
            
            if (useStorage) {
                // Try Firebase Storage first (for files > 700KB)
                console.log('Attempting Firebase Storage for:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
                const safeFileName = file.name.replace(/[^a-z0-9.-]/gi, '_');
                const filePath = `reports/${appId}/${timestamp}_${randomId}_${safeFileName}`;
                const storageRef = ref(storage, filePath);
                
                const uploadPromise = new Promise((resolve, reject) => {
                    try {
                        const uploadTask = uploadBytesResumable(storageRef, file);
                        
                        uploadTask.on('state_changed', 
                            (snapshot) => {
                                if (snapshot.totalBytes > 0) {
                                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                    setUploadProgress(prev => ({
                                        ...prev,
                                        [fileId]: {
                                            fileName: file.name,
                                            progress: Math.max(1, Math.round(progress)),
                                            status: 'uploading'
                                        }
                                    }));
                                } else {
                                    setUploadProgress(prev => ({
                                        ...prev,
                                        [fileId]: { fileName: file.name, progress: 1, status: 'uploading' }
                                    }));
                                }
                            },
                            async (error) => {
                                console.error("Storage upload failed:", error);
                                // Check if it's a CORS error
                                const isCorsError = error.code === 'storage/unauthorized' || 
                                                   error.message?.includes('CORS') || 
                                                   error.message?.includes('cors') ||
                                                   error.message?.includes('preflight');
                                
                                if (isCorsError) {
                                    console.warn("CORS error detected. Falling back to Firestore if file is small enough.");
                                    // Fallback to Firestore only if file is small enough
                                    if (file.size <= MAX_FIRESTORE_SIZE) {
                                        try {
                                            setUploadProgress(prev => ({
                                                ...prev,
                                                [fileId]: { fileName: file.name, progress: 50, status: 'uploading', error: 'Switching to Firestore...' }
                                            }));
                                            const base64 = await convertFileToBase64(file);
                                            setUploadProgress(prev => ({
                                                ...prev,
                                                [fileId]: { fileName: file.name, progress: 100, status: 'completed' }
                                            }));
                                            resolve({
                                                name: file.name,
                                                data: base64,
                                                type: file.type,
                                                size: file.size,
                                                uploadedAt: timestamp,
                                                storageType: 'firestore'
                                            });
                                            return;
                                        } catch (fallbackError) {
                                            setUploadProgress(prev => ({
                                                ...prev,
                                                [fileId]: {
                                                    fileName: file.name,
                                                    progress: 0,
                                                    status: 'error',
                                                    error: 'Upload failed. Please configure CORS for Storage or reduce file size to 700KB.'
                                                }
                                            }));
                                            reject(fallbackError);
                                            return;
                                        }
                                    } else {
                                        // File too large for Firestore fallback
                                        setUploadProgress(prev => ({
                                            ...prev,
                                            [fileId]: {
                                                fileName: file.name,
                                                progress: 0,
                                                status: 'error',
                                                error: 'CORS error. Please configure CORS for Firebase Storage (see STORAGE_SETUP.md) or reduce file size to 700KB.'
                                            }
                                        }));
                                        reject(error);
                                        return;
                                    }
                                }
                                
                                // Other errors
                                setUploadProgress(prev => ({
                                    ...prev,
                                    [fileId]: {
                                        fileName: file.name,
                                        progress: 0,
                                        status: 'error',
                                        error: error.message || 'Upload failed'
                                    }
                                }));
                                reject(error);
                            },
                            async () => {
                                try {
                                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                    setUploadProgress(prev => ({
                                        ...prev,
                                        [fileId]: { fileName: file.name, progress: 100, status: 'completed' }
                                    }));
                                    resolve({
                                        name: file.name,
                                        url: downloadURL,
                                        path: filePath,
                                        type: file.type,
                                        size: file.size,
                                        uploadedAt: timestamp,
                                        storageType: 'storage'
                                    });
                                } catch (err) {
                                    setUploadProgress(prev => ({
                                        ...prev,
                                        [fileId]: {
                                            fileName: file.name,
                                            progress: 0,
                                            status: 'error',
                                            error: err.message || 'Failed to get download URL'
                                        }
                                    }));
                                    reject(err);
                                }
                            }
                        );
                    } catch (err) {
                        setUploadProgress(prev => ({
                            ...prev,
                            [fileId]: {
                                fileName: file.name,
                                progress: 0,
                                status: 'error',
                                error: err.message || 'Upload initialization failed'
                            }
                        }));
                        reject(err);
                    }
                });
                
                uploadPromises.push({ promise: uploadPromise, fileId, fileName: file.name });
            } else {
                // Use Firestore for smaller files (no CORS needed)
                console.log('Using Firestore for:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
                const uploadPromise = (async () => {
                    try {
                        setUploadProgress(prev => ({
                            ...prev,
                            [fileId]: { fileName: file.name, progress: 20, status: 'uploading' }
                        }));
                        
                        const base64 = await convertFileToBase64(file);
                        
                        setUploadProgress(prev => ({
                            ...prev,
                            [fileId]: { fileName: file.name, progress: 80, status: 'uploading' }
                        }));
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        setUploadProgress(prev => ({
                            ...prev,
                            [fileId]: { fileName: file.name, progress: 100, status: 'completed' }
                        }));
                        
                        return {
                            name: file.name,
                            data: base64,
                            type: file.type,
                            size: file.size,
                            uploadedAt: timestamp,
                            storageType: 'firestore'
                        };
                    } catch (err) {
                        console.error("Error uploading file to Firestore:", file.name, err);
                        setUploadProgress(prev => ({
                            ...prev,
                            [fileId]: {
                                fileName: file.name,
                                progress: 0,
                                status: 'error',
                                error: err.message || 'Upload failed'
                            }
                        }));
                        throw err;
                    }
                })();
                
                uploadPromises.push({ promise: uploadPromise, fileId, fileName: file.name });
            }
        }
        
        if (uploadPromises.length === 0) {
            setUploadingReports(false);
            e.target.value = '';
            return;
        }
        
        try {
            const results = await Promise.allSettled(uploadPromises.map(({ promise }) => promise));
            const successfulReports = [];
            const errors = [];
            
            results.forEach((result, index) => {
                const { fileName } = uploadPromises[index];
                if (result.status === 'fulfilled') {
                    successfulReports.push(result.value);
                } else {
                    errors.push({ fileName, error: result.reason?.message || 'Upload failed' });
                }
            });
            
            if (successfulReports.length > 0) {
                setReportFiles([...reportFiles, ...successfulReports]);
            }
            
            if (errors.length > 0) {
                alert(`Upload completed:\n\n` +
                      `✅ Successfully uploaded: ${successfulReports.length} file(s)\n` +
                      `❌ Failed: ${errors.length} file(s)\n\n` +
                      `Failed: ${errors.map(e => e.fileName).join(', ')}`);
            } else if (successfulReports.length > 0) {
                alert(`Successfully uploaded ${successfulReports.length} file(s).`);
                setTimeout(() => setUploadProgress({}), 2000);
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert(`Error during upload: ${err.message}`);
        } finally {
            setUploadingReports(false);
            e.target.value = '';
        }
  };

  const removeReport = (index) => {
      setReportFiles(reportFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId) return alert("Please select a doctor");
    if (!formData.meetingLink) return alert("Missing Video Link. Please select a doctor with a configured link or create one manually.");

    // No need to validate total size anymore since files are in Storage, not Firestore
    // Just check if we have reports

    setLoading(true);
    try {
      const doctor = doctors.find(d => d.id === formData.doctorId);
      if (!doctor) {
         alert("Selected doctor not found in records.");
         setLoading(false);
         return;
      }
      
      const safePatientId = `${formData.name.replace(/[^a-z0-9]/gi, '_')}-${formData.aadhaar || Math.floor(Math.random() * 10000)}`;
      const newUHID = generateUHID();
      
      const existingPatient = patients.find(p => p.id === safePatientId || (p.name === formData.name && p.phone === formData.phone));
      const uhidToUse = existingPatient?.uhid || newUHID;

      // Store reports metadata
      // Files can be in Storage (url) or Firestore (data as base64)
      const reportsMetadata = reportFiles.map(report => {
        if (report.storageType === 'firestore' || report.data) {
          // Firestore storage - store base64 data
          return {
            name: report.name,
            data: report.data,
            type: report.type,
            size: report.size,
            uploadedAt: report.uploadedAt,
            storageType: 'firestore'
          };
        } else {
          // Storage - store URL and metadata
          return {
            name: report.name,
            url: report.url,
            path: report.path,
            type: report.type,
            size: report.size,
            uploadedAt: report.uploadedAt,
            storageType: 'storage'
          };
        }
      });
      
      console.log('Saving reports metadata:', reportsMetadata);
      console.log('Total report files:', reportFiles.length);

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'consultations'), {
        ...formData, 
        uhid: uhidToUse,
        doctorName: doctor.name, 
        doctorSpec: doctor.spec, 
        doctorEmail: doctor.email, 
        doctorId: doctor.id,
        receptionistId: currentUser.id || 'unknown', 
        receptionistName: currentUser.username || 'Reception', 
        status: 'pending', 
        meetingLink: formData.meetingLink, 
        createdAt: serverTimestamp(), 
        clinicalData: null,
        reports: reportsMetadata
      });

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patients', safePatientId), { 
          name: formData.name, 
          age: formData.age, 
          sex: formData.sex, 
          aadhaar: formData.aadhaar, 
          phone: formData.phone, 
          email: formData.email, 
          chronicConditions: formData.chronicConditions,
          uhid: uhidToUse,
          lastVisit: serverTimestamp()
      }, { merge: true });
      
      if (confirm(`Consultation Created! Send Google Meet invitations?`)) {
          const subject = `Consultation: ${formData.name} with Dr. ${doctor.name}`;
          const body = `Hello,\n\nA new consultation has been scheduled.\n\nPatient: ${formData.name}\nDoctor: ${doctor.name}\n\nJoin Google Meet: ${formData.meetingLink}\n\nRegards,\n${clinicSettings?.name || 'Clinic'}`;
          const recipients = [doctor.email, clinicSettings?.email || '', formData.email].filter(Boolean).join(',');
          window.open(`mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      }
      setFormData({ name: '', age: '', sex: 'Male', phone: '', email: '', aadhaar: '', chronicConditions: '', bp: '', pulse: '', grbs: '', weight: '', doctorId: '', meetingLink: '', paymentMode: 'Cash', paymentAmount: '500' });
      setReportFiles([]);
      setActiveTab('dashboard');
    } catch (err) { 
        console.error("Registration Error:", err); 
        alert(`Error registering patient: ${err.message}`);
    } finally { 
        setLoading(false); 
    }
  };

  const handleUpdateConsultation = async (e) => {
      e.preventDefault();
      if (!editingConsultation) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', editingConsultation.id), {
             meetingLink: editingConsultation.meetingLink,
             paymentAmount: editingConsultation.paymentAmount,
             pharmacyAmount: editingConsultation.pharmacyAmount || 0,
             diagnosticsAmount: editingConsultation.diagnosticsAmount || 0
          });
          alert("Consultation details updated successfully.");
          setEditingConsultation(null);
      } catch (err) {
          console.error(err);
          alert("Failed to update consultation.");
      }
  };

  const handleSaveBilling = async (id, items, total, pharmacy, diagnostics) => {
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consultations', id), {
              billItems: items,
              paymentAmount: total,
              pharmacyAmount: pharmacy,
              diagnosticsAmount: diagnostics
          });
          setBillingConsultation(null);
      } catch (err) {
          console.error("Billing Error:", err);
          alert("Failed to save invoice.");
      }
  };

  const handleSendEmail = (consultation) => {
      const doc = doctors.find(d => d.id === consultation.doctorId);
      setViewingPatient(consultation);
      setViewingDoctor(doc);
      
      setTimeout(() => {
          if (confirm("Send Prescription Email?\n\nSTEP 1: An email draft will open. Please ATTACH the prescription PDF to it.\nSTEP 2: The Print window will open. Save as PDF to your device.\n\nProceed?")) {
              setTimeout(() => window.print(), 1000);
          }
      }, 500);
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

  // Filter follow-ups based on followUpDate
  const filteredFollowUps = consultations.filter(c => {
      if (!c.clinicalData?.followUpDate) return false;
      
      const followUpDate = new Date(c.clinicalData.followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let dateMatch = false;
      
      if (followUpFilterType === 'today') {
          dateMatch = followUpDate.toDateString() === today.toDateString();
      } else if (followUpFilterType === '7days') {
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);
          dateMatch = followUpDate >= today && followUpDate <= nextWeek;
      } else if (followUpFilterType === '30days') {
          const nextMonth = new Date();
          nextMonth.setDate(today.getDate() + 30);
          dateMatch = followUpDate >= today && followUpDate <= nextMonth;
      } else if (followUpFilterType === 'custom' && followUpCustomRange.start && followUpCustomRange.end) {
          const startDate = new Date(followUpCustomRange.start);
          const endDate = new Date(followUpCustomRange.end);
          endDate.setHours(23, 59, 59, 999);
          dateMatch = followUpDate >= startDate && followUpDate <= endDate;
      }
      
      return dateMatch;
  }).sort((a, b) => {
      const dateA = a.clinicalData?.followUpDate ? new Date(a.clinicalData.followUpDate) : new Date();
      const dateB = b.clinicalData?.followUpDate ? new Date(b.clinicalData.followUpDate) : new Date();
      return dateA - dateB;
  });
  
  const totalRevenue = filteredConsults.reduce((acc, curr) => acc + (Number(curr.paymentAmount) || 0), 0);
  const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="max-w-7xl mx-auto p-4">
      {viewingPatient && viewingDoctor && <PrescriptionPreview patient={viewingPatient} doctor={viewingDoctor} clinicalData={viewingPatient.clinicalData} onClose={() => {setViewingPatient(null); setViewingDoctor(null)}} onPrint={() => window.print()} readOnly={true} logo={prescriptionLogo} clinicSettings={clinicSettings} />}
      
      {selectedPatientProfile && (
          <PatientProfile 
              patient={selectedPatientProfile} 
              history={profileHistory} 
              onClose={() => setSelectedPatientProfile(null)} 
              onViewPrescription={(consult) => {
                  const doc = doctors.find(d => d.id === consult.doctorId);
                  if (doc) {
                      setViewingPatient(consult);
                      setViewingDoctor(doc);
                  } else {
                      alert("Doctor profile for this prescription not found.");
                  }
              }}
          />
      )}

      {/* NEW: Billing Modal */}
      {billingConsultation && (
          <BillingModal 
              consultation={billingConsultation} 
              onClose={() => setBillingConsultation(null)} 
              onSave={handleSaveBilling} 
          />
      )}

      {/* Edit Consultation Modal */}
      {editingConsultation && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Pencil size={20} className="text-blue-600"/> Edit Consultation</h3>
                     <button onClick={() => setEditingConsultation(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                 </div>
                 <form onSubmit={handleUpdateConsultation} className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label>
                         <input disabled className="w-full border p-3 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed" value={editingConsultation.name} />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Video Meeting Link (Google Meet)</label>
                         <div className="flex gap-2">
                             <input required type="text" className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none" value={editingConsultation.meetingLink} onChange={e => setEditingConsultation({...editingConsultation, meetingLink: e.target.value})} />
                             <button type="button" onClick={() => window.open('https://meet.google.com/new', '_blank')} className="px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs flex items-center shadow"><Plus size={16}/></button>
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Bill Amount</label>
                            <input required type="number" className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none font-bold" value={editingConsultation.paymentAmount} onChange={e => setEditingConsultation({...editingConsultation, paymentAmount: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-green-600 uppercase mb-1">Pharmacy Amt</label>
                            <input type="number" className="w-full border p-3 rounded-lg focus:ring-2 ring-green-500 outline-none bg-green-50/30" value={editingConsultation.pharmacyAmount || ''} onChange={e => setEditingConsultation({...editingConsultation, pharmacyAmount: e.target.value})} placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-purple-600 uppercase mb-1">Diagnostics Amt</label>
                            <input type="number" className="w-full border p-3 rounded-lg focus:ring-2 ring-purple-500 outline-none bg-purple-50/30" value={editingConsultation.diagnosticsAmount || ''} onChange={e => setEditingConsultation({...editingConsultation, diagnosticsAmount: e.target.value})} placeholder="0" />
                        </div>
                     </div>

                     <div className="flex justify-end pt-4 gap-2">
                        <button type="button" onClick={() => setEditingConsultation(null)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                         <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Save Changes</button>
                     </div>
                 </form>
              </div>
          </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap gap-4 mb-6 print:hidden">
        {['dashboard', 'followups', 'new', 'patients'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all shadow-sm ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow-blue-500/40 scale-105' 
                : tab === 'followups'
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab === 'new' ? 'New Patient' : tab === 'patients' ? 'Registered Patients' : tab === 'followups' ? 'Follow-ups' : 'Consultations'}
          </button>
        ))}
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
               <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email ID <span className="text-slate-400 font-normal">(Optional)</span></label><input type="email" className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Optional" /></div>
               <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Aadhaar</label><input className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.aadhaar} onChange={e => setFormData({...formData, aadhaar: e.target.value})} /></div>
               <div className="col-span-full"><label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">History</label><textarea rows="1" className="w-full border-b-2 border-slate-200 bg-slate-50/50 p-3 rounded-t-lg focus:border-blue-500 outline-none transition" value={formData.chronicConditions} onChange={e => setFormData({...formData, chronicConditions: e.target.value})} /></div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                   <h3 className="text-sm font-bold text-blue-700 uppercase mb-4 flex items-center gap-2"><Activity size={18}/> Vitals</h3>
                   <div className="grid grid-cols-4 gap-6"><input placeholder="BP" className="p-3 border rounded-xl" value={formData.bp} onChange={e => setFormData({...formData, bp: e.target.value})} /><input placeholder="Pulse" className="p-3 border rounded-xl" value={formData.pulse} onChange={e => setFormData({...formData, pulse: e.target.value})} /><input placeholder="GRBS" className="p-3 border rounded-xl" value={formData.grbs} onChange={e => setFormData({...formData, grbs: e.target.value})} /><input placeholder="Weight" className="p-3 border rounded-xl" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
                </div>
                
                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                    <h3 className="text-sm font-bold text-amber-700 uppercase mb-4 flex items-center gap-2"><FilePlus size={18}/> Upload Reports (Optional)</h3>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleReportUpload} 
                      disabled={uploadingReports}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 disabled:opacity-50"
                    />
                    
                    {/* Upload Progress Display */}
                    {uploadingReports && Object.keys(uploadProgress).length > 0 && (
                        <div className="mt-4 space-y-2">
                            {Object.entries(uploadProgress).map(([fileId, progress]) => (
                                <div key={fileId} className="bg-white p-3 rounded-lg border border-amber-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold text-slate-700 truncate flex-1 mr-2">{progress.fileName}</span>
                                        <span className="text-xs font-bold text-amber-600">{progress.progress}%</span>
                                    </div>
                                    <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-300 ${
                                                progress.status === 'completed' ? 'bg-green-500' : 
                                                progress.status === 'error' ? 'bg-red-500' : 
                                                'bg-amber-500'
                                            }`}
                                            style={{ width: `${progress.progress}%` }}
                                        />
                                    </div>
                                    {progress.status === 'error' && (
                                        <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Uploaded Files List */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {reportFiles.map((file, idx) => (
                                 <span key={idx} className="bg-white border border-amber-200 text-amber-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                                     {file.name} <button type="button" onClick={() => removeReport(idx)} className="text-red-500 hover:text-red-700"><X size={12}/></button>
                                 </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic">* Max size 50MB per file. Files &lt;700KB use Firestore, larger files use Firebase Storage. Images/PDFs recommended.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Doctor</label>
                 <input
                   type="text"
                   placeholder="Search doctor by name or specialty..."
                   className="w-full p-3 border-2 rounded-xl mb-2 text-sm"
                   value={doctorSearchQuery}
                   onChange={(e) => setDoctorSearchQuery(e.target.value)}
                 />
                 <select className="w-full p-4 border-2 rounded-xl" value={formData.doctorId} onChange={handleDoctorChange}>
                   <option value="">Select Doctor</option>
                   {filteredDoctors.map(d => (
                     <option key={d.id} value={d.id}>
                       {d.name}{d.spec ? ` (${d.spec})` : ''}
                     </option>
                   ))}
                 </select>
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
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Payment Amount</label>
                 <input type="number" className="w-full p-4 border-2 rounded-xl mb-4" value={formData.paymentAmount} onChange={e => setFormData({...formData, paymentAmount: e.target.value})} />
                 
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Video Meeting Link</label>
                 <div className="relative">
                     <input 
                       readOnly={!!selectedDoctor?.googleMeetUrl}
                       type="text" 
                       placeholder="Paste link here or select doctor with permanent link" 
                       className={`w-full p-4 border-2 rounded-xl font-mono text-sm ${!formData.meetingLink ? 'bg-red-50 border-red-100 text-red-500' : 'bg-green-50 border-green-100 text-green-700'}`} 
                       value={formData.meetingLink} 
                       onChange={e => setFormData({...formData, meetingLink: e.target.value})}
                     />
                     <div className="absolute right-3 top-3 flex gap-2">
                       {formData.meetingLink && <CheckCircle size={20} className="text-green-600"/>}
                        <button type="button" onClick={() => window.open('https://meet.google.com/new', '_blank')} className="bg-green-100 hover:bg-green-200 text-green-700 p-1 rounded-lg" title="Create New Link"><Plus size={16}/></button>
                     </div>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1 italic ml-1">
                     {formData.meetingLink && selectedDoctor?.googleMeetUrl
                       ? "* Link retrieved from Doctor's profile." 
                        : "* Manually create/paste link if doctor has no default."}
                 </p>
              </div>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition transform active:scale-95">
               {loading ? 'Processing...' : 'Register & Schedule'}
            </button>
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
                       <select className="border p-2 rounded-lg" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}><option value="all">All Doctors</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}{d.spec ? ` (${d.spec})` : ''}</option>)}</select>
                       <select className="border p-2 rounded-lg" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option></select>
                   </div>
               </div>
               <table className="min-w-full text-sm">
                   <thead className="bg-slate-50"><tr><th className="px-6 py-4 text-left">Date & Time</th><th className="px-6 py-4 text-left">Patient</th><th className="px-6 py-4 text-left">Details</th><th className="px-6 py-4 text-left">Doctor</th><th className="px-6 py-4 text-left">Financials</th><th className="px-6 py-4 text-left">Status</th><th className="px-6 py-4">Action</th></tr></thead>
                   <tbody>{filteredConsults.map(c => (
                       <tr key={c.id} className="hover:bg-blue-50">
                           <td className="px-6 py-4 text-slate-500">{c.createdAt ? new Date(c.createdAt.seconds*1000).toLocaleString() : 'N/A'}</td>
                           <td className="px-6 py-4 font-bold">{c.name}</td>
                           <td className="px-6 py-4 text-xs text-slate-500"><div>{c.age} / {c.sex}</div><div className="font-mono">{c.phone}</div></td>
                           <td className="px-6 py-4">{c.doctorName}</td>
                           <td className="px-6 py-4">
                               <div className="text-xs font-bold text-slate-700">Total: ₹{c.paymentAmount || 0}</div>
                               {(Number(c.pharmacyAmount) > 0 || Number(c.diagnosticsAmount) > 0) && (
                                   <div className="flex gap-2 mt-1">
                                       {Number(c.pharmacyAmount) > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Rx: {c.pharmacyAmount}</span>}
                                       {Number(c.diagnosticsAmount) > 0 && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Dx: {c.diagnosticsAmount}</span>}
                                   </div>
                               )}
                           </td>
                           <td className="px-6 py-4">{c.status}</td>
                           <td className="px-6 py-4 flex gap-2">
                               <button onClick={() => setBillingConsultation(c)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-full shadow-sm border border-emerald-200" title="Bill/Invoice">
                                   <Receipt size={16}/>
                               </button>
                               {c.status === 'completed' ? (
                                   <>
                                    <button onClick={() => handleSendEmail(c)} className="text-green-600 hover:bg-green-100 p-2 rounded-full" title="Email & Print"><Mail size={16}/></button>
                                    <button onClick={() => {setViewingPatient(c); setViewingDoctor(doctors.find(d=>d.id===c.doctorId))}} className="text-blue-600 hover:bg-blue-100 p-2 rounded-full" title="View/Print"><Printer size={16}/></button>
                                   </>
                               ) : (
                                   <>
                                    <a href={c.meetingLink} target="_blank" className="text-blue-600 font-bold hover:underline flex items-center gap-1"><Video size={14}/> Join</a>
                                    <button onClick={() => setEditingConsultation(c)} className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50"><Pencil size={14}/></button>
                                   </>
                               )}
                           </td>
                       </tr>
                   ))}</tbody>
               </table>
           </div>
        </div>
      )}

      {activeTab === 'followups' && (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
               <div>
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date Range</label>
                   <select className="border p-2 rounded-lg text-sm bg-slate-50" value={followUpFilterType} onChange={(e) => setFollowUpFilterType(e.target.value)}>
                       <option value="today">Today</option>
                       <option value="7days">Next 7 Days</option>
                       <option value="30days">Next 30 Days</option>
                       <option value="custom">Custom Range</option>
                   </select>
               </div>
               {followUpFilterType === 'custom' && (
                   <div className="flex gap-2">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Start Date</label>
                           <input type="date" className="border p-2 rounded-lg text-sm" value={followUpCustomRange.start} onChange={e => setFollowUpCustomRange({...followUpCustomRange, start: e.target.value})} />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">End Date</label>
                           <input type="date" className="border p-2 rounded-lg text-sm" value={followUpCustomRange.end} onChange={e => setFollowUpCustomRange({...followUpCustomRange, end: e.target.value})} />
                       </div>
                   </div>
               )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Clock className="text-purple-500"/> Pending Follow-ups</h2>
                   <span className="text-sm text-slate-500 font-semibold">{filteredFollowUps.length} {filteredFollowUps.length === 1 ? 'appointment' : 'appointments'}</span>
               </div>
               
               {filteredFollowUps.length === 0 ? (
                   <div className="text-center py-12 text-slate-400">
                       <Clock className="mx-auto mb-3 text-slate-300" size={48}/>
                       <p className="text-lg font-semibold">No pending follow-ups found</p>
                       <p className="text-sm mt-1">for the selected date range.</p>
                   </div>
               ) : (
                   <div className="space-y-4">
                       {filteredFollowUps.map(c => {
                           const followUpDate = c.clinicalData?.followUpDate ? new Date(c.clinicalData.followUpDate) : null;
                           const isToday = followUpDate && followUpDate.toDateString() === new Date().toDateString();
                           const isOverdue = followUpDate && followUpDate < new Date();
                           const doctor = doctors.find(d => d.id === c.doctorId);
                           
                           return (
                               <div key={c.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition">
                                   <div className="flex items-center gap-4">
                                       <div className={`w-2 h-12 rounded-full ${isOverdue ? 'bg-red-500' : isToday ? 'bg-orange-500' : 'bg-purple-500'}`}></div>
                                       <div>
                                           <h4 className="font-bold text-slate-800">{c.name}</h4>
                                           <p className="text-xs text-slate-500">
                                               Follow-up: {followUpDate ? followUpDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                               {isOverdue && <span className="ml-2 text-red-600 font-bold">(Overdue)</span>}
                                               {isToday && <span className="ml-2 text-orange-600 font-bold">(Today)</span>}
                                           </p>
                                           <p className="text-xs text-slate-400">
                                               Dr. {doctor?.name || 'Unknown'} | Last Visit: {formatDate(c.createdAt?.seconds)}
                                           </p>
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => {
                                           const doc = doctors.find(d => d.id === c.doctorId);
                                           if (doc) {
                                               setViewingPatient(c);
                                               setViewingDoctor(doc);
                                           }
                                       }} className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold uppercase hover:bg-purple-100">View</button>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               )}
           </div>
        </div>
      )}
      
      {activeTab === 'patients' && (
         <div className="bg-white rounded-3xl shadow-xl p-6">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-blue-600"/> Patient Registry</h2>
             
             {/* Patient Search in Registry */}
             <div className="mb-4">
                 <input 
                    type="text" 
                    placeholder="Search by Patient Name, ID, Mobile or Aadhaar..." 
                    className="w-full border p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 ring-blue-500 outline-none transition"
                    onChange={(e) => {
                        const term = e.target.value.toLowerCase();
                        if (term === '') {
                             setSearchResults([]);
                             setSearchQuery('');
                        } else {
                             setSearchQuery(term);
                             setSearchResults(patients.filter(p => 
                                (p.name && p.name.toLowerCase().includes(term)) || 
                                (p.aadhaar && String(p.aadhaar).includes(term)) || 
                                (p.phone && String(p.phone).includes(term)) ||
                                (p.uhid && String(p.uhid).toLowerCase().includes(term))
                             ));
                        }
                    }}
                 />
             </div>

             <div className="overflow-x-auto border border-slate-200 rounded-xl">
                 <table className="min-w-full text-sm">
                     <thead className="bg-slate-50">
                         <tr>
                             <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Unique ID</th>
                             <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Patient Name</th>
                             <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Mobile</th>
                             <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Aadhaar</th>
                             <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase">Age/Sex</th>
                             <th className="px-6 py-4 text-right font-bold text-slate-600 uppercase">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {(searchQuery ? searchResults : patients).length === 0 ? (
                             <tr><td colSpan="6" className="p-8 text-center text-slate-400">No patients found.</td></tr>
                         ) : (searchQuery ? searchResults : patients).map(p => (
                             <tr key={p.id} onClick={() => openPatientProfile(p)} className="hover:bg-blue-50 cursor-pointer transition">
                                 <td className="px-6 py-4 font-mono font-medium text-blue-600">{p.uhid || 'N/A'}</td>
                                 <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                                 <td className="px-6 py-4 text-slate-600">{p.phone}</td>
                                 <td className="px-6 py-4 text-slate-600">{p.aadhaar || '-'}</td>
                                 <td className="px-6 py-4 text-slate-600">{p.age} / {p.sex}</td>
                                 <td className="px-6 py-4 text-right">
                                     <button className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-100 px-3 py-1 rounded-full">
                                         View Profile
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         </div>
      )}
    </div>
  );
};

export default ReceptionistView;
