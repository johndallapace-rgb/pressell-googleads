import React, { useState, useEffect } from 'react';

interface AdEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { headlines: string[], descriptions: string[] }) => void;
  initialHeadlines: string[];
  initialDescriptions: string[];
}

export default function AdEditorModal({ isOpen, onClose, onSave, initialHeadlines, initialDescriptions }: AdEditorProps) {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
        setHeadlines([...initialHeadlines]);
        setDescriptions([...initialDescriptions]);
    }
  }, [isOpen, initialHeadlines, initialDescriptions]);

  if (!isOpen) return null;

  const handleHeadlineChange = (index: number, val: string) => {
    const newArr = [...headlines];
    newArr[index] = val;
    setHeadlines(newArr);
  };

  const handleDescriptionChange = (index: number, val: string) => {
    const newArr = [...descriptions];
    newArr[index] = val;
    setDescriptions(newArr);
  };

  const addHeadline = () => setHeadlines([...headlines, '']);
  const removeHeadline = (i: number) => setHeadlines(headlines.filter((_, idx) => idx !== i));

  const addDescription = () => setDescriptions([...descriptions, '']);
  const removeDescription = (i: number) => setDescriptions(descriptions.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-xl font-bold">Edit Ad Copy</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
            {/* Headlines Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800">Headlines <span className="text-xs font-normal text-gray-500">(Max 30 chars)</span></h4>
                    <button onClick={addHeadline} className="text-sm text-blue-600 font-medium hover:underline">+ Add Headline</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {headlines.map((h, i) => (
                        <div key={i} className="relative">
                            <input 
                                type="text" 
                                value={h}
                                onChange={(e) => handleHeadlineChange(i, e.target.value)}
                                className={`w-full border rounded px-3 py-2 pr-16 ${h.length > 30 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                                placeholder={`Headline ${i+1}`}
                            />
                            <div className="absolute right-2 top-2 flex items-center space-x-2">
                                <span className={`text-xs ${h.length > 30 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                                    {h.length}/30
                                </span>
                                {headlines.length > 1 && (
                                    <button onClick={() => removeHeadline(i)} className="text-gray-400 hover:text-red-500">×</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Descriptions Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800">Descriptions <span className="text-xs font-normal text-gray-500">(Max 90 chars)</span></h4>
                    <button onClick={addDescription} className="text-sm text-blue-600 font-medium hover:underline">+ Add Description</button>
                </div>
                <div className="space-y-3">
                    {descriptions.map((d, i) => (
                        <div key={i} className="relative">
                            <textarea 
                                value={d}
                                onChange={(e) => handleDescriptionChange(i, e.target.value)}
                                className={`w-full border rounded px-3 py-2 pr-16 ${d.length > 90 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                                placeholder={`Description ${i+1}`}
                                rows={2}
                            />
                            <div className="absolute right-2 top-2 flex items-center space-x-2">
                                <span className={`text-xs ${d.length > 90 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                                    {d.length}/90
                                </span>
                                {descriptions.length > 1 && (
                                    <button onClick={() => removeDescription(i)} className="text-gray-400 hover:text-red-500">×</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10">
            <button onClick={onClose} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
            <button 
                onClick={() => onSave({ headlines, descriptions })}
                className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 shadow-sm"
            >
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
}
