import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import AIToolsRunner from '@/components/admin/AIToolsRunner'; 

export const dynamic = 'force-dynamic';

export default async function AIEngineeringPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !(await verifyToken(token))) {
    redirect('/admin/login');
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-purple-600">⚡</span>
                AI Engineering Control Center
            </h1>
            <p className="text-gray-500 mt-2">
                Centralized workspace for AI-assisted debugging, architecture analysis, performance review, and system improvement.
            </p>
        </div>
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Manual / Safe
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: TOOLS (Handled by Client Component for interactivity) */}
        <div className="lg:col-span-2 space-y-6">
            <AIToolsRunner />
        </div>

        {/* RIGHT COLUMN: OUTPUTS & HELP */}
        <div className="space-y-6">
            
            {/* Generated Outputs Card */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-4">
                <h3 className="font-bold text-gray-800 mb-4">Generated Outputs</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Recent engineering artifacts generated for analysis, debugging, and system review.
                </p>
                <div className="space-y-2">
                    {[
                        'AI Debug Pack', 
                        'System Structure', 
                        'System Flows', 
                        'Debug Manifest', 
                        'Architecture Report', 
                        'System Health Report',
                        'Log Analysis Report',
                        'Fix Suggestions Report',
                        'Bug Report', 
                        'Performance Report',
                        'SEO Report',
                        'Product Inspector Report',
                        'ChatGPT Analysis Prompt',
                        'ChatGPT Analysis Context'
                    ].map(f => (
                        <div key={f} className="flex items-center text-xs bg-white px-3 py-2 rounded border border-gray-200 text-gray-600">
                            <span className="mr-2 text-gray-400">📄</span> {f}
                        </div>
                    ))}
                </div>
            </div>

            {/* How to Use */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">How to Use with ChatGPT</h3>
                <p className="text-xs text-blue-700 mb-4">
                    Follow this workflow to get fast, context-aware engineering support.
                </p>
                <ol className="text-xs text-blue-800 space-y-2 list-decimal pl-4 mb-6">
                    <li>Generate the <strong>AI Debug Pack</strong></li>
                    <li>Copy the <strong>Engineer Prompt</strong></li>
                    <li>Start a new ChatGPT conversation</li>
                    <li>Upload the <strong>ZIP file</strong></li>
                    <li>Describe the bug or request</li>
                </ol>

                <div className="bg-white p-3 rounded border border-blue-200 mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Recommended Context</p>
                    <div className="text-xs text-gray-600 font-mono leading-relaxed">
                        Bug:<br/>
                        Tested slug:<br/>
                        Does the URL open in browser:<br/>
                        Did admin mark it offline:<br/>
                        Was Repair Keys used:<br/>
                        Environment: localhost or production
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
