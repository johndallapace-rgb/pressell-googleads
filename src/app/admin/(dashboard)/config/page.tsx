'use client';

import { useState, useEffect } from 'react';
import { SystemConfig } from '@/lib/config';

export default function ConfigSystemPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'platforms' | 'health'>('api');
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Health Statuses
  const [health, setHealth] = useState({
      gemini: 'checking',
      geminiError: '', // New field for detailed error
      kv: 'checking',
      googleAds: 'checking',
      buygoods: 'checking',
      maxweb: 'checking',
      clickbank: 'checking',
      digistore: 'checking',
      googleSearch: 'checking',
      vercel: 'checking'
  });

  useEffect(() => {
    fetchConfig();
    checkHealth();
  }, []);

  const fetchConfig = async () => {
    try {
        const res = await fetch('/api/admin/config', { cache: 'no-store' });
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            setConfig(data);
        } catch (e) {
            console.error('Config Parse Error:', text);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const checkHealth = async () => {
      // Helper to map response to status
      const check = async (url: string, body?: any) => {
          try {
              const opts = { 
                  method: 'POST', // Force POST for all diagnostic routes
                  body: body ? JSON.stringify(body) : undefined,
                  headers: { 'Cache-Control': 'no-cache' } 
              };
              const res = await fetch(url, opts);
              const text = await res.text();
              
              let data;
              try {
                  data = text ? JSON.parse(text) : {};
              } catch (e) {
                  return { status: 'error', error: 'Invalid Server Response' };
              }
              
              if (!res.ok) {
                  return { status: 'error', error: data.error || `HTTP ${res.status}` };
              }

              if (data.success) return { status: 'ok', error: '' };
              if (data.error === 'NOT_CONFIGURED') return { status: 'not_configured', error: '' };
              return { status: 'error', error: data.error || 'Unknown Error' };
          } catch (e: any) {
              return { status: 'error', error: e.message || 'Connection Failed' };
          }
      };

      setHealth({
          gemini: 'checking',
          geminiError: '',
          kv: 'checking',
          googleAds: 'checking',
          buygoods: 'checking',
          maxweb: 'checking',
          clickbank: 'checking',
          digistore: 'checking',
          googleSearch: 'checking',
          vercel: 'checking'
      });

      Promise.all([
          check('/api/admin/diagnostics/test-gemini'),
          check('/api/admin/diagnostics/test-kv'),
          // Google Ads uses GET and has different response structure, handle separately
          fetch('/api/admin/verify-google-ads', { headers: { 'Cache-Control': 'no-cache' } })
            .then(r => r.json())
            .then(d => d.error ? { status: 'error', error: d.error } : { status: 'ok', error: '' })
            .catch(e => ({ status: 'error', error: e.message || 'Network Error' })),
          check('/api/admin/diagnostics/test-platform', { platform: 'buygoods' }),
          check('/api/admin/diagnostics/test-platform', { platform: 'maxweb' }),
          check('/api/admin/diagnostics/test-platform', { platform: 'clickbank' }),
          check('/api/admin/diagnostics/test-platform', { platform: 'digistore' }),
          check('/api/admin/diagnostics/test-google-search'),
          check('/api/admin/diagnostics/test-vercel'),
      ]).then(([gemini, kv, google, buygoods, maxweb, clickbank, digistore, googleSearch, vercel]) => {
          setHealth({ 
              gemini: gemini.status as any,
              geminiError: gemini.error,
              kv: kv.status as any, 
              googleAds: google.status as any,
              buygoods: buygoods.status as any,
              maxweb: maxweb.status as any,
              clickbank: clickbank.status as any,
              digistore: digistore.status as any,
              googleSearch: googleSearch.status as any,
              vercel: vercel.status as any
          });
      });
  };

  const handleSave = async () => {
      if (!config) return;
      setSaving(true);
      try {
          await fetch('/api/admin/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(config)
          });
          alert('✅ Configuração salva com sucesso!');
          
          // Force immediate re-check after save
          await checkHealth();
          
      } catch (e) {
          alert('❌ Erro ao salvar.');
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando Config System...</div>;

  // SAFEGUARD: Ensure config object exists even if API fails
  const safeConfig = config || { 
      affiliate_nickname: '', 
      api_keys: {}, 
      platforms: {} 
  } as SystemConfig;

  // Check current platform status based on safeConfig (Client Side Validation)
  // Must match logic in /api/admin/diagnostics/test-platform/route.ts
  const getPlatformStatus = (platform: string) => {
      let isActive = false;
      switch(platform) {
          case 'clickbank':
              isActive = !!(safeConfig.api_keys?.clickbank_api_token && safeConfig.api_keys?.clickbank_nickname);
              break;
          case 'digistore':
              isActive = !!(safeConfig.platforms?.digistore?.credentials?.affiliate_id && safeConfig.platforms?.digistore?.credentials?.api_key);
              break;
          case 'buygoods':
              isActive = !!(safeConfig.api_keys?.buygoods_api && safeConfig.api_keys?.buygoods_account_id);
              break;
          case 'maxweb':
              isActive = !!(safeConfig.api_keys?.maxweb_api && safeConfig.api_keys?.maxweb_affiliate_id);
              break;
      }
      return isActive;
  };

  return (
    <div className="space-y-6">
      {/* Header (Simplified without Back Button) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Title removed as it is handled by the Layout or Tabs */}
      </div>

      {/* Tabs - Moved to Top Level */}
      <div className="bg-white rounded-t-xl border-b border-gray-200 px-2 flex">
        <button 
            onClick={() => setActiveTab('api')}
            className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'api' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
            🔑 API Keys & Identity
        </button>
        <button 
            onClick={() => setActiveTab('platforms')}
            className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'platforms' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
            🛒 Platforms
        </button>
        <button 
            onClick={() => setActiveTab('health')}
            className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'health' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
            ❤️ System Health
        </button>
        
        {/* Save Button integrated into Tabs Bar (Right aligned) */}
        <div className="ml-auto flex items-center px-4">
            <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-8 min-h-[400px]">
        {/* TAB 1: API KEYS */}
        {activeTab === 'api' && (
            <div className="space-y-8 animate-fade-in">
                <div className="max-w-3xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Global Identity</h3>
                    <p className="text-sm text-gray-500 mb-6">Defina sua identidade de afiliado para automação de links.</p>
                    
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Affiliate Nickname (Global)</label>
                                <input 
                                    type="text" 
                                    value={safeConfig.affiliate_nickname || ''}
                                    onChange={e => setConfig({...safeConfig, affiliate_nickname: e.target.value})}
                                    className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm font-medium"
                                    placeholder="johnpace"
                                />
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Usado para gerar links automáticos em todas as plataformas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 max-w-3xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">API Credentials</h3>
                    <p className="text-sm text-gray-500 mb-6">Chaves essenciais para o funcionamento dos robôs e integrações.</p>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Gemini API Key <span className="text-red-500">*</span></label>
                                <input 
                                    type="password" 
                                    value={safeConfig.api_keys?.gemini || ''}
                                    onChange={e => setConfig({
                                        ...safeConfig, 
                                        api_keys: { ...safeConfig.api_keys, gemini: e.target.value }
                                    })}
                                    className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm font-mono text-sm"
                                    placeholder="AIzaSy..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Google Search API Key</label>
                                    <input 
                                        type="password" 
                                        value={safeConfig.api_keys?.google_search_key || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, google_search_key: e.target.value }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm font-mono text-sm"
                                        placeholder="AIzaSy..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Search Engine ID (CX)</label>
                                    <input 
                                        type="text" 
                                        value={safeConfig.api_keys?.google_search_cx || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, google_search_cx: e.target.value }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm font-mono text-sm"
                                        placeholder="012345..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Vercel Token (Optional)</label>
                                <input 
                                    type="password" 
                                    value={safeConfig.api_keys?.vercel || ''}
                                    onChange={e => setConfig({
                                        ...safeConfig, 
                                        api_keys: { ...safeConfig.api_keys, vercel: e.target.value }
                                    })}
                                    className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 2: PLATFORMS */}
        {activeTab === 'platforms' && (
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Affiliate Platforms</h3>
                    <p className="text-sm text-gray-500 mb-6">Gerencie credenciais específicas para cada marketplace.</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ClickBank */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">🛒</div>
                                    <div>
                                        <span className="font-bold text-gray-900 block">ClickBank</span>
                                        <span className="text-xs text-gray-500">Global Leader</span>
                                    </div>
                                </div>
                                {getPlatformStatus('clickbank') ? (
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">Active</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">Not Configured</span>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ClickBank API Token (Unified)</label>
                                    <input 
                                        type="password" 
                                        value={safeConfig.api_keys?.clickbank_api_token || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, clickbank_api_token: e.target.value }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-sm"
                                        placeholder="API-..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Account Nickname</label>
                                    <input 
                                        type="text" 
                                        value={safeConfig.api_keys?.clickbank_nickname || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, clickbank_nickname: e.target.value }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                                        placeholder="e.g. johnpace"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Digistore24 */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">🇪🇺</div>
                                    <div>
                                        <span className="font-bold text-gray-900 block">Digistore24</span>
                                        <span className="text-xs text-gray-500">Europe Focus</span>
                                    </div>
                                </div>
                                {getPlatformStatus('digistore') ? (
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">Active</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">Not Configured</span>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Digistore API Key</label>
                                    <input 
                                        type="password" 
                                        value={safeConfig.platforms?.digistore?.credentials?.api_key || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            platforms: {
                                                ...safeConfig.platforms,
                                                digistore: {
                                                    ...safeConfig.platforms.digistore,
                                                    name: 'Digistore24',
                                                    status: 'Active',
                                                    credentials: {
                                                        ...safeConfig.platforms.digistore?.credentials,
                                                        api_key: e.target.value
                                                    }
                                                }
                                            }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-sm"
                                        placeholder="API-..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Affiliate ID (Nickname)</label>
                                    <input 
                                        type="text" 
                                        value={safeConfig.platforms?.digistore?.credentials?.affiliate_id || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            platforms: {
                                                ...safeConfig.platforms,
                                                digistore: {
                                                    ...safeConfig.platforms.digistore,
                                                    name: 'Digistore24',
                                                    status: 'Active',
                                                    credentials: {
                                                        ...safeConfig.platforms.digistore?.credentials,
                                                        affiliate_id: e.target.value
                                                    }
                                                }
                                            }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                                        placeholder="e.g. JohnPace"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BuyGoods */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">📦</div>
                                    <div>
                                        <span className="font-bold text-gray-900 block">BuyGoods</span>
                                        <span className="text-xs text-gray-500">Direct Response</span>
                                    </div>
                                </div>
                                {getPlatformStatus('buygoods') ? (
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">Active</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">Not Configured</span>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">BuyGoods API Key</label>
                                    <input 
                                        type="password" 
                                        value={safeConfig.api_keys?.buygoods_api || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, buygoods_api: e.target.value }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-sm"
                                        placeholder="bg_..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Account ID</label>
                                    <input 
                                        type="text" 
                                        value={safeConfig.api_keys?.buygoods_account_id || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, buygoods_account_id: e.target.value }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                                        placeholder="e.g. 12345"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* MaxWeb */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">🌐</div>
                                    <div>
                                        <span className="font-bold text-gray-900 block">MaxWeb</span>
                                        <span className="text-xs text-gray-500">CPA Network</span>
                                    </div>
                                </div>
                                {getPlatformStatus('maxweb') ? (
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">Active</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">Not Configured</span>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">MaxWeb API Key</label>
                                    <input 
                                        type="password" 
                                        value={safeConfig.api_keys?.maxweb_api || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, maxweb_api: e.target.value }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-sm"
                                        placeholder="mw_..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Affiliate ID</label>
                                    <input 
                                        type="text" 
                                        value={safeConfig.api_keys?.maxweb_affiliate_id || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, maxweb_affiliate_id: e.target.value }
                                        })}
                                        className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                                        placeholder="e.g. mw_12345"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 3: SYSTEM HEALTH */}
        {activeTab === 'health' && (
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">System Health Monitor</h3>
                    <p className="text-sm text-gray-500 mb-6">Status em tempo real das conexões críticas.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Gemini Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.gemini === 'ok' ? 'bg-green-50 border-green-500' : health.gemini === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">Gemini AI</span>
                                {health.gemini === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ONLINE</span>}
                                {health.gemini === 'error' && (
                                    <div className="flex items-center gap-2">
                                        <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">ERROR</span>
                                        <div className="group relative">
                                            <svg className="w-4 h-4 text-red-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-black text-white text-xs rounded p-3 hidden group-hover:block z-10 shadow-lg">
                                                {health.geminiError || 'Unknown Error'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {health.gemini === 'not_configured' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>}
                                {health.gemini === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Cérebro do sistema. Responsável por copy, tradução e análise de tendências.
                            </p>
                        </div>

                        {/* KV Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.kv === 'ok' ? 'bg-green-50 border-green-500' : health.kv === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">Vercel KV</span>
                                {health.kv === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ONLINE</span>}
                                {health.kv === 'error' && <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">ERROR</span>}
                                {health.kv === 'not_configured' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>}
                                {health.kv === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Banco de dados Redis de alta performance. Armazena produtos e configs.
                            </p>
                        </div>

                        {/* Google Ads Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.googleAds === 'ok' ? 'bg-green-50 border-green-500' : health.googleAds === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">Google Ads</span>
                                {health.googleAds === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">LINKED</span>}
                                {health.googleAds === 'error' && (
                                    <div className="flex items-center gap-2">
                                        <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">OFFLINE</span>
                                        <div className="group relative">
                                            <svg className="w-4 h-4 text-red-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-black text-white text-xs rounded p-2 hidden group-hover:block z-10">
                                                Check API credentials or account status. Code: 401
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {health.googleAds === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Conexão para publicação automática de campanhas e rastreamento de conversões.
                            </p>
                        </div>

                        {/* Google Search Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.googleSearch === 'ok' ? 'bg-green-50 border-green-500' : health.googleSearch === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">Google Search</span>
                                {health.googleSearch === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>}
                                {health.googleSearch === 'error' && <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">ERROR</span>}
                                {health.googleSearch === 'not_configured' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>}
                                {health.googleSearch === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Usado para encontrar URLs oficiais e imagens para o efeito Blur.
                            </p>
                        </div>

                        {/* Vercel Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.vercel === 'ok' ? 'bg-green-50 border-green-500' : health.vercel === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">Vercel API</span>
                                {health.vercel === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">CONNECTED</span>}
                                {health.vercel === 'error' && <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">ERROR</span>}
                                {health.vercel === 'not_configured' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>}
                                {health.vercel === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Permissão para criar e atualizar páginas estáticas automaticamente.
                            </p>
                        </div>

                        {/* ClickBank Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.clickbank === 'ok' ? 'bg-green-50 border-green-500' : health.clickbank === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">ClickBank</span>
                                {health.clickbank === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>}
                                {health.clickbank === 'error' && <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">ERROR</span>}
                                {health.clickbank === 'not_configured' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>}
                                {health.clickbank === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Monitoramento de Hops e conversões da ClickBank.
                            </p>
                        </div>

                        {/* Digistore24 Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.digistore === 'ok' ? 'bg-green-50 border-green-500' : health.digistore === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">Digistore24</span>
                                {health.digistore === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>}
                                {health.digistore === 'error' && <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">ERROR</span>}
                                {health.digistore === 'not_configured' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>}
                                {health.digistore === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Integração com mercado europeu.
                            </p>
                        </div>

                        {/* BuyGoods Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.buygoods === 'ok' ? 'bg-green-50 border-green-500' : health.buygoods === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">BuyGoods</span>
                                {health.buygoods === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>}
                                {health.buygoods === 'error' && <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">ERROR</span>}
                                {health.buygoods === 'not_configured' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>}
                                {health.buygoods === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Integração para importação de ofertas e links de checkout.
                            </p>
                        </div>

                        {/* MaxWeb Status */}
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${health.maxweb === 'ok' ? 'bg-green-50 border-green-500' : health.maxweb === 'error' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">MaxWeb</span>
                                {health.maxweb === 'ok' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>}
                                {health.maxweb === 'error' && <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">ERROR</span>}
                                {health.maxweb === 'not_configured' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>}
                                {health.maxweb === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                CPA Network Integration. Monitoramento de ofertas e links.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={checkHealth} 
                            className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Atualizar Status
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
