'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    vertical: 'health',
    language: 'en',
    template: 'editorial',
    affiliate_url: '',
    official_url: '',
    youtube_review_url: '',
    status: 'active',
    set_as_active: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Get token from localStorage (as per existing admin login logic)
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Unauthorized: Please login again' });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      setMessage({ type: 'success', text: `Product created successfully: ${data.slug}` });
      
      // Open Presell in new tab
      window.open(`/${data.slug}`, '_blank');
      
      // Refresh router to show update in list (if displayed)
      router.refresh();

      // Optional: Clear form or redirect
      // setFormData({ ... });

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Create New Product</h2>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input 
                type="text" name="name" required
                value={formData.name} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Mitolyn"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Optional)</label>
              <input 
                type="text" name="slug"
                value={formData.slug} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: mitolyn (auto-generated if empty)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vertical *</label>
                <select 
                    name="vertical" value={formData.vertical} onChange={handleChange}
                    className="w-full border rounded px-3 py-2 bg-white"
                >
                    <option value="health">Health</option>
                    <option value="diy">DIY</option>
                    <option value="pets">Pets</option>
                    <option value="dating">Dating</option>
                    <option value="finance">Finance</option>
                    <option value="other">Other</option>
                </select>
               </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language *</label>
                <select 
                    name="language" value={formData.language} onChange={handleChange}
                    className="w-full border rounded px-3 py-2 bg-white"
                >
                    <option value="en">English (en)</option>
                    <option value="pt">Portuguese (pt)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="it">Italian (it)</option>
                </select>
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
               <select 
                   name="template" value={formData.template} onChange={handleChange}
                   className="w-full border rounded px-3 py-2 bg-white"
               >
                   <option value="editorial">Editorial (Recommended)</option>
                   <option value="story">Story</option>
                   <option value="comparison">Comparison</option>
               </select>
            </div>
          </div>

          {/* URLs & Media */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate URL *</label>
              <input 
                type="url" name="affiliate_url" required
                value={formData.affiliate_url} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://hop.clickbank.net/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Official Site URL *</label>
              <input 
                type="url" name="official_url" required
                value={formData.official_url} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://product.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Review URL</label>
              <input 
                type="url" name="youtube_review_url"
                value={formData.youtube_review_url} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-500 mt-1">We will extract the ID automatically.</p>
            </div>

            <div className="flex items-center space-x-4 pt-4">
               <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" name="set_as_active"
                    checked={formData.set_as_active} onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">Set as Active Product (Root)</span>
               </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
           <button 
             type="submit" 
             disabled={loading}
             className={`px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {loading ? 'Creating...' : 'Create Product'}
           </button>
        </div>
      </form>
    </div>
  );
}
