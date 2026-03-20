import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva';
import Konva from 'konva';
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
  CheckCircle, AlertCircle, Loader2, Type, Info, X
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

const TEXT_COLORS = ['#FFFFFF','#000000','#FFE600','#FF2E63','#FF6B35','#00C9A7','#4169E1','#FF69B4'];
const STROKE_COLORS = ['#000000','#FFFFFF','#FF2E63','#FFE600','#1C1C1C','#FF6B35','#4169E1','#00C9A7'];

// ─── T-shirt types & sizes ────────────────────────────────────────────────────
const SHIRT_TYPES = [
  { id: 'mens', label: "Men's", sizes: ['S','M','L','XL','2XL','3XL','4XL','5XL'] },
  { id: 'womens', label: "Women's", sizes: ['S','M','L','XL','2XL','3XL'] },
  { id: 'unisex', label: 'Unisex', sizes: ['S','M','L','XL','2XL','3XL','4XL','5XL'] },
];

// ─── Size guide data (placeholder — replace with your actual measurements) ────
// T-shirt colours — background colour shown in canvas preview
const SHIRT_COLORS = [
  { id: 'white',      label: 'White',       hex: '#FFFFFF', border: '#e0e0e0' },
  { id: 'black',      label: 'Black',       hex: '#1C1C1C', border: '#1C1C1C' },
  { id: 'red',        label: 'Red',         hex: '#CC2200', border: '#CC2200' },
  { id: 'royal-blue', label: 'Royal Blue',  hex: '#2155CD', border: '#2155CD' },
  { id: 'navy',       label: 'Navy',        hex: '#0A1F44', border: '#0A1F44' },
  { id: 'purple',     label: 'Purple',      hex: '#5B2C8D', border: '#5B2C8D' },
  { id: 'green',      label: 'Green',       hex: '#1A7A4A', border: '#1A7A4A' },
  { id: 'grey',       label: 'Grey',        hex: '#8C8C8C', border: '#8C8C8C' },
  { id: 'pink',       label: 'Pink',        hex: '#E8558A', border: '#E8558A' },
];

// Real measurements provided by Swap My Face Tees
// Half Chest = measure flat across chest. Full chest = double this figure.
const SIZE_GUIDE = {
  mens: {
    note: "Men's and Unisex use the same sizing. Measurements taken flat — double the half chest for full chest measurement.",
    headers: ['Size','Half Chest (cm)','Length (cm)'],
    rows: [
      ['S','46','71'],['M','51','74'],['L','56','77'],
      ['XL','61','79'],['2XL','66','83'],['3XL','71','85'],
      ['4XL','76','87'],['5XL','81','89'],
    ]
  },
  womens: {
    note: "Women's fitted cut. Ladies size guide included for reference.",
    headers: ['Size','Half Chest (cm)','Length (cm)','Ladies Size'],
    rows: [
      ['S','43','64','8/10'],['M','46','66','10/12'],['L','49','68','12/14'],
      ['XL','52','70','14/16'],['2XL','59','71','18/20'],['3XL','65','72','22/24'],
    ]
  },
  unisex: {
    note: "Unisex and Men's use the same sizing. Measurements taken flat — double the half chest for full chest measurement.",
    headers: ['Size','Half Chest (cm)','Length (cm)'],
    rows: [
      ['S','46','71'],['M','51','74'],['L','56','77'],
      ['XL','61','79'],['2XL','66','83'],['3XL','71','85'],
      ['4XL','76','87'],['5XL','81','89'],
    ]
  }
};

