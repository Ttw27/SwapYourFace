import { useState, useEffect, useRef } from 'react';
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
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const STROKE_WIDTH = 6;

const TEXT_COLORS = ['#FFFFFF','#000000','#FFE600','#FF2E63','#FF6B35','#00C9A7','#4169E1','#FF69B4'];
const STROKE_COLORS = ['#000000','#FFFFFF','#FF2E63','#FFE600','#1C1C1C','#FF6B35','#4169E1','#00C9A7'];

const ColorPicker = ({ label, colors, value, onChange }) => (
  <div className="mb-3">
    <Label className="text-xs text-gray-500 mb-1.5 block">{label}</Label>
    <div className="flex gap-2 flex-wrap">
      {colors.map(c => (
        <button key={c} onClick={() => onChange(c)}
          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
          style={{ background: c, borderColor: value === c ? '#FF2E63' : '#e0e0e0', transform: value === c ? 'scale(1.15)' : 'scale(1)', boxShadow: value === c ? '0 0 0 2px #FF2E63' : 'none' }}
        />
      ))}
    </div>
  </div>
);

const DraggableText = ({ text, x, y, fontSize, fill, stroke, strokeWidth, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  if (!text) return null;
  return (
    <>
      <Text
        ref={shapeRef}
        text={text.toUpperCase()}
        x={x}
        y={y}
        fontSize={fontSize}
        fontFamily="Anton, Impact, sans-serif"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        align="center"
        width={CANVAS_WIDTH}
        offsetX={CANVAS_WIDTH / 2}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          onChange({ x: node.x(), y: node.y(), fontSize: Math.round(fontSize * node.scaleX()) });
          node.scaleX(1); node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer ref={trRef}
          enabledAnchors={['middle-left','middle-right']}
          boundBoxFunc={(oldBox, newBox) => newBox.width < 50 ? oldBox : newBox}
        />
      )}
    </>
  );
};

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
        onDragEnd={(e) => onChange({ x: e.target.x() / CANVAS_WIDTH, y: e.target.y() / CANVAS_HEIGHT })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          onChange({ scale: placement.scale * node.scaleX(), rotation: node.rotation() });
          node.scaleX(1); node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20) ? oldBox : newBox} />
      )}
    </>
  );
};

const TemplateImage = ({ imageUrl }) => {
  const [image] = useImage(imageUrl, 'anonymous');
  if (!image) return null;
  const scale = Math.min(CANVAS_WIDTH / image.width, CANVAS_HEIGHT / image.height) * 0.95;
  return (
    <KonvaImage
      image={image}
      x={CANVAS_WIDTH / 2} y={CANVAS_HEIGHT / 2}
      width={image.width * scale} height={image.height * scale}
      offsetX={(image.width * scale) / 2} offsetY={(image.height * scale) / 2}
      listening={false}
    />
  );
};

