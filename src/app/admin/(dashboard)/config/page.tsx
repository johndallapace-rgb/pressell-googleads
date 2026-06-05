'use client';

import { useState, useEffect } from 'react';
import { SystemConfig } from '@/lib/shared/config';
import { FormInput } from '@/components/ui/FormInput';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormField } from '@/components/ui/FormField';
import { FormTextarea } from '@/components/ui/FormTextarea';

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

      let googleAdsState: 'OFFLINE' | 'CONFIGURED' | 'READY' | 'ACTIVE' = 'OFFLINE';
      try {
          const cfg =
              config ||
              (await fetch('/api/admin/config', { cache: 'no-store' })
                  .then(r => r.json())
                  .catch(() => null));
          const g = (cfg as any)?.google_ads || {};
          const requiredOk = !!(g?.developer_token && g?.client_id && g?.client_secret && g?.refresh_token && g?.manager_account_id);
          const accessLevel = g?.access_level === 'production' ? 'production' : 'test';
          const executionMode = g?.execution_mode === 'active' ? 'active' : g?.execution_mode === 'read_only' ? 'read_only' : 'config_only';

          if (!requiredOk) googleAdsState = 'OFFLINE';
          else if (accessLevel === 'test') googleAdsState = 'CONFIGURED';
          else if (executionMode === 'active') googleAdsState = 'ACTIVE';
          else googleAdsState = 'READY';
      } catch (e) {
          googleAdsState = 'OFFLINE';
      }

      Promise.all([
          check('/api/admin/diagnostics/test-gemini'),
          check('/api/admin/diagnostics/test-kv'),
          Promise.resolve({ status: googleAdsState, error: '' }),
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
      google_ads: {
          developer_token: '',
          client_id: '',
          client_secret: '',
          refresh_token: '',
          manager_account_id: '3380319096',
          customer_accounts: ['7770764905'],
          access_level: 'test',
          execution_mode: 'config_only',
          config_valid: false,
          last_validation_at: null
      },
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
                            <FormField>
                                <FormLabel className="text-gray-700">Affiliate Nickname (Global)</FormLabel>
                                <FormInput 
                                    type="text" 
                                    value={safeConfig.affiliate_nickname || ''}
                                    onChange={e => setConfig({...safeConfig, affiliate_nickname: e.target.value})}
                                    placeholder="johnpace"
                                    className="font-medium"
                                />
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Usado para gerar links automáticos em todas as plataformas.
                                </p>
                            </FormField>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 max-w-3xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">API Credentials</h3>
                    <p className="text-sm text-gray-500 mb-6">Chaves essenciais para o funcionamento dos robôs e integrações.</p>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <FormField>
                                <FormLabel className="text-gray-700" required>Gemini API Key</FormLabel>
                                <FormInput 
                                    type="password" 
                                    value={safeConfig.api_keys?.gemini || ''}
                                    onChange={e => setConfig({
                                        ...safeConfig, 
                                        api_keys: { ...safeConfig.api_keys, gemini: e.target.value }
                                    })}
                                    placeholder="AIzaSy..."
                                    className="font-mono text-sm"
                                />
                            </FormField>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField>
                                    <FormLabel className="text-gray-700">Google Search API Key</FormLabel>
                                    <FormInput 
                                        type="password" 
                                        value={safeConfig.api_keys?.google_search_key || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, google_search_key: e.target.value }
                                        })}
                                        placeholder="AIzaSy..."
                                        className="font-mono text-sm"
                                    />
                                </FormField>
                                <FormField>
                                    <FormLabel className="text-gray-700">Search Engine ID (CX)</FormLabel>
                                    <FormInput 
                                        type="text" 
                                        value={safeConfig.api_keys?.google_search_cx || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, google_search_cx: e.target.value }
                                        })}
                                        placeholder="012345..."
                                        className="font-mono text-sm"
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField>
                                    <FormLabel className="text-gray-700">SERP_PROVIDER</FormLabel>
                                    <FormInput 
                                        type="text" 
                                        value={safeConfig.api_keys?.serp_provider || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, serp_provider: e.target.value }
                                        })}
                                        placeholder="serpapi"
                                        className="font-medium"
                                    />
                                </FormField>
                                <FormField>
                                    <FormLabel className="text-gray-700">SERPAPI_API_KEY</FormLabel>
                                    <FormInput 
                                        type="password" 
                                        value={safeConfig.api_keys?.serpapi_api_key || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, serpapi_api_key: e.target.value }
                                        })}
                                        placeholder="Paste SerpApi key"
                                        className="font-mono text-sm"
                                    />
                                </FormField>
                            </div>

                            <FormField>
                                <FormLabel className="text-gray-700">Vercel Token (Optional)</FormLabel>
                                <FormInput 
                                    type="password" 
                                    value={safeConfig.api_keys?.vercel || ''}
                                    onChange={e => setConfig({
                                        ...safeConfig, 
                                        api_keys: { ...safeConfig.api_keys, vercel: e.target.value }
                                    })}
                                    className="font-mono text-sm"
                                />
                            </FormField>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">Google Ads API</h4>
                                    <p className="text-sm text-gray-500">Credentials stored in Config System for future API enablement.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField>
                                    <FormLabel className="text-gray-700">Developer Token</FormLabel>
                                    <FormInput
                                        type="password"
                                        value={safeConfig.google_ads?.developer_token || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig,
                                            google_ads: { ...safeConfig.google_ads, developer_token: e.target.value }
                                        })}
                                        placeholder="developer token"
                                        className="font-mono text-sm"
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Manager Account ID</FormLabel>
                                    <FormInput
                                        type="text"
                                        value={safeConfig.google_ads?.manager_account_id || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig,
                                            google_ads: { ...safeConfig.google_ads, manager_account_id: e.target.value }
                                        })}
                                        placeholder="123-456-7890"
                                        className="font-mono text-sm"
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Client ID</FormLabel>
                                    <FormInput
                                        type="password"
                                        value={safeConfig.google_ads?.client_id || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig,
                                            google_ads: { ...safeConfig.google_ads, client_id: e.target.value }
                                        })}
                                        placeholder="xxxxx.apps.googleusercontent.com"
                                        className="font-mono text-sm"
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Client Secret</FormLabel>
                                    <FormInput
                                        type="password"
                                        value={safeConfig.google_ads?.client_secret || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig,
                                            google_ads: { ...safeConfig.google_ads, client_secret: e.target.value }
                                        })}
                                        placeholder="client secret"
                                        className="font-mono text-sm"
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Refresh Token</FormLabel>
                                    <FormInput
                                        type="password"
                                        value={safeConfig.google_ads?.refresh_token || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig,
                                            google_ads: { ...safeConfig.google_ads, refresh_token: e.target.value }
                                        })}
                                        placeholder="refresh token"
                                        className="font-mono text-sm"
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Customer Account IDs</FormLabel>
                                    <FormInput
                                        type="text"
                                        value={
                                            Array.isArray(safeConfig.google_ads?.customer_accounts)
                                                ? safeConfig.google_ads!.customer_accounts!.join(', ')
                                                : ''
                                        }
                                        onChange={e => {
                                            const raw = e.target.value || '';
                                            const ids = raw
                                                .split(/[\n,]+/g)
                                                .map(s => s.trim())
                                                .filter(Boolean);
                                            setConfig({
                                                ...safeConfig,
                                                google_ads: { ...safeConfig.google_ads, customer_accounts: ids }
                                            });
                                        }}
                                        placeholder="123-456-7890, 234-567-8901"
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Comma-separated. Stored as an array.</p>
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Access Level</FormLabel>
                                    <FormInput
                                        type="text"
                                        value={safeConfig.google_ads?.access_level || 'test'}
                                        onChange={e => setConfig({
                                            ...safeConfig,
                                            google_ads: { ...safeConfig.google_ads, access_level: (e.target.value as any) || 'test' }
                                        })}
                                        placeholder="test"
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Default: test</p>
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Execution Mode</FormLabel>
                                    <FormInput
                                        type="text"
                                        value={safeConfig.google_ads?.execution_mode || 'config_only'}
                                        onChange={e => setConfig({
                                            ...safeConfig,
                                            google_ads: { ...safeConfig.google_ads, execution_mode: (e.target.value as any) || 'config_only' }
                                        })}
                                        placeholder="config_only"
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Default: config_only</p>
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Config Valid</FormLabel>
                                    <FormInput
                                        type="text"
                                        value={String(!!safeConfig.google_ads?.config_valid)}
                                        disabled
                                        className="font-mono text-sm"
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel className="text-gray-700">Last Validation At</FormLabel>
                                    <FormInput
                                        type="text"
                                        value={safeConfig.google_ads?.last_validation_at || ''}
                                        disabled
                                        className="font-mono text-sm"
                                    />
                                </FormField>
                            </div>

                            <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200">
                                <div className="mb-4">
                                    <h5 className="text-lg font-bold text-gray-900">Google Ads Test & Production Accounts</h5>
                                    <p className="text-sm text-gray-500">
                                        Configure allowlists de contas para execução real em TEST e para futura liberação segura em PRODUÇÃO.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField>
                                        <FormLabel className="text-gray-700">Test Manager Account ID</FormLabel>
                                        <FormInput
                                            type="text"
                                            value={safeConfig.google_ads?.test_manager_account_id || ''}
                                            onChange={e => setConfig({
                                                ...safeConfig,
                                                google_ads: { ...safeConfig.google_ads, test_manager_account_id: e.target.value }
                                            })}
                                            placeholder="123-456-7890"
                                            className="font-mono text-sm"
                                        />
                                    </FormField>

                                    <FormField>
                                        <FormLabel className="text-gray-700">Production Manager Account ID</FormLabel>
                                        <FormInput
                                            type="text"
                                            value={safeConfig.google_ads?.production_manager_account_id || ''}
                                            onChange={e => setConfig({
                                                ...safeConfig,
                                                google_ads: { ...safeConfig.google_ads, production_manager_account_id: e.target.value }
                                            })}
                                            placeholder="123-456-7890"
                                            className="font-mono text-sm"
                                        />
                                    </FormField>
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField>
                                        <FormLabel className="text-gray-700">Test Customer Accounts</FormLabel>
                                        <FormTextarea
                                            value={
                                                Array.isArray(safeConfig.google_ads?.test_customer_accounts)
                                                    ? safeConfig.google_ads!.test_customer_accounts!.join(', ')
                                                    : ''
                                            }
                                            onChange={e => {
                                                const raw = e.target.value || '';
                                                const ids = raw
                                                    .split(/[\n,]+/g)
                                                    .map(s => s.trim())
                                                    .filter(Boolean);
                                                setConfig({
                                                    ...safeConfig,
                                                    google_ads: { ...safeConfig.google_ads, test_customer_accounts: ids }
                                                });
                                            }}
                                            placeholder="111-111-1111, 222-222-2222"
                                            className="font-mono text-sm min-h-[120px]"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Separar por vírgula ou quebra de linha. Armazenado como string[].</p>
                                    </FormField>

                                    <FormField>
                                        <FormLabel className="text-gray-700">Production Customer Accounts</FormLabel>
                                        <FormTextarea
                                            value={
                                                Array.isArray(safeConfig.google_ads?.production_customer_accounts)
                                                    ? safeConfig.google_ads!.production_customer_accounts!.join(', ')
                                                    : ''
                                            }
                                            onChange={e => {
                                                const raw = e.target.value || '';
                                                const ids = raw
                                                    .split(/[\n,]+/g)
                                                    .map(s => s.trim())
                                                    .filter(Boolean);
                                                setConfig({
                                                    ...safeConfig,
                                                    google_ads: { ...safeConfig.google_ads, production_customer_accounts: ids }
                                                });
                                            }}
                                            placeholder="111-111-1111, 222-222-2222"
                                            className="font-mono text-sm min-h-[120px]"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Preencher apenas quando formos liberar PRODUÇÃO. Mantém produção bloqueada enquanto estiver vazio.
                                        </p>
                                    </FormField>
                                </div>

                                <div className="mt-6 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="font-bold text-gray-800 mb-2">Ajuda rápida</div>
                                    <div className="space-y-1">
                                        <div>TEST real: access_level=test, execution_mode=active, test_customer_accounts com pelo menos 1 Customer ID.</div>
                                        <div>PRODUÇÃO: preencher production_customer_accounts apenas quando formos liberar produção com segurança.</div>
                                    </div>
                                </div>
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
                                <FormField>
                                    <FormLabel className="text-gray-700">ClickBank API Token (Unified)</FormLabel>
                                    <FormInput 
                                        type="password" 
                                        value={safeConfig.api_keys?.clickbank_api_token || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, clickbank_api_token: e.target.value }
                                        })}
                                        placeholder="API-..."
                                        className="font-mono text-sm"
                                    />
                                </FormField>
                                <FormField>
                                    <FormLabel className="text-gray-700">Account Nickname</FormLabel>
                                    <FormInput 
                                        type="text" 
                                        value={safeConfig.api_keys?.clickbank_nickname || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, clickbank_nickname: e.target.value }
                                        })}
                                        placeholder="e.g. johnpace"
                                        className="font-medium"
                                    />
                                </FormField>
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
                                <FormField>
                                    <FormLabel className="text-gray-700">Digistore API Key</FormLabel>
                                    <FormInput 
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
                                        placeholder="API-..."
                                        className="font-mono text-sm"
                                    />
                                </FormField>
                                <FormField>
                                    <FormLabel className="text-gray-700">Affiliate ID (Nickname)</FormLabel>
                                    <FormInput 
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
                                        placeholder="e.g. JohnPace"
                                        className="font-medium"
                                    />
                                </FormField>
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
                                <FormField>
                                    <FormLabel className="text-gray-700">BuyGoods API Key</FormLabel>
                                    <FormInput 
                                        type="password" 
                                        value={safeConfig.api_keys?.buygoods_api || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, buygoods_api: e.target.value }
                                        })}
                                        placeholder="bg_..."
                                        className="font-mono text-sm"
                                    />
                                </FormField>
                                <FormField>
                                    <FormLabel className="text-gray-700">Account ID</FormLabel>
                                    <FormInput 
                                        type="text" 
                                        value={safeConfig.api_keys?.buygoods_account_id || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, buygoods_account_id: e.target.value }
                                        })}
                                        placeholder="e.g. 12345"
                                        className="font-medium"
                                    />
                                </FormField>
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
                                <FormField>
                                    <FormLabel className="text-gray-700">MaxWeb API Key</FormLabel>
                                    <FormInput 
                                        type="password" 
                                        value={safeConfig.api_keys?.maxweb_api || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, maxweb_api: e.target.value }
                                        })}
                                        placeholder="mw_..."
                                        className="font-mono text-sm"
                                    />
                                </FormField>
                                <FormField>
                                    <FormLabel className="text-gray-700">Affiliate ID</FormLabel>
                                    <FormInput 
                                        type="text" 
                                        value={safeConfig.api_keys?.maxweb_affiliate_id || ''}
                                        onChange={e => setConfig({
                                            ...safeConfig, 
                                            api_keys: { ...safeConfig.api_keys, maxweb_affiliate_id: e.target.value }
                                        })}
                                        placeholder="e.g. mw_12345"
                                        className="font-medium"
                                    />
                                </FormField>
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
                        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${
                            health.googleAds === 'ACTIVE' ? 'bg-green-50 border-green-500' :
                            health.googleAds === 'READY' ? 'bg-blue-50 border-blue-500' :
                            health.googleAds === 'CONFIGURED' ? 'bg-gray-50 border-gray-400' :
                            health.googleAds === 'OFFLINE' ? 'bg-red-50 border-red-500' :
                            'bg-gray-50 border-gray-400'
                        }`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">Google Ads</span>
                                <div className="flex items-center gap-3">
                                    {health.googleAds === 'ACTIVE' && <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>}
                                    {health.googleAds === 'READY' && <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">READY</span>}
                                    {health.googleAds === 'CONFIGURED' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">CONFIGURED</span>}
                                    {health.googleAds === 'OFFLINE' && <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">OFFLINE</span>}
                                    {health.googleAds === 'checking' && <span className="text-gray-500 text-xs">Checking...</span>}

                                    <span className="text-xs font-bold text-gray-600">
                                        {safeConfig.google_ads?.execution_mode === 'active' ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}
                                    </span>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={safeConfig.google_ads?.execution_mode === 'active'}
                                        disabled={
                                            saving ||
                                            (safeConfig.google_ads?.execution_mode !== 'active' && safeConfig.google_ads?.config_valid !== true)
                                        }
                                        onClick={async () => {
                                            const canEnable = safeConfig.google_ads?.config_valid === true;
                                            const nextMode =
                                                safeConfig.google_ads?.execution_mode === 'active'
                                                    ? 'config_only'
                                                    : canEnable
                                                      ? 'active'
                                                      : 'config_only';
                                            const updated = {
                                                ...safeConfig,
                                                google_ads: {
                                                    ...safeConfig.google_ads,
                                                    execution_mode: nextMode
                                                }
                                            };
                                            setConfig(updated);
                                            setSaving(true);
                                            try {
                                                await fetch('/api/admin/config', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(updated)
                                                });
                                                await checkHealth();
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            safeConfig.google_ads?.execution_mode === 'active' ? 'bg-blue-600' : 'bg-gray-300'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <span className="sr-only">Google Ads Mode Toggle</span>
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                safeConfig.google_ads?.execution_mode === 'active' ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
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

                        {/* SerpApi Status */}
                        <div
                            className={`p-6 rounded-xl border-l-4 shadow-sm ${
                                safeConfig.api_keys?.serp_provider === 'serpapi' && safeConfig.api_keys?.serpapi_api_key
                                    ? (safeConfig.api_keys?.serpapi_enabled === true ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-400')
                                    : 'bg-gray-50 border-gray-400'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800 text-lg">SerpApi</span>
                                <div className="flex items-center gap-3">
                                    {safeConfig.api_keys?.serp_provider === 'serpapi' && safeConfig.api_keys?.serpapi_api_key ? (
                                        safeConfig.api_keys?.serpapi_enabled === true ? (
                                            <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">ONLINE</span>
                                        ) : (
                                            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">DISABLED</span>
                                        )
                                    ) : (
                                        <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">NOT CONFIGURED</span>
                                    )}

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={safeConfig.api_keys?.serpapi_enabled === true}
                                        disabled={saving || !(safeConfig.api_keys?.serp_provider === 'serpapi' && safeConfig.api_keys?.serpapi_api_key)}
                                        onClick={async () => {
                                            const updated = {
                                                ...safeConfig,
                                                api_keys: { ...safeConfig.api_keys, serpapi_enabled: !(safeConfig.api_keys?.serpapi_enabled === true) }
                                            };
                                            setConfig(updated);
                                            setSaving(true);
                                            try {
                                                await fetch('/api/admin/config', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(updated)
                                                });
                                                await checkHealth();
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            safeConfig.api_keys?.serpapi_enabled === true ? 'bg-blue-600' : 'bg-gray-300'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <span className="sr-only">Enable SerpApi</span>
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                safeConfig.api_keys?.serpapi_enabled === true ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                SERP intelligence para encontrar URLs oficiais e sinais de busca.
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
