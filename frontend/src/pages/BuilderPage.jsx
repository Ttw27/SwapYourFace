import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  
  // Scale to fit canvas
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

  // Load template from URL param
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

      if (data.quality_warning) {
        toast.warning(data.quality_warning);
      }

      // Process background removal
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

  // Calculate total for bulk mode
  const calculateBulkTotal = () => {
    const totalQty = Object.values(bulkSizes).reduce((sum, qty) => sum + qty, 0);
    const baseTotal = totalQty * pricing.base_price;
    const backTotal = hasBackPrint ? totalQty * pricing.back_print_price : 0;
    return baseTotal + backTotal;
  };

  // Get total quantity
  const getTotalQuantity = () => {
    return Object.values(bulkSizes).reduce((sum, qty) => sum + qty, 0);
  };

  // Add bulk order to cart
  const handleAddBulkToCart = () => {
    const totalQty = getTotalQuantity();
    if (totalQty === 0) {
      toast.error('Please select at least one size');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    if (hasBackPrint && !useSingleBackName && bulkBackNames.length !== totalQty) {
      toast.error(`Please enter exactly ${totalQty} back names (one per shirt)`);
      return;
    }

    // Create cart items for each size
    const items = [];
    Object.entries(bulkSizes).forEach(([size, qty]) => {
      if (qty > 0) {
        for (let i = 0; i < qty; i++) {
          items.push({
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            headCutoutId: headCutout?.id,
            titleText,
            subtitleText,
            hasBackPrint,
            backName: hasBackPrint 
              ? (useSingleBackName ? singleBackName : bulkBackNames[items.length] || '')
              : '',
            backNumber: '',
            size,
            quantity: 1,
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
    
    // Reset for next person
    setHeadCutout(null);
    setOriginalPhoto(null);
    setBackName('');
    setBackNumber('');
  };

  // Add all party members to cart
  const handleAddPartyToCart = () => {
    if (partyMembers.length === 0) {
      toast.error('Please add at least one person');
      return;
    }

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

  // Step navigation
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
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* Header */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide">
            PARTY BUILDER
          </h1>
          <p className="text-gray-600 mt-2">Create your custom party t-shirt design</p>
          
          {/* Mode selector */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setBuilderMode('bulk')}
              data-testid="mode-bulk"
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                builderMode === 'bulk'
                  ? 'bg-[#FF2E63] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Shirt className="w-5 h-5" />
              Bulk Order (Same Design)
            </button>
            <button
              onClick={() => setBuilderMode('multi')}
              data-testid="mode-multi"
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                builderMode === 'multi'
                  ? 'bg-[#FF2E63] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            {['Template', 'Photo', 'Customize', 'Sizes'].map((label, idx) => (
              <div key={label} className="flex items-center">
                <button
                  onClick={() => setStep(idx + 1)}
                  data-testid={`step-${idx + 1}`}
                  className={`flex items-center gap-2 ${
                    step === idx + 1 ? 'text-[#FF2E63]' : step > idx + 1 ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === idx + 1 
                      ? 'bg-[#FF2E63] text-white' 
                      : step > idx + 1 
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
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
            <div className="card-party p-6">
              <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">PREVIEW</h3>
              <div 
                className="canvas-container rounded-xl overflow-hidden mx-auto"
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                data-testid="design-canvas"
              >
                <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
                  <Layer>
                    {/* Template image */}
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
                    
                    {/* Title text */}
                    {titleText && (
                      <Text
                        text={titleText.toUpperCase()}
                        x={CANVAS_WIDTH / 2}
                        y={CANVAS_HEIGHT - 80}
                        fontSize={24}
                        fontFamily="Anton"
                        fill={selectedTemplate?.text_fields?.title?.color || '#FFFFFF'}
                        stroke={selectedTemplate?.text_fields?.title?.outline || '#000000'}
                        strokeWidth={1}
                        align="center"
                        offsetX={titleText.length * 6}
                      />
                    )}
                    
                    {/* Subtitle text */}
                    {subtitleText && (
                      <Text
                        text={subtitleText.toUpperCase()}
                        x={CANVAS_WIDTH / 2}
                        y={CANVAS_HEIGHT - 50}
                        fontSize={16}
                        fontFamily="Anton"
                        fill={selectedTemplate?.text_fields?.subtitle?.color || '#FFFFFF'}
                        stroke={selectedTemplate?.text_fields?.subtitle?.outline || '#000000'}
                        strokeWidth={0.5}
                        align="center"
                        offsetX={subtitleText.length * 4}
                      />
                    )}
                  </Layer>
                </Stage>
              </div>

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
                          min={0.1}
                          max={2}
                          step={0.1}
                          onValueChange={([val]) => setHeadPlacement({ scale: val })}
                          data-testid="scale-slider"
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
                          min={-180}
                          max={180}
                          step={5}
                          onValueChange={([val]) => setHeadPlacement({ rotation: val })}
                          data-testid="rotation-slider"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    <Move className="w-4 h-4 inline mr-1" />
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
                  className="card-party p-6"
                >
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">
                    1. CHOOSE A TEMPLATE
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          if (template.head_placement) {
                            setHeadPlacement(template.head_placement);
                          }
                        }}
                        data-testid={`select-template-${template.id}`}
                        className={`p-2 rounded-xl border-2 transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-[#FF2E63] bg-[#FF2E63]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                          <img 
                            src={template.body_image_url}
                            alt={template.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">{template.name}</p>
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
                  className="card-party p-6"
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
                        />
                      </div>
                      <p className="text-green-600 font-medium flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Photo processed!
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setHeadCutout(null);
                          setOriginalPhoto(null);
                        }}
                        className="mt-4"
                        data-testid="change-photo-btn"
                      >
                        Change Photo
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`upload-dropzone ${isUploading || isProcessing ? 'active' : ''}`}
                      onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
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
                          <p className="text-gray-600">
                            {isUploading ? 'Uploading...' : 'Removing background...'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium mb-2">Click to upload or drag & drop</p>
                          <p className="text-gray-400 text-sm">JPG, PNG or WebP up to 10MB</p>
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
                  className="card-party p-6"
                >
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">
                    3. ADD YOUR TEXT
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                        Main Title (e.g., "DAVE'S STAG DO")
                      </Label>
                      <Input
                        id="title"
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                        placeholder="Enter main text..."
                        className="mt-1"
                        data-testid="title-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subtitle" className="text-sm font-medium text-gray-700">
                        Subtitle (e.g., "BENIDORM 2025")
                      </Label>
                      <Input
                        id="subtitle"
                        value={subtitleText}
                        onChange={(e) => setSubtitleText(e.target.value)}
                        placeholder="Enter subtitle..."
                        className="mt-1"
                        data-testid="subtitle-input"
                      />
                    </div>
                    
                    {/* Back print option */}
                    <div className="mt-6">
                      <div 
                        className="back-print-toggle"
                        onClick={() => setHasBackPrint(!hasBackPrint)}
                      >
                        <Checkbox
                          checked={hasBackPrint}
                          onCheckedChange={setHasBackPrint}
                          data-testid="back-print-checkbox"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-700">Add name on the back</p>
                          <p className="text-sm text-gray-500">+£{pricing.back_print_price.toFixed(2)} per shirt</p>
                        </div>
                      </div>
                      
                      {hasBackPrint && builderMode === 'multi' && (
                        <div className="mt-4 space-y-4 pl-8">
                          <div>
                            <Label htmlFor="backName" className="text-sm font-medium text-gray-700">
                              Back Name
                            </Label>
                            <Input
                              id="backName"
                              value={backName}
                              onChange={(e) => setBackName(e.target.value)}
                              placeholder="e.g., BEST MAN"
                              className="mt-1"
                              data-testid="back-name-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="backNumber" className="text-sm font-medium text-gray-700">
                              Back Number (optional)
                            </Label>
                            <Input
                              id="backNumber"
                              value={backNumber}
                              onChange={(e) => setBackNumber(e.target.value)}
                              placeholder="e.g., 69"
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
                  className="card-party p-6"
                >
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">
                    4. {builderMode === 'bulk' ? 'SELECT SIZES & QUANTITIES' : 'ADD TO ORDER'}
                  </h3>
                  
                  {builderMode === 'bulk' ? (
                    <div className="space-y-6">
                      {/* Size quantities */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Object.entries(bulkSizes).map(([size, qty]) => (
                          <div key={size} className="bg-gray-50 rounded-xl p-4">
                            <Label className="text-lg font-bold text-center block mb-3">{size}</Label>
                            <div className="qty-stepper justify-center">
                              <button
                                onClick={() => updateBulkSize(size, qty - 1)}
                                data-testid={`qty-minus-${size}`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => updateBulkSize(size, parseInt(e.target.value) || 0)}
                                min="0"
                                data-testid={`qty-input-${size}`}
                              />
                              <button
                                onClick={() => updateBulkSize(size, qty + 1)}
                                data-testid={`qty-plus-${size}`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Back names for bulk */}
                      {hasBackPrint && (
                        <div className="border-t pt-6">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Back Names
                          </Label>
                          <div className="flex gap-4 mb-4">
                            <button
                              onClick={() => setUseSingleBackName(true)}
                              data-testid="single-name-btn"
                              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                useSingleBackName 
                                  ? 'bg-[#FF2E63] text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Same name for all
                            </button>
                            <button
                              onClick={() => setUseSingleBackName(false)}
                              data-testid="multi-name-btn"
                              className={`px-4 py-2 rounded-lg text-sm font-medium ${
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
                              placeholder="Enter name for all shirts..."
                              data-testid="single-back-name-input"
                            />
                          ) : (
                            <div>
                              <Textarea
                                value={bulkBackNames.join('\n')}
                                onChange={(e) => setBulkBackNames(e.target.value.split('\n').filter(n => n.trim()))}
                                placeholder={`Enter one name per line (${getTotalQuantity()} names needed)...`}
                                rows={5}
                                data-testid="bulk-back-names-input"
                              />
                              <p className="text-sm text-gray-500 mt-2">
                                {bulkBackNames.length} / {getTotalQuantity()} names entered
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bulk total */}
                      <div className="bg-[#252A34] text-white rounded-xl p-6">
                        <div className="flex justify-between items-center mb-2">
                          <span>Quantity</span>
                          <span className="font-bold">{getTotalQuantity()} shirts</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Base price</span>
                          <span>£{pricing.base_price.toFixed(2)} each</span>
                        </div>
                        {hasBackPrint && (
                          <div className="flex justify-between items-center mb-2">
                            <span>Back print</span>
                            <span>+£{pricing.back_print_price.toFixed(2)} each</span>
                          </div>
                        )}
                        <div className="border-t border-white/20 mt-4 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold">Total</span>
                            <span className="text-2xl font-bold text-[#F9ED69]">
                              £{calculateBulkTotal().toFixed(2)}
                            </span>
                          </div>
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
                    /* Multi-design mode */
                    <div className="space-y-6">
                      {/* Current person size selection */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                          Select Size for This Person
                        </Label>
                        <div className="flex gap-2 flex-wrap">
                          {['S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                            <button
                              key={size}
                              onClick={() => setBackNumber(size)} // Using backNumber as temp size storage
                              data-testid={`size-btn-${size}`}
                              className={`size-btn ${backNumber === size ? 'active' : ''}`}
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

                      {/* Party members list */}
                      {partyMembers.length > 0 && (
                        <div className="border-t pt-6">
                          <h4 className="font-bold text-gray-700 mb-4">
                            People in Order ({partyMembers.length})
                          </h4>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {partyMembers.map((member, idx) => (
                              <div key={member.id} className="party-member-card flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
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
                                  className="text-red-500 hover:text-red-700 p-2"
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
                  className="flex-1 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 font-bold uppercase tracking-wider"
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
