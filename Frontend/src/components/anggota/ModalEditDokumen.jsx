import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function ModalEditDokumen({ document, onClose, onSave }) {
  const [label, setLabel] = useState(document?.label || 'Proposal');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(document?.tags || ['2024', 'Divisi Acara']);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...document,
      label,
      tags
    });
  };

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div className="portal-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Atur Label & Kategorisasi</h3>
            <p className="portal-modal-subtitle">Kategorikan dokumen agar mudah ditemukan.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="portal-modal-body">
            <div className="portal-form-group">
              <label className="portal-form-label">Label Dokumen</label>
              <select 
                className="portal-select"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              >
                <option value="Proposal">Proposal</option>
                <option value="LPJ">LPJ</option>
                <option value="Surat">Surat</option>
                <option value="Sipakamase">Sipakamase</option>
              </select>
            </div>

            <div className="portal-form-group">
              <label className="portal-form-label">Tag tambahan</label>
              <input 
                type="text" 
                className="portal-input"
                placeholder="Ketik tag lalu tekan Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <div className="tag-input-chips">
                {tags.map((tag) => (
                  <span key={tag} className="interactive-chip">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="portal-modal-footer">
            <button 
              type="button" 
              className="btn-secondary"
              style={{ width: 'auto', padding: '9px 18px', fontSize: '13.5px' }}
              onClick={onClose}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn-primary-glow"
              style={{ padding: '9px 20px', fontSize: '13.5px' }}
            >
              Simpan Kategorisasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
