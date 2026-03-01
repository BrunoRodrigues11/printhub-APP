import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Printer, PrinterStatus, PrinterType, User, UserRole, Site } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PrinterFormModal } from '../components/PrinterFormModal';
import { UserFormModal } from '../components/UserFormModal';
import { SiteFormModal } from '../components/SiteFormModal';
import { Trash2, Edit2, Plus, ArrowLeft, Search, QrCode, Printer as PrinterIcon, CheckSquare, X, Sliders, Link, FileText, Globe, Upload, Image as ImageIcon, Trash, CheckCircle, Users, LayoutGrid, LogOut, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api'; // Importando a API

interface AdminPanelProps {
  onLogout: () => void;
  user: User | null;
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

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'printers' | 'users' | 'sites'>('printers');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado Local para Impressoras, Usuários e Unidades
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Printer Modal State
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Site Modal State
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Batch Print State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState(false);
  const [qrType, setQrType] = useState<'LINK' | 'INFO' | 'CUSTOM'>('LINK');
  const [customQrLink, setCustomQrLink] = useState('');
  const [labelSettings, setLabelSettings] = useState<LabelSettings>({
    showName: true,
    showModel: true,
    showLocation: true,
    showIp: false,
    showQueue: false,
    showSerial: false,
    showAssetId: true,
    showToner: false,
    scale: 0.8,
    logo: null
  });

  // ==========================================
  // BUSCANDO DADOS DA API
  // ==========================================
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Busca sites primeiro, pois as impressoras e usuários dependem deles para mostrar o nome
      const sitesData = await apiFetch('/sites');
      setSites(sitesData);

      // Busca impressoras e usuários
      const [printersData, usersData] = await Promise.all([
        apiFetch('/printers'),
        apiFetch('/users')
      ]);

      // Mapeia as impressoras para o formato do Frontend
      const mappedPrinters = printersData.map((p: any) => {
        const siteObj = sitesData.find((s: any) => s.id === p.site_id);
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          model: p.model,
          manufacturer: p.manufacturer,
          serialNumber: p.serial_number,
          assetId: p.asset_id,
          site: siteObj ? siteObj.name : 'Sem Unidade',
          siteId: p.site_id,
          location: p.location,
          ipAddress: p.ip_address,
          queueName: p.queue_name,
          tonerCode: p.toner_code,
          status: p.status,
          notes: p.notes,
        };
      });
      setPrinters(mappedPrinters);

      // Mapeia os usuários para o formato do Frontend
      const mappedUsers = usersData.map((u: any) => {
        const siteObj = sitesData.find((s: any) => s.id === u.site_id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          site: siteObj ? siteObj.name : 'Todas',
          siteId: u.site_id,
          lastLogin: u.last_login
        };
      });
      setUsers(mappedUsers);

    } catch (error) {
      console.error("Erro ao carregar dados do admin:", error);
      showToast("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  const filteredPrinters = useMemo(() => {
    return printers.filter(p => {
      // Ajuste na verificação de Role
      if (user?.role !== 'Admin' && user?.role !== UserRole.ADMIN && user?.siteId && p.siteId !== user.siteId) {
        return false;
      }

      return (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [printers, searchTerm, user]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredSites = useMemo(() => {
    return sites.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sites, searchTerm]);

  // Toast Helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredPrinters.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // ==========================================
  // CRUD PRINTERS
  // ==========================================
  const handleOpenAddPrinter = () => {
    setEditingPrinter(null);
    setIsPrinterModalOpen(true);
  };

  const handleOpenEditPrinter = (printer: Printer) => {
    setEditingPrinter(printer);
    setIsPrinterModalOpen(true);
  };

  const handleDeletePrinterAction = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta impressora?')) {
      try {
        await apiFetch(`/printers/${id}`, 'DELETE');
        
        // Remove da lista local e da seleção sem precisar recarregar tudo
        setPrinters(prev => prev.filter(p => p.id !== id));
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
        
        showToast('Impressora removida com sucesso.');
      } catch (error: any) {
        alert('Erro ao excluir: ' + error.message);
      }
    }
  };

  const handlePrinterFormSubmit = async (data: any) => {
    // Como o Modal pode enviar camelCase, mapeamos para snake_case para a API
    const apiData = {
      name: data.name,
      type: data.type,
      model: data.model,
      manufacturer: data.manufacturer,
      serial_number: data.serialNumber,
      asset_id: data.assetId,
      site_id: data.siteId || null, // Importante: O Modal deve retornar o ID do site. Se for null ou undefined, enviamos null para a API.
      location: data.location,
      ip_address: data.ipAddress,
      queue_name: data.queueName,
      toner_code: data.tonerCode,
      status: data.status,
      notes: data.notes
    };

    try {
      if (editingPrinter) {
        await apiFetch(`/printers/${editingPrinter.id}`, 'PUT', apiData);
        showToast('Impressora atualizada com sucesso.');
      } else {
        await apiFetch('/printers', 'POST', apiData);
        showToast('Impressora adicionada com sucesso.');
      }
      setIsPrinterModalOpen(false);
      loadData(); // Recarrega os dados para pegar o ID e site correto do banco
    } catch (error: any) {
      alert('Erro ao salvar impressora: ' + error.message);
    }
  };

  // ==========================================
  // CRUD USERS
  // ==========================================
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUserAction = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await apiFetch(`/users/${id}`, 'DELETE');
        setUsers(prev => prev.filter(u => u.id !== id));
        showToast('Usuário removido com sucesso.');
      } catch (error: any) {
        alert('Erro ao excluir: ' + error.message);
      }
    }
  };

  const handleUserFormSubmit = async (data: any) => {
    const apiData = {
      name: data.name,
      email: data.email,
      role: data.role,
      site_id: data.siteId || null, // O Modal deve retornar o ID do site. Se for null ou undefined, enviamos null para a API.
      password: data.password // Backend cuidará do hash no POST ou ignorará no PUT se vazio
    };

    try {
      if (editingUser) {
        await apiFetch(`/users/${editingUser.id}`, 'PUT', apiData);
        showToast('Usuário atualizado com sucesso.');
      } else {
        await apiFetch('/users', 'POST', apiData);
        showToast('Usuário adicionado com sucesso.');
      }
      setIsUserModalOpen(false);
      loadData();
    } catch (error: any) {
      alert('Erro ao salvar usuário: ' + error.message);
    }
  };

  // ==========================================
  // CRUD SITES
  // ==========================================
  const handleOpenAddSite = () => {
    setEditingSite(null);
    setIsSiteModalOpen(true);
  };

  const handleOpenEditSite = (site: Site) => {
    setEditingSite(site);
    setIsSiteModalOpen(true);
  };

  const handleDeleteSiteAction = async (id: string) => {
    if (window.confirm('ATENÇÃO: Excluir uma unidade removerá todas as impressoras vinculadas a ela. Continuar?')) {
      try {
        await apiFetch(`/sites/${id}`, 'DELETE');
        setSites(prev => prev.filter(s => s.id !== id));
        // Recarregar impressoras já que podem ter sido apagadas no banco (CASCADE)
        loadData();
        showToast('Unidade removida com sucesso.');
      } catch (error: any) {
        alert('Erro ao excluir unidade: ' + error.message);
      }
    }
  };

  const handleSiteFormSubmit = async (data: Omit<Site, 'id'>) => {
    try {
      if (editingSite) {
        await apiFetch(`/sites/${editingSite.id}`, 'PUT', data);
        showToast('Unidade atualizada com sucesso.');
      } else {
        await apiFetch('/sites', 'POST', data);
        showToast('Unidade adicionada com sucesso.');
      }
      setIsSiteModalOpen(false);
      loadData();
    } catch (error: any) {
      alert('Erro ao salvar unidade: ' + error.message);
    }
  };

  // Access Control Helpers
  const canManageUsers = user?.role === 'Admin' || user?.role === UserRole.ADMIN;
  const canManageSites = user?.role === 'Admin' || user?.role === UserRole.ADMIN;
  const canManagePrinters = user?.role === 'Admin' || user?.role === UserRole.ADMIN || user?.role === 'Analista' || user?.role === UserRole.ANALYST;

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

  // --- BATCH PRINT LOGIC ---
  const handleBatchPrint = () => {
    const printersToPrint = printers.filter(p => selectedIds.has(p.id));
    if (printersToPrint.length === 0) return;

    if (qrType === 'CUSTOM' && !customQrLink) {
      alert("Por favor, insira o link customizado.");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir as etiquetas.');
      return;
    }

    // Generate HTML for each card
    const cardsHtml = printersToPrint.map(printer => {
       let qrData = '';
       let scanText = '';
       
       if (qrType === 'LINK') {
         qrData = `${window.location.origin}/#/printer/${printer.id}`;
         scanText = 'Escaneie para acessar o Hub';
       } else if (qrType === 'INFO') {
         qrData = `Nome: ${printer.name}\nModelo: ${printer.model}\nIP: ${printer.ipAddress || 'N/A'}\nSérie: ${printer.serialNumber}\nPatrimônio: ${printer.assetId}`;
         scanText = 'Dados do Equipamento';
       } else {
         qrData = customQrLink;
         scanText = 'Acesse o Link';
       }

       const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
       
       return `
        <div class="label-card">
           <div class="qr-section">
             ${labelSettings.logo ? `<img src="${labelSettings.logo}" class="logo-img" alt="Logo" />` : ''}
             <img src="${qrUrl}" alt="QR Code" class="qr-img" />
             <div class="scan-text">${scanText}</div>
           </div>
           
           <div class="info-section">
              ${labelSettings.showName ? `<h2 class="printer-name">${printer.name}</h2>` : ''}
              ${labelSettings.showModel ? `<p class="printer-model">${printer.manufacturer} ${printer.model}</p>` : ''}

              <div class="details">
                ${labelSettings.showLocation ? `
                  <div class="detail-row">
                     <span class="detail-label">Local:</span>
                     <span class="detail-value">${printer.location}</span>
                  </div>` : ''}
                
                ${labelSettings.showAssetId ? `
                  <div class="detail-row">
                     <span class="detail-label">Patrimônio:</span>
                     <span class="detail-value mono">${printer.assetId}</span>
                  </div>` : ''}

                ${labelSettings.showIp ? `
                  <div class="detail-row">
                     <span class="detail-label">IP:</span>
                     <span class="detail-value mono">${printer.ipAddress || 'N/A'}</span>
                  </div>` : ''}

                ${labelSettings.showQueue ? `
                  <div class="detail-row">
                     <span class="detail-label">Fila:</span>
                     <span class="detail-value mono">${printer.queueName}</span>
                  </div>` : ''}

                ${labelSettings.showToner && printer.type === PrinterType.PAPER && printer.tonerCode ? `
                  <div class="detail-row">
                     <span class="detail-label">Toner:</span>
                     <span class="detail-value mono">${printer.tonerCode}</span>
                  </div>` : ''}

                ${labelSettings.showSerial ? `
                  <div class="detail-row">
                     <span class="detail-label">Série:</span>
                     <span class="detail-value mono">${printer.serialNumber}</span>
                  </div>` : ''}
              </div>
           </div>
        </div>
       `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Imprimir Etiquetas em Lote</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            background-color: white; 
            margin: 0; 
            padding: 20px;
          }
          
          /* Grid Layout for A4 */
          .grid-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr); /* 2 Columns */
            gap: 20px;
            max-width: 210mm; /* A4 Width approx */
            margin: 0 auto;
          }

          .label-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 20px;
            background: white;
            page-break-inside: avoid; /* Prevent splitting across pages */
            break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            position: relative;
          }

          .qr-section {
            flex-shrink: 0;
            text-align: center;
            width: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .logo-img {
            max-width: 80px;
            max-height: 30px;
            object-fit: contain;
            margin-bottom: 8px;
            display: block;
          }

          .qr-img {
            width: 80px;
            height: 80px;
            display: block;
          }

          .scan-text {
            font-size: 8px;
            color: #94a3b8;
            margin-top: 4px;
            text-transform: uppercase;
            max-width: 80px;
            word-wrap: break-word;
          }

          .info-section {
            flex-grow: 1;
            overflow: hidden;
          }

          .printer-name {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 4px 0;
            line-height: 1.2;
          }
          .printer-model {
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
            margin: 0 0 12px 0;
          }

          .details {
            border-top: 1px solid #f1f5f9;
            padding-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .detail-row {
            display: flex;
            align-items: center;
            font-size: 10px;
            color: #334155;
          }
          .detail-label {
            font-weight: 600;
            color: #94a3b8;
            width: 60px;
            flex-shrink: 0;
          }
          .detail-value {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .mono {
            font-family: monospace;
          }

          @media print {
            @page { 
              size: auto;
              margin: 10mm;
            }
            body { 
              padding: 0;
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .grid-container {
              gap: 15px;
            }
            .label-card {
              border: 1px solid #94a3b8; /* Darker border for print visibility */
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="grid-container" style="transform: scale(${labelSettings.scale}); transform-origin: top left; width: ${100 / labelSettings.scale}%">
          ${cardsHtml}
        </div>
        <script>
          setTimeout(() => {
            window.print();
          }, 800);
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando painel...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Administração</h1>
            
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('printers')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'printers' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center">
                  <PrinterIcon size={16} className="mr-2" />
                  Impressoras
                </div>
              </button>
              
              {canManageUsers && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'users' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Users size={16} className="mr-2" />
                    Usuários
                  </div>
                </button>
              )}

              {canManageSites && (
                <button
                  onClick={() => setActiveTab('sites')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'sites' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    Unidades
                  </div>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'printers' && selectedIds.size > 0 && (
              <button 
                onClick={() => setIsBatchPrintModalOpen(true)}
                className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition font-medium shadow-sm animate-fade-in"
              >
                <PrinterIcon size={18} className="mr-2" />
                Imprimir Seleção ({selectedIds.size})
              </button>
            )}
            
            {(activeTab === 'printers' && canManagePrinters) && (
              <button 
                onClick={handleOpenAddPrinter}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
              >
                <Plus size={18} className="mr-2" />
                Nova Impressora
              </button>
            )}

            {(activeTab === 'users' && canManageUsers) && (
              <button 
                onClick={handleOpenAddUser}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
              >
                <Plus size={18} className="mr-2" />
                Novo Usuário
              </button>
            )}

            {(activeTab === 'sites' && canManageSites) && (
              <button 
                onClick={handleOpenAddSite}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
              >
                <Plus size={18} className="mr-2" />
                Nova Unidade
              </button>
            )}

            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              title="Sair"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar impressora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500">
              {activeTab === 'printers' ? (
                selectedIds.size > 0 
                  ? <span className="text-blue-600 font-medium">{selectedIds.size} selecionado(s)</span>
                  : `Total: ${filteredPrinters.length}`
              ) : activeTab === 'users' ? (
                `Total: ${filteredUsers.length}`
              ) : (
                `Total: ${filteredSites.length}`
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {activeTab === 'printers' ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        checked={filteredPrinters.length > 0 && selectedIds.size === filteredPrinters.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome / Modelo / Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Localidade / Localização</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Série / IP</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredPrinters.map((printer) => (
                    <tr key={printer.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(printer.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          checked={selectedIds.has(printer.id)}
                          onChange={() => handleSelectOne(printer.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{printer.name}</div>
                        <div className="text-xs text-slate-500">{printer.manufacturer} {printer.model}</div>
                        <div className="mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${
                            printer.type === PrinterType.THERMAL 
                              ? 'bg-orange-50 text-orange-600 border-orange-100' 
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {printer.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={printer.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="font-medium text-slate-900">{printer.site}</div>
                        <div className="text-xs text-slate-500">{printer.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-slate-900 font-mono">SN: {printer.serialNumber}</div>
                        <div className="text-xs text-slate-500 font-mono">{printer.ipAddress || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                           <button 
                            onClick={() => navigate(`/printer/${printer.id}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                            title="Visualizar Hub"
                          >
                            <QrCode size={18} />
                          </button>
                          
                          {canManagePrinters && (
                            <>
                              <button 
                                onClick={() => handleOpenEditPrinter(printer)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeletePrinterAction(printer.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredPrinters.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        Nenhuma impressora encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'users' ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Função / Unidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Último Login</th>
                    {canManageUsers && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{u.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${
                            u.role === 'Admin' || u.role === UserRole.ADMIN 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {u.role}
                          </span>
                          {u.site && (
                            <span className="text-xs text-slate-500 mt-1">{u.site}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '-'}
                      </td>
                      {canManageUsers && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUserAction(u.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome da Unidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredSites.map((site) => (
                    <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{site.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {site.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canManageSites && (
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleOpenEditSite(site)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSiteAction(site.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {filteredSites.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                        Nenhuma unidade encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <PrinterFormModal 
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        onSubmit={handlePrinterFormSubmit}
        initialData={editingPrinter}
        sites={sites}
      />

      <UserFormModal 
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserFormSubmit}
        initialData={editingUser}
        sites={sites}
      />

      <SiteFormModal 
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        onSubmit={handleSiteFormSubmit}
        initialData={editingSite}
      />
      
      {isBatchPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center">
                <PrinterIcon size={18} className="mr-2 text-blue-600" />
                Impressão em Lote ({selectedIds.size})
              </h3>
              <button onClick={() => setIsBatchPrintModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              
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
                      id="batch-logo-upload"
                    />
                    <label 
                      htmlFor="batch-logo-upload"
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                    >
                      <Upload size={14} className="mr-2" />
                      {labelSettings.logo ? 'Trocar Logo' : 'Upload Logo'}
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Exibido no canto superior esquerdo.</p>
                  </div>
                </div>
              </div>

              {/* QR Code Type Selection */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <QrCode size={14} className="mr-2" /> Conteúdo do QR Code
                </h4>
                <div className="grid grid-cols-3 gap-3">
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
                    <p className="text-xs text-slate-500 mt-1">Este link será usado em todos os QR Codes da seleção.</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <CheckSquare size={14} className="mr-2" /> Dados na Etiqueta
                </h4>
                <div className="grid grid-cols-2 gap-3">
                   <label className="flex items-center space-x-2 cursor-pointer group">
                     <input type="checkbox" checked={labelSettings.showName} onChange={() => toggleLabelSetting('showName')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition cursor-pointer"/> 
                     <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Nome</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer group">
                     <input type="checkbox" checked={labelSettings.showModel} onChange={() => toggleLabelSetting('showModel')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition cursor-pointer"/> 
                     <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Modelo</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer group">
                     <input type="checkbox" checked={labelSettings.showLocation} onChange={() => toggleLabelSetting('showLocation')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition cursor-pointer"/> 
                     <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Local</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer group">
                     <input type="checkbox" checked={labelSettings.showAssetId} onChange={() => toggleLabelSetting('showAssetId')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition cursor-pointer"/> 
                     <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Patrimônio</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer group">
                     <input type="checkbox" checked={labelSettings.showIp} onChange={() => toggleLabelSetting('showIp')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition cursor-pointer"/> 
                     <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">IP</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer group">
                     <input type="checkbox" checked={labelSettings.showQueue} onChange={() => toggleLabelSetting('showQueue')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition cursor-pointer"/> 
                     <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Fila</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer group">
                     <input type="checkbox" checked={labelSettings.showToner} onChange={() => toggleLabelSetting('showToner')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition cursor-pointer"/> 
                     <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Toner</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer group">
                     <input type="checkbox" checked={labelSettings.showSerial} onChange={() => toggleLabelSetting('showSerial')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition cursor-pointer"/> 
                     <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Série</span>
                   </label>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                   <Sliders size={14} className="mr-2" /> Ajuste de Escala
                </h4>
                <input 
                  type="range" min="0.5" max="1.2" step="0.1" 
                  value={labelSettings.scale}
                  onChange={(e) => setLabelSettings(prev => ({...prev, scale: parseFloat(e.target.value)}))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Pequeno (50%)</span>
                  <span>Grande (120%)</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 border border-blue-100">
                O sistema irá gerar um PDF otimizado para folhas A4 com grade de etiquetas. Certifique-se de configurar "Margens: Nenhuma" na janela de impressão.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button onClick={() => setIsBatchPrintModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={handleBatchPrint} className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-sm transition-colors">
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 animate-fade-in transition-all">
          <CheckCircle size={20} className="text-emerald-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};