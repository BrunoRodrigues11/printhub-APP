import React, { useState, useMemo, useEffect } from 'react';
import { PrinterStatus, StatCount, User, UserRole } from '../types';
import { PrinterCard } from '../components/PrinterCard';
import { Search, Filter, Activity, AlertOctagon, CheckCircle2, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api'; // <-- Importando nosso novo módulo de API!

// Removemos 'printers' das props, pois agora o próprio Dashboard vai buscar elas
interface DashboardProps {
  onLogout: () => void;
  user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user }) => {
  const navigate = useNavigate();
  
  // Novos estados para guardar os dados da API
  const [printers, setPrinters] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados originais de filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PrinterStatus | 'ALL'>('ALL');

  // ==========================================
  // BUSCANDO OS DADOS REAIS DA API (NOVO)
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Promise.all permite buscar as impressoras e os sites ao mesmo tempo!
        const [printersData, sitesData] = await Promise.all([
          apiFetch('/printers'),
          apiFetch('/sites')
        ]);

        setSites(sitesData);

        // Mapeando os dados do banco (snake_case) para o formato do Frontend (camelCase)
        const mappedPrinters = printersData.map((p: any) => {
          // Procura o nome do site cruzando o site_id da impressora com a lista de sites
          const siteObj = sitesData.find((s: any) => s.id === p.site_id);
          
          return {
            ...p,
            serialNumber: p.serial_number, 
            ipAddress: p.ip_address,
            assetId: p.asset_id,     // <--- BASTA ADICIONAR ESTA LINHA AQUI!
            site: siteObj ? siteObj.name : 'Sem Unidade', 
            siteId: p.site_id
          };
        });

        setPrinters(mappedPrinters);
      } catch (error) {
        console.error("Erro ao buscar dados do Dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

// 1. Filter by User Site (Security/Access Level)
  const visiblePrinters = useMemo(() => {
    if (!user) return [];
    
    const isAdmin = user.role === 'Admin' || user.role === UserRole.ADMIN;
    if (isAdmin) return printers;
    
    const userSiteId = user.siteId || user.site_id;
    
    // Retorna apenas as impressoras que pertencem à unidade do Analista/User
    return printers.filter(p => p.siteId === userSiteId);
  }, [printers, user]);

  // 2. Calculate Statistics based on visible printers
  const stats: StatCount = useMemo(() => {
    return visiblePrinters.reduce(
      (acc, curr) => {
        acc.total++;
        if (curr.status === 'Online' || curr.status === PrinterStatus.ONLINE) acc.online++;
        if (curr.status === 'Offline' || curr.status === PrinterStatus.OFFLINE) acc.offline++;
        if (curr.status === 'Manutenção' || curr.status === PrinterStatus.MAINTENANCE) acc.maintenance++;
        return acc;
      },
      { online: 0, offline: 0, maintenance: 0, total: 0 }
    );
  }, [visiblePrinters]);

  // 3. Filter by Search & Status
  const filteredPrinters = useMemo(() => {
    return visiblePrinters.filter((printer) => {
      const searchString = `${printer.name} ${printer.serialNumber} ${printer.location}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || printer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [visiblePrinters, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Carregando inventário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Parque de Impressão</h1>
            <p className="mt-1 text-slate-500">Visão geral e status em tempo real</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Painel Administrativo"
            >
              <Settings size={24} />
            </button>
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
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className="p-3 bg-slate-100 rounded-full text-slate-600 mr-4">
               <PrinterCardIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 mr-4">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Online</p>
              <p className="text-2xl font-bold text-slate-900">{stats.online}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className="p-3 bg-red-100 rounded-full text-red-600 mr-4">
               <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Offline</p>
              <p className="text-2xl font-bold text-slate-900">{stats.offline}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600 mr-4">
               <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Manutenção</p>
              <p className="text-2xl font-bold text-slate-900">{stats.maintenance}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
              placeholder="Buscar por nome, série ou setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-64">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm appearance-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PrinterStatus | 'ALL')}
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Manutenção">Manutenção</option>
                </select>
             </div>
          </div>
        </div>

        {/* Grid */}
        {user?.role === 'Admin' || user?.role === UserRole.ADMIN ? (
          <div className="space-y-8">
            {Object.entries(
              filteredPrinters.reduce((acc, printer) => {
                const site = printer.site || 'Sem Unidade';
                if (!acc[site]) acc[site] = [];
                acc[site].push(printer);
                return acc;
              }, {} as Record<string, any[]>)
            ).map(([site, sitePrinters]) => (
              <div key={site} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <span className="w-2 h-6 bg-blue-600 rounded-sm mr-3"></span>
                    {site}
                    <span className="ml-3 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                      {sitePrinters.length}
                    </span>
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sitePrinters.map((printer) => (
                    <PrinterCard key={printer.id} printer={printer} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPrinters.map((printer) => (
              <PrinterCard key={printer.id} printer={printer} />
            ))}
          </div>
        )}

        {filteredPrinters.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500 text-lg">Nenhuma impressora encontrada com os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Icon for the total card
const PrinterCardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);