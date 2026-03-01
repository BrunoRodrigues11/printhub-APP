import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, PrinterStatus, PrinterType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MapPin, Server, ArrowLeft, Printer as PrinterIcon, Hash, Sliders, CheckSquare, X, Receipt, Link, FileText, QrCode, Globe, Droplets, Image as ImageIcon, Upload, Trash } from 'lucide-react';

interface PrinterDetailProps {
  printers: Printer[];
  onUpdateStatus: (id: string, newStatus: PrinterStatus) => void;
}

interface LabelSettings {
  showName: boolean;
  showModel: boolean;
  showLocation: boolean;
  showIp: boolean;
  showQueue: boolean;
  showSerial: boolean;
  showAssetId: boolean;
  showToner: boolean;
  scale: number;
  logo: string | null;
}

export const PrinterDetail: React.FC<PrinterDetailProps> = ({ printers, onUpdateStatus }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [printer, setPrinter] = useState<Printer | undefined>(undefined);
  
  // Label Modal State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [qrType, setQrType] = useState<'LINK' | 'INFO' | 'CUSTOM'>('LINK');
  const [customQrLink, setCustomQrLink] = useState('');

  // Label Settings State
  const [labelSettings, setLabelSettings] = useState<LabelSettings>({
    showName: true,
    showModel: true,
    showLocation: true,
    showIp: false,
    showQueue: false,
    showSerial: false,
    showAssetId: true,
    showToner: false,
    scale: 1,
    logo: null
  });

  useEffect(() => {
    const found = printers.find(p => p.id === id);
    setPrinter(found);
  }, [id, printers]);

  if (!printer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Impressora não encontrada</h2>
          <p className="text-slate-500 mt-2">O QR Code escaneado não corresponde a um equipamento cadastrado.</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(printer.id, e.target.value as PrinterStatus);
  };

  const toggleLabelSetting = (key: keyof LabelSettings) => {
    setLabelSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLabelSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLabelSettings(prev => ({ ...prev, logo: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Robust Print Logic using a new Window
  const handlePrintLabel = () => {
    if (qrType === 'CUSTOM' && !customQrLink) {
      alert("Por favor, insira o link customizado.");
      return;
    }

    const printContent = document.getElementById('printable-label-content');
    if (!printContent) return;

    // Open a new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir a etiqueta.');
      return;
    }

    // Generate the HTML for the new window
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Etiqueta - ${printer.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            background-color: white; 
            margin: 0; 
            padding: 0; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh;
          }
          @media print {
            @page { 
              margin: 0; 
              size: auto; /* Let content or printer settings decide size */
            }
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
        <script>
          // Wait slightly for styles to apply then print
          setTimeout(() => {
            window.print();
            // Optional: window.close() after print if desired, 
            // but keeping it open allows user to retry if needed.
          }, 800);
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Logic for QR Code Content
  let qrData = '';
  if (qrType === 'LINK') {
    qrData = window.location.href;
  } else if (qrType === 'INFO') {
    qrData = `Nome: ${printer.name}\nModelo: ${printer.model}\nIP: ${printer.ipAddress || 'N/A'}\nSérie: ${printer.serialNumber}\nPatrimônio: ${printer.assetId}`;
  } else {
    qrData = customQrLink || 'https://';
  }
    
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header / Nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Hub do Equipamento</h1>
          <button 
            onClick={() => setIsLabelModalOpen(true)}
            className="p-2 -mr-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
            title="Gerar Etiqueta"
          >
            <PrinterIcon size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Main Identity Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col items-center text-center">
             <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${printer.type === PrinterType.THERMAL ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                {printer.type === PrinterType.THERMAL ? <Receipt size={40} /> : <PrinterIcon size={40} />}
             </div>
             <h1 className="text-2xl font-bold text-slate-900">{printer.name}</h1>
             <p className="text-slate-500 mt-1">{printer.manufacturer} {printer.model}</p>
             
             <div className="flex items-center space-x-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded font-medium border ${printer.type === PrinterType.THERMAL ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                  {printer.type}
                </span>
             </div>
             
             <div className="mt-6 w-full flex justify-center">
                <StatusBadge status={printer.status} size="lg" />
             </div>

             <p className="text-xs text-slate-400 mt-4">
               Última atualização: {new Date(printer.lastUpdated).toLocaleString('pt-BR')}
             </p>
          </div>
        </div>

        {/* Quick Actions / Status Update */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
           <label className="block text-sm font-medium text-slate-700 mb-2">Atualizar Status</label>
           <div className="flex gap-2">
             <select 
                value={printer.status}
                onChange={handleStatusChange}
                className="block w-full rounded-lg border-slate-300 bg-slate-50 border px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
             >
                {Object.values(PrinterStatus).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
             </select>
           </div>
           <p className="text-xs text-slate-500 mt-2">
             * Alterações são registradas automaticamente no sistema central.
           </p>
        </div>

        {/* Technical Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                <MapPin size={16} className="mr-2 text-slate-400" /> Localização
             </h3>
             <div className="space-y-1">
               <p className="text-slate-700 font-medium">{printer.site}</p>
               <p className="text-sm text-slate-500">{printer.location}</p>
             </div>
             <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">Patrimônio: {printer.assetId}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                <Server size={16} className="mr-2 text-slate-400" /> Rede
             </h3>
             <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">IP:</span>
                  <span className="text-sm font-mono text-slate-700">{printer.ipAddress || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-slate-500">Fila:</span>
                  <span className="text-sm font-mono text-slate-700 break-all text-right ml-2">{printer.queueName}</span>
                </div>
             </div>
          </div>

          <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm ${printer.type === PrinterType.PAPER ? '' : 'md:col-span-2'}`}>
             <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                <Hash size={16} className="mr-2 text-slate-400" /> Série
             </h3>
             <p className="font-mono text-lg text-slate-800 tracking-wider bg-slate-50 p-2 rounded border border-slate-100 text-center">
                {printer.serialNumber}
             </p>
          </div>

          {/* Toner Section - Only for PAPER type */}
          {printer.type === PrinterType.PAPER && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                <Droplets size={16} className="mr-2 text-slate-400" /> Código do Toner
              </h3>
              <div className="flex items-center">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 w-full">
                  <span className="text-sm font-medium text-slate-700">
                    {printer.tonerCode || 'Não informado'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Label Generator Modal */}
      {isLabelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center">
                <PrinterIcon size={18} className="mr-2 text-blue-600" />
                Configurar Impressão de Etiqueta
              </h3>
              <button 
                onClick={() => setIsLabelModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                
                {/* Configuration Controls */}
                <div className="space-y-6">
                  
                  {/* Logo Upload Section */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                      <ImageIcon size={14} className="mr-2" /> Logo Corporativo
                    </h4>
                    <div className="flex items-center space-x-4">
                      {labelSettings.logo ? (
                        <div className="relative group">
                          <img src={labelSettings.logo} alt="Logo Preview" className="h-16 w-auto object-contain border border-slate-200 rounded bg-white p-1" />
                          <button 
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover Logo"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 bg-slate-50">
                          <ImageIcon size={24} />
                        </div>
                      )}
                      
                      <div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUpload}
                          ref={fileInputRef}
                          className="hidden" 
                          id="logo-upload"
                        />
                        <label 
                          htmlFor="logo-upload"
                          className="cursor-pointer inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                        >
                          <Upload size={14} className="mr-2" />
                          {labelSettings.logo ? 'Trocar Logo' : 'Upload Logo'}
                        </label>
                        <p className="text-xs text-slate-500 mt-1">Exibido no canto superior esquerdo.</p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Selection */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                      <QrCode size={14} className="mr-2" /> Conteúdo do QR Code
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => setQrType('LINK')}
                        className={`flex items-center justify-center p-2 rounded-lg border text-xs font-medium transition ${
                          qrType === 'LINK' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        <Link size={14} className="mr-1.5" />
                        Link Hub
                      </button>
                      <button 
                         onClick={() => setQrType('INFO')}
                         className={`flex items-center justify-center p-2 rounded-lg border text-xs font-medium transition ${
                          qrType === 'INFO' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        <FileText size={14} className="mr-1.5" />
                        Texto Info
                      </button>
                      <button 
                         onClick={() => setQrType('CUSTOM')}
                         className={`flex items-center justify-center p-2 rounded-lg border text-xs font-medium transition ${
                          qrType === 'CUSTOM' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        <Globe size={14} className="mr-1.5" />
                        Customizado
                      </button>
                    </div>

                    {qrType === 'CUSTOM' && (
                      <div className="mt-3 animate-fade-in">
                        <input 
                          type="text" 
                          value={customQrLink}
                          onChange={(e) => setCustomQrLink(e.target.value)}
                          placeholder="https://exemplo.com/suporte"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                      <CheckSquare size={14} className="mr-2" /> Campos Visíveis
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${labelSettings.showName ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                           <CheckSquare size={14} fill="currentColor" />
                        </div>
                        <input type="checkbox" className="hidden" checked={labelSettings.showName} onChange={() => toggleLabelSetting('showName')} />
                        <span className="text-sm text-slate-700">Nome</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${labelSettings.showModel ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                           <CheckSquare size={14} fill="currentColor" />
                        </div>
                        <input type="checkbox" className="hidden" checked={labelSettings.showModel} onChange={() => toggleLabelSetting('showModel')} />
                        <span className="text-sm text-slate-700">Modelo</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${labelSettings.showLocation ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                           <CheckSquare size={14} fill="currentColor" />
                        </div>
                        <input type="checkbox" className="hidden" checked={labelSettings.showLocation} onChange={() => toggleLabelSetting('showLocation')} />
                        <span className="text-sm text-slate-700">Localização</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${labelSettings.showAssetId ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                           <CheckSquare size={14} fill="currentColor" />
                        </div>
                        <input type="checkbox" className="hidden" checked={labelSettings.showAssetId} onChange={() => toggleLabelSetting('showAssetId')} />
                        <span className="text-sm text-slate-700">Patrimônio</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${labelSettings.showIp ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                           <CheckSquare size={14} fill="currentColor" />
                        </div>
                        <input type="checkbox" className="hidden" checked={labelSettings.showIp} onChange={() => toggleLabelSetting('showIp')} />
                        <span className="text-sm text-slate-700">IP</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${labelSettings.showQueue ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                           <CheckSquare size={14} fill="currentColor" />
                        </div>
                        <input type="checkbox" className="hidden" checked={labelSettings.showQueue} onChange={() => toggleLabelSetting('showQueue')} />
                        <span className="text-sm text-slate-700">Fila</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${labelSettings.showToner ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                           <CheckSquare size={14} fill="currentColor" />
                        </div>
                        <input type="checkbox" className="hidden" checked={labelSettings.showToner} onChange={() => toggleLabelSetting('showToner')} />
                        <span className="text-sm text-slate-700">Código Toner</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${labelSettings.showSerial ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                           <CheckSquare size={14} fill="currentColor" />
                        </div>
                        <input type="checkbox" className="hidden" checked={labelSettings.showSerial} onChange={() => toggleLabelSetting('showSerial')} />
                        <span className="text-sm text-slate-700">Série</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                       <Sliders size={14} className="mr-2" /> Escala
                    </h4>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500">50%</span>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="1.5" 
                        step="0.1" 
                        value={labelSettings.scale}
                        onChange={(e) => setLabelSettings(prev => ({...prev, scale: parseFloat(e.target.value)}))}
                        className="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs text-slate-500">150%</span>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-2 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 min-h-[300px] overflow-hidden relative">
                   
                   <p className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wide z-10">Preview</p>

                   {/* The actual content to print is generated here but kept clean */}
                   <div 
                     id="printable-label-content"
                     className="bg-white p-6 rounded-lg shadow-md border border-slate-200 flex flex-row items-center space-x-6"
                     style={{ 
                       transform: `scale(${labelSettings.scale})`,
                       transformOrigin: 'center center',
                       transition: 'transform 0.2s',
                       // Fix width to ensure it doesn't collapse weirdly in print window
                       minWidth: '350px',
                       maxWidth: '500px'
                     }}
                   >
                     <div className="flex-shrink-0 flex flex-col items-center">
                       {labelSettings.logo && (
                         <img src={labelSettings.logo} alt="Logo" className="max-w-[80px] max-h-[30px] object-contain mb-2" />
                       )}
                       <img src={qrUrl} alt="QR Code" className="w-32 h-32 object-contain bg-white" />
                       <div className="text-[10px] text-center text-slate-400 mt-1 uppercase font-semibold">
                         {qrType === 'LINK' ? 'Escaneie para acessar' : (qrType === 'INFO' ? 'Dados da Impressora' : 'Link Externo')}
                       </div>
                     </div>
                     
                     <div className="flex flex-col justify-center flex-grow">
                        {labelSettings.showName && (
                          <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-1">{printer.name}</h2>
                        )}
                        
                        {labelSettings.showModel && (
                          <p className="text-sm text-slate-500 font-medium mb-2">{printer.manufacturer} {printer.model}</p>
                        )}

                        <div className="space-y-1 mt-1 border-t border-slate-100 pt-2 w-full">
                          {labelSettings.showLocation && (
                            <div className="flex items-center text-xs text-slate-700">
                               <span className="font-semibold w-16 text-slate-400 flex-shrink-0">Local:</span>
                               <span className="truncate">{printer.location}</span>
                            </div>
                          )}
                          
                          {labelSettings.showAssetId && (
                            <div className="flex items-center text-xs text-slate-700">
                               <span className="font-semibold w-16 text-slate-400 flex-shrink-0">Patrimônio:</span>
                               <span className="font-mono">{printer.assetId}</span>
                            </div>
                          )}

                          {labelSettings.showIp && (
                            <div className="flex items-center text-xs text-slate-700">
                               <span className="font-semibold w-16 text-slate-400 flex-shrink-0">IP:</span>
                               <span className="font-mono">{printer.ipAddress}</span>
                            </div>
                          )}
                          
                          {labelSettings.showQueue && (
                            <div className="flex items-center text-xs text-slate-700">
                               <span className="font-semibold w-16 text-slate-400 flex-shrink-0">Fila:</span>
                               <span className="font-mono truncate">{printer.queueName}</span>
                            </div>
                          )}

                          {labelSettings.showToner && printer.type === PrinterType.PAPER && printer.tonerCode && (
                            <div className="flex items-center text-xs text-slate-700">
                               <span className="font-semibold w-16 text-slate-400 flex-shrink-0">Toner:</span>
                               <span className="font-mono truncate">{printer.tonerCode}</span>
                            </div>
                          )}

                          {labelSettings.showSerial && (
                            <div className="flex items-center text-xs text-slate-700">
                               <span className="font-semibold w-16 text-slate-400 flex-shrink-0">Série:</span>
                               <span className="font-mono">{printer.serialNumber}</span>
                            </div>
                          )}
                        </div>
                     </div>
                   </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button 
                onClick={() => setIsLabelModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handlePrintLabel}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center transition shadow-sm font-medium"
              >
                <PrinterIcon size={18} className="mr-2" />
                Imprimir Etiqueta
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};