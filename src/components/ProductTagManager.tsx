import React, { useState } from 'react';
import { Tag, Plus, X, Sparkles } from 'lucide-react';

interface ProductTagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export const ProductTagManager: React.FC<ProductTagManagerProps> = ({ tags = [], onChange }) => {
  const [inputTag, setInputTag] = useState('');

  const handleAddTag = () => {
    const trimmed = inputTag.trim().toLowerCase().replace(/^#/, '');
    if (!trimmed) return;

    // Split by comma if multiple tags pasted e.g. "gaming, wireless, bluetooth"
    const newTags = trimmed
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && !tags.includes(t));

    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
    setInputTag('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-[#FF5500]" />
          <span>Product Search Keywords & Tags (Optional)</span>
        </label>
        <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-2 py-0.5 rounded-full">
          {tags.length} tags added
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-normal">
        Add words or keywords. When buyers search these exact words or tags, your product will automatically pop up in search results!
      </p>

      {/* Add Tag Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Type tag (e.g. wireless, gaming, leather) & press Enter or Comma"
            value={inputTag}
            onChange={(e) => setInputTag(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] font-medium"
          />
        </div>
        <button
          type="button"
          onClick={handleAddTag}
          disabled={!inputTag.trim()}
          className="px-3.5 py-2 bg-[#FF5500] hover:bg-orange-600 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Tag</span>
        </button>
      </div>

      {/* Render Current Tags */}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100/80 border border-orange-200 text-[#FF5500] text-xs font-bold rounded-lg group animate-in fade-in duration-150"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-orange-400 hover:text-rose-600 hover:bg-orange-200 p-0.5 rounded transition-colors cursor-pointer"
                title={`Remove #${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 italic flex items-center gap-1 pt-0.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>No search tags added yet. Adding tags boosts product search visibility.</span>
        </div>
      )}
    </div>
  );
};
