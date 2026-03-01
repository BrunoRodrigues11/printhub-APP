import React from 'react';
import { Printer, PrinterType } from '../types';
import { StatusBadge } from './StatusBadge';
import { MapPin, Printer as PrinterIcon, QrCode, ScrollText, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrinterCardProps {
  printer: Printer;
}

export const PrinterCard: React.FC<PrinterCardProps> = ({ printer }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200 overflow-hidden cursor-pointer group"
      onClick={() => navigate(`/printer/${printer.id}`)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
              {printer.type === PrinterType.THERMAL ? <Receipt size={24} /> : <PrinterIcon size={24} />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 leading-tight">{printer.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{printer.manufacturer} {printer.model}</p>
            </div>
          </div>
          <StatusBadge status={printer.status} size="sm" />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center text-sm text-slate-600">
            <MapPin size={16} className="mr-2 text-slate-400 shrink-0" />
            <span className="truncate">{printer.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-slate-600">
               <span className="inline-block w-4 h-4 mr-2 text-center text-slate-400 font-mono text-xs border border-slate-300 rounded">#</span>
               <span className="font-mono text-xs">{printer.serialNumber}</span>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
              printer.type === PrinterType.THERMAL 
                ? 'bg-orange-50 text-orange-600 border-orange-100' 
                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              {printer.type}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs text-slate-500">
          RI: {printer.assetId}
        </span>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
          <QrCode size={16} className="mr-1.5" />
          Acessar HUB
        </button>
      </div>
    </div>
  );
};