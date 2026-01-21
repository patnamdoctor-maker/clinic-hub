import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { DEFAULT_LOGO, DEFAULT_CLINIC_DETAILS } from '../constants';

const PrescriptionPreview = ({ patient, doctor, clinicalData, onClose, onPrint, onEdit, readOnly, logo, clinicSettings }) => {
  if (!patient || !doctor || !clinicalData) return null;
  
  const details = clinicSettings || DEFAULT_CLINIC_DETAILS;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-slate-900/80 backdrop-blur-sm z-[9999] overflow-auto flex justify-center py-8">
       <div className="bg-white max-w-[210mm] w-full min-h-[297mm] p-8 print:p-0 relative shadow-2xl print:shadow-none print:m-0 print:w-full print:absolute print:top-0 print:left-0 flex flex-col" style={{ fontFamily: '"Aptos Body", "Calibri", "Arial", sans-serif' }}>
        
        {/* Controls */}
        <div className="print:hidden flex justify-between mb-8 border-b pb-4 sticky top-0 bg-white z-10 font-sans">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600"/> Prescription Preview</h2>
            <div className="flex gap-3">
               {!readOnly && onEdit && <button onClick={onEdit} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 font-medium text-slate-700">Edit</button>}
               <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 font-medium text-slate-700">Close</button>
               <button onClick={onPrint} className="px-6 py-2 text-sm bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 shadow-lg shadow-blue-500/30"><Printer size={16}/> Print</button>
            </div>
        </div>

        <table className="w-full text-black text-sm leading-snug">
           <thead>
               <tr>
                   <td>
                       <div className="flex flex-col justify-center items-center border-b-2 border-black mb-4 pb-2">
                            <img src={logo || DEFAULT_LOGO} alt="Header" className="h-20 w-auto object-contain mb-2" />
                            <h2 className="font-bold text-lg uppercase tracking-wide">{details.name}</h2>
                            <p className="text-sm">{details.location}</p>
                       </div>
                   </td>
               </tr>
           </thead>

           <tfoot>
               <tr>
                   <td>
                       <div className="h-auto pt-4 border-t-2 border-black text-xs text-center text-gray-600 mt-auto">
                           <p className="mb-1">{details.address} | Ph: {details.phone} {details.altPhone && `, ${details.altPhone}`}</p>
                           <p className="italic">Remark: This is an electronically generated prescription.</p>
                       </div>
                   </td>
               </tr>
           </tfoot>

           <tbody>
               <tr>
                   <td className="align-top">
                       <div className="px-2">
                           <div className="flex justify-between items-start mb-4 text-sm">
                                <div className="w-1/3 pt-2">
                                   <p><span className="font-bold">Date:</span> {patient.createdAt ? new Date(patient.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                   {patient.uhid && <p><span className="font-bold">UHID:</span> {patient.uhid}</p>}
                                </div>
                                <div className="w-2/3 text-right">
                                    <p className="font-bold text-lg uppercase">{doctor.name}</p>
                                    {doctor.designation && <p className="font-bold text-sm uppercase">{doctor.designation}</p>}
                                    <p className="text-sm">{doctor.qualification}</p>
                                    <p className="text-sm">{doctor.registration}</p>
                                </div>
                           </div>

                           <div className="flex justify-between mb-2 text-sm font-medium">
                                <div className="flex-1"><span className="font-bold">Name:</span> {patient.name}</div>
                                <div className="flex-1 text-center"><span className="font-bold">Age/Sex:</span> {patient.age} / {patient.sex}</div>
                                <div className="flex-1 text-right"><span className="font-bold">Weight:</span> {patient.weight}</div>
                           </div>

                           <div className="flex justify-between mb-4 text-sm font-medium border-b border-black pb-2">
                                <div className="flex-1"><span className="font-bold">BP:</span> {patient.bp}</div>
                                <div className="flex-1 text-center"><span className="font-bold">Ph:</span> {patient.phone}</div>
                                <div className="flex-1 text-right"><span className="font-bold">Pulse:</span> {patient.pulse}</div>
                           </div>

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
       </div>
    </div>
  );
};

export default PrescriptionPreview;
