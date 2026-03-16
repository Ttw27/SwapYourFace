import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Get configuration from data attributes
const getConfig = () => {
  const container = document.getElementById('party-builder-app');
  return {
    apiUrl: container?.dataset.apiUrl || 'https://party-shirt-builder.preview.emergentagent.com/api',
    productHandle: container?.dataset.productHandle || 'custom-party-tshirt',
    primaryColor: container?.dataset.primaryColor || '#FF2E63',
    secondaryColor: container?.dataset.secondaryColor || '#08D9D6',
    basePrice: parseInt(container?.dataset.basePrice || '1999') / 100,
    backPrintPrice: parseInt(container?.dataset.backPrintPrice || '250') / 100,
    shopDomain: container?.dataset.shopDomain || '',
    currency: container?.dataset.currency || 'GBP',
  };
};

// Simple state management
const useBuilderStore = () => {
  const [state, setState] = useState({
    templates: [],
    selectedTemplate: null,
    originalPhoto: null,
    headCutout: null,
    headPlacement: { x: 0.5, y: 0.15, scale: 1.0, rotation: 0 },
    titleText: '',
    subtitleText: '',
    hasBackPrint: false,
    backName: '',
    backNumber: '',
    builderMode: 'bulk',
    bulkSizes: { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 },
    partyMembers: [],
    loading: false,
    step: 1,
    gdprConsent: false,
  });

  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return { state, updateState };
};

// Template selector component
const TemplateSelector = ({ templates, selected, onSelect }) => {
  return (
    <div className="pb-template-grid">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className={`pb-template-card ${selected?.id === template.id ? 'selected' : ''}`}
        >
          <div className="pb-template-image">
            <img src={template.body_image_url} alt={template.name} />
          </div>
          <span className="pb-template-name">{template.name}</span>
          <span className={`pb-template-badge ${template.category}`}>{template.category}</span>
        </button>
      ))}
    </div>
  );
};

