import React, { useState } from 'react';
import { User, Hash, Activity, FileText, FilePlus, Image as ImageIcon, Printer, Plus } from 'lucide-react';
import { formatDate } from '../utils';

const PatientProfile = ({ patient, history = [], onClose, onViewPrescription }) => {
    const [activeTab, setActiveTab] = useState('overview');
    
    // Aggregate reports from all consultations
    const allReports = history.reduce((acc, consult) => {
        if(consult.reports && Array.isArray(consult.reports)) {
            return [...acc, ...consult.reports.map(r => ({...r, date: consult.createdAt}))];
        }
        return acc;
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
                
                {/* Sidebar / Info Panel */}
                <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-slate-200 flex flex-col overflow-y-auto">
                    <div className="mb-6 text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center text-blue-600">
                            <User size={36}/>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mt-2">
                             <Hash size={12}/> {patient.uhid || 'NO UHID'}
                        </div>
                    </div>
                    
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Age / Sex</span>
                            <span className="font-semibold">{patient.age} / {patient.sex}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Mobile</span>
                            <span className="font-semibold">{patient.phone}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Aadhaar</span>
                            <span className="font-semibold">{patient.aadhaar || 'N/A'}</span>
                        </div>
                         <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Email</span>
                            <span className="font-semibold truncate max-w-[150px]">{patient.email || 'N/A'}</span>
                        </div>
                         <div className="pt-2">
                            <span className="block text-slate-500 mb-1 text-xs uppercase font-bold">Chronic Conditions / History</span>
                            <p className="bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-100 italic text-xs leading-relaxed">
                                {patient.chronicConditions || 'No recorded chronic history.'}
                            </p>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="mt-auto pt-6 w-full text-center text-slate-500 hover:text-slate-800 font-bold text-sm">Close Profile</button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="flex border-b border-slate-100">
                        {['overview', 'timeline', 'reports'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Visits</div>
                                        <div className="text-3xl font-bold text-slate-800">{history.length}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Last Visit</div>
                                        <div className="text-lg font-bold text-slate-800">
                                            {history.length > 0 ? formatDate(history[0].createdAt?.seconds) : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18} className="text-blue-500"/> Recent Vitals</h3>
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Date</th>
                                                <th className="px-4 py-3 text-left">BP</th>
                                                <th className="px-4 py-3 text-left">Pulse</th>
                                                <th className="px-4 py-3 text-left">Weight</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {history.slice(0, 5).map(visit => (
                                                <tr key={visit.id}>
                                                    <td className="px-4 py-3 font-medium">{formatDate(visit.createdAt?.seconds)}</td>
                                                    <td className="px-4 py-3">{visit.bp || '-'}</td>
                                                    <td className="px-4 py-3">{visit.pulse || '-'}</td>
                                                    <td className="px-4 py-3">{visit.weight || '-'}</td>
                                                </tr>
                                            ))}
                                            {history.length === 0 && <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">No vitals recorded yet.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="space-y-6">
                                {history.length === 0 ? <p className="text-center text-slate-400 mt-10">No consultation history found.</p> : (
                                    history.map((consult, idx) => (
                                        <div key={consult.id} className="relative pl-8 pb-6 border-l-2 border-slate-200 last:border-0">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                            {formatDate(consult.createdAt?.seconds)}
                                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${consult.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>{consult.status}</span>
                                                        </h4>
                                                        <p className="text-sm text-blue-600 font-medium">Dr. {consult.doctorName}</p>
                                                    </div>
                                                </div>
                                                
                                                {consult.clinicalData && (
                                                    <div className="space-y-3 text-sm border-t pt-3 border-slate-100">
                                                        {consult.clinicalData.provisionalDiagnosis && (
                                                            <div>
                                                                <span className="text-xs font-bold text-slate-400 uppercase">Diagnosis</span>
                                                                <p className="text-slate-800">{consult.clinicalData.provisionalDiagnosis}</p>
                                                            </div>
                                                        )}
                                                        {consult.clinicalData.medications && (
                                                            <div>
                                                                <span className="text-xs font-bold text-slate-400 uppercase">Prescription</span>
                                                                <p className="font-mono text-xs bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap">{consult.clinicalData.medications}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {consult.status === 'completed' && onViewPrescription && (
                                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                                        <button 
                                                            onClick={() => onViewPrescription(consult)}
                                                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase hover:bg-blue-100 transition"
                                                        >
                                                            <Printer size={14}/> View Prescription
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div>
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18}/> Files & Reports</h3>
                                {allReports.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                        <FilePlus className="mx-auto text-slate-300 mb-2" size={32}/>
                                        <p className="text-slate-400">No reports uploaded for this patient.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {allReports.map((report, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition group">
                                                <div className="bg-purple-100 p-2.5 rounded-lg text-purple-600">
                                                    {report.type?.includes('image') ? <ImageIcon size={20}/> : <FileText size={20}/>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-slate-800 truncate">{report.name}</p>
                                                    <p className="text-xs text-slate-500">{formatDate(report.date?.seconds)}</p>
                                                </div>
                                                <a 
                                                    href={report.data} 
                                                    download={report.name} 
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Download"
                                                >
                                                    <Plus className="rotate-45" size={20}/>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;
