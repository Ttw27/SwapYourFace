import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Wand2, Sparkles, Loader2, RefreshCw, Eraser, Download,
  Rocket, ArrowLeft, ArrowRight, Undo2, Maximize2, Check, ImageOff, Upload, User, Type
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAX_HISTORY = 20;

// Same logical frame the customer Builder uses, so saved head placement lines up.
const FRAME_W = 400;
const FRAME_H = 500;
const MOCKUP_RES = 3; // export mockups at 1200x1500

const STYLES = [
  { id: 'cartoon', label: 'Cartoon', hint: 'Bold, flat, sticker-style' },
  { id: 'realistic', label: 'Realistic', hint: 'Looks like a real photo' },
  { id: 'comic', label: 'Comic', hint: 'Inked comic-book look' },
  { id: '3d', label: '3D', hint: 'Animated-film render' },
  { id: 'vintage', label: 'Vintage', hint: 'Retro screen print' },
  { id: 'caricature', label: 'Caricature', hint: 'Big head, small body' },
];

const FONTS = [
  { id: 'Plump', label: 'Default' },
  { id: 'Anton', label: 'Anton' },
  { id: 'Fredoka One', label: 'Fredoka' },
  { id: 'Dancing Script', label: 'Script' },
  { id: 'Bebas Neue', label: 'Bebas' },
  { id: 'Montserrat', label: 'Montserrat' },
];