// Photo uploader component
const PhotoUploader = ({ config, onPhotoProcessed, gdprConsent, onGdprChange }) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !gdprConsent) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload photo
      const uploadRes = await fetch(`${config.apiUrl}/upload/photo`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      // Remove background
      setUploading(false);
      setProcessing(true);
      
      const bgFormData = new FormData();
      bgFormData.append('file_id', uploadData.id);
      
      const bgRes = await fetch(`${config.apiUrl}/upload/remove-background`, {
        method: 'POST',
        body: bgFormData,
      });
      const bgData = await bgRes.json();

      onPhotoProcessed({
        original: uploadData,
        head: bgData,
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process photo. Please try again.');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="pb-uploader">
      <div className="pb-gdpr-consent">
        <label>
          <input
            type="checkbox"
            checked={gdprConsent}
            onChange={(e) => onGdprChange(e.target.checked)}
          />
          <span>I consent to my photo being used for order fulfilment only.</span>
        </label>
      </div>
      
      {gdprConsent && (
        <div 
          className={`pb-dropzone ${uploading || processing ? 'active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          {uploading || processing ? (
            <div className="pb-upload-status">
              <div className="pb-spinner"></div>
              <p>{uploading ? 'Uploading...' : 'Processing...'}</p>
            </div>
          ) : (
            <div className="pb-upload-prompt">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p>Click to upload a photo</p>
              <span>JPG, PNG up to 10MB</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Size quantity selector
const SizeSelector = ({ sizes, onChange }) => {
  const sizeLabels = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  
  return (
    <div className="pb-size-grid">
      {sizeLabels.map((size) => (
        <div key={size} className="pb-size-item">
          <label>{size}</label>
          <div className="pb-qty-stepper">
            <button onClick={() => onChange(size, Math.max(0, sizes[size] - 1))}>-</button>
            <input
              type="number"
              value={sizes[size]}
              onChange={(e) => onChange(size, parseInt(e.target.value) || 0)}
              min="0"
            />
            <button onClick={() => onChange(size, sizes[size] + 1)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main builder component
const PartyBuilder = () => {
  const config = getConfig();
  const { state, updateState } = useBuilderStore();

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/templates`);
        const templates = await res.json();
        updateState({ templates });
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };
    fetchTemplates();

    // Hide loading indicator
    const loading = document.getElementById('party-builder-loading');
    if (loading) loading.classList.add('hidden');
  }, []);

  // Calculate total
  const getTotalQuantity = () => Object.values(state.bulkSizes).reduce((sum, qty) => sum + qty, 0);
  const getTotal = () => {
    const qty = getTotalQuantity();
    const backPrice = state.hasBackPrint ? config.backPrintPrice : 0;
    return qty * (config.basePrice + backPrice);
  };

  // Add to Shopify cart
  const addToShopifyCart = async () => {
    const totalQty = getTotalQuantity();
    if (totalQty === 0) {
      alert('Please select at least one size');
      return;
    }

    // Build line items for Shopify cart
    const items = [];
    Object.entries(state.bulkSizes).forEach(([size, qty]) => {
      if (qty > 0) {
        items.push({
          quantity: qty,
          properties: {
            'Template': state.selectedTemplate?.name || 'Custom',
            'Title Text': state.titleText,
            'Subtitle Text': state.subtitleText,
            'Size': size,
            'Back Print': state.hasBackPrint ? 'Yes' : 'No',
            'Back Name': state.hasBackPrint ? state.backName : '',
            '_head_cutout_id': state.headCutout?.id || '',
            '_original_photo_id': state.originalPhoto?.id || '',
          },
        });
      }
    });

    // Add to Shopify cart via AJAX API
    try {
      for (const item of items) {
        // Note: You need to create a product in Shopify with variants for each size
        // The variant ID should be fetched based on the size
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: getVariantIdForSize(item.properties.Size), // Implement this function
            quantity: item.quantity,
            properties: item.properties,
          }),
        });
      }
      
      // Redirect to cart
      window.location.href = '/cart';
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  // Placeholder - needs to be configured with actual variant IDs from your Shopify product
  const getVariantIdForSize = (size) => {
    // TODO: Map sizes to actual Shopify variant IDs
    // You'll need to create a product in Shopify with variants for S, M, L, XL, 2XL, 3XL
    // Then add those variant IDs here
    const variantMap = {
      'S': 'YOUR_S_VARIANT_ID',
      'M': 'YOUR_M_VARIANT_ID',
      'L': 'YOUR_L_VARIANT_ID',
      'XL': 'YOUR_XL_VARIANT_ID',
      '2XL': 'YOUR_2XL_VARIANT_ID',
      '3XL': 'YOUR_3XL_VARIANT_ID',
    };
    return variantMap[size];
  };

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return (
          <div className="pb-step">
            <h3>1. Choose a Template</h3>
            <TemplateSelector
              templates={state.templates}
              selected={state.selectedTemplate}
              onSelect={(template) => updateState({ selectedTemplate: template })}
            />
          </div>
        );
      
      case 2:
        return (
          <div className="pb-step">
            <h3>2. Upload a Photo</h3>
            <PhotoUploader
              config={config}
              gdprConsent={state.gdprConsent}
              onGdprChange={(consent) => updateState({ gdprConsent: consent })}
              onPhotoProcessed={({ original, head }) => updateState({ 
                originalPhoto: original, 
                headCutout: head 
              })}
            />
            {state.headCutout && (
              <div className="pb-photo-preview">
                <img 
                  src={`${config.apiUrl.replace('/api', '')}${state.headCutout.head_url}`} 
                  alt="Processed" 
                />
                <p>✓ Photo processed!</p>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="pb-step">
            <h3>3. Customize Your Text</h3>
            <div className="pb-text-inputs">
              <div className="pb-input-group">
                <label>Main Title</label>
                <input
                  type="text"
                  value={state.titleText}
                  onChange={(e) => updateState({ titleText: e.target.value })}
                  placeholder="e.g., DAVE'S STAG DO"
                />
              </div>
              <div className="pb-input-group">
                <label>Subtitle</label>
                <input
                  type="text"
                  value={state.subtitleText}
                  onChange={(e) => updateState({ subtitleText: e.target.value })}
                  placeholder="e.g., BENIDORM 2025"
                />
              </div>
              <div className="pb-back-print">
                <label>
                  <input
                    type="checkbox"
                    checked={state.hasBackPrint}
                    onChange={(e) => updateState({ hasBackPrint: e.target.checked })}
                  />
                  <span>Add name on the back (+£{config.backPrintPrice.toFixed(2)})</span>
                </label>
                {state.hasBackPrint && (
                  <input
                    type="text"
                    value={state.backName}
                    onChange={(e) => updateState({ backName: e.target.value })}
                    placeholder="Back name"
                    className="pb-back-name-input"
                  />
                )}
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="pb-step">
            <h3>4. Select Sizes</h3>
            <SizeSelector
              sizes={state.bulkSizes}
              onChange={(size, qty) => updateState({ 
                bulkSizes: { ...state.bulkSizes, [size]: qty } 
              })}
            />
            <div className="pb-total">
              <div className="pb-total-row">
                <span>Quantity:</span>
                <span>{getTotalQuantity()} shirts</span>
              </div>
              <div className="pb-total-row">
                <span>Price per shirt:</span>
                <span>£{(config.basePrice + (state.hasBackPrint ? config.backPrintPrice : 0)).toFixed(2)}</span>
              </div>
              <div className="pb-total-row pb-total-final">
                <span>Total:</span>
                <span>£{getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="pb-builder" style={{ '--primary': config.primaryColor, '--secondary': config.secondaryColor }}>
      {/* Progress steps */}
      <div className="pb-progress">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            className={`pb-progress-step ${state.step === num ? 'active' : ''} ${state.step > num ? 'completed' : ''}`}
            onClick={() => updateState({ step: num })}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="pb-content">
        <div className="pb-preview">
          <h4>Preview</h4>
          <div className="pb-canvas">
            {state.selectedTemplate && (
              <img src={state.selectedTemplate.body_image_url} alt="Template" className="pb-template-preview" />
            )}
            {state.headCutout && (
              <img 
                src={`${config.apiUrl.replace('/api', '')}${state.headCutout.head_url}`} 
                alt="Head" 
                className="pb-head-preview"
                style={{
                  left: `${state.headPlacement.x * 100}%`,
                  top: `${state.headPlacement.y * 100}%`,
                  transform: `translate(-50%, -50%) scale(${state.headPlacement.scale}) rotate(${state.headPlacement.rotation}deg)`,
                }}
              />
            )}
            {state.titleText && (
              <div className="pb-text-preview pb-title">{state.titleText.toUpperCase()}</div>
            )}
            {state.subtitleText && (
              <div className="pb-text-preview pb-subtitle">{state.subtitleText.toUpperCase()}</div>
            )}
          </div>
        </div>
        
        <div className="pb-controls">
          {renderStep()}
          
          <div className="pb-navigation">
            {state.step > 1 && (
              <button className="pb-btn pb-btn-outline" onClick={() => updateState({ step: state.step - 1 })}>
                Back
              </button>
            )}
            {state.step < 4 ? (
              <button 
                className="pb-btn pb-btn-primary" 
                onClick={() => updateState({ step: state.step + 1 })}
                disabled={state.step === 1 && !state.selectedTemplate}
              >
                Next Step
              </button>
            ) : (
              <button 
                className="pb-btn pb-btn-primary pb-btn-cart" 
                onClick={addToShopifyCart}
                disabled={getTotalQuantity() === 0}
              >
                Add to Cart - £{getTotal().toFixed(2)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mount the app
const rootElement = document.getElementById('party-builder-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<PartyBuilder />);
}
