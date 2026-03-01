import React, { useState, useEffect } from 'react';
import { Printer, PrinterStatus, PrinterType, Site } from '../types';
import { X, Droplets } from 'lucide-react';

interface PrinterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Printer, 'id' | 'lastUpdated'>) => void;
  initialData?: Printer | null;
  sites: Site[];
}

export const PrinterFormModal: React.FC<PrinterFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  sites
}) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model: '',
    type: PrinterType.PAPER,
    serialNumber: '',
    assetId: '',
    site: '',
    location: '',
    ipAddress: '',
    queueName: '',
    tonerCode: '',
    status: PrinterStatus.ONLINE,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        manufacturer: initialData.manufacturer,
        model: initialData.model,
        type: initialData.type || PrinterType.PAPER,
        serialNumber: initialData.serialNumber,
        assetId: initialData.assetId,
        site: initialData.site || '',
        location: initialData.location,
        ipAddress: initialData.ipAddress || '',
        queueName: initialData.queueName,
        tonerCode: initialData.tonerCode || '',
        status: initialData.status,
        notes: initialData.notes || ''
      });
    } else {
      // Reset for new entry
      setFormData({
        name: '',
        manufacturer: '',
        model: '',
        type: PrinterType.PAPER,
        serialNumber: '',
        assetId: '',
        location: '',
        ipAddress: '',
        queueName: '',
        tonerCode: '',
        status: PrinterStatus.ONLINE,
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClasses = "w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Editar Impressora' : 'Nova Impressora'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Impressora *</label>
              <input required name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="Ex: ADM-FIN-01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClasses}>
                {Object.values(PrinterStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fabricante *</label>
              <input required name="manufacturer" value={formData.manufacturer} onChange={handleChange} className={inputClasses} placeholder="Ex: HP" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
              <input required name="model" value={formData.model} onChange={handleChange} className={inputClasses} placeholder="Ex: LaserJet M404" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Impressão *</label>
              <select name="type" value={formData.type} onChange={handleChange} className={inputClasses}>
                {Object.values(PrinterType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de Série *</label>
              <input required name="serialNumber" value={formData.serialNumber} onChange={handleChange} className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patrimônio / Asset ID *</label>
              <input required name="assetId" value={formData.assetId} onChange={handleChange} className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Localidade / Unidade *</label>
              <select required name="site" value={formData.site} onChange={handleChange} className={inputClasses}>
                <option value="">Selecione...</option>
                {sites.map(site => (
                  <option key={site.id} value={site.name}>{site.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço IP</label>
              <input name="ipAddress" value={formData.ipAddress} onChange={handleChange} className={inputClasses} placeholder="192.168.x.x" />
            </div>
            
            {/* Campo Condicional de Toner */}
            {formData.type === PrinterType.PAPER && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center text-blue-700">
                  <Droplets size={14} className="mr-1.5" /> Código do Toner
                </label>
                <input 
                  name="tonerCode" 
                  value={formData.tonerCode} 
                  onChange={handleChange} 
                  className={`${inputClasses} border-blue-200 bg-blue-50 focus:ring-blue-500`} 
                  placeholder="Ex: CF258A ou MLT-D304E" 
                />
              </div>
            )}

            <div className={`${formData.type === PrinterType.PAPER ? '' : 'md:col-span-2'}`}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Localização *</label>
              <input required name="location" value={formData.location} onChange={handleChange} className={inputClasses} placeholder="Ex: Financeiro - 2º Andar" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Fila</label>
              <input required name="queueName" value={formData.queueName} onChange={handleChange} className={inputClasses} placeholder="\\server\printer" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas / Observações</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputClasses} />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition font-medium">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium">
              {initialData ? 'Salvar Alterações' : 'Criar Impressora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};