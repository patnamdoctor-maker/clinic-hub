import React from 'react';
import { LogOut } from 'lucide-react';
import { DEFAULT_LOGO, DEFAULT_CLINIC_DETAILS } from '../constants';

const Header = ({ userRole, userName, onLogout, logo, clinicSettings }) => (
  <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 shadow-lg shadow-blue-900/20 flex justify-between items-center print:hidden sticky top-0 z-50">
    <div className="flex items-center space-x-4">
      <div className="bg-white p-1.5 rounded-lg shadow-inner w-12 h-12 flex items-center justify-center">
        <img src={logo || DEFAULT_LOGO} alt="App Logo" className="w-full h-full object-contain" />
      </div>
      <div>
        <h1 className="font-bold text-lg md:text-xl tracking-widest uppercase font-sans text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white">
           {clinicSettings?.name || DEFAULT_CLINIC_DETAILS.name}
        </h1>
        <p className="text-[10px] text-blue-200 tracking-wider uppercase">
           {clinicSettings?.location || DEFAULT_CLINIC_DETAILS.location} | Premium Teleconsultation Suite
        </p>
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

export default Header;
