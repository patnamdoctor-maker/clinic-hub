import React, { useState } from 'react';
import { Receipt, ShoppingBag, Beaker, Save, Plus, Trash2, X } from 'lucide-react';

// Billing Modal (UPDATED with Rx and Dx fields)
const BillingModal = ({ consultation, onClose, onSave }) => {
    // Initial state: Use existing bill items OR create a default "Consultation Fee" item from the initial payment amount
    const [items, setItems] = useState(
        consultation.billItems && consultation.billItems.length > 0 
        ? consultation.billItems 
        : [{ id: 1, desc: 'Consultation Fee', amount: Number(consultation.paymentAmount) || 0 }]
    );
    
    // Separate state for Pharmacy and Diagnostics
    const [pharmacyAmount, setPharmacyAmount] = useState(consultation.pharmacyAmount || 0);
    const [diagnosticsAmount, setDiagnosticsAmount] = useState(consultation.diagnosticsAmount || 0);
    
    const [newItem, setNewItem] = useState({ desc: '', amount: '' });

    const itemsTotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const grandTotal = itemsTotal + Number(pharmacyAmount) + Number(diagnosticsAmount);

    const handleAddItem = () => {
        if (!newItem.desc || !newItem.amount) return;
        setItems([...items, { id: Date.now(), desc: newItem.desc, amount: Number(newItem.amount) }]);
        setNewItem({ desc: '', amount: '' });
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSave = () => {
        onSave(consultation.id, items, grandTotal, pharmacyAmount, diagnosticsAmount);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Receipt className="text-blue-600" size={20}/> Billing & Invoice
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase">{consultation.name} | {consultation.uhid || 'No UHID'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-full text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
                </div>
                
                <div className="p-6">
                    {/* Standard Bill Items */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-4">
                        <div className="max-h-48 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Service / Procedure</th>
                                        <th className="px-4 py-3 text-right">Amount (₹)</th>
                                        <th className="px-2 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-white">
                                            <td className="px-4 py-3 font-medium text-slate-700">{item.desc}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-600">{Number(item.amount).toLocaleString()}</td>
                                            <td className="px-2 py-3 text-right">
                                                <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-slate-300 hover:text-red-500 transition"><Trash2 size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-slate-400 italic">No services added.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            placeholder="Add Service (e.g., Procedure, Dressing)" 
                            className="flex-1 border p-2 rounded-lg text-sm outline-none focus:ring-2 ring-blue-500"
                            value={newItem.desc}
                            onChange={(e) => setNewItem({...newItem, desc: e.target.value})}
                        />
                        <input 
                            type="number" 
                            placeholder="Cost" 
                            className="w-24 border p-2 rounded-lg text-sm outline-none focus:ring-2 ring-blue-500"
                            value={newItem.amount}
                            onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        />
                        <button onClick={handleAddItem} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"><Plus size={20}/></button>
                    </div>

                    {/* Pharmacy & Diagnostics Section */}
                    <div className="grid grid-cols-2 gap-4 mb-6 border-t border-slate-100 pt-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                 <ShoppingBag size={12}/> Pharmacy Paid (₹)
                             </label>
                             <input 
                                type="number" 
                                className="w-full border p-2 rounded-lg text-sm font-mono focus:ring-2 ring-green-500 outline-none bg-green-50/30"
                                value={pharmacyAmount}
                                onChange={(e) => setPharmacyAmount(e.target.value)}
                                placeholder="0"
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                 <Beaker size={12}/> Diagnostics Paid (₹)
                             </label>
                             <input 
                                type="number" 
                                className="w-full border p-2 rounded-lg text-sm font-mono focus:ring-2 ring-purple-500 outline-none bg-purple-50/30"
                                value={diagnosticsAmount}
                                onChange={(e) => setDiagnosticsAmount(e.target.value)}
                                placeholder="0"
                             />
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-slate-800 text-white px-4 py-3 rounded-xl flex justify-between items-center mb-6 shadow-lg">
                        <span className="font-bold uppercase text-xs tracking-wider">Grand Total Amount</span>
                        <span className="font-bold text-xl">₹{grandTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg text-sm">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-500/30 flex items-center gap-2">
                            <Save size={16}/> Save Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingModal;
