import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import {
  Upload, Download, Move, Type, Info, RefreshCw, Trash2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

const TEXT_COLORS = ['#FFFFFF','#000000','#FFE600','#FF2E63','#FF6B35','#00C9A7','#4169E1','#FF69B4'];
const STROKE_COLORS = ['#000000','#FFFFFF','#FF2E63','#FFE600','#1C1C1C','#FF6B35','#4169E1','#00C9A7'];

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

const ColorPicker = ({ label, colors, value, onChange }) => (
  <div className="space-y-2">
    <Label className="text-xs text-gray-500">{label}</Label>
    <div className="flex gap-2 flex-wrap">
      {colors.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${value === color ? 'border-gray-800 ring-2 ring-offset-1' : 'border-gray-300'}`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  </div>
);

// ─── Text styling panel ──────────────────────────────────────────────────────
const TextStylePanel = ({ label, fontSize, setFontSize, color, setColor, stroke, setStroke, strokeWidth, setStrokeWidth, font, setFont }) => (
  <div className="p-4 bg-gray-50 rounded-xl space-y-3 mt-3">
    <p className="text-xs font-bold text-gray-500 tracking-wide">{label} STYLING</p>
    <div><Label className="text-xs text-gray-500 mb-1 block">Font size ({fontSize}px)</Label><Slider value={[fontSize]} min={14} max={64} step={2} onValueChange={([v])=>setFontSize(v)} /></div>
    <div><Label className="text-xs text-gray-500 mb-1 block">Stroke thickness ({strokeWidth===0?'none':strokeWidth})</Label><Slider value={[strokeWidth]} min={0} max={20} step={1} onValueChange={([v])=>setStrokeWidth(v)} /></div>
    <ColorPicker label="Text colour" colors={TEXT_COLORS} value={color} onChange={setColor} />
    <ColorPicker label="Stroke colour" colors={STROKE_COLORS} value={stroke} onChange={setStroke} />
    <p className="text-xs text-gray-400">Drag text on the canvas to reposition it</p>
  </div>
);

// ─── Draggable text component ────────────────────────────────────────────────
const DraggableText = ({ text, x, y, fontSize, fill, stroke, strokeWidth, isSelected, onSelect, onChange, fontFamily = 'Plump' }) => {
  const groupRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Force redraw when font changes
  useEffect(() => {
    if (groupRef.current && groupRef.current.getLayer()) {
      groupRef.current.getLayer().batchDraw();
    }
  }, [fontFamily]);

  if (!text) return null;

  const upper = text.toUpperCase();
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  const font = `${fontSize}px ${fontFamily}`;
  ctx.font = font;
  const width = ctx.measureText(upper).width;
  const gx = x - width / 2;

  return (
    <>
      <Text
        text={upper}
        x={gx} y={y}
        fontSize={fontSize}
        fontFamily={`${fontFamily}, Arial, sans-serif`}
        fill={stroke} stroke={stroke} strokeWidth={strokeWidth > 0 ? strokeWidth * 2.5 : 0}
        lineJoin="round"
        lineCap="round"
        listening={false}
      />
      <Text
        text={upper}
        x={gx} y={y}
        fontSize={fontSize}
        fontFamily={`${fontFamily}, Arial, sans-serif`}
        fill={fill}
        listening={false}
      />
      <Text
        ref={ref => { if (!groupRef.current && ref) groupRef.current = ref.parent; }}
        text={upper}
        x={gx} y={y}
        fontSize={fontSize}
        fontFamily={`${fontFamily}, Arial, sans-serif`}
        fill={fill}
        opacity={0}
        draggable
        onDragEnd={(e) => onChange({ x: e.target.x() + width / 2, y: e.target.y() })}
        onDblClick={() => onSelect()}
      />
    </>
  );
};

// ─── MAIN ADMIN BUILDER ──────────────────────────────────────────────────────
export default function AdminBuilder() {
  const stageRef = useRef();
  
  // Photo state
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [headCutout, setHeadCutout] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Text state
  const [line1Text, setLine1Text] = useState('');
  const [line1Color, setLine1Color] = useState('#FFFFFF');
  const [line1Stroke, setLine1Stroke] = useState('#000000');
  const [line1Size, setLine1Size] = useState(36);
  const [line1Font, setLine1Font] = useState('Plump');
  const [line1SW, setLine1SW] = useState(10);
  const [line1Pos, setLine1Pos] = useState({ x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT-130 });

  const [line2Text, setLine2Text] = useState('');
  const [line2Color, setLine2Color] = useState('#FFFFFF');
  const [line2Stroke, setLine2Stroke] = useState('#000000');
  const [line2Size, setLine2Size] = useState(32);
  const [line2Font, setLine2Font] = useState('Plump');
  const [line2SW, setLine2SW] = useState(10);
  const [line2Pos, setLine2Pos] = useState({ x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT-85 });

  const [line3Text, setLine3Text] = useState('');
  const [line3Color, setLine3Color] = useState('#000000');
  const [line3Stroke, setLine3Stroke] = useState('#FFFFFF');
  const [line3Size, setLine3Size] = useState(18);
  const [line3Font, setLine3Font] = useState('Plump');
  const [line3SW, setLine3SW] = useState(0);
  const [line3Pos, setLine3Pos] = useState({ x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT-44 });

  // UI state
  const [selectedElement, setSelectedElement] = useState(null);
  const [shirtColor, setShirtColor] = useState('white');
  const [isProcessing, setIsProcessing] = useState(false);
  const [templates, setTemplates] = useState([]);

  // Fetch templates on mount
  useEffect(() => {
    fetch(`${API}/templates`)
      .then(r => r.json())
      .then(data => setTemplates(data))
      .catch(() => toast.error('Failed to load templates'));
  }, []);

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch(`${API}/process-photo`, { method: 'POST', body: formData });
      const data = await res.json();
      setOriginalPhoto(data.original);
      setHeadCutout(data.cutout);
      toast.success('Photo processed successfully!');
    } catch (err) {
      toast.error('Failed to process photo');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download design as high-quality PNG image
  const handleDownload = () => {
    if (!stageRef.current) {
      toast.error('No design to download');
      return;
    }
    
    try {
      // Export canvas as PNG at 2x scale for print quality
      const scale = 2;
      const uri = stageRef.current.toDataURL({ pixelRatio: scale });
      
      // Create download link
      const link = document.createElement('a');
      link.href = uri;
      link.download = `design-${line1Text || 'print'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('✓ Design downloaded as PNG (ready for print!)');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download design');
    }
  };

  // Reset
  const handleReset = () => {
    setOriginalPhoto(null);
    setHeadCutout(null);
    setSelectedTemplate(null);
    setLine1Text('');
    setLine2Text('');
    setLine3Text('');
    setSelectedElement(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Builder</h1>
          <p className="text-gray-600">Create custom designs for print orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Controls */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Photo Upload */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Upload className="w-4 h-4"/>Upload Photo</h3>
              <label className="block w-full">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isProcessing} className="hidden" />
                <div className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#FF2E63] transition-colors ${isProcessing ? 'opacity-50' : ''}`}>
                  {isProcessing ? <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" /> : <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />}
                  <p className="text-sm font-medium text-gray-700">Choose photo</p>
                  <p className="text-xs text-gray-500">PNG, JPG, or GIF</p>
                </div>
              </label>
            </div>

            {/* Templates */}
            {headCutout && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Templates</h3>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${selectedTemplate?.id === t.id ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Text Input */}
            {selectedTemplate && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Type className="w-4 h-4"/>Add Text</h3>
                
                {/* Font Selection */}
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 tracking-wide mb-2">FONT</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Plump', 'Anton', 'Fredoka One', 'Dancing Script', 'Bebas Neue', 'Montserrat'].map(f => (
                      <button key={f} onClick={() => {setLine1Font(f); setLine2Font(f); setLine3Font(f);}} className={`py-1 px-2 rounded-lg text-xs font-medium transition-all ${line1Font === f ? 'bg-[#FF2E63] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:border-[#FF2E63]'}`}>
                        {f === 'Plump' ? 'Default' : f === 'Fredoka One' ? 'Fredoka' : f === 'Dancing Script' ? 'Script' : f === 'Bebas Neue' ? 'Bebas' : f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="mb-3">
                  <Label className="text-sm font-bold text-gray-700 mb-1 block">Name</Label>
                  <Input value={line1Text} onChange={(e)=>setLine1Text(e.target.value)} placeholder="e.g. BRAD'S" className="font-medium" />
                  {line1Text && <TextStylePanel label="NAME" fontSize={line1Size} setFontSize={setLine1Size} color={line1Color} setColor={setLine1Color} stroke={line1Stroke} setStroke={setLine1Stroke} strokeWidth={line1SW} setStrokeWidth={setLine1SW} font={line1Font} setFont={setLine1Font} />}
                </div>

                {/* Event */}
                <div className="mb-3">
                  <Label className="text-sm font-bold text-gray-700 mb-1 block">Event</Label>
                  <Input value={line2Text} onChange={(e)=>setLine2Text(e.target.value)} placeholder="e.g. STAG WEEKEND" className="font-medium" />
                  {line2Text && <TextStylePanel label="EVENT" fontSize={line2Size} setFontSize={setLine2Size} color={line2Color} setColor={setLine2Color} stroke={line2Stroke} setStroke={setLine2Stroke} strokeWidth={line2SW} setStrokeWidth={setLine2SW} font={line2Font} setFont={setLine2Font} />}
                </div>

                {/* Location */}
                <div>
                  <Label className="text-sm font-bold text-gray-700 mb-1 block">Location</Label>
                  <Input value={line3Text} onChange={(e)=>setLine3Text(e.target.value)} placeholder="e.g. BENIDORM 2025" className="font-medium" />
                  {line3Text && <TextStylePanel label="LOCATION" fontSize={line3Size} setFontSize={setLine3Size} color={line3Color} setColor={setLine3Color} stroke={line3Stroke} setStroke={setLine3Stroke} strokeWidth={line3SW} setStrokeWidth={setLine3SW} font={line3Font} setFont={setLine3Font} />}
                </div>
              </div>
            )}

            {/* Shirt Color */}
            {selectedTemplate && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Shirt Colour</h3>
                <div className="grid grid-cols-3 gap-2">
                  {SHIRT_COLORS.map(c => (
                    <button key={c.id} onClick={() => setShirtColor(c.id)} className={`p-2 rounded-lg text-xs font-medium transition-all border-2 ${shirtColor === c.id ? 'border-gray-900' : 'border-gray-300'}`} style={{backgroundColor: c.hex}} title={c.label} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedTemplate && (
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
                <Button onClick={handleDownload} className="w-full bg-green-600 hover:bg-green-700 text-white"><Download className="w-4 h-4 mr-2"/>Download Design</Button>
                <Button onClick={handleReset} variant="outline" className="w-full"><RefreshCw className="w-4 h-4 mr-2"/>Reset</Button>
              </div>
            )}

          </div>

          {/* Right Panel: Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1"><Info className="w-4 h-4"/>Click text on canvas to select & drag to reposition</p>
              <div className="w-full flex justify-center bg-gray-100 rounded-xl p-4">
                {selectedTemplate && headCutout ? (
                  <Stage ref={stageRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{width:'100%', height:'auto', maxWidth:'100%'}}>
                    <Layer>
                      {/* Shirt background */}
                      <Text text="" x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill={SHIRT_COLORS.find(c => c.id === shirtColor)?.hex} />
                      
                      {/* Template body */}
                      <TemplateImage url={selectedTemplate.preview_url} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                      
                      {/* Head cutout */}
                      <HeadImage url={headCutout.head_url} placement={selectedTemplate.head_placement || {x: CANVAS_WIDTH/2, y: 80, width: 120, height: 150}} />
                      
                      {/* Text */}
                      {line1Text && <DraggableText text={line1Text} x={line1Pos.x} y={line1Pos.y} fontSize={line1Size} fill={line1Color} stroke={line1Stroke} strokeWidth={line1SW} isSelected={selectedElement==='line1'} onSelect={()=>setSelectedElement('line1')} onChange={(u)=>{if(u.x!==undefined)setLine1Pos({x:u.x,y:u.y});}} fontFamily={line1Font}/>}
                      {line2Text && <DraggableText text={line2Text} x={line2Pos.x} y={line2Pos.y} fontSize={line2Size} fill={line2Color} stroke={line2Stroke} strokeWidth={line2SW} isSelected={selectedElement==='line2'} onSelect={()=>setSelectedElement('line2')} onChange={(u)=>{if(u.x!==undefined)setLine2Pos({x:u.x,y:u.y});}} fontFamily={line2Font}/>}
                      {line3Text && <DraggableText text={line3Text} x={line3Pos.x} y={line3Pos.y} fontSize={line3Size} fill={line3Color} stroke={line3Stroke} strokeWidth={line3SW} isSelected={selectedElement==='line3'} onSelect={()=>setSelectedElement('line3')} onChange={(u)=>{if(u.x!==undefined)setLine3Pos({x:u.x,y:u.y});}} fontFamily={line3Font}/>}
                    </Layer>
                  </Stage>
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    <p className="text-sm">Upload a photo and select a template to begin</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper components
function TemplateImage({ url, width, height }) {
  const [image] = useImage(url);
  return image ? <KonvaImage image={image} width={width} height={height} /> : null;
}

function HeadImage({ url, placement }) {
  const [image] = useImage(url);
  return image ? <KonvaImage image={image} x={placement.x - placement.width/2} y={placement.y} width={placement.width} height={placement.height} /> : null;
}

// Import Loader2 from lucide-react
import { Loader2 } from 'lucide-react';
