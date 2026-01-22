import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { DEFAULT_LOGO, DEFAULT_CLINIC_DETAILS } from '../constants';

const PrescriptionPreview = ({ patient, doctor, clinicalData, onClose, onPrint, onEdit, readOnly, logo, clinicSettings }) => {
  if (!patient || !doctor || !clinicalData) return null;
  
  const details = clinicSettings || DEFAULT_CLINIC_DETAILS;

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm 10mm 15mm 10mm; /* Top, Right, Bottom, Left */
          }
          
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            box-sizing: border-box;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          .prescription-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white;
            font-family: "Aptos Body", "Calibri", "Arial", sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: black;
            overflow: visible !important;
            box-sizing: border-box !important;
            height: auto !important;
          }
          
          /* Table structure for repeating headers/footers */
          .prescription-table {
            width: 100% !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            border-collapse: collapse;
            table-layout: fixed;
            page-break-inside: auto;
            height: auto !important;
          }
          
          /* Header repeats on each page */
          .prescription-table thead {
            display: table-header-group !important;
          }
          
          .prescription-table thead tr {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          .prescription-table thead td {
            height: auto !important;
          }
          
          .prescription-header {
            margin-bottom: 8mm;
            border-bottom: 2px solid black;
            padding-bottom: 3mm;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          
          .prescription-header img {
            height: 45px !important;
            width: auto !important;
            max-width: 180px !important;
            object-fit: contain;
            display: block;
            margin: 0 auto 2mm auto;
          }
          
          .prescription-header h2 {
            font-size: 13pt !important;
            font-weight: bold !important;
            text-align: center;
            margin: 2mm 0 1mm 0;
            line-height: 1.2;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
          }
          
          .prescription-header p {
            font-size: 9pt !important;
            text-align: center;
            margin: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
          }
          
          /* Footer repeats on each page */
          .prescription-table tfoot {
            display: table-footer-group !important;
          }
          
          .prescription-table tfoot tr {
            page-break-inside: avoid;
            page-break-before: avoid;
          }
          
          .prescription-table tfoot td {
            height: auto !important;
          }
          
          .prescription-footer {
            margin-top: 8mm;
            padding-top: 4mm;
            border-top: 2px solid black;
            font-size: 8pt !important;
            text-align: center;
            width: 100%;
            max-width: 100%;
          }
          
          .prescription-footer p {
            font-size: 8pt !important;
            margin: 1mm 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          /* Content area - MUST allow page breaks */
          .prescription-table tbody {
            display: table-row-group !important;
          }
          
          .prescription-table tbody tr {
            page-break-inside: auto !important;
            height: auto !important;
          }
          
          .prescription-table tbody td {
            padding: 0;
            vertical-align: top;
            width: 100%;
            max-width: 100%;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            overflow-wrap: anywhere;
            overflow: visible !important;
            height: auto !important;
          }
          
          .prescription-content {
            font-size: 10pt;
            line-height: 1.5;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: visible !important;
            padding: 0 2mm;
            height: auto !important;
            page-break-inside: auto !important;
          }
          
          .prescription-section {
            margin-bottom: 5mm;
            orphans: 2;
            widows: 2;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: visible !important;
            page-break-inside: auto !important;
          }
          
          .prescription-section h3 {
            font-size: 10pt !important;
            font-weight: bold !important;
            margin-bottom: 2mm;
            margin-top: 0;
            page-break-after: avoid;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .prescription-section p,
          .prescription-section div {
            font-size: 10pt !important;
            line-height: 1.5 !important;
            word-wrap: break-word !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            hyphens: auto;
            margin: 0 0 2mm 0;
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          
          .medications-section {
            font-size: 9pt !important;
            font-family: "Courier New", "Courier", monospace !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            line-height: 1.6;
            page-break-inside: auto !important;
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          
          .medications-section h3 {
            font-family: "Aptos Body", "Calibri", "Arial", sans-serif !important;
            font-size: 11pt !important;
            page-break-after: avoid;
          }
          
          .medications-section div {
            max-width: 100% !important;
            width: 100% !important;
            word-wrap: break-word !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            white-space: pre-wrap !important;
            overflow: visible !important;
            box-sizing: border-box !important;
            page-break-inside: auto !important;
          }
          
          /* Patient info should stay together */
          .patient-info-section {
            page-break-after: avoid;
            page-break-inside: avoid;
            margin-bottom: 5mm;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          
          .patient-info-section .flex {
            flex-wrap: wrap;
            max-width: 100%;
            box-sizing: border-box;
          }
          
          .patient-info-section .flex > div {
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }
          
          .patient-info-section p {
            word-wrap: break-word !important;
            overflow-wrap: anywhere !important;
            max-width: 100%;
          }
          
          .signature-section {
            margin-top: 8mm;
            page-break-inside: avoid;
            page-break-before: avoid;
          }
          
          .signature-section img {
            height: 30px !important;
            max-width: 120px !important;
            object-fit: contain;
            display: block;
          }
          
          .signature-section p {
            font-size: 9pt !important;
            margin-top: 2mm;
          }
          
          /* Force all text to wrap */
          .prescription-content p,
          .prescription-content div,
          .prescription-content span {
            word-wrap: break-word !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          
          /* Prevent any fixed heights */
          .prescription-container,
          .prescription-table,
          .prescription-content,
          .prescription-section {
            min-height: 0 !important;
          }
        }
        
        @media screen {
          .prescription-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            overflow-x: hidden;
            width: 100%;
            box-sizing: border-box;
            height: auto;
          }
          
          .prescription-table {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
            height: auto;
          }
          
          .prescription-content {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
            height: auto;
          }
          
          .prescription-section p,
          .prescription-section div {
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            overflow-wrap: anywhere;
            max-width: 100%;
            overflow-x: hidden;
          }
          
          .medications-section div {
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            overflow-wrap: anywhere;
            max-width: 100%;
            width: 100%;
            overflow-x: hidden;
          }
        }
      `}</style>

      <div className="fixed top-0 left-0 w-full h-full bg-slate-900/80 backdrop-blur-sm z-[9999] overflow-auto flex justify-center py-8 print:relative print:inset-0 print:bg-white print:h-auto print:overflow-visible">
        <div className="prescription-container bg-white w-full p-8 print:p-0 print:w-full print:m-0 print:max-w-full print:h-auto print:overflow-visible" style={{ maxWidth: '100%' }}>
          {/* Controls */}
          <div className="print:hidden flex justify-between mb-8 border-b pb-4 sticky top-0 bg-white z-10 font-sans">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600"/> Prescription Preview</h2>
            <div className="flex gap-3">
              {!readOnly && onEdit && <button onClick={onEdit} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 font-medium text-slate-700">Edit</button>}
              <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 font-medium text-slate-700">Close</button>
              <button onClick={onPrint} className="px-6 py-2 text-sm bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 shadow-lg shadow-blue-500/30"><Printer size={16}/> Print</button>
            </div>
          </div>

          {/* Prescription Content - Table structure for repeating headers/footers */}
          <table className="prescription-table">
            {/* Header - Repeats on each page */}
            <thead>
              <tr>
                <td>
                  <div className="prescription-header">
                    <div className="flex flex-col justify-center items-center">
                      <img src={logo || DEFAULT_LOGO} alt="Clinic Logo" className="h-16 w-auto object-contain mb-2 print:h-12 max-w-full" />
                      <h2 className="font-bold text-base uppercase tracking-wide print:text-sm break-words text-center">{details.name}</h2>
                      <p className="text-xs print:text-xs break-words text-center">{details.location}</p>
                    </div>
                  </div>
                </td>
              </tr>
            </thead>

            {/* Footer - Repeats on each page */}
            <tfoot>
              <tr>
                <td>
                  <div className="prescription-footer">
                    <p className="mb-1">{details.address} | Ph: {details.phone} {details.altPhone && `, ${details.altPhone}`}</p>
                    <p className="italic">Remark: This is an electronically generated prescription.</p>
                  </div>
                </td>
              </tr>
            </tfoot>

            {/* Content - Flows across pages */}
            <tbody>
              <tr>
                <td>
                  <div className="prescription-content">
              {/* Patient Info */}
              <div className="prescription-section patient-info-section">
                <div className="flex justify-between items-start mb-3 text-xs flex-wrap">
                  <div className="w-1/3 min-w-0 flex-shrink">
                    <p className="break-words"><span className="font-bold">Date:</span> {patient.createdAt ? new Date(patient.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                    {patient.uhid && <p className="break-words"><span className="font-bold">UHID:</span> {patient.uhid}</p>}
                  </div>
                  <div className="w-2/3 text-right min-w-0 flex-shrink">
                    <p className="font-bold text-sm uppercase break-words">{doctor.name}</p>
                    {doctor.designation && <p className="font-bold text-xs uppercase break-words">{doctor.designation}</p>}
                    <p className="text-xs break-words">{doctor.qualification}</p>
                    <p className="text-xs break-words">{doctor.registration}</p>
                  </div>
                </div>

                <div className="flex justify-between mb-2 text-xs font-medium flex-wrap">
                  <div className="flex-1 min-w-0"><span className="font-bold">Name:</span> <span className="break-words">{patient.name}</span></div>
                  <div className="flex-1 text-center min-w-0"><span className="font-bold">Age/Sex:</span> {patient.age} / {patient.sex}</div>
                  <div className="flex-1 text-right min-w-0"><span className="font-bold">Weight:</span> {patient.weight}</div>
                </div>

                <div className="flex justify-between mb-3 text-xs font-medium border-b border-black pb-2 flex-wrap">
                  <div className="flex-1 min-w-0"><span className="font-bold">BP:</span> {patient.bp}</div>
                  <div className="flex-1 text-center min-w-0"><span className="font-bold">Ph:</span> <span className="break-words">{patient.phone}</span></div>
                  <div className="flex-1 text-right min-w-0"><span className="font-bold">Pulse:</span> {patient.pulse}</div>
                </div>
              </div>

              {/* Clinical Data Sections */}
              <div className="space-y-2 text-xs">
                {patient.chronicConditions && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1 uppercase text-xs">History / Chronic Conditions:</h3>
                    <p className="whitespace-pre-wrap pl-1 italic break-words">{patient.chronicConditions}</p>
                  </div>
                )}

                {clinicalData.chiefComplaint && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1">Chief Complaints:</h3>
                    <p className="whitespace-pre-wrap pl-1 break-words">{clinicalData.chiefComplaint}</p>
                  </div>
                )}
                
                {clinicalData.history && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1">History:</h3>
                    <p className="whitespace-pre-wrap pl-1 break-words">{clinicalData.history}</p>
                  </div>
                )}

                {clinicalData.examFindings && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1">Examination:</h3>
                    <p className="whitespace-pre-wrap pl-1 break-words">{clinicalData.examFindings}</p>
                  </div>
                )}

                {clinicalData.provisionalDiagnosis && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1">Provisional Diagnosis:</h3>
                    <p className="whitespace-pre-wrap pl-1 break-words">{clinicalData.provisionalDiagnosis}</p>
                  </div>
                )}

                {clinicalData.prevInvestigations && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1">Previous Investigations:</h3>
                    <p className="whitespace-pre-wrap pl-1 break-words">{clinicalData.prevInvestigations}</p>
                  </div>
                )}

                {clinicalData.advisedInvestigations && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1">Investigations advised:</h3>
                    <p className="whitespace-pre-wrap pl-1 break-words">{clinicalData.advisedInvestigations}</p>
                  </div>
                )}

                <div className="prescription-section medications-section">
                  <h3 className="font-bold underline mb-1 text-sm">Medications:</h3>
                  <div className="whitespace-pre-wrap pl-1 font-mono break-words">
                    {clinicalData.medications}
                  </div>
                </div>

                {clinicalData.followUp && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1">Advise:</h3>
                    <p className="whitespace-pre-wrap pl-1 break-words">{clinicalData.followUp}</p>
                  </div>
                )}
                
                {clinicalData.followUpDate && (
                  <div className="prescription-section">
                    <h3 className="font-bold underline mb-1">Follow-up Date:</h3>
                    <p className="pl-1">{new Date(clinicalData.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
              </div>

                    {/* Signature */}
                    <div className="signature-section mt-6 flex flex-col items-end">
                      {doctor.signatureUrl ? (
                        <img src={doctor.signatureUrl} alt="Signature" className="h-12 object-contain mb-1 print:h-10" />
                      ) : (
                        <div className="h-12 mb-1 flex items-end font-cursive text-lg print:h-10">Sign: ________________</div>
                      )}
                      <p className="font-bold text-center min-w-[200px] text-xs">({doctor.name})</p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PrescriptionPreview;