function absUrl(url) {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')
    ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function AIDesignGenerator() {
  // step: 'prompt' -> 'options' -> 'edit' -> 'mockup'
  const [step, setStep] = useState('prompt');

  // Prompt stage
  const [shortPrompt, setShortPrompt] = useState('');
  const [style, setStyle] = useState('cartoon');
  const [expandedPrompt, setExpandedPrompt] = useState('');
  const [expanding, setExpanding] = useState(false);
  const [numImages, setNumImages] = useState(4);
  const [generating, setGenerating] = useState(false);

  // Options stage
  const [generationId, setGenerationId] = useState(null);
  const [images, setImages] = useState([]);

  // Edit (print file) stage
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const historyRef = useRef([]);
  const [brushSize, setBrushSize] = useState(40);
  const [canvasReady, setCanvasReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [printDataUrl, setPrintDataUrl] = useState(null); // snapshot of the finished print file

  // Mockup stage
  const mockupRef = useRef(null);
  const [bodyImg, setBodyImg] = useState(null);
  const [headImg, setHeadImg] = useState(null);
  const [headLoading, setHeadLoading] = useState(false);
  const [headSrc, setHeadSrc] = useState(null); // URL of the current face, so it can be saved as a sample
  const [sampleFaces, setSampleFaces] = useState({ male: null, female: null });
  const [savingSample, setSavingSample] = useState(null);
  const [autoCutout, setAutoCutout] = useState(true);
  const [head, setHead] = useState({ x: 200, y: 110, width: 110, rotation: 0 });
  const [line1, setLine1] = useState({ text: 'NAME', x: 200, y: 400, size: 46 });
  const [line2, setLine2] = useState({ text: 'STAG DO 2026', x: 200, y: 450, size: 30 });
  const [font, setFont] = useState('Plump');
  const [fill, setFill] = useState('#FFFFFF');
  const [stroke, setStroke] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(10);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [transparentBg, setTransparentBg] = useState(false);
  const dragRef = useRef(null);

  // Publish
  const [templateName, setTemplateName] = useState('');
  const [categories, setCategories] = useState({ stag: true, hen: false, party: false });
  const [isFeatured, setIsFeatured] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedTemplate, setPublishedTemplate] = useState(null);

  const resetAll = () => {
    setStep('prompt');
    setShortPrompt('');
    setExpandedPrompt('');
    setGenerationId(null);
    setImages([]);
    setTemplateName('');
    setPublishedTemplate(null);
    setPrintDataUrl(null);
    setBodyImg(null);
    setHeadImg(null);
    setHeadSrc(null);
    historyRef.current = [];
    setCanUndo(false);
  };

  // ── Prompt expansion (Claude) ──────────────────────────────────────────
  const handleExpandPrompt = async () => {
    if (!shortPrompt.trim()) { toast.error('Type an idea first, e.g. "A Nurse"'); return; }
    setExpanding(true);
    try {
      const res = await fetch(`${API}/admin/design-generator/expand-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: shortPrompt, style }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to expand prompt');
      }
      const data = await res.json();
      setExpandedPrompt(data.expanded_prompt);
      toast.success('Prompt improved — edit it if needed, then generate');
    } catch (e) {
      toast.error(e.message || 'Failed to improve prompt');
    } finally {
      setExpanding(false);
    }
  };

  // A prompt written for the old style would fight the new one, so clear it
  const handleStyleChange = (id) => {
    setStyle(id);
    if (expandedPrompt) {
      setExpandedPrompt('');
      toast.message('Style changed — click Improve Prompt again, or just Generate');
    }
  };

  // ── Generate images (Ideogram) ─────────────────────────────────────────
  const handleGenerate = async () => {
    const isExpanded = !!expandedPrompt.trim();
    const finalPrompt = isExpanded ? expandedPrompt.trim() : shortPrompt.trim();
    if (!finalPrompt) { toast.error('Type an idea first'); return; }
    setGenerating(true);
    try {
      const res = await fetch(`${API}/admin/design-generator/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, num_images: numImages, style, prompt_is_expanded: isExpanded }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate designs');
      }
      const data = await res.json();
      setGenerationId(data.generation_id);
      setImages(data.images);
      setStep('options');
      toast.success(`${data.images.length} design option(s) ready`);
    } catch (e) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // ── Load an image into the clean-up canvas ─────────────────────────────
  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas.toDataURL('image/png'));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    setCanUndo(historyRef.current.length > 1);
  };

  const loadImageOntoCanvas = async (url) => {
    try {
      const img = await loadImage(url);
      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 1000;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      historyRef.current = [canvas.toDataURL('image/png')];
      setCanUndo(false);
      setCanvasReady(true);
    } catch {
      toast.error('Could not load that image for editing');
    }
  };

  const handleSelectOption = (url) => {
    setStep('edit');
    setCanvasReady(false);
    setTimeout(() => loadImageOntoCanvas(absUrl(url)), 0);
  };

  // Back from mockup: restore the cleaned-up print file into the editor
  const backToEdit = () => {
    setStep('edit');
    if (printDataUrl) {
      setCanvasReady(false);
      setTimeout(() => loadImageOntoCanvas(printDataUrl), 0);
    }
  };

  // ── Eraser ──────────────────────────────────────────────────────────────
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY, scaleX };
  };

  const eraseAt = (x, y, scaleX) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, (brushSize / 2) * scaleX, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    pushHistory();
    drawingRef.current = true;
    const { x, y, scaleX } = getPos(e);
    eraseAt(x, y, scaleX);
  };
  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y, scaleX } = getPos(e);
    eraseAt(x, y, scaleX);
  };
  const handlePointerUp = () => { drawingRef.current = false; };

  const handleUndo = () => {
    if (historyRef.current.length < 2) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    const canvas = canvasRef.current;
    const img = new window.Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
    setCanUndo(historyRef.current.length > 1);
  };

  // ── Canvas resize (transparent margin, design stays centred) ───────────
  const handleExpandCanvas = (percent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushHistory();
    const oldW = canvas.width, oldH = canvas.height;
    const newW = Math.round(oldW * (1 + percent));
    const newH = Math.round(oldH * (1 + percent));
    const snapshot = canvas.toDataURL('image/png');
    const img = new window.Image();
    img.onload = () => {
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, newW, newH);
      ctx.drawImage(img, (newW - oldW) / 2, (newH - oldH) / 2, oldW, oldH);
    };
    img.src = snapshot;
  };

  // ── File helpers ───────────────────────────────────────────────────────
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();
  const slug = () => (templateName || shortPrompt || 'design').trim().replace(/\s+/g, '-');

  const handleDownloadPrint = async () => {
    const blob = step === 'edit' && canvasRef.current
      ? await canvasToBlob(canvasRef.current)
      : await dataUrlToBlob(printDataUrl);
    downloadBlob(blob, `${slug()}-print.png`);
  };

  // ── Move on to the mockup ──────────────────────────────────────────────
  const goToMockup = async () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setPrintDataUrl(dataUrl);
    setBodyImg(await loadImage(dataUrl));
    if (!templateName && shortPrompt) setTemplateName(shortPrompt.replace(/\b\w/g, c => c.toUpperCase()));
    setStep('mockup');
  };

  // Body fitted exactly like the Builder's TemplateImage (95% of the frame, centred)
  const bodyRect = useCallback(() => {
    if (!bodyImg) return null;
    const s = Math.min(FRAME_W / bodyImg.naturalWidth, FRAME_H / bodyImg.naturalHeight) * 0.95;
    const w = bodyImg.naturalWidth * s, h = bodyImg.naturalHeight * s;
    return { x: (FRAME_W - w) / 2, y: (FRAME_H - h) / 2, w, h };
  }, [bodyImg]);

  const fontString = useCallback((size) => `${size}px "${font}", Arial, sans-serif`, [font]);

  // ── Draw the mockup ────────────────────────────────────────────────────
  const drawMockup = useCallback(() => {
    const canvas = mockupRef.current;
    if (!canvas || !bodyImg) return;
    canvas.width = FRAME_W * MOCKUP_RES;
    canvas.height = FRAME_H * MOCKUP_RES;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(MOCKUP_RES, 0, 0, MOCKUP_RES, 0, 0);
    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    if (!transparentBg) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, FRAME_W, FRAME_H); }

    const r = bodyRect();
    ctx.drawImage(bodyImg, r.x, r.y, r.w, r.h);

    if (headImg) {
      const hw = head.width;
      const hh = hw * (headImg.naturalHeight / headImg.naturalWidth);
      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate((head.rotation * Math.PI) / 180);
      ctx.drawImage(headImg, -hw / 2, -hh / 2, hw, hh);
      ctx.restore();
    }

    [line1, line2].forEach((l) => {
      if (!l.text) return;
      ctx.font = fontString(l.size);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      if (strokeWidth > 0) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(l.text, l.x, l.y);
      }
      ctx.fillStyle = fill;
      ctx.fillText(l.text, l.x, l.y);
    });
  }, [bodyImg, headImg, head, line1, line2, fill, stroke, strokeWidth, bgColor, transparentBg, bodyRect, fontString]);

  useEffect(() => {
    if (step !== 'mockup') return;
    // Make sure the chosen font has loaded before drawing text onto the canvas
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load(fontString(line1.size)), document.fonts.load(fontString(line2.size))])
        .catch(() => {})
        .finally(drawMockup);
    } else {
      drawMockup();
    }
  }, [step, drawMockup, fontString, line1.size, line2.size]);

  // ── Sample face (optionally cut out with the same service customers use) ──
  useEffect(() => {
    if (step !== 'mockup') return;
    fetch(`${API}/admin/sample-faces`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setSampleFaces(data); })
      .catch(() => {});
  }, [step]);

  const placeFace = async (url) => {
    const img = await loadImage(url);
    setHeadImg(img);
    setHeadSrc(url);
    const r = bodyRect();
    setHead(h => ({ ...h, x: FRAME_W / 2, y: r ? Math.round(r.y + 55) : 110, width: 110 }));
  };

  const handleFaceUpload = async (file) => {
    if (!file) return;
    setHeadLoading(true);
    try {
      let url;
      if (autoCutout) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await fetch(`${API}/upload/photo`, { method: 'POST', body: fd });
        if (!up.ok) throw new Error('Photo upload failed');
        const { id } = await up.json();
        const fd2 = new FormData();
        fd2.append('file_id', id);
        const cut = await fetch(`${API}/upload/remove-background`, { method: 'POST', body: fd2 });
        if (!cut.ok) throw new Error('Face cut-out failed');
        url = absUrl((await cut.json()).head_url);
      } else {
        url = URL.createObjectURL(file);
      }
      await placeFace(url);
      toast.success('Face added — drag it into place');
    } catch (e) {
      toast.error(e.message || 'Could not add that face');
    } finally {
      setHeadLoading(false);
    }
  };

  const handleUseSample = async (slot) => {
    setHeadLoading(true);
    try {
      await placeFace(absUrl(sampleFaces[slot]));
    } catch {
      toast.error('Could not load the sample face');
    } finally {
      setHeadLoading(false);
    }
  };

  const handleSaveSample = async (slot) => {
    if (!headSrc) return;
    setSavingSample(slot);
    try {
      const blob = await (await fetch(headSrc)).blob();
      const fd = new FormData();
      fd.append('file', blob, `${slot}.png`);
      const res = await fetch(`${API}/admin/sample-faces/${slot}`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setSampleFaces(prev => ({ ...prev, [slot]: url }));
      toast.success(`Saved as the ${slot} sample face`);
    } catch {
      toast.error('Could not save the sample face');
    } finally {
      setSavingSample(null);
    }
  };

  // ── Drag face / text on the mockup ─────────────────────────────────────
  const mockPos = (e) => {
    const rect = mockupRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: ((clientX - rect.left) / rect.width) * FRAME_W, y: ((clientY - rect.top) / rect.height) * FRAME_H };
  };

  const hitText = (l, p) => {
    if (!l.text) return false;
    const ctx = mockupRef.current.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = fontString(l.size);
    const w = ctx.measureText(l.text).width;
    ctx.restore();
    return Math.abs(p.x - l.x) <= w / 2 + 8 && Math.abs(p.y - l.y) <= l.size / 2 + 8;
  };

  const onMockDown = (e) => {
    const p = mockPos(e);
    let target = null;
    if (hitText(line1, p)) target = 'line1';
    else if (hitText(line2, p)) target = 'line2';
    else if (headImg) {
      const hh = head.width * (headImg.naturalHeight / headImg.naturalWidth);
      if (Math.abs(p.x - head.x) <= head.width / 2 && Math.abs(p.y - head.y) <= hh / 2) target = 'head';
    }
    if (!target) return;
    e.preventDefault();
    const origin = target === 'head' ? head : target === 'line1' ? line1 : line2;
    dragRef.current = { target, dx: p.x - origin.x, dy: p.y - origin.y };
  };
  const onMockMove = (e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const p = mockPos(e);
    const { target, dx, dy } = dragRef.current;
    const nx = Math.round(p.x - dx), ny = Math.round(p.y - dy);
    if (target === 'head') setHead(h => ({ ...h, x: nx, y: ny }));
    if (target === 'line1') setLine1(l => ({ ...l, x: nx, y: ny }));
    if (target === 'line2') setLine2(l => ({ ...l, x: nx, y: ny }));
  };
  const onMockUp = () => { dragRef.current = null; };

  const handleDownloadMockup = async () => {
    downloadBlob(await canvasToBlob(mockupRef.current), `${slug()}-mockup.png`);
  };

  // ── Publish as a live Template ─────────────────────────────────────────
  const uploadFinal = async (blob, name) => {
    const form = new FormData();
    form.append('file', blob, name);
    const res = await fetch(`${API}/admin/design-generator/upload-final`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Failed to upload image');
    return (await res.json()).url;
  };

  const handlePublish = async () => {
    if (!templateName.trim()) { toast.error('Give the design a name first'); return; }
    const cats = Object.entries(categories).filter(([, v]) => v).map(([k]) => k);
    if (cats.length === 0) { toast.error('Pick at least one category'); return; }
    setPublishing(true);
    try {
      const printUrl = await uploadFinal(await dataUrlToBlob(printDataUrl), 'print.png');
      const mockupUrl = await uploadFinal(await canvasToBlob(mockupRef.current), 'mockup.png');

      // Head placement in the Builder's own units so customer faces start in the same spot
      const headPlacement = headImg ? {
        x: +(head.x / FRAME_W).toFixed(3),
        y: +(head.y / FRAME_H).toFixed(3),
        scale: +(head.width / (headImg.naturalWidth * 0.3)).toFixed(3),
        rotation: head.rotation,
      } : undefined;

      const textFields = {
        title: { font, size: line1.size, color: fill, outline: stroke, x: +(line1.x / FRAME_W).toFixed(3), y: +(line1.y / FRAME_H).toFixed(3) },
        subtitle: { font, size: line2.size, color: fill, outline: stroke, x: +(line2.x / FRAME_W).toFixed(3), y: +(line2.y / FRAME_H).toFixed(3) },
      };

      const pubRes = await fetch(`${API}/admin/design-generator/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_id: generationId,
          image_url: printUrl,
          product_image_url: mockupUrl,
          head_placement: headPlacement,
          text_fields: textFields,
          name: templateName,
          categories: cats,
          is_featured: isFeatured,
        }),
      });
      if (!pubRes.ok) throw new Error('Failed to publish template');
      setPublishedTemplate(await pubRes.json());
      toast.success('Design is live on the site!');
    } catch (e) {
      toast.error(e.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const checker = 'bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:20px_20px]';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide mb-2 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-[#FF2E63]" /> AI DESIGN GENERATOR
        </h2>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide mb-5 flex-wrap">
          {[['prompt', '1. IDEA'], ['options', '2. PICK'], ['edit', '3. CLEAN UP'], ['mockup', '4. MOCKUP & PUBLISH']].map(([id, label], i, arr) => (
            <span key={id} className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full ${step === id ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-400'}`}>{label}</span>
              {i < arr.length - 1 && <span className="text-gray-300">›</span>}
            </span>
          ))}
        </div>

        {/* ── Step 1: Idea + style ── */}
        {step === 'prompt' && (
          <div className="space-y-5">
            <div>
              <Label className="text-xs font-bold text-gray-500 tracking-wide">YOUR IDEA</Label>
              <Input value={shortPrompt} onChange={(e) => setShortPrompt(e.target.value)}
                placeholder='e.g. "A Nurse" or "Darth Vader"' className="mt-1" />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-500 tracking-wide">ART STYLE</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => handleStyleChange(s.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-colors ${style === s.id ? 'border-[#FF2E63] bg-[#FF2E63]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-bold text-sm text-[#252A34]">{s.label}</p>
                    <p className="text-xs text-gray-500">{s.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs font-bold text-gray-500 tracking-wide">DETAILED PROMPT (optional)</Label>
                <Button onClick={handleExpandPrompt} disabled={expanding} size="sm"
                  className="bg-[#252A34] hover:bg-[#1a1e26] text-white rounded-full px-4 font-bold gap-2">
                  {expanding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Improve Prompt with Claude
                </Button>
              </div>
              <Textarea value={expandedPrompt} onChange={(e) => setExpandedPrompt(e.target.value)} rows={4} className="mt-2"
                placeholder="Leave empty to generate straight from your idea + style, or click Improve Prompt for a detailed one you can edit." />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select value={numImages} onChange={(e) => setNumImages(parseInt(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {[1, 2, 4, 6, 8].map(n => <option key={n} value={n}>{n} image{n > 1 ? 's' : ''}</option>)}
              </select>
              <Button onClick={handleGenerate} disabled={generating}
                className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-6 font-bold gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {generating ? 'Generating (up to a minute)…' : 'Generate Designs'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Pick ── */}
        {step === 'options' && (
          <div className="space-y-4">
            <button onClick={() => setStep('prompt')} className="text-sm text-gray-500 hover:text-[#FF2E63] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to prompt
            </button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((url, i) => (
                <button key={i} onClick={() => handleSelectOption(url)}
                  className={`group relative rounded-xl overflow-hidden border-2 border-gray-200 hover:border-[#FF2E63] transition-colors ${checker}`}>
                  <img src={absUrl(url)} alt={`Option ${i + 1}`} className="w-full h-56 object-contain" crossOrigin="anonymous" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" /> Use this one
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <Button onClick={handleGenerate} disabled={generating} variant="outline" className="rounded-full gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </Button>
          </div>
        )}

        {/* ── Step 3: Clean up print file ── */}
        {step === 'edit' && (
          <div className="space-y-4">
            <button onClick={() => setStep('options')} className="text-sm text-gray-500 hover:text-[#FF2E63] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to options
            </button>
            <div className={`border border-gray-200 rounded-xl overflow-hidden ${checker} flex items-center justify-center p-2`}>
              {!canvasReady && <div className="py-24 text-gray-400 flex flex-col items-center gap-2"><ImageOff className="w-6 h-6" />Loading image…</div>}
              <canvas ref={canvasRef}
                style={{ maxWidth: '100%', maxHeight: '520px', touchAction: 'none', display: canvasReady ? 'block' : 'none', cursor: 'crosshair' }}
                onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp} />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Eraser className="w-4 h-4 text-gray-500" />
                <input type="range" min={10} max={150} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} />
                <span className="text-xs text-gray-500 w-10">{brushSize}px</span>
              </div>
              <Button onClick={handleUndo} disabled={!canUndo} variant="outline" size="sm" className="rounded-full gap-1">
                <Undo2 className="w-4 h-4" /> Undo
              </Button>
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-gray-500" />
                <Button onClick={() => handleExpandCanvas(0.1)} variant="outline" size="sm" className="rounded-full">+10% canvas</Button>
                <Button onClick={() => handleExpandCanvas(0.25)} variant="outline" size="sm" className="rounded-full">+25% canvas</Button>
              </div>
              <Button onClick={handleDownloadPrint} variant="outline" size="sm" className="rounded-full gap-1">
                <Download className="w-4 h-4" /> Download print file
              </Button>
              <Button onClick={goToMockup} disabled={!canvasReady}
                className="ml-auto bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-6 font-bold gap-2">
                Next: Mockup <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Mockup + publish ── */}
        {step === 'mockup' && (
          <div className="space-y-4">
            <button onClick={backToEdit} className="text-sm text-gray-500 hover:text-[#FF2E63] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to clean up
            </button>
            <p className="text-sm text-gray-500">
              This becomes the main product image on the website. Add a sample face and text, drag them into place, then publish.
              The print file stays clean, with no face or text.
            </p>

            <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
              {/* Mockup canvas — same 4:5 frame as the Builder */}
              <div>
                <div className={`rounded-xl overflow-hidden border border-gray-200 ${checker}`} style={{ width: '100%', maxWidth: FRAME_W }}>
                  <canvas ref={mockupRef}
                    style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: 'move' }}
                    onMouseDown={onMockDown} onMouseMove={onMockMove} onMouseUp={onMockUp} onMouseLeave={onMockUp}
                    onTouchStart={onMockDown} onTouchMove={onMockMove} onTouchEnd={onMockUp} />
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button onClick={handleDownloadMockup} variant="outline" size="sm" className="rounded-full gap-1">
                    <Download className="w-4 h-4" /> Download mockup
                  </Button>
                  <Button onClick={handleDownloadPrint} variant="outline" size="sm" className="rounded-full gap-1">
                    <Download className="w-4 h-4" /> Download print file
                  </Button>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Face */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 tracking-wide flex items-center gap-1"><User className="w-4 h-4" /> SAMPLE FACE</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['male', 'female'].map(slot => (
                      <Button key={slot} onClick={() => handleUseSample(slot)} disabled={!sampleFaces[slot] || headLoading}
                        size="sm" className="rounded-full bg-[#252A34] hover:bg-[#1a1e26] text-white capitalize">
                        Use {slot} sample
                      </Button>
                    ))}
                    {!sampleFaces.male && !sampleFaces.female && (
                      <span className="text-xs text-gray-400">Upload a face below, then save it as a sample to reuse it.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white cursor-pointer hover:border-[#FF2E63] text-sm font-medium">
                      {headLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {headImg ? 'Change face photo' : 'Upload face photo'}
                      <input type="file" accept="image/*" className="hidden" disabled={headLoading}
                        onChange={(e) => { handleFaceUpload(e.target.files && e.target.files[0]); e.target.value = ''; }} />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={autoCutout} onChange={(e) => setAutoCutout(e.target.checked)} />
                      Auto cut out face
                    </label>
                    {headImg && <button onClick={() => { setHeadImg(null); setHeadSrc(null); }} className="text-sm text-red-500 hover:underline">Remove face</button>}
                  </div>
                  {headImg && headSrc && (
                    <div className="flex items-center gap-3 flex-wrap text-sm">
                      <span className="text-xs text-gray-500">Keep this face for next time:</span>
                      {['male', 'female'].map(slot => (
                        <button key={slot} onClick={() => handleSaveSample(slot)} disabled={!!savingSample}
                          className="text-[#FF2E63] font-medium hover:underline disabled:opacity-50">
                          {savingSample === slot ? 'Saving…' : `Save as ${slot} sample`}
                        </button>
                      ))}
                    </div>
                  )}
                  {headImg && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Size</Label>
                        <input type="range" min={40} max={260} value={head.width} className="w-full"
                          onChange={(e) => setHead(h => ({ ...h, width: parseInt(e.target.value) }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Rotation ({head.rotation}°)</Label>
                        <input type="range" min={-45} max={45} value={head.rotation} className="w-full"
                          onChange={(e) => setHead(h => ({ ...h, rotation: parseInt(e.target.value) }))} />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">The face position is saved to the template, so customers' faces start in the same spot in the Builder.</p>
                </div>

                {/* Text */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 tracking-wide flex items-center gap-1"><Type className="w-4 h-4" /> TEXT</p>
                  <div className="grid grid-cols-[1fr_120px] gap-3 items-end">
                    <div><Label className="text-xs">Line 1 (name)</Label>
                      <Input value={line1.text} onChange={(e) => setLine1(l => ({ ...l, text: e.target.value }))} /></div>
                    <div><Label className="text-xs">Size {line1.size}</Label>
                      <input type="range" min={14} max={90} value={line1.size} className="w-full"
                        onChange={(e) => setLine1(l => ({ ...l, size: parseInt(e.target.value) }))} /></div>
                  </div>
                  <div className="grid grid-cols-[1fr_120px] gap-3 items-end">
                    <div><Label className="text-xs">Line 2 (event)</Label>
                      <Input value={line2.text} onChange={(e) => setLine2(l => ({ ...l, text: e.target.value }))} /></div>
                    <div><Label className="text-xs">Size {line2.size}</Label>
                      <input type="range" min={12} max={70} value={line2.size} className="w-full"
                        onChange={(e) => setLine2(l => ({ ...l, size: parseInt(e.target.value) }))} /></div>
                  </div>
                  <div>
                    <Label className="text-xs">Font</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {FONTS.map(f => (
                        <button key={f.id} onClick={() => setFont(f.id)}
                          className={`py-2 rounded-lg border-2 text-sm ${font === f.id ? 'border-[#FF2E63] bg-[#FF2E63]/5' : 'border-gray-200 bg-white'}`}
                          style={{ fontFamily: `"${f.id}", Arial, sans-serif` }}>{f.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-sm">Fill <input type="color" value={fill} onChange={(e) => setFill(e.target.value)} /></label>
                    <label className="flex items-center gap-2 text-sm">Outline <input type="color" value={stroke} onChange={(e) => setStroke(e.target.value)} /></label>
                    <label className="flex items-center gap-2 text-sm">Thickness
                      <input type="range" min={0} max={20} value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value))} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400">Drag the text on the image to move it.</p>
                </div>

                {/* Background */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 flex-wrap">
                  <p className="text-xs font-bold text-gray-500 tracking-wide">BACKGROUND</p>
                  <input type="color" value={bgColor} disabled={transparentBg} onChange={(e) => setBgColor(e.target.value)} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} />
                    Transparent
                  </label>
                </div>

                {/* Publish */}
                <div className="border-2 border-[#FF2E63]/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 tracking-wide">PUBLISH TO SITE</p>
                  <div>
                    <Label className="text-xs">Design name</Label>
                    <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Nurse" />
                  </div>
                  <div className="flex gap-4">
                    {['stag', 'hen', 'party'].map(c => (
                      <label key={c} className="flex items-center gap-1 text-sm capitalize">
                        <input type="checkbox" checked={!!categories[c]}
                          onChange={(e) => setCategories(prev => ({ ...prev, [c]: e.target.checked }))} />
                        {c}
                      </label>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                    Feature on homepage carousel
                  </label>
                  <Button onClick={handlePublish} disabled={publishing}
                    className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-5 font-bold gap-2">
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    Publish Live
                  </Button>
                  <p className="text-xs text-gray-400">Saves the clean print file as the template design and this mockup as its product image.</p>
                  {publishedTemplate && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 space-y-2">
                      <p className="font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Published!</p>
                      <p>"{publishedTemplate.name}" is now live in the Gallery and Builder.</p>
                      <button onClick={resetAll} className="text-[#FF2E63] font-medium hover:underline">Create another design →</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
