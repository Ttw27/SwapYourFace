import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { 
  Upload, RotateCw, ZoomIn, ZoomOut, Move, Trash2, 
  Plus, Minus, ShoppingCart, Users, Shirt, ChevronRight,
  CheckCircle, AlertCircle, Loader2, Type
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Canvas dimensions
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

// ─── Head Image Component ────────────────────────────────────────────────────
const HeadImage = ({ imageUrl, placement, isSelected, onSelect, onChange }) => {
  // Always use anonymous crossOrigin for head images served from our backend
  const [image] = useImage(imageUrl, 'anonymous');
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  if (!image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={placement.x * CANVAS_WIDTH}
        y={placement.y * CANVAS_HEIGHT}
        width={image.width * placement.scale * 0.3}
        height={image.height * placement.scale * 0.3}
        offsetX={(image.width * placement.scale * 0.3) / 2}
        offsetY={(image.height * placement.scale * 0.3) / 2}
        rotation={placement.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x() / CANVAS_WIDTH,
            y: e.target.y() / CANVAS_HEIGHT,
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          onChange({
            scale: placement.scale * scaleX,
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

// ─── Template Image Component ────────────────────────────────────────────────
// FIX: Cloudinary URLs are fully CORS-compatible with 'anonymous' crossOrigin.
// The previous bug was that body_image_url was a relative path or Emergent CDN URL.
// Now all template images are on Cloudinary which allows cross-origin canvas use.
const TemplateImage = ({ imageUrl }) => {
  const [image, status] = useImage(imageUrl, 'anonymous');
  
  if (!image) return null;
  
  const scale = Math.min(CANVAS_WIDTH / image.width, CANVAS_HEIGHT / image.height) * 0.95;
  
  return (
    <KonvaImage
      image={image}
      x={CANVAS_WIDTH / 2}
      y={CANVAS_HEIGHT / 2}
      width={image.width * scale}
      height={image.height * scale}
      offsetX={(image.width * scale) / 2}
      offsetY={(image.height * scale) / 2}
      listening={false}
    />
  );
};

// ─── Canvas Text Component ───────────────────────────────────────────────────
// Live text preview with stroke — matches the design style
const CanvasText = ({ text, y, fontSize, fillColor, strokeColor }) => {
  if (!text) return null;
  return (
    <Text
      text={text.toUpperCase()}
      x={CANVAS_WIDTH / 2}
      y={y}
      fontSize={fontSize}
      fontFamily="Anton, sans-serif"
      fontStyle="normal"
      fill={fillColor || '#FFFFFF'}
      stroke={strokeColor || '#000000'}
      strokeWidth={fontSize > 20 ? 2 : 1}
      shadowColor="rgba(0,0,0,0.5)"
      shadowBlur={4}
      shadowOffsetX={1}
      shadowOffsetY={1}
      align="center"
      listening={false}
      offsetX={0}
      width={CANVAS_WIDTH}
    />
  );
};

// ─── Category Filter Tabs ────────────────────────────────────────────────────
const CategoryTabs = ({ active, onChange }) => {
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'stag', label: '🟦 Stag' },
    { key: 'hen', label: '🟪 Hen' },
    { key: 'party', label: '🎉 Party' },
  ];
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === tab.key
              ? 'bg-[#FF2E63] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ─── Main Builder Page ───────────────────────────────────────────────────────
export default function BuilderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const {
    templates, fetchTemplates,
    selectedTemplate, setSelectedTemplate,
    originalPhoto, setOriginalPhoto,
    headCutout, setHeadCutout,
    headPlacement, setHeadPlacement,
    titleText, setTitleText,
    subtitleText, setSubtitleText,
    hasBackPrint, setHasBackPrint,
    backName, setBackName,
    backNumber, setBackNumber,
    builderMode, setBuilderMode,
    bulkSizes, updateBulkSize,
    bulkBackNames, setBulkBackNames,
    useSingleBackName, setUseSingleBackName,
    singleBackName, setSingleBackName,
    partyMembers, addPartyMember, updatePartyMember, removePartyMember,
    addToCart, addMultipleToCart,
    pricing,
    resetBuilder
  } = useStore();

  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [headSelected, setHeadSelected] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load template from URL param
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        if (template.head_placement) setHeadPlacement(template.head_placement);
      }
    }
  }, [searchParams, templates, setSelectedTemplate, setHeadPlacement]);

  useEffect(() => {
    if (templates.length === 0) fetchTemplates();
  }, [templates.length, fetchTemplates]);

  // Filtered templates
  const filteredTemplates = templates.filter(t => {
    if (categoryFilter === 'all') return true;
    const cats = t.categories || [t.category];
    return cats.includes(categoryFilter);
  });

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API}/upload/photo`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setOriginalPhoto(data);
      if (data.quality_warning) toast.warning(data.quality_warning);

      setIsProcessing(true);
      const bgFormData = new FormData();
      bgFormData.append('file_id', data.id);

      const bgResponse = await fetch(`${API}/upload/remove-background`, {
        method: 'POST',
        body: bgFormData,
      });
      if (!bgResponse.ok) throw new Error('Background removal failed');
      const bgData = await bgResponse.json();
      setHeadCutout(bgData);
      toast.success('Photo processed successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process photo. Please try again.');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  // Drag and drop support
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFileUpload(fakeEvent);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  // Calculate total for bulk mode
  const calculateBulkTotal = () => {
    const totalQty = Object.values(bulkSizes).reduce((sum, qty) => sum + qty, 0);
    const baseTotal = totalQty * pricing.base_price;
    const backTotal = hasBackPrint ? totalQty * pricing.back_print_price : 0;
    return baseTotal + backTotal;
  };

  const getTotalQuantity = () =>
    Object.values(bulkSizes).reduce((sum, qty) => sum + qty, 0);

  // Add bulk order to cart
  const handleAddBulkToCart = () => {
    const totalQty = getTotalQuantity();
    if (totalQty === 0) { toast.error('Please select at least one size'); return; }
    if (!selectedTemplate) { toast.error('Please select a template'); return; }
    if (hasBackPrint && !useSingleBackName && bulkBackNames.length !== totalQty) {
      toast.error(`Please enter exactly ${totalQty} back names`); return;
    }

    const items = [];
    Object.entries(bulkSizes).forEach(([size, qty]) => {
      if (qty > 0) {
        for (let i = 0; i < qty; i++) {
          items.push({
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            headCutoutId: headCutout?.id,
            titleText, subtitleText, hasBackPrint,
            backName: hasBackPrint ? (useSingleBackName ? singleBackName : bulkBackNames[items.length] || '') : '',
            backNumber: '',
            size, quantity: 1,
            headPlacement,
            originalPhotoUrl: originalPhoto?.original_url,
            headUrl: headCutout?.head_url,
            price: pricing.base_price,
            backPrice: hasBackPrint ? pricing.back_print_price : 0,
          });
        }
      }
    });

    addMultipleToCart(items);
    toast.success(`Added ${totalQty} items to cart!`);
    navigate('/cart');
  };

  // Add party member
  const handleAddPartyMember = () => {
    if (!selectedTemplate) { toast.error('Please select a template first'); return; }
    addPartyMember({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      headCutoutId: headCutout?.id,
      titleText, subtitleText, hasBackPrint, backName, backNumber,
      size: 'M',
      headPlacement: { ...headPlacement },
      originalPhotoUrl: originalPhoto?.original_url,
      headUrl: headCutout?.head_url,
    });
    toast.success('Person added to order!');
    setHeadCutout(null);
    setOriginalPhoto(null);
    setBackName('');
    setBackNumber('');
  };

  const handleAddPartyToCart = () => {
    if (partyMembers.length === 0) { toast.error('Please add at least one person'); return; }
    const items = partyMembers.map(member => ({
      ...member,
      quantity: 1,
      price: pricing.base_price,
      backPrice: member.hasBackPrint ? pricing.back_print_price : 0,
    }));
    addMultipleToCart(items);
    toast.success(`Added ${items.length} items to cart!`);
    navigate('/cart');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedTemplate !== null;
      case 2: return headCutout !== null || !gdprConsent;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  // Get text colours from selected template
  const titleColor = selectedTemplate?.text_fields?.title?.color || '#FFFFFF';
  const titleStroke = selectedTemplate?.text_fields?.title?.outline || '#000000';
  const subtitleColor = selectedTemplate?.text_fields?.subtitle?.color || '#FFFFFF';
  const subtitleStroke = selectedTemplate?.text_fields?.subtitle?.outline || '#000000';

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* Header */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide">
            PARTY BUILDER
          </h1>
          <p className="text-gray-600 mt-2">Create your custom party t-shirt design</p>
          
          {/* Mode selector */}
          <div className="flex gap-4 mt-6 flex-wrap">
            <button
              onClick={() => setBuilderMode('bulk')}
              data-testid="mode-bulk"
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                builderMode === 'bulk' ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Shirt className="w-5 h-5" />
              Bulk Order (Same Design)
            </button>
            <button
              onClick={() => setBuilderMode('multi')}
              data-testid="mode-multi"
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                builderMode === 'multi' ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-5 h-5" />
              Multi-Design (Different Per Person)
            </button>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {['Template', 'Photo', 'Customise', 'Sizes'].map((label, idx) => (
              <div key={label} className="flex items-center">
                <button
                  onClick={() => idx + 1 < step && setStep(idx + 1)}
                  data-testid={`step-${idx + 1}`}
                  className={`flex items-center gap-2 ${
                    step === idx + 1 ? 'text-[#FF2E63]' : step > idx + 1 ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === idx + 1 ? 'bg-[#FF2E63] text-white' 
                      : step > idx + 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > idx + 1 ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="hidden sm:inline font-medium">{label}</span>
                </button>
                {idx < 3 && <ChevronRight className="w-5 h-5 text-gray-300 mx-2 sm:mx-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Left: Canvas Preview */}
          <div className="order-2 lg:order-1">
            <div className="card-party p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">PREVIEW</h3>
              
              {/* Canvas */}
              <div 
                className="rounded-xl overflow-hidden mx-auto border border-gray-100"
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: '#f9f9f9' }}
                data-testid="design-canvas"
              >
                <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
                  <Layer>
                    {/* Template image — Cloudinary URLs are CORS safe */}
                    {selectedTemplate && (
                      <TemplateImage imageUrl={selectedTemplate.body_image_url} />
                    )}
                    
                    {/* Head cutout */}
                    {headCutout && (
                      <HeadImage
                        imageUrl={`${process.env.REACT_APP_BACKEND_URL}${headCutout.head_url}`}
                        placement={headPlacement}
                        isSelected={headSelected}
                        onSelect={() => setHeadSelected(true)}
                        onChange={(newPlacement) => setHeadPlacement(newPlacement)}
                      />
                    )}
                    
                    {/* Live title text with stroke */}
                    {titleText && (
                      <CanvasText
                        text={titleText}
                        y={CANVAS_HEIGHT - 80}
                        fontSize={24}
                        fillColor={titleColor}
                        strokeColor={titleStroke}
                      />
                    )}
                    
                    {/* Live subtitle text with stroke */}
                    {subtitleText && (
                      <CanvasText
                        text={subtitleText}
                        y={CANVAS_HEIGHT - 48}
                        fontSize={16}
                        fillColor={subtitleColor}
                        strokeColor={subtitleStroke}
                      />
                    )}
                  </Layer>
                </Stage>
              </div>

              {/* No template selected placeholder */}
              {!selectedTemplate && (
                <div className="mt-4 text-center text-gray-400 text-sm">
                  👈 Pick a template to see your design
                </div>
              )}

              {/* Head controls */}
              {headCutout && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-sm text-gray-600 mb-2 block">Scale</Label>
                      <div className="flex items-center gap-2">
                        <ZoomOut className="w-4 h-4 text-gray-400" />
                        <Slider
                          value={[headPlacement.scale]}
                          min={0.1} max={2} step={0.05}
                          onValueChange={([val]) => setHeadPlacement({ scale: val })}
                          className="flex-1"
                        />
                        <ZoomIn className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm text-gray-600 mb-2 block">Rotation</Label>
                      <div className="flex items-center gap-2">
                        <RotateCw className="w-4 h-4 text-gray-400" />
                        <Slider
                          value={[headPlacement.rotation]}
                          min={-180} max={180} step={5}
                          onValueChange={([val]) => setHeadPlacement({ rotation: val })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    <Move className="w-4 h-4 inline mr-1" />
                    Drag the head to reposition it
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="order-1 lg:order-2 space-y-6">
            <AnimatePresence mode="wait">

              {/* Step 1: Select Template */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-2 tracking-wide">
                    1. CHOOSE A TEMPLATE
                  </h3>
                  
                  {/* Category filter */}
                  <CategoryTabs active={categoryFilter} onChange={setCategoryFilter} />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          if (template.head_placement) setHeadPlacement(template.head_placement);
                        }}
                        data-testid={`select-template-${template.id}`}
                        className={`p-2 rounded-xl border-2 transition-all text-left ${
                          selectedTemplate?.id === template.id
                            ? 'border-[#FF2E63] bg-[#FF2E63]/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                          {/* Show product_image_url as the gallery thumbnail */}
                          <img
                            src={template.product_image_url || template.body_image_url}
                            alt={template.name}
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">{template.name}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {(template.categories || [template.category]).map(cat => (
                            <span key={cat} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full capitalize">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-gray-400">
                        No templates in this category yet
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Upload Photo */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">
                    2. UPLOAD A PHOTO
                  </h3>
                  
                  {/* GDPR Consent */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="gdpr"
                        checked={gdprConsent}
                        onCheckedChange={setGdprConsent}
                        data-testid="gdpr-consent"
                      />
                      <label htmlFor="gdpr" className="text-sm text-gray-600 cursor-pointer">
                        I consent to my photo being used for order fulfilment only. 
                        Your photo will be securely stored and used solely to create your custom t-shirt design.
                      </label>
                    </div>
                  </div>

                  {!gdprConsent ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-600">Please accept the consent above to upload a photo</p>
                    </div>
                  ) : headCutout ? (
                    <div className="text-center py-4">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 border-4 border-green-500">
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}${headCutout.head_url}`}
                          alt="Processed head"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <p className="text-green-600 font-medium flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Photo processed!
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => { setHeadCutout(null); setOriginalPhoto(null); }}
                        className="mt-4"
                        data-testid="change-photo-btn"
                      >
                        Change Photo
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                        isUploading || isProcessing
                          ? 'border-[#FF2E63] bg-[#FF2E63]/5'
                          : 'border-gray-300 hover:border-[#FF2E63] hover:bg-[#FF2E63]/5'
                      }`}
                      onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        data-testid="photo-upload-input"
                      />
                      {isUploading || isProcessing ? (
                        <div>
                          <Loader2 className="w-12 h-12 text-[#FF2E63] mx-auto mb-4 animate-spin" />
                          <p className="text-gray-600 font-medium">
                            {isUploading ? 'Uploading your photo...' : 'Removing background...'}
                          </p>
                          <p className="text-gray-400 text-sm mt-1">This takes a few seconds</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-700 font-medium mb-1">Click to upload or drag & drop</p>
                          <p className="text-gray-400 text-sm">JPG, PNG or WebP up to 10MB</p>
                          <p className="text-gray-400 text-xs mt-2">Best results: clear face photo, good lighting</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Customise Text */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-1 tracking-wide">
                    3. ADD YOUR TEXT
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <Type className="w-4 h-4" />
                    Text updates live on the preview
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                        Main Title
                      </Label>
                      <Input
                        id="title"
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                        placeholder='e.g. "DAVE'S STAG DO"'
                        className="mt-1 font-medium"
                        data-testid="title-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subtitle" className="text-sm font-medium text-gray-700">
                        Subtitle
                      </Label>
                      <Input
                        id="subtitle"
                        value={subtitleText}
                        onChange={(e) => setSubtitleText(e.target.value)}
                        placeholder='e.g. "BENIDORM 2025"'
                        className="mt-1"
                        data-testid="subtitle-input"
                      />
                    </div>

                    {/* Text colour preview */}
                    {selectedTemplate && (
                      <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 flex items-center gap-3">
                        <span>Text colours from your template:</span>
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full border border-gray-200 inline-block" style={{ background: titleColor }}></span>
                          Title
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full border border-gray-200 inline-block" style={{ background: subtitleColor }}></span>
                          Subtitle
                        </span>
                      </div>
                    )}
                    
                    {/* Back print option */}
                    <div className="mt-6 border-t pt-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        onClick={() => setHasBackPrint(!hasBackPrint)}
                      >
                        <Checkbox
                          checked={hasBackPrint}
                          onCheckedChange={setHasBackPrint}
                          data-testid="back-print-checkbox"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-700">Add name on the back</p>
                          <p className="text-sm text-gray-500">+£{pricing.back_print_price?.toFixed(2)} per shirt</p>
                        </div>
                      </div>
                      
                      {hasBackPrint && builderMode === 'multi' && (
                        <div className="mt-4 space-y-4 pl-8">
                          <div>
                            <Label htmlFor="backName">Back Name</Label>
                            <Input
                              id="backName"
                              value={backName}
                              onChange={(e) => setBackName(e.target.value)}
                              placeholder='e.g. "BEST MAN"'
                              className="mt-1"
                              data-testid="back-name-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="backNumber">Back Number (optional)</Label>
                            <Input
                              id="backNumber"
                              value={backNumber}
                              onChange={(e) => setBackNumber(e.target.value)}
                              placeholder="e.g. 69"
                              className="mt-1"
                              data-testid="back-number-input"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Sizes & Add to Cart */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">
                    4. {builderMode === 'bulk' ? 'SELECT SIZES & QUANTITIES' : 'ADD TO ORDER'}
                  </h3>
                  
                  {builderMode === 'bulk' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Object.entries(bulkSizes).map(([size, qty]) => (
                          <div key={size} className="bg-gray-50 rounded-xl p-4">
                            <Label className="text-lg font-bold text-center block mb-3">{size}</Label>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => updateBulkSize(size, qty - 1)}
                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                data-testid={`qty-minus-${size}`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-bold text-lg">{qty}</span>
                              <button
                                onClick={() => updateBulkSize(size, qty + 1)}
                                className="w-8 h-8 rounded-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white flex items-center justify-center transition-colors"
                                data-testid={`qty-plus-${size}`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {hasBackPrint && (
                        <div className="border-t pt-6">
                          <Label className="text-sm font-medium text-gray-700 mb-3 block">Back Names</Label>
                          <div className="flex gap-3 mb-4">
                            <button
                              onClick={() => setUseSingleBackName(true)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                useSingleBackName ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Same for all
                            </button>
                            <button
                              onClick={() => setUseSingleBackName(false)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                !useSingleBackName ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Different names
                            </button>
                          </div>
                          {useSingleBackName ? (
                            <Input
                              value={singleBackName}
                              onChange={(e) => setSingleBackName(e.target.value)}
                              placeholder="Enter name for all shirts..."
                            />
                          ) : (
                            <div>
                              <Textarea
                                value={bulkBackNames.join('\n')}
                                onChange={(e) => setBulkBackNames(e.target.value.split('\n').filter(n => n.trim()))}
                                placeholder={`One name per line (${getTotalQuantity()} needed)...`}
                                rows={5}
                              />
                              <p className="text-sm text-gray-500 mt-2">
                                {bulkBackNames.length} / {getTotalQuantity()} names entered
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order total */}
                      <div className="bg-[#252A34] text-white rounded-xl p-6">
                        <div className="flex justify-between items-center mb-2">
                          <span>Quantity</span>
                          <span className="font-bold">{getTotalQuantity()} shirts</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Base price</span>
                          <span>£{pricing.base_price?.toFixed(2)} each</span>
                        </div>
                        {hasBackPrint && (
                          <div className="flex justify-between items-center mb-2">
                            <span>Back print</span>
                            <span>+£{pricing.back_print_price?.toFixed(2)} each</span>
                          </div>
                        )}
                        <div className="border-t border-white/20 mt-4 pt-4 flex justify-between items-center">
                          <span className="text-xl font-bold">Total</span>
                          <span className="text-2xl font-bold text-[#F9ED69]">
                            £{calculateBulkTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleAddBulkToCart}
                        disabled={getTotalQuantity() === 0}
                        className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider"
                        data-testid="add-bulk-to-cart-btn"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                          Select Size for This Person
                        </Label>
                        <div className="flex gap-2 flex-wrap">
                          {['S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                            <button
                              key={size}
                              onClick={() => setBackNumber(size)}
                              data-testid={`size-btn-${size}`}
                              className={`px-4 py-2 rounded-lg font-bold border-2 transition-colors ${
                                backNumber === size
                                  ? 'border-[#FF2E63] bg-[#FF2E63] text-white'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleAddPartyMember}
                        disabled={!selectedTemplate || !headCutout}
                        className="w-full bg-[#08D9D6] hover:bg-[#06B5B2] text-[#252A34] rounded-full py-4 font-bold uppercase tracking-wider"
                        data-testid="add-person-btn"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Person to Order
                      </Button>

                      {partyMembers.length > 0 && (
                        <div className="border-t pt-6">
                          <h4 className="font-bold text-gray-700 mb-4">
                            People in Order ({partyMembers.length})
                          </h4>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {partyMembers.map((member, idx) => (
                              <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                  {member.headUrl && (
                                    <img
                                      src={`${process.env.REACT_APP_BACKEND_URL}${member.headUrl}`}
                                      alt={`Person ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-700 truncate">
                                    {member.backName || `Person ${idx + 1}`}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {member.templateName} • Size {member.size || 'M'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removePartyMember(member.id)}
                                  className="text-red-400 hover:text-red-600 p-2 transition-colors"
                                  data-testid={`remove-person-${idx}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {partyMembers.length > 0 && (
                        <Button
                          onClick={handleAddPartyToCart}
                          className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider"
                          data-testid="add-party-to-cart-btn"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Add All to Cart (£{(partyMembers.length * pricing.base_price).toFixed(2)})
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 rounded-full py-6"
                  data-testid="prev-step-btn"
                >
                  Back
                </Button>
              )}
              {step < 4 && (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex-1 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 font-bold uppercase tracking-wider disabled:opacity-50"
                  data-testid="next-step-btn"
                >
                  Next Step
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