const CategoryTabs = ({ active, onChange }) => (
  <div className="flex gap-2 flex-wrap mb-4">
    {[{key:'all',label:'All'},{key:'stag',label:'Stag'},{key:'hen',label:'Hen'},{key:'party',label:'Party'}].map(tab => (
      <button key={tab.key} onClick={() => onChange(tab.key)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${active === tab.key ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
        {tab.label}
      </button>
    ))}
  </div>
);

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
    partyMembers, addPartyMember, removePartyMember,
    addMultipleToCart,
    pricing,
  } = useStore();

  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [titleStroke, setTitleStroke] = useState('#000000');
  const [titleFontSize, setTitleFontSize] = useState(32);
  const [titlePos, setTitlePos] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 90 });

  const [subtitleColor, setSubtitleColor] = useState('#FFE600');
  const [subtitleStroke, setSubtitleStroke] = useState('#000000');
  const [subtitleFontSize, setSubtitleFontSize] = useState(20);
  const [subtitlePos, setSubtitlePos] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 });

  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) { setSelectedTemplate(template); if (template.head_placement) setHeadPlacement(template.head_placement); }
    }
  }, [searchParams, templates, setSelectedTemplate, setHeadPlacement]);

  useEffect(() => { if (templates.length === 0) fetchTemplates(); }, [templates.length, fetchTemplates]);

  useEffect(() => {
    if (selectedTemplate?.text_fields) {
      const tf = selectedTemplate.text_fields;
      if (tf.title?.color) setTitleColor(tf.title.color);
      if (tf.title?.outline) setTitleStroke(tf.title.outline);
      if (tf.subtitle?.color) setSubtitleColor(tf.subtitle.color);
      if (tf.subtitle?.outline) setSubtitleStroke(tf.subtitle.outline);
    }
  }, [selectedTemplate]);

  const filteredTemplates = templates.filter(t => {
    if (categoryFilter === 'all') return true;
    return (t.categories || [t.category]).includes(categoryFilter);
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Maximum 10MB'); return; }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API}/upload/photo`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setOriginalPhoto(data);
      if (data.quality_warning) toast.warning(data.quality_warning);
      setIsProcessing(true);
      const bgFormData = new FormData();
      bgFormData.append('file_id', data.id);
      const bgResponse = await fetch(`${API}/upload/remove-background`, { method: 'POST', body: bgFormData });
      if (!bgResponse.ok) throw new Error('Background removal failed');
      const bgData = await bgResponse.json();
      setHeadCutout(bgData);
      toast.success('Photo processed!');
    } catch (error) {
      toast.error('Failed to process photo. Please try again.');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const calculateBulkTotal = () => {
    const totalQty = Object.values(bulkSizes).reduce((sum, qty) => sum + qty, 0);
    return totalQty * pricing.base_price + (hasBackPrint ? totalQty * pricing.back_print_price : 0);
  };
  const getTotalQuantity = () => Object.values(bulkSizes).reduce((sum, qty) => sum + qty, 0);

  const handleAddBulkToCart = () => {
    const totalQty = getTotalQuantity();
    if (totalQty === 0) { toast.error('Please select at least one size'); return; }
    if (!selectedTemplate) { toast.error('Please select a template'); return; }
    const items = [];
    Object.entries(bulkSizes).forEach(([size, qty]) => {
      if (qty > 0) for (let i = 0; i < qty; i++) items.push({
        templateId: selectedTemplate.id, templateName: selectedTemplate.name,
        headCutoutId: headCutout?.id, titleText, subtitleText, hasBackPrint,
        backName: hasBackPrint ? (useSingleBackName ? singleBackName : bulkBackNames[items.length] || '') : '',
        backNumber: '', size, quantity: 1, headPlacement,
        originalPhotoUrl: originalPhoto?.original_url, headUrl: headCutout?.head_url,
        price: pricing.base_price, backPrice: hasBackPrint ? pricing.back_print_price : 0,
      });
    });
    addMultipleToCart(items);
    toast.success(`Added ${totalQty} items to cart!`);
    navigate('/cart');
  };

  const handleAddPartyMember = () => {
    if (!selectedTemplate) { toast.error('Please select a template first'); return; }
    addPartyMember({ templateId: selectedTemplate.id, templateName: selectedTemplate.name, headCutoutId: headCutout?.id, titleText, subtitleText, hasBackPrint, backName, backNumber, size: 'M', headPlacement: { ...headPlacement }, originalPhotoUrl: originalPhoto?.original_url, headUrl: headCutout?.head_url });
    toast.success('Person added!');
    setHeadCutout(null); setOriginalPhoto(null); setBackName(''); setBackNumber('');
  };

  const handleAddPartyToCart = () => {
    if (partyMembers.length === 0) { toast.error('Please add at least one person'); return; }
    addMultipleToCart(partyMembers.map(m => ({ ...m, quantity: 1, price: pricing.base_price, backPrice: m.hasBackPrint ? pricing.back_print_price : 0 })));
    toast.success(`Added ${partyMembers.length} items to cart!`);
    navigate('/cart');
  };

  const canProceed = () => {
    if (step === 1) return selectedTemplate !== null;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide">PARTY BUILDER</h1>
          <p className="text-gray-600 mt-2">Create your custom party t-shirt design</p>
          <div className="flex gap-4 mt-6 flex-wrap">
            <button onClick={() => setBuilderMode('bulk')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${builderMode === 'bulk' ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Shirt className="w-5 h-5" /> Bulk Order (Same Design)</button>
            <button onClick={() => setBuilderMode('multi')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${builderMode === 'multi' ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Users className="w-5 h-5" /> Multi-Design (Different Per Person)</button>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {['Template','Photo','Customise','Sizes'].map((label, idx) => (
              <div key={label} className="flex items-center">
                <button onClick={() => idx + 1 < step && setStep(idx + 1)} className={`flex items-center gap-2 ${step === idx + 1 ? 'text-[#FF2E63]' : step > idx + 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === idx + 1 ? 'bg-[#FF2E63] text-white' : step > idx + 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Canvas */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">PREVIEW</h3>
                <span className="text-xs text-gray-400 font-medium">CLICK TEXT OR FACE TO SELECT</span>
              </div>

              <div className="rounded-xl overflow-hidden mx-auto border border-gray-100" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: '#f9f9f9' }}>
                <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={(e) => { if (e.target === e.target.getStage()) setSelectedElement(null); }} onTap={(e) => { if (e.target === e.target.getStage()) setSelectedElement(null); }}>
                  <Layer>
                    {selectedTemplate && <TemplateImage imageUrl={selectedTemplate.body_image_url} />}
                    {headCutout && <HeadImage imageUrl={`${process.env.REACT_APP_BACKEND_URL}${headCutout.head_url}`} placement={headPlacement} isSelected={selectedElement === 'head'} onSelect={() => setSelectedElement('head')} onChange={(p) => setHeadPlacement(p)} />}
                    {titleText && <DraggableText text={titleText} x={titlePos.x} y={titlePos.y} fontSize={titleFontSize} fill={titleColor} stroke={titleStroke} strokeWidth={STROKE_WIDTH} isSelected={selectedElement === 'title'} onSelect={() => setSelectedElement('title')} onChange={(u) => { if (u.x !== undefined) setTitlePos({x:u.x,y:u.y}); if (u.fontSize) setTitleFontSize(u.fontSize); }} />}
                    {subtitleText && <DraggableText text={subtitleText} x={subtitlePos.x} y={subtitlePos.y} fontSize={subtitleFontSize} fill={subtitleColor} stroke={subtitleStroke} strokeWidth={Math.round(STROKE_WIDTH * 0.7)} isSelected={selectedElement === 'subtitle'} onSelect={() => setSelectedElement('subtitle')} onChange={(u) => { if (u.x !== undefined) setSubtitlePos({x:u.x,y:u.y}); if (u.fontSize) setSubtitleFontSize(u.fontSize); }} />}
                  </Layer>
                </Stage>
              </div>

              {/* Quality banner */}
              <div className="mt-4 p-3 bg-[#FFF9E6] border border-[#FFE600] rounded-lg flex gap-3 items-start">
                <div className="w-6 h-6 bg-[#FFE600] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
                <div>
                  <p className="text-xs font-bold text-[#1C1C1C] tracking-wide">DO NOT WORRY IF IT IS NOT PERFECT</p>
                  <p className="text-xs text-gray-600 mt-0.5">Every order is reviewed before printing. We will adjust placement and contact you if we need a better photo.</p>
                </div>
              </div>

              {/* Head controls when selected */}
              {selectedElement === 'head' && headCutout && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-gray-500 tracking-wide">HEAD CONTROLS</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500 mb-1 block">Scale</Label>
                      <div className="flex items-center gap-2"><ZoomOut className="w-4 h-4 text-gray-400" /><Slider value={[headPlacement.scale]} min={0.1} max={2} step={0.05} onValueChange={([val]) => setHeadPlacement({ scale: val })} className="flex-1" /><ZoomIn className="w-4 h-4 text-gray-400" /></div>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500 mb-1 block">Rotation</Label>
                      <div className="flex items-center gap-2"><RotateCw className="w-4 h-4 text-gray-400" /><Slider value={[headPlacement.rotation]} min={-180} max={180} step={5} onValueChange={([val]) => setHeadPlacement({ rotation: val })} className="flex-1" /></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center"><Move className="w-3 h-3 inline mr-1" />Drag the face to reposition</p>
                </div>
              )}

              {/* Title controls when selected */}
              {selectedElement === 'title' && titleText && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-gray-500 tracking-wide">TITLE CONTROLS</p>
                  <div><Label className="text-xs text-gray-500 mb-1 block">Size ({titleFontSize}px)</Label><Slider value={[titleFontSize]} min={16} max={60} step={2} onValueChange={([val]) => setTitleFontSize(val)} /></div>
                  <ColorPicker label="Text colour" colors={TEXT_COLORS} value={titleColor} onChange={setTitleColor} />
                  <ColorPicker label="Stroke colour" colors={STROKE_COLORS} value={titleStroke} onChange={setTitleStroke} />
                  <p className="text-xs text-gray-400 text-center">Drag text on canvas to reposition</p>
                </div>
              )}

              {/* Subtitle controls when selected */}
              {selectedElement === 'subtitle' && subtitleText && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-gray-500 tracking-wide">SUBTITLE CONTROLS</p>
                  <div><Label className="text-xs text-gray-500 mb-1 block">Size ({subtitleFontSize}px)</Label><Slider value={[subtitleFontSize]} min={12} max={40} step={2} onValueChange={([val]) => setSubtitleFontSize(val)} /></div>
                  <ColorPicker label="Text colour" colors={TEXT_COLORS} value={subtitleColor} onChange={setSubtitleColor} />
                  <ColorPicker label="Stroke colour" colors={STROKE_COLORS} value={subtitleStroke} onChange={setSubtitleStroke} />
                  <p className="text-xs text-gray-400 text-center">Drag text on canvas to reposition</p>
                </div>
              )}

              {!selectedElement && (titleText || subtitleText || headCutout) && (
                <p className="text-center text-xs text-gray-400 mt-3"><Move className="w-3 h-3 inline mr-1" />Click text or face on canvas to select and edit</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="order-1 lg:order-2 space-y-6">
            <AnimatePresence mode="wait">

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-2 tracking-wide">1. CHOOSE A TEMPLATE</h3>
                  <CategoryTabs active={categoryFilter} onChange={setCategoryFilter} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                    {filteredTemplates.map(template => (
                      <button key={template.id} onClick={() => { setSelectedTemplate(template); if (template.head_placement) setHeadPlacement(template.head_placement); }}
                        className={`p-2 rounded-xl border-2 transition-all text-left ${selectedTemplate?.id === template.id ? 'border-[#FF2E63] bg-[#FF2E63]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                          <img src={template.product_image_url || template.body_image_url} alt={template.name} className="w-full h-full object-contain" crossOrigin="anonymous" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">{template.name}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {(template.categories || [template.category]).map(cat => (
                            <span key={cat} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full capitalize">{cat}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                    {filteredTemplates.length === 0 && <div className="col-span-3 text-center py-8 text-gray-400">No templates in this category yet</div>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">2. UPLOAD A PHOTO</h3>
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Checkbox id="gdpr" checked={gdprConsent} onCheckedChange={setGdprConsent} />
                      <label htmlFor="gdpr" className="text-sm text-gray-600 cursor-pointer">I consent to my photo being used for order fulfilment only. Your photo will be securely stored and used solely to create your custom t-shirt design.</label>
                    </div>
                  </div>
                  {!gdprConsent ? (
                    <div className="text-center py-8"><AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" /><p className="text-gray-600">Please accept the consent above to upload a photo</p></div>
                  ) : headCutout ? (
                    <div className="text-center py-4">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 border-4 border-green-500">
                        <img src={`${process.env.REACT_APP_BACKEND_URL}${headCutout.head_url}`} alt="Processed" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      </div>
                      <p className="text-green-600 font-medium flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Photo processed!</p>
                      <Button variant="outline" onClick={() => { setHeadCutout(null); setOriginalPhoto(null); }} className="mt-4">Change Photo</Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isUploading || isProcessing ? 'border-[#FF2E63] bg-[#FF2E63]/5' : 'border-gray-300 hover:border-[#FF2E63] hover:bg-[#FF2E63]/5'}`}
                      onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if(f) handleFileUpload({target:{files:[f]}}); }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      {isUploading || isProcessing ? (
                        <div><Loader2 className="w-12 h-12 text-[#FF2E63] mx-auto mb-4 animate-spin" /><p className="text-gray-600 font-medium">{isUploading ? 'Uploading...' : 'Removing background...'}</p><p className="text-gray-400 text-sm mt-1">This takes a few seconds</p></div>
                      ) : (
                        <div><Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-700 font-medium mb-1">Click to upload or drag and drop</p><p className="text-gray-400 text-sm">JPG, PNG or WebP up to 10MB</p><p className="text-gray-400 text-xs mt-2">Best results: clear face photo, good lighting</p></div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-1 tracking-wide">3. ADD YOUR TEXT</h3>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1"><Type className="w-4 h-4" /> Type then click text on canvas to move and style it</p>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Main Title</Label>
                      <Input value={titleText} onChange={(e) => setTitleText(e.target.value)} placeholder="e.g. DAVES STAG DO" className="mt-1 font-medium" />
                      {titleText && <button onClick={() => setSelectedElement('title')} className="mt-1 text-xs text-[#FF2E63] font-medium">Click to edit colour and size on canvas</button>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Subtitle</Label>
                      <Input value={subtitleText} onChange={(e) => setSubtitleText(e.target.value)} placeholder="e.g. BENIDORM 2025" className="mt-1" />
                      {subtitleText && <button onClick={() => setSelectedElement('subtitle')} className="mt-1 text-xs text-[#FF2E63] font-medium">Click to edit colour and size on canvas</button>}
                    </div>

                    {titleText && (
                      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-gray-500 tracking-wide">TITLE STYLING</p>
                        <ColorPicker label="Text colour" colors={TEXT_COLORS} value={titleColor} onChange={setTitleColor} />
                        <ColorPicker label="Stroke colour" colors={STROKE_COLORS} value={titleStroke} onChange={setTitleStroke} />
                        <div><Label className="text-xs text-gray-500 mb-1 block">Font size ({titleFontSize}px)</Label><Slider value={[titleFontSize]} min={16} max={60} step={2} onValueChange={([val]) => setTitleFontSize(val)} /></div>
                      </div>
                    )}

                    {subtitleText && (
                      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-gray-500 tracking-wide">SUBTITLE STYLING</p>
                        <ColorPicker label="Text colour" colors={TEXT_COLORS} value={subtitleColor} onChange={setSubtitleColor} />
                        <ColorPicker label="Stroke colour" colors={STROKE_COLORS} value={subtitleStroke} onChange={setSubtitleStroke} />
                        <div><Label className="text-xs text-gray-500 mb-1 block">Font size ({subtitleFontSize}px)</Label><Slider value={[subtitleFontSize]} min={12} max={40} step={2} onValueChange={([val]) => setSubtitleFontSize(val)} /></div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50" onClick={() => setHasBackPrint(!hasBackPrint)}>
                        <Checkbox checked={hasBackPrint} onCheckedChange={setHasBackPrint} />
                        <div className="flex-1"><p className="font-medium text-gray-700">Add name on the back</p><p className="text-sm text-gray-500">+£{pricing.back_print_price?.toFixed(2)} per shirt</p></div>
                      </div>
                      {hasBackPrint && builderMode === 'multi' && (
                        <div className="mt-4 space-y-4 pl-8">
                          <div><Label>Back Name</Label><Input value={backName} onChange={(e) => setBackName(e.target.value)} placeholder="e.g. BEST MAN" className="mt-1" /></div>
                          <div><Label>Back Number (optional)</Label><Input value={backNumber} onChange={(e) => setBackNumber(e.target.value)} placeholder="e.g. 69" className="mt-1" /></div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">4. {builderMode === 'bulk' ? 'SELECT SIZES & QUANTITIES' : 'ADD TO ORDER'}</h3>
                  {builderMode === 'bulk' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Object.entries(bulkSizes).map(([size, qty]) => (
                          <div key={size} className="bg-gray-50 rounded-xl p-4">
                            <Label className="text-lg font-bold text-center block mb-3">{size}</Label>
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => updateBulkSize(size, qty - 1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"><Minus className="w-3 h-3" /></button>
                              <span className="w-8 text-center font-bold text-lg">{qty}</span>
                              <button onClick={() => updateBulkSize(size, qty + 1)} className="w-8 h-8 rounded-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white flex items-center justify-center transition-colors"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {hasBackPrint && (
                        <div className="border-t pt-6">
                          <Label className="text-sm font-medium text-gray-700 mb-3 block">Back Names</Label>
                          <div className="flex gap-3 mb-4">
                            <button onClick={() => setUseSingleBackName(true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${useSingleBackName ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600'}`}>Same for all</button>
                            <button onClick={() => setUseSingleBackName(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!useSingleBackName ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600'}`}>Different names</button>
                          </div>
                          {useSingleBackName ? <Input value={singleBackName} onChange={(e) => setSingleBackName(e.target.value)} placeholder="Enter name for all shirts..." /> : (
                            <div>
                              <Textarea value={bulkBackNames.join('\n')} onChange={(e) => setBulkBackNames(e.target.value.split('\n').filter(n => n.trim()))} placeholder={`One name per line (${getTotalQuantity()} needed)...`} rows={5} />
                              <p className="text-sm text-gray-500 mt-2">{bulkBackNames.length} / {getTotalQuantity()} names</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="bg-[#252A34] text-white rounded-xl p-6">
                        <div className="flex justify-between items-center mb-2"><span>Quantity</span><span className="font-bold">{getTotalQuantity()} shirts</span></div>
                        <div className="flex justify-between items-center mb-2"><span>Base price</span><span>£{pricing.base_price?.toFixed(2)} each</span></div>
                        {hasBackPrint && <div className="flex justify-between items-center mb-2"><span>Back print</span><span>+£{pricing.back_print_price?.toFixed(2)} each</span></div>}
                        <div className="border-t border-white/20 mt-4 pt-4 flex justify-between items-center"><span className="text-xl font-bold">Total</span><span className="text-2xl font-bold text-[#F9ED69]">£{calculateBulkTotal().toFixed(2)}</span></div>
                      </div>
                      <Button onClick={handleAddBulkToCart} disabled={getTotalQuantity() === 0} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider"><ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Size for This Person</Label>
                        <div className="flex gap-2 flex-wrap">
                          {['S','M','L','XL','2XL','3XL'].map(size => <button key={size} onClick={() => setBackNumber(size)} className={`px-4 py-2 rounded-lg font-bold border-2 transition-colors ${backNumber === size ? 'border-[#FF2E63] bg-[#FF2E63] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{size}</button>)}
                        </div>
                      </div>
                      <Button onClick={handleAddPartyMember} disabled={!selectedTemplate || !headCutout} className="w-full bg-[#08D9D6] hover:bg-[#06B5B2] text-[#252A34] rounded-full py-4 font-bold uppercase tracking-wider"><Plus className="w-5 h-5 mr-2" /> Add Person to Order</Button>
                      {partyMembers.length > 0 && (
                        <>
                          <div className="border-t pt-6">
                            <h4 className="font-bold text-gray-700 mb-4">People in Order ({partyMembers.length})</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {partyMembers.map((member, idx) => (
                                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">{member.headUrl && <img src={`${process.env.REACT_APP_BACKEND_URL}${member.headUrl}`} alt={`Person ${idx+1}`} className="w-full h-full object-cover" />}</div>
                                  <div className="flex-1 min-w-0"><p className="font-medium text-gray-700 truncate">{member.backName || `Person ${idx+1}`}</p><p className="text-sm text-gray-500">{member.templateName} • Size {member.size || 'M'}</p></div>
                                  <button onClick={() => removePartyMember(member.id)} className="text-red-400 hover:text-red-600 p-2 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button onClick={handleAddPartyToCart} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider"><ShoppingCart className="w-5 h-5 mr-2" /> Add All to Cart (£{(partyMembers.length * pricing.base_price).toFixed(2)})</Button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 rounded-full py-6">Back</Button>}
              {step < 4 && <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 font-bold uppercase tracking-wider disabled:opacity-50">Next Step <ChevronRight className="w-5 h-5 ml-2" /></Button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
