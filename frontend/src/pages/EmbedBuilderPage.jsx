import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Canvas dimensions
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

// Head component for the canvas
const HeadImage = ({ imageUrl, placement, isSelected, onSelect, onChange }) => {
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
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Template image component
const TemplateImage = ({ imageUrl }) => {
  const [image] = useImage(imageUrl, 'anonymous');
  
  if (!image) return null;
  
  const scale = Math.min(CANVAS_WIDTH / image.width, CANVAS_HEIGHT / image.height) * 0.9;
  
  return (
    <KonvaImage
      image={image}
      x={CANVAS_WIDTH / 2}
      y={CANVAS_HEIGHT / 2}
      width={image.width * scale}
      height={image.height * scale}
      offsetX={(image.width * scale) / 2}
      offsetY={(image.height * scale) / 2}
    />
  );
};

export default function EmbedBuilderPage() {
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  // Get Shopify config from URL params
  const shopifyDomain = searchParams.get('shop') || '';
  const shopifyMode = searchParams.get('shopify') === 'true';
  
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
    partyMembers, addPartyMember, removePartyMember,
    pricing,
  } = useStore();

  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [headSelected, setHeadSelected] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        if (template.head_placement) {
          setHeadPlacement(template.head_placement);
        }
      }
    }
  }, [searchParams, templates, setSelectedTemplate, setHeadPlacement]);

  useEffect(() => {
    if (templates.length === 0) {
      fetchTemplates();
    }
  }, [templates.length, fetchTemplates]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
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

      if (data.quality_warning) {
        toast.warning(data.quality_warning);
      }

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

  const calculateBulkTotal = () => {
    const totalQty = Object.values(bulkSizes).reduce((sum, qty) => sum + qty, 0);
    const baseTotal = totalQty * pricing.base_price;
    const backTotal = hasBackPrint ? totalQty * pricing.back_print_price : 0;
    return baseTotal + backTotal;
  };

  const getTotalQuantity = () => {
    return Object.values(bulkSizes).reduce((sum, qty) => sum + qty, 0);
  };

  // Add to Shopify cart via postMessage to parent window
  const addToShopifyCart = async () => {
    const totalQty = getTotalQuantity();
    if (totalQty === 0) {
      toast.error('Please select at least one size');
      return;
    }

    setIsAddingToCart(true);

    // Build cart data
    const cartData = {
      type: 'ADD_TO_SHOPIFY_CART',
      items: [],
      designInfo: {
        templateId: selectedTemplate?.id,
        templateName: selectedTemplate?.name,
        titleText,
        subtitleText,
        hasBackPrint,
        backName: hasBackPrint ? (useSingleBackName ? singleBackName : '') : '',
        headCutoutId: headCutout?.id,
        originalPhotoId: originalPhoto?.id,
      }
    };

    Object.entries(bulkSizes).forEach(([size, qty]) => {
      if (qty > 0) {
        cartData.items.push({
          size,
          quantity: qty,
          properties: {
            'Template': selectedTemplate?.name || 'Custom',
            'Title Text': titleText,
            'Subtitle Text': subtitleText,
            'Back Print': hasBackPrint ? 'Yes' : 'No',
            'Back Name': hasBackPrint ? (useSingleBackName ? singleBackName : 'See order') : '',
            '_design_id': `${Date.now()}`,
            '_head_cutout_id': headCutout?.id || '',
          }
        });
      }
    });

    // Send message to parent Shopify window
    if (window.parent !== window) {
      window.parent.postMessage(cartData, '*');
    }

    // Also try direct Shopify cart API if we have the domain
    if (shopifyDomain) {
      try {
        for (const item of cartData.items) {
          // This would need the actual variant IDs from Shopify
          // For now, show success and let the parent handle it
        }
      } catch (error) {
        console.error('Shopify cart error:', error);
      }
    }

    toast.success(`${totalQty} items ready! Complete checkout in your store.`);
    setIsAddingToCart(false);
  };

  const handleAddPartyMember = () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    addPartyMember({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      headCutoutId: headCutout?.id,
      titleText,
      subtitleText,
      hasBackPrint,
      backName,
      backNumber,
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

  const canProceed = () => {
    switch (step) {
      case 1: return selectedTemplate !== null;
      case 2: return headCutout !== null || !gdprConsent;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Mode selector */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={() => setBuilderMode('bulk')}
            data-testid="embed-mode-bulk"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
              builderMode === 'bulk'
                ? 'bg-[#FF2E63] text-white shadow-lg shadow-[#FF2E63]/30'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Shirt className="w-4 h-4" />
            Bulk Order (Same Design)
          </button>
          <button
            onClick={() => setBuilderMode('multi')}
            data-testid="embed-mode-multi"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
              builderMode === 'multi'
                ? 'bg-[#FF2E63] text-white shadow-lg shadow-[#FF2E63]/30'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Multi-Design (Per Person)
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Template', 'Photo', 'Text', 'Sizes'].map((label, idx) => (
            <div key={label} className="flex items-center">
              <button
                onClick={() => setStep(idx + 1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  step === idx + 1 
                    ? 'bg-[#FF2E63] text-white' 
                    : step > idx + 1 
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {step > idx + 1 ? '✓' : idx + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {idx < 3 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Canvas Preview */}
          <div className="order-2 lg:order-1">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-800 mb-4 text-center">Preview</h3>
              <div 
                className="bg-white rounded-xl overflow-hidden mx-auto shadow-inner"
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: 'repeating-conic-gradient(#f0f0f0 0% 25%, white 0% 50%) 50% / 20px 20px' }}
              >
                <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
                  <Layer>
                    {selectedTemplate && (
                      <TemplateImage imageUrl={selectedTemplate.body_image_url} />
                    )}
                    {headCutout && (
                      <HeadImage
                        imageUrl={`${process.env.REACT_APP_BACKEND_URL}${headCutout.head_url}`}
                        placement={headPlacement}
                        isSelected={headSelected}
                        onSelect={() => setHeadSelected(true)}
                        onChange={(newPlacement) => setHeadPlacement(newPlacement)}
                      />
                    )}
                    {titleText && (
                      <Text
                        text={titleText.toUpperCase()}
                        x={CANVAS_WIDTH / 2}
                        y={CANVAS_HEIGHT - 80}
                        fontSize={24}
                        fontFamily="Arial Black"
                        fill="#FFFFFF"
                        stroke="#000000"
                        strokeWidth={1}
                        align="center"
                        offsetX={titleText.length * 6}
                      />
                    )}
                    {subtitleText && (
                      <Text
                        text={subtitleText.toUpperCase()}
                        x={CANVAS_WIDTH / 2}
                        y={CANVAS_HEIGHT - 50}
                        fontSize={16}
                        fontFamily="Arial Black"
                        fill="#FFFFFF"
                        stroke="#000000"
                        strokeWidth={0.5}
                        align="center"
                        offsetX={subtitleText.length * 4}
                      />
                    )}
                  </Layer>
                </Stage>
              </div>

              {headCutout && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500 mb-1 block">Scale</Label>
                      <div className="flex items-center gap-2">
                        <ZoomOut className="w-3 h-3 text-gray-400" />
                        <Slider
                          value={[headPlacement.scale]}
                          min={0.1}
                          max={2}
                          step={0.1}
                          onValueChange={([val]) => setHeadPlacement({ scale: val })}
                          className="flex-1"
                        />
                        <ZoomIn className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500 mb-1 block">Rotate</Label>
                      <div className="flex items-center gap-2">
                        <RotateCw className="w-3 h-3 text-gray-400" />
                        <Slider
                          value={[headPlacement.rotation]}
                          min={-180}
                          max={180}
                          step={5}
                          onValueChange={([val]) => setHeadPlacement({ rotation: val })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    <Move className="w-3 h-3 inline mr-1" />
                    Drag the head to reposition
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
                  className="bg-gray-50 rounded-2xl p-6"
                >
                  <h3 className="font-bold text-gray-800 mb-4">1. Choose a Template</h3>
                  <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          if (template.head_placement) {
                            setHeadPlacement(template.head_placement);
                          }
                        }}
                        className={`p-2 rounded-xl border-2 transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-[#FF2E63] bg-[#FF2E63]/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-1">
                          <img 
                            src={template.body_image_url}
                            alt={template.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs font-medium text-gray-700 truncate">{template.name}</p>
                      </button>
                    ))}
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
                  className="bg-gray-50 rounded-2xl p-6"
                >
                  <h3 className="font-bold text-gray-800 mb-4">2. Upload a Photo</h3>
                  
                  <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={gdprConsent}
                        onCheckedChange={setGdprConsent}
                      />
                      <span className="text-xs text-gray-600">
                        I consent to my photo being used for order fulfilment only.
                      </span>
                    </label>
                  </div>

                  {!gdprConsent ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Please accept to upload a photo</p>
                    </div>
                  ) : headCutout ? (
                    <div className="text-center py-4">
                      <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100 border-3 border-green-500">
                        <img 
                          src={`${process.env.REACT_APP_BACKEND_URL}${headCutout.head_url}`}
                          alt="Processed"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-green-600 font-medium text-sm flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Photo processed!
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHeadCutout(null);
                          setOriginalPhoto(null);
                        }}
                        className="mt-3"
                      >
                        Change Photo
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        isUploading || isProcessing 
                          ? 'border-[#FF2E63] bg-[#FF2E63]/5' 
                          : 'border-gray-300 hover:border-[#FF2E63] bg-white'
                      }`}
                      onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      {isUploading || isProcessing ? (
                        <div>
                          <Loader2 className="w-10 h-10 text-[#FF2E63] mx-auto mb-3 animate-spin" />
                          <p className="text-gray-600 text-sm">
                            {isUploading ? 'Uploading...' : 'Processing...'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium text-sm mb-1">Click to upload</p>
                          <p className="text-gray-400 text-xs">JPG, PNG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Customize Text */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-gray-50 rounded-2xl p-6"
                >
                  <h3 className="font-bold text-gray-800 mb-4">3. Add Your Text</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Main Title</Label>
                      <Input
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                        placeholder="e.g., DAVE'S STAG DO"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Subtitle</Label>
                      <Input
                        value={subtitleText}
                        onChange={(e) => setSubtitleText(e.target.value)}
                        placeholder="e.g., BENIDORM 2025"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={hasBackPrint}
                          onCheckedChange={setHasBackPrint}
                        />
                        <div>
                          <p className="font-medium text-gray-700 text-sm">Add name on the back</p>
                          <p className="text-xs text-gray-500">+£{pricing.back_print_price.toFixed(2)} per shirt</p>
                        </div>
                      </label>
                      
                      {hasBackPrint && builderMode === 'bulk' && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => setUseSingleBackName(true)}
                              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium ${
                                useSingleBackName 
                                  ? 'bg-[#FF2E63] text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Same for all
                            </button>
                            <button
                              onClick={() => setUseSingleBackName(false)}
                              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium ${
                                !useSingleBackName 
                                  ? 'bg-[#FF2E63] text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Different names
                            </button>
                          </div>
                          
                          {useSingleBackName ? (
                            <Input
                              value={singleBackName}
                              onChange={(e) => setSingleBackName(e.target.value)}
                              placeholder="Name for all shirts..."
                              className="text-sm"
                            />
                          ) : (
                            <Textarea
                              value={bulkBackNames.join('\n')}
                              onChange={(e) => setBulkBackNames(e.target.value.split('\n').filter(n => n.trim()))}
                              placeholder="One name per line..."
                              rows={4}
                              className="text-sm"
                            />
                          )}
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
                  className="bg-gray-50 rounded-2xl p-6"
                >
                  <h3 className="font-bold text-gray-800 mb-4">4. Select Sizes</h3>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {Object.entries(bulkSizes).map(([size, qty]) => (
                      <div key={size} className="bg-white rounded-xl p-3 text-center border border-gray-200">
                        <Label className="text-lg font-bold block mb-2">{size}</Label>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateBulkSize(size, qty - 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={qty}
                            onChange={(e) => updateBulkSize(size, parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-12 h-8 text-center border border-gray-200 rounded-lg text-sm font-medium"
                          />
                          <button
                            onClick={() => updateBulkSize(size, qty + 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#252A34] text-white rounded-xl p-4 mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Quantity</span>
                      <span className="font-bold">{getTotalQuantity()} shirts</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Price per shirt</span>
                      <span>£{(pricing.base_price + (hasBackPrint ? pricing.back_print_price : 0)).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/20 mt-3 pt-3 flex justify-between">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-xl font-bold text-[#F9ED69]">
                        £{calculateBulkTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={addToShopifyCart}
                    disabled={getTotalQuantity() === 0 || isAddingToCart}
                    className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider"
                  >
                    {isAddingToCart ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-5 h-5 mr-2" />
                    )}
                    Add to Cart
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 rounded-full"
                >
                  Back
                </Button>
              )}
              {step < 4 && (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex-1 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full font-bold"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