// ─── Size Guide Modal ─────────────────────────────────────────────────────────
const SizeGuideModal = ({ type, onClose }) => {
  const guide = SIZE_GUIDE[type];
  const typeLabel = SHIRT_TYPES.find(t => t.id === type)?.label;
  if (!guide) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">{typeLabel} SIZE GUIDE</h3>
            <p className="text-xs text-gray-400 mt-0.5">All measurements in centimetres (cm)</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5">
          {guide.note && (
            <div className="mb-4 p-3 bg-[#FFF9E6] border border-[#FFE600] rounded-lg text-xs text-gray-600">{guide.note}</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FF2E63] text-white">
                  {guide.headers.map(h => <th key={h} className="px-4 py-2 text-left font-bold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {guide.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    {row.map((cell, j) => (
                      <td key={j} className={`px-4 py-2.5 ${j === 0 ? 'font-bold text-[#252A34]' : 'text-gray-600'}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">If you are between sizes, we recommend sizing up.</p>
        </div>
      </div>
    </div>
  );
};

// ─── Outside stroke text ──────────────────────────────────────────────────────
// Uses a Group so the transformer hugs just the visible text, not the full canvas width.
const DraggableText = ({ text, x, y, fontSize, fill, stroke, strokeWidth, isSelected, onSelect, onChange }) => {
  const groupRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  if (!text) return null;

  const upper = text.toUpperCase();
  const font = `${fontSize}px Anton, Impact, sans-serif`;

  // Measure text width on a temporary canvas so the group is exactly the right size
  let textWidth = fontSize * upper.length * 0.6; // fallback estimate
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = font;
    textWidth = ctx.measureText(upper).width;
  } catch (e) {}

  const gx = x - textWidth / 2;

  return (
    <>
      <KonvaImage // invisible spacer — not used, just Group below
        x={0} y={0} width={0} height={0} listening={false}
      />
      {/* Group positioned so its left edge = gx, making transformer tight */}
      <Text
        // Stroke layer — behind
        text={upper}
        x={gx} y={y}
        fontSize={fontSize}
        fontFamily="Anton, Impact, sans-serif"
        fill={stroke} stroke={stroke} strokeWidth={strokeWidth > 0 ? strokeWidth * 2.5 : 0}
        listening={false}
      />
      <Text
        // Fill layer — on top
        text={upper}
        x={gx} y={y}
        fontSize={fontSize}
        fontFamily="Anton, Impact, sans-serif"
        fill={fill}
        listening={false}
      />
      {/* Transparent hit area — same size, this is what gets dragged/transformed */}
      <Text
        ref={groupRef}
        text={upper}
        x={gx} y={y}
        fontSize={fontSize}
        fontFamily="Anton, Impact, sans-serif"
        fill="rgba(0,0,0,0)"
        draggable
        onClick={onSelect} onTap={onSelect}
        onDragEnd={(e) => {
          const newX = e.target.x() + textWidth / 2;
          onChange({ x: newX, y: e.target.y() });
          e.target.x(gx); // reset — position is controlled via state
          e.target.y(y);
        }}
        onTransformEnd={() => {
          const n = groupRef.current;
          const newFontSize = Math.round(fontSize * n.scaleX());
          const newX = n.x() + textWidth / 2;
          onChange({ x: newX, y: n.y(), fontSize: newFontSize });
          n.scaleX(1); n.scaleY(1);
          n.x(gx); n.y(y);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(o, n) => n.width < 30 ? o : n}
        />
      )}
    </>
  );
};

// ─── Head Image with touch and filters ───────────────────────────────────────
const HeadImage = ({ imageUrl, placement, isSelected, onSelect, onChange, brightness, contrast }) => {
  const [image] = useImage(imageUrl, 'anonymous');
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Cache must run after every render so filters apply and resize works immediately
  useEffect(() => {
    if (shapeRef.current && image) {
      shapeRef.current.cache();
      shapeRef.current.getLayer()?.batchDraw();
    }
  });

  if (!image) return null;

  const w = image.width * placement.scale * 0.3;
  const h = image.height * placement.scale * 0.3;
  // Use top-left positioning (no offsetX/offsetY) so transformer hugs tightly
  const px = placement.x * CANVAS_WIDTH - w / 2;
  const py = placement.y * CANVAS_HEIGHT - h / 2;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={px}
        y={py}
        width={w}
        height={h}
        rotation={placement.rotation}
        filters={[Konva.Filters.Brighten, Konva.Filters.Contrast]}
        brightness={brightness}
        contrast={contrast}
        draggable
        onClick={onSelect} onTap={onSelect}
        onDragEnd={(e) => onChange({
          x: (e.target.x() + w / 2) / CANVAS_WIDTH,
          y: (e.target.y() + h / 2) / CANVAS_HEIGHT,
        })}
        onTransformEnd={() => {
          const n = shapeRef.current;
          const newScale = placement.scale * n.scaleX();
          const newW = image.width * newScale * 0.3;
          const newH = image.height * newScale * 0.3;
          onChange({
            scale: newScale,
            rotation: n.rotation(),
            x: (n.x() + newW / 2) / CANVAS_WIDTH,
            y: (n.y() + newH / 2) / CANVAS_HEIGHT,
          });
          n.scaleX(1); n.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          keepRatio={true}
          boundBoxFunc={(o, n) => (n.width < 20 || n.height < 20) ? o : n}
        />
      )}
    </>
  );
};

const TemplateImage = ({ imageUrl }) => {
  const [image] = useImage(imageUrl, 'anonymous');
  if (!image) return null;
  const scale = Math.min(CANVAS_WIDTH / image.width, CANVAS_HEIGHT / image.height) * 0.95;
  return <KonvaImage image={image} x={CANVAS_WIDTH/2} y={CANVAS_HEIGHT/2} width={image.width*scale} height={image.height*scale} offsetX={(image.width*scale)/2} offsetY={(image.height*scale)/2} listening={false} />;
};

const ColorPicker = ({ label, colors, value, onChange }) => (
  <div className="mb-2">
    <Label className="text-xs text-gray-500 mb-1.5 block">{label}</Label>
    <div className="flex gap-2 flex-wrap">
      {colors.map(c => <button key={c} onClick={() => onChange(c)} className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110" style={{ background:c, borderColor: value===c?'#FF2E63':'#e0e0e0', boxShadow: value===c?'0 0 0 2px #FF2E63':'none', transform: value===c?'scale(1.15)':'scale(1)' }} />)}
    </div>
  </div>
);

const TextStylePanel = ({ label, fontSize, setFontSize, color, setColor, stroke, setStroke, strokeWidth, setStrokeWidth }) => (
  <div className="p-4 bg-gray-50 rounded-xl space-y-3 mt-3">
    <p className="text-xs font-bold text-gray-500 tracking-wide">{label} STYLING</p>
    <div><Label className="text-xs text-gray-500 mb-1 block">Font size ({fontSize}px)</Label><Slider value={[fontSize]} min={14} max={64} step={2} onValueChange={([v])=>setFontSize(v)} /></div>
    <div><Label className="text-xs text-gray-500 mb-1 block">Stroke thickness ({strokeWidth===0?'none':strokeWidth})</Label><Slider value={[strokeWidth]} min={0} max={20} step={1} onValueChange={([v])=>setStrokeWidth(v)} /></div>
    <ColorPicker label="Text colour" colors={TEXT_COLORS} value={color} onChange={setColor} />
    <ColorPicker label="Stroke colour" colors={STROKE_COLORS} value={stroke} onChange={setStroke} />
    <p className="text-xs text-gray-400">Drag text on the canvas to reposition it</p>
  </div>
);

const CategoryTabs = ({ active, onChange }) => (
  <div className="flex gap-2 flex-wrap mb-4">
    {[{key:'all',label:'All'},{key:'stag',label:'Stag'},{key:'hen',label:'Hen'},{key:'party',label:'Party'}].map(t => (
      <button key={t.key} onClick={()=>onChange(t.key)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${active===t.key?'bg-[#FF2E63] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
    ))}
  </div>
);

export default function BuilderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasDisplayWidth, setCanvasDisplayWidth] = useState(CANVAS_WIDTH);

  useEffect(() => {
    const measure = () => {
      if (canvasContainerRef.current) {
        // Measure the parent card's inner width, not the canvas container itself
        // This breaks the feedback loop where the Stage was pushing the container wider
        const parent = canvasContainerRef.current.parentElement;
        if (parent) {
          const style = getComputedStyle(parent);
          const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
          const available = parent.clientWidth - paddingX;
          setCanvasDisplayWidth(Math.min(CANVAS_WIDTH, Math.floor(available)));
        }
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const {
    templates, fetchTemplates,
    selectedTemplate, setSelectedTemplate,
    originalPhoto, setOriginalPhoto,
    headCutout, setHeadCutout,
    headPlacement, setHeadPlacement,
    setTitleText, setSubtitleText,
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
  const [headBrightness, setHeadBrightness] = useState(0);   // -1 to 1
  const [headContrast, setHeadContrast] = useState(0);       // -100 to 100
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Text lines
  const [line1Text, setLine1Text] = useState('');
  const [line1Color, setLine1Color] = useState('#FFFFFF');
  const [line1Stroke, setLine1Stroke] = useState('#000000');
  const [line1Size, setLine1Size] = useState(36);
  const [line1SW, setLine1SW] = useState(10);
  const [line1Pos, setLine1Pos] = useState({ x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT-130 });

  const [line2Text, setLine2Text] = useState('');
  const [line2Color, setLine2Color] = useState('#FFFFFF');
  const [line2Stroke, setLine2Stroke] = useState('#000000');
  const [line2Size, setLine2Size] = useState(32);
  const [line2SW, setLine2SW] = useState(10);
  const [line2Pos, setLine2Pos] = useState({ x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT-85 });

  const [line3Text, setLine3Text] = useState('');
  const [line3Color, setLine3Color] = useState('#000000');
  const [line3Stroke, setLine3Stroke] = useState('#FFFFFF');
  const [line3Size, setLine3Size] = useState(18);
  const [line3SW, setLine3SW] = useState(0);
  const [line3Pos, setLine3Pos] = useState({ x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT-44 });

  // T-shirt type, colour & sizes
  const [shirtType, setShirtType] = useState('mens');
  const [shirtColor, setShirtColor] = useState('white');
  const [selectedSizes, setSelectedSizes] = useState({});
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const currentType = SHIRT_TYPES.find(t => t.id === shirtType);
  const currentShirtColor = SHIRT_COLORS.find(c => c.id === shirtColor) || SHIRT_COLORS[0];

  const updateSize = (size, delta) => {
    setSelectedSizes(prev => ({ ...prev, [size]: Math.max(0, (prev[size] || 0) + delta) }));
  };

  const getTotalQty = () => Object.values(selectedSizes).reduce((s, q) => s + q, 0);
  const getTotal = () => getTotalQty() * pricing.base_price + (hasBackPrint ? getTotalQty() * pricing.back_print_price : 0);

  // Reset sizes when type changes
  useEffect(() => { setSelectedSizes({}); }, [shirtType]);

  useEffect(() => { setTitleText(line1Text); }, [line1Text, setTitleText]);
  useEffect(() => { setSubtitleText(`${line2Text}${line3Text?' | '+line3Text:''}`); }, [line2Text, line3Text, setSubtitleText]);

  useEffect(() => {
    const tid = searchParams.get('template');
    if (tid && templates.length > 0) {
      const t = templates.find(t => t.id === tid);
      if (t) { setSelectedTemplate(t); if (t.head_placement) setHeadPlacement(t.head_placement); }
    }
  }, [searchParams, templates, setSelectedTemplate, setHeadPlacement]);

  useEffect(() => { if (templates.length === 0) fetchTemplates(); }, [templates.length, fetchTemplates]);

  const filteredTemplates = templates.filter(t => {
    if (categoryFilter === 'all') return true;
    return (t.categories || [t.category]).includes(categoryFilter);
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 10*1024*1024) { toast.error('File too large. Maximum 10MB'); return; }
    setIsUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await fetch(`${API}/upload/photo`, { method:'POST', body:fd });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setOriginalPhoto(d);
      if (d.quality_warning) toast.warning(d.quality_warning);
      setIsProcessing(true);
      const bf = new FormData(); bf.append('file_id', d.id);
      const br = await fetch(`${API}/upload/remove-background`, { method:'POST', body:bf });
      if (!br.ok) throw new Error();
      const bd = await br.json();
      setHeadCutout(bd);
      toast.success('Face cutout complete!');
    } catch { toast.error('Failed to process photo. Please try again.'); }
    finally { setIsUploading(false); setIsProcessing(false); }
  };

  // ── Export canvas as PNG and upload to backend ──────────────────────────────
  const exportCanvasPreview = async () => {
    if (!stageRef.current) return null;
    try {
      // Deselect everything so transformer handles don't appear in the export
      setSelectedElement(null);
      // Small delay to let Konva re-render without selection handles
      await new Promise(r => setTimeout(r, 80));
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 }); // 2x for print quality
      // Convert base64 to blob
      const res = await fetch(dataURL);
      const blob = await res.blob();
      const fd = new FormData();
      fd.append('file', blob, 'preview.png');
      const uploadRes = await fetch(`${API}/upload/preview`, { method: 'POST', body: fd });
      if (!uploadRes.ok) return null;
      const data = await uploadRes.json();
      return data.preview_url;
    } catch (e) {
      console.error('Preview export failed:', e);
      return null;
    }
  };

  const handleAddBulkToCart = async () => {
    if (getTotalQty() === 0) { toast.error('Please select at least one size'); return; }
    if (!selectedTemplate) { toast.error('Please select a template'); return; }
    toast.loading('Saving your design preview...', { id: 'preview' });
    const previewUrl = await exportCanvasPreview();
    toast.dismiss('preview');
    const items = [];
    Object.entries(selectedSizes).forEach(([size, qty]) => {
      if (qty > 0) for (let i = 0; i < qty; i++) items.push({
        templateId: selectedTemplate.id, templateName: selectedTemplate.name,
        headCutoutId: headCutout?.id,
        titleText: line1Text,
        subtitleText: `${line2Text}${line3Text?' | '+line3Text:''}`,
        shirtType, shirtColor, hasBackPrint,
        backName: hasBackPrint?(useSingleBackName?singleBackName:bulkBackNames[items.length]||''):'',
        backNumber:'', size, quantity:1, headPlacement,
        originalPhotoUrl: originalPhoto?.original_url, headUrl: headCutout?.head_url,
        previewUrl,
        price: pricing.base_price, backPrice: hasBackPrint?pricing.back_print_price:0,
      });
    });
    addMultipleToCart(items);
    toast.success(`Added ${getTotalQty()} items to cart!`);
    navigate('/cart');
  };

  const handleAddPartyMember = async () => {
    if (!selectedTemplate) { toast.error('Please select a template first'); return; }
    toast.loading('Saving design preview...', { id: 'preview' });
    const previewUrl = await exportCanvasPreview();
    toast.dismiss('preview');
    addPartyMember({ templateId: selectedTemplate.id, templateName: selectedTemplate.name, headCutoutId: headCutout?.id, titleText: line1Text, subtitleText: `${line2Text}${line3Text?' | '+line3Text:''}`, shirtType, shirtColor, hasBackPrint, backName, backNumber, size: backNumber||'M', headPlacement:{...headPlacement}, originalPhotoUrl: originalPhoto?.original_url, headUrl: headCutout?.head_url, previewUrl });
    toast.success('Person added!');
    setHeadCutout(null); setOriginalPhoto(null); setBackName(''); setBackNumber('');
  };

  const handleAddPartyToCart = () => {
    if (partyMembers.length === 0) { toast.error('Please add at least one person'); return; }
    addMultipleToCart(partyMembers.map(m=>({...m,quantity:1,price:pricing.base_price,backPrice:m.hasBackPrint?pricing.back_print_price:0})));
    toast.success(`Added ${partyMembers.length} items to cart!`);
    navigate('/cart');
  };

  const canProceed = () => step === 1 ? !!selectedTemplate : true;
  const hasText = line1Text||line2Text||line3Text;

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {sizeGuideOpen && <SizeGuideModal type={shirtType} onClose={() => setSizeGuideOpen(false)} />}

      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide">PARTY BUILDER</h1>
          <p className="text-gray-600 mt-2">Create your custom party t-shirt design</p>
          <div className="flex gap-4 mt-6 flex-wrap">
            <button onClick={()=>setBuilderMode('bulk')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${builderMode==='bulk'?'bg-[#FF2E63] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Shirt className="w-5 h-5" /> Bulk Order</button>
            <button onClick={()=>setBuilderMode('multi')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${builderMode==='multi'?'bg-[#FF2E63] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Users className="w-5 h-5" /> Multi-Design</button>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {['Template','Photo','Text','Sizes'].map((label,idx)=>(
            <div key={label} className="flex items-center">
              <button onClick={()=>idx+1<step&&setStep(idx+1)} className={`flex items-center gap-2 ${step===idx+1?'text-[#FF2E63]':step>idx+1?'text-green-600':'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step===idx+1?'bg-[#FF2E63] text-white':step>idx+1?'bg-green-600 text-white':'bg-gray-200 text-gray-500'}`}>
                  {step>idx+1?<CheckCircle className="w-4 h-4"/>:idx+1}
                </div>
                <span className="hidden sm:inline font-medium">{label}</span>
              </button>
              {idx<3&&<ChevronRight className="w-5 h-5 text-gray-300 mx-2 sm:mx-4"/>}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">

          {/* Controls */}
          <div className="order-1 lg:order-2 space-y-6">
            <AnimatePresence mode="wait">

              {step===1 && (
                <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-2 tracking-wide">1. CHOOSE A TEMPLATE</h3>
                  <CategoryTabs active={categoryFilter} onChange={setCategoryFilter} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                    {filteredTemplates.map(t=>(
                      <button key={t.id} onClick={()=>{setSelectedTemplate(t);if(t.head_placement)setHeadPlacement(t.head_placement);}} className={`p-2 rounded-xl border-2 transition-all text-left ${selectedTemplate?.id===t.id?'border-[#FF2E63] bg-[#FF2E63]/5':'border-gray-200 hover:border-gray-300'}`}>
                        <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                          <img src={t.product_image_url||t.body_image_url} alt={t.name} className="w-full h-full object-contain" crossOrigin="anonymous" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">{t.name}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {(t.categories||[t.category]).map(c=><span key={c} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full capitalize">{c}</span>)}
                        </div>
                      </button>
                    ))}
                    {filteredTemplates.length===0&&<div className="col-span-3 text-center py-8 text-gray-400">No templates in this category yet</div>}
                  </div>
                </motion.div>
              )}

              {step===2 && (
                <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">2. UPLOAD A PHOTO</h3>
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Checkbox id="gdpr" checked={gdprConsent} onCheckedChange={setGdprConsent} />
                      <label htmlFor="gdpr" className="text-sm text-gray-600 cursor-pointer">I consent to my photo being used for order fulfilment only.</label>
                    </div>
                  </div>
                  {!gdprConsent?(
                    <div className="text-center py-8"><AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4"/><p className="text-gray-600">Please accept the consent above</p></div>
                  ):headCutout?(
                    <div className="text-center py-4">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 border-4 border-green-500">
                        <img src={`${process.env.REACT_APP_BACKEND_URL}${headCutout.head_url}`} alt="Face" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      </div>
                      <p className="text-green-600 font-medium flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5"/> Face cutout complete!</p>
                      <Button variant="outline" onClick={()=>{setHeadCutout(null);setOriginalPhoto(null);}} className="mt-4">Change Photo</Button>
                    </div>
                  ):(
                    <div className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isUploading||isProcessing?'border-[#FF2E63] bg-[#FF2E63]/5':'border-gray-300 hover:border-[#FF2E63] hover:bg-[#FF2E63]/5'}`}
                      onClick={()=>!isUploading&&!isProcessing&&fileInputRef.current?.click()}
                      onDrop={(e)=>{e.preventDefault();const f=e.dataTransfer.files?.[0];if(f)handleFileUpload({target:{files:[f]}});}}
                      onDragOver={(e)=>e.preventDefault()}>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden"/>
                      {isUploading||isProcessing?(
                        <div><Loader2 className="w-12 h-12 text-[#FF2E63] mx-auto mb-4 animate-spin"/><p className="text-gray-600 font-medium">{isUploading?'Uploading...':'Cutting out face...'}</p></div>
                      ):(
                        <div><Upload className="w-12 h-12 text-gray-400 mx-auto mb-4"/><p className="text-gray-700 font-medium mb-1">Click to upload or drag and drop</p><p className="text-gray-400 text-sm">JPG, PNG or WebP up to 10MB</p><p className="text-gray-400 text-xs mt-2">Best results: clear face, good lighting</p></div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {step===3 && (
                <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-1 tracking-wide">3. ADD YOUR TEXT</h3>
                  <p className="text-sm text-gray-500 mb-5 flex items-center gap-1"><Type className="w-4 h-4"/>Click text on canvas to drag and adjust</p>

                  {[
                    {num:1,label:'Name',placeholder:"e.g. BRAD'S",val:line1Text,set:setLine1Text,fontSize:line1Size,setFS:setLine1Size,color:line1Color,setC:setLine1Color,stroke:line1Stroke,setSt:setLine1Stroke,sw:line1SW,setSW:setLine1SW,key:'line1'},
                    {num:2,label:'Event type',placeholder:'e.g. STAG WEEKEND',val:line2Text,set:setLine2Text,fontSize:line2Size,setFS:setLine2Size,color:line2Color,setC:setLine2Color,stroke:line2Stroke,setSt:setLine2Stroke,sw:line2SW,setSW:setLine2SW,key:'line2'},
                    {num:3,label:'Location & year',placeholder:'e.g. BENIDORM 2025',val:line3Text,set:setLine3Text,fontSize:line3Size,setFS:setLine3Size,color:line3Color,setC:setLine3Color,stroke:line3Stroke,setSt:setLine3Stroke,sw:line3SW,setSW:setLine3SW,key:'line3'},
                  ].map(line=>(
                    <div key={line.key} className="mb-5">
                      <Label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 bg-[#FF2E63] text-white rounded-full text-xs flex items-center justify-center">{line.num}</span>
                        {line.label}
                      </Label>
                      <Input value={line.val} onChange={(e)=>line.set(e.target.value)} placeholder={line.placeholder} className="font-medium" />
                      {line.val&&(
                        <button onClick={()=>setSelectedElement(line.key)} className="mt-1 text-xs text-[#FF2E63] font-medium">Edit style on canvas</button>
                      )}
                      {line.val&&<TextStylePanel label={line.label.toUpperCase()} fontSize={line.fontSize} setFontSize={line.setFS} color={line.color} setColor={line.setC} stroke={line.stroke} setStroke={line.setSt} strokeWidth={line.sw} setStrokeWidth={line.setSW} />}
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50" onClick={()=>setHasBackPrint(!hasBackPrint)}>
                      <Checkbox checked={hasBackPrint} onCheckedChange={setHasBackPrint}/>
                      <div className="flex-1"><p className="font-medium text-gray-700">Add name on the back</p><p className="text-sm text-gray-500">+£{pricing.back_print_price?.toFixed(2)} per shirt</p></div>
                    </div>
                    {hasBackPrint&&builderMode==='multi'&&(
                      <div className="mt-3 space-y-3 pl-8">
                        <div><Label>Back Name</Label><Input value={backName} onChange={(e)=>setBackName(e.target.value)} placeholder="e.g. BEST MAN" className="mt-1"/></div>
                        <div><Label>Back Number (optional)</Label><Input value={backNumber} onChange={(e)=>setBackNumber(e.target.value)} placeholder="e.g. 69" className="mt-1"/></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step===4 && (
                <motion.div key="s4" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] mb-4 tracking-wide">4. {builderMode==='bulk'?'SIZES & QUANTITIES':'ADD TO ORDER'}</h3>

                  {builderMode==='bulk'&&(
                    <>
                      {/* T-shirt colour selector */}
                      <div className="mb-6">
                        <Label className="text-sm font-bold text-gray-700 mb-3 block">T-Shirt Colour</Label>
                        <p className="text-xs text-gray-400 mb-3">The preview canvas updates to show your chosen colour</p>
                        <div className="flex gap-2 flex-wrap">
                          {SHIRT_COLORS.map(c=>(
                            <button key={c.id} onClick={()=>setShirtColor(c.id)}
                              title={c.label}
                              className="relative flex flex-col items-center gap-1 group"
                            >
                              <div className="w-9 h-9 rounded-full border-[3px] transition-transform group-hover:scale-110"
                                style={{ background: c.hex, borderColor: shirtColor===c.id ? '#FF2E63' : c.border, boxShadow: shirtColor===c.id ? '0 0 0 2px #FF2E63' : 'none', transform: shirtColor===c.id ? 'scale(1.15)' : 'scale(1)' }}
                              />
                              <span className="text-xs text-gray-500 hidden sm:block" style={{fontSize:'10px'}}>{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* T-shirt type selector */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-bold text-gray-700">T-Shirt Type</Label>
                          <button onClick={()=>setSizeGuideOpen(true)} className="flex items-center gap-1 text-xs text-[#FF2E63] font-medium hover:underline">
                            <Info className="w-3 h-3"/> Size Guide
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {SHIRT_TYPES.map(type=>(
                            <button key={type.id} onClick={()=>setShirtType(type.id)}
                              className={`py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all ${shirtType===type.id?'border-[#FF2E63] bg-[#FF2E63]/5 text-[#FF2E63]':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sizes for selected type */}
                      <Label className="text-sm font-bold text-gray-700 mb-3 block">Select Sizes</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                        {currentType?.sizes.map(size=>{
                          const qty = selectedSizes[size]||0;
                          return (
                            <div key={size} className={`rounded-xl p-3 border-2 transition-all ${qty>0?'border-[#FF2E63] bg-[#FF2E63]/5':'border-gray-100 bg-gray-50'}`}>
                              <p className="font-bold text-center text-[#252A34] mb-2">{size}</p>
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={()=>updateSize(size,-1)} className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"><Minus className="w-3 h-3"/></button>
                                <span className="w-6 text-center font-bold">{qty}</span>
                                <button onClick={()=>updateSize(size,1)} className="w-7 h-7 rounded-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white flex items-center justify-center transition-colors"><Plus className="w-3 h-3"/></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {builderMode==='multi'&&(
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-bold text-gray-700">T-Shirt Colour</Label>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-4">
                          {SHIRT_COLORS.map(c=>(
                            <button key={c.id} onClick={()=>setShirtColor(c.id)} title={c.label}
                              className="w-8 h-8 rounded-full border-[3px] transition-transform hover:scale-110"
                              style={{ background: c.hex, borderColor: shirtColor===c.id ? '#FF2E63' : c.border, boxShadow: shirtColor===c.id ? '0 0 0 2px #FF2E63' : 'none', transform: shirtColor===c.id ? 'scale(1.15)' : 'scale(1)' }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-bold text-gray-700">T-Shirt Type & Size</Label>
                        <button onClick={()=>setSizeGuideOpen(true)} className="flex items-center gap-1 text-xs text-[#FF2E63] font-medium hover:underline"><Info className="w-3 h-3"/> Size Guide</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {SHIRT_TYPES.map(type=>(
                          <button key={type.id} onClick={()=>setShirtType(type.id)} className={`py-2.5 rounded-xl border-2 font-medium text-xs transition-all ${shirtType===type.id?'border-[#FF2E63] bg-[#FF2E63]/5 text-[#FF2E63]':'border-gray-200 text-gray-600'}`}>{type.label}</button>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {currentType?.sizes.map(s=><button key={s} onClick={()=>setBackNumber(s)} className={`px-4 py-2 rounded-lg font-bold border-2 transition-colors text-sm ${backNumber===s?'border-[#FF2E63] bg-[#FF2E63] text-white':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{s}</button>)}
                      </div>
                    </div>
                  )}

                  {hasBackPrint&&builderMode==='bulk'&&(
                    <div className="border-t pt-4 mb-6">
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Back Names</Label>
                      <div className="flex gap-2 mb-3">
                        <button onClick={()=>setUseSingleBackName(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${useSingleBackName?'bg-[#FF2E63] text-white':'bg-gray-100 text-gray-600'}`}>Same for all</button>
                        <button onClick={()=>setUseSingleBackName(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${!useSingleBackName?'bg-[#FF2E63] text-white':'bg-gray-100 text-gray-600'}`}>Different names</button>
                      </div>
                      {useSingleBackName?<Input value={singleBackName} onChange={(e)=>setSingleBackName(e.target.value)} placeholder="Name for all shirts..."/>:(
                        <div><Textarea value={bulkBackNames.join('\n')} onChange={(e)=>setBulkBackNames(e.target.value.split('\n').filter(n=>n.trim()))} placeholder={`One per line (${getTotalQty()} needed)...`} rows={4}/><p className="text-sm text-gray-500 mt-1">{bulkBackNames.length}/{getTotalQty()} names</p></div>
                      )}
                    </div>
                  )}

                  {builderMode==='bulk'&&(
                    <>
                      <div className="bg-[#252A34] text-white rounded-xl p-5">
                        <div className="flex justify-between mb-2"><span>Quantity</span><span className="font-bold">{getTotalQty()} shirts</span></div>
                        <div className="flex justify-between mb-2"><span>Per shirt</span><span>£{pricing.base_price?.toFixed(2)}</span></div>
                        {hasBackPrint&&<div className="flex justify-between mb-2"><span>Back print</span><span>+£{pricing.back_print_price?.toFixed(2)}</span></div>}
                        <div className="border-t border-white/20 mt-3 pt-3 flex justify-between"><span className="text-xl font-bold">Total</span><span className="text-2xl font-bold text-[#F9ED69]">£{getTotal().toFixed(2)}</span></div>
                      </div>
                      <Button onClick={handleAddBulkToCart} disabled={getTotalQty()===0} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider mt-4">
                        <ShoppingCart className="w-5 h-5 mr-2"/> Add to Cart
                      </Button>
                    </>
                  )}

                  {builderMode==='multi'&&(
                    <div className="space-y-4">
                      <Button onClick={handleAddPartyMember} disabled={!selectedTemplate||!headCutout} className="w-full bg-[#08D9D6] hover:bg-[#06B5B2] text-[#252A34] rounded-full py-4 font-bold uppercase tracking-wider">
                        <Plus className="w-5 h-5 mr-2"/> Add Person to Order
                      </Button>
                      {partyMembers.length>0&&(
                        <>
                          <div className="border-t pt-4">
                            <h4 className="font-bold text-gray-700 mb-3">People in Order ({partyMembers.length})</h4>
                            <div className="space-y-2 max-h-52 overflow-y-auto">
                              {partyMembers.map((m,i)=>(
                                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">{m.headUrl&&<img src={`${process.env.REACT_APP_BACKEND_URL}${m.headUrl}`} alt="" className="w-full h-full object-cover"/>}</div>
                                  <div className="flex-1 min-w-0"><p className="font-medium text-gray-700 truncate">{m.backName||`Person ${i+1}`}</p><p className="text-xs text-gray-500">{m.templateName} • {m.shirtType} {m.size||'M'}</p></div>
                                  <button onClick={()=>removePartyMember(m.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button onClick={handleAddPartyToCart} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider">
                            <ShoppingCart className="w-5 h-5 mr-2"/> Add All to Cart (£{(partyMembers.length*pricing.base_price).toFixed(2)})
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop nav buttons */}
            <div className="hidden lg:flex gap-4">
              {step>1&&<Button variant="outline" onClick={()=>setStep(step-1)} className="flex-1 rounded-full py-6">Back</Button>}
              {step<4&&<Button onClick={()=>setStep(step+1)} disabled={!canProceed()} className="flex-1 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 font-bold uppercase tracking-wider disabled:opacity-50">Next Step <ChevronRight className="w-5 h-5 ml-2"/></Button>}
            </div>
          </div>

          {/* Canvas */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">PREVIEW</h3>
                <span className="text-xs text-gray-400 hidden sm:block">TAP TEXT OR FACE TO SELECT & DRAG</span>
              </div>

              {/* Canvas container */}
              <div
                ref={canvasContainerRef}
                className="rounded-xl overflow-hidden border border-gray-100 w-full"
                style={{
                  background: currentShirtColor.hex,
                  touchAction: 'none',
                  transition: 'background 0.2s',
                  aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                  maxWidth: '100%',
                }}
              >
                {canvasDisplayWidth > 0 && (
                <Stage
                  ref={stageRef}
                  width={canvasDisplayWidth}
                  height={canvasDisplayWidth * (CANVAS_HEIGHT / CANVAS_WIDTH)}
                  scaleX={canvasDisplayWidth / CANVAS_WIDTH}
                  scaleY={canvasDisplayWidth / CANVAS_WIDTH}
                  style={{ touchAction:'none', display: 'block' }}
                  onClick={(e)=>{ if(e.target===e.target.getStage()) setSelectedElement(null); }}
                  onTap={(e)=>{ if(e.target===e.target.getStage()) setSelectedElement(null); }}
                >
                  <Layer>
                    {selectedTemplate&&<TemplateImage imageUrl={selectedTemplate.body_image_url}/>}
                    {headCutout&&<HeadImage imageUrl={`${process.env.REACT_APP_BACKEND_URL}${headCutout.head_url}`} placement={headPlacement} isSelected={selectedElement==='head'} onSelect={()=>setSelectedElement('head')} onChange={(p)=>setHeadPlacement(p)} brightness={headBrightness} contrast={headContrast}/>}
                    {line1Text&&<DraggableText text={line1Text} x={line1Pos.x} y={line1Pos.y} fontSize={line1Size} fill={line1Color} stroke={line1Stroke} strokeWidth={line1SW} isSelected={selectedElement==='line1'} onSelect={()=>setSelectedElement('line1')} onChange={(u)=>{if(u.x!==undefined)setLine1Pos({x:u.x,y:u.y});if(u.fontSize)setLine1Size(u.fontSize);}}/>}
                    {line2Text&&<DraggableText text={line2Text} x={line2Pos.x} y={line2Pos.y} fontSize={line2Size} fill={line2Color} stroke={line2Stroke} strokeWidth={line2SW} isSelected={selectedElement==='line2'} onSelect={()=>setSelectedElement('line2')} onChange={(u)=>{if(u.x!==undefined)setLine2Pos({x:u.x,y:u.y});if(u.fontSize)setLine2Size(u.fontSize);}}/>}
                    {line3Text&&<DraggableText text={line3Text} x={line3Pos.x} y={line3Pos.y} fontSize={line3Size} fill={line3Color} stroke={line3Stroke} strokeWidth={line3SW} isSelected={selectedElement==='line3'} onSelect={()=>setSelectedElement('line3')} onChange={(u)=>{if(u.x!==undefined)setLine3Pos({x:u.x,y:u.y});if(u.fontSize)setLine3Size(u.fontSize);}}/>}
                  </Layer>
                </Stage>
                )}
              </div>

              {/* Proof approval notice */}
              <div className="mt-4 p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#FFE600] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#1C1C1C]">✓</div>
                  <p className="text-xs font-bold text-[#1C1C1C] tracking-wide uppercase">Don't worry if it's not perfect — we've got you covered</p>
                </div>
                <ul className="text-xs text-gray-700 space-y-1 pl-8 list-disc">
                  <li>Every order is manually checked by our team before printing</li>
                  <li>A <strong>digital proof</strong> is sent to you for approval — nothing prints until you say yes</li>
                  <li>We can make corrections and adjustments as required</li>
                  <li>We'll contact you if we need a better quality photo</li>
                  <li className="font-semibold text-[#FF2E63]">Please make sure your email and phone number are correct at checkout</li>
                </ul>
              </div>

              {selectedElement==='head'&&headCutout&&(
                <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-gray-500 tracking-wide">FACE CONTROLS</p>
                  <div className="flex gap-4">
                    <div className="flex-1"><Label className="text-xs text-gray-500 mb-1 block">Scale</Label><div className="flex items-center gap-2"><ZoomOut className="w-4 h-4 text-gray-400"/><Slider value={[headPlacement.scale]} min={0.1} max={2} step={0.05} onValueChange={([v])=>setHeadPlacement({scale:v})} className="flex-1"/><ZoomIn className="w-4 h-4 text-gray-400"/></div></div>
                    <div className="flex-1"><Label className="text-xs text-gray-500 mb-1 block">Rotation</Label><div className="flex items-center gap-2"><RotateCw className="w-4 h-4 text-gray-400"/><Slider value={[headPlacement.rotation]} min={-180} max={180} step={5} onValueChange={([v])=>setHeadPlacement({rotation:v})} className="flex-1"/></div></div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Brightness ({headBrightness > 0 ? '+' : ''}{Math.round(headBrightness * 100)})</Label>
                    <Slider value={[headBrightness]} min={-1} max={1} step={0.05} onValueChange={([v])=>setHeadBrightness(v)} />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Contrast ({headContrast > 0 ? '+' : ''}{Math.round(headContrast)})</Label>
                    <Slider value={[headContrast]} min={-100} max={100} step={5} onValueChange={([v])=>setHeadContrast(v)} />
                  </div>
                  {(headBrightness !== 0 || headContrast !== 0) && (
                    <button onClick={()=>{setHeadBrightness(0);setHeadContrast(0);}} className="text-xs text-gray-400 hover:text-gray-600 underline">Reset adjustments</button>
                  )}
                  <p className="text-xs text-gray-400 text-center"><Move className="w-3 h-3 inline mr-1"/>Drag the face to reposition</p>
                </div>
              )}
              {selectedElement==='line1'&&line1Text&&<TextStylePanel label="NAME" fontSize={line1Size} setFontSize={setLine1Size} color={line1Color} setColor={setLine1Color} stroke={line1Stroke} setStroke={setLine1Stroke} strokeWidth={line1SW} setStrokeWidth={setLine1SW}/>}
              {selectedElement==='line2'&&line2Text&&<TextStylePanel label="EVENT" fontSize={line2Size} setFontSize={setLine2Size} color={line2Color} setColor={setLine2Color} stroke={line2Stroke} setStroke={setLine2Stroke} strokeWidth={line2SW} setStrokeWidth={setLine2SW}/>}
              {selectedElement==='line3'&&line3Text&&<TextStylePanel label="LOCATION" fontSize={line3Size} setFontSize={setLine3Size} color={line3Color} setColor={setLine3Color} stroke={line3Stroke} setStroke={setLine3Stroke} strokeWidth={line3SW} setStrokeWidth={setLine3SW}/>}

              {!selectedElement&&hasText&&<p className="text-center text-xs text-gray-400 mt-3"><Move className="w-3 h-3 inline mr-1"/>Tap text or face on canvas to select and edit</p>}

              {/* Mobile nav — below preview */}
              <div className="mt-5 lg:hidden flex gap-4">
                {step>1&&<Button variant="outline" onClick={()=>setStep(step-1)} className="flex-1 rounded-full py-5">Back</Button>}
                {step<4&&<Button onClick={()=>setStep(step+1)} disabled={!canProceed()} className="flex-1 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-5 font-bold uppercase tracking-wider disabled:opacity-50">Next Step <ChevronRight className="w-5 h-5 ml-2"/></Button>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
