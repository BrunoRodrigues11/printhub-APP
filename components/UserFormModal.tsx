import React, { useState, useEffect } from 'react';
import { User, UserRole, Site } from '../types';
import { X, Save } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void; // Tipo ajustado temporariamente para suportar o siteId
  initialData?: User | null;
  sites: Site[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  sites
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.USER,
    siteId: '', // <-- Modificado de 'site' para 'siteId' para o banco de dados
    password: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        role: initialData.role || UserRole.USER,
        siteId: initialData.siteId || '', // <-- Carrega o siteId do usuário
        password: '' // Sempre vem vazio na edição por segurança (backend resolve)
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: UserRole.USER,
        siteId: '', // <-- Limpa o ID
        password: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se o usuário é ADMIN, forçamos o siteId para vazio (null no banco) pois ele vê todas
    const finalData = {
      ...formData,
      siteId: formData.role === UserRole.ADMIN ? '' : formData.siteId
    };

    onSubmit(finalData);
    // Deixamos o AdminPanel fechar após o sucesso para melhor UX
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">
            {initialData ? 'Editar Usuário' : 'Novo Usuário'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao.silva@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              required={!initialData} // Obrigatório apenas na criação
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={initialData ? "Deixe em branco para manter a atual" : "Crie uma senha"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              <option value="User">Usuário</option>
              <option value="Analista">Analista</option>
              <option value="Admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unidade Vinculada</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white disabled:opacity-50 disabled:bg-slate-50"
              value={formData.siteId} // <-- Linkado no formData.siteId
              onChange={e => setFormData({ ...formData, siteId: e.target.value })}
              required={formData.role !== 'Admin'} // Só exige se não for admin
              disabled={formData.role === 'Admin'}
            >
              <option value="">Selecione uma unidade...</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option> // <-- Passa a ID para o valor do select
              ))}
            </select>
            {formData.role === 'Admin' && (
              <p className="text-xs text-slate-500 mt-1">Administradores têm acesso a todas as unidades.</p>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm flex items-center transition"
            >
              <Save size={18} className="mr-2" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};