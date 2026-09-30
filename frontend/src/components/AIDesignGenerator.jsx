import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Wand2, Sparkles, Loader2, RefreshCw, Eraser, Download,
  Rocket, ArrowLeft, Undo2, Maximize2, Check, ImageOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAX_HISTORY = 20;

function absUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`;
}

export default function AIDesignGenerator() {
  // step: 'prompt' -> 'options' -> 'edit'
  const [step, setStep] = useState('prompt');

  // Prompt stage
  const [shortPrompt, setShortPrompt] = useState('');
  const [expandedPrompt, setExpandedPrompt] = useState('');
  const [expanding, setExpanding] = useState(false);
  const [numImages, setNumImages] = useState(4);
  const [generating, setGenerating] = useState(false);

  // Options stage
  const [generationId, setGenerationId] = useState(null);
  const [images, setImages] = useState([]);

  // Edit stage
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const historyRef = useRef([]);
  const [brushSize, setBrushSize] = useState(40);
  const [canvasReady, setCanvasReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

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
        body: JSON.stringify({ prompt: shortPrompt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to expand prompt');
      }
      const data = await res.json();
      setExpandedPrompt(data.expanded_prompt);
      toast.success('Prompt improved — edit it below if needed, then generate');
    } catch (e) {
      toast.error(e.message || 'Failed to improve prompt');
    } finally {
      setExpanding(false);
    }
  };

  // ── Generate images (Ideogram) ─────────────────────────────────────────
  const handleGenerate = async () => {
    const finalPrompt = expandedPrompt.trim() || shortPrompt.trim();
    if (!finalPrompt) { toast.error('Type an idea first'); return; }
    setGenerating(true);
    try {
      const res = await fetch(`${API}/admin/design-generator/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, num_images: numImages }),
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

  // ── Pick an option -> load into editor canvas ──────────────────────────
  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.toDataURL('image/png');
    historyRef.current.push(snap);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    setCanUndo(historyRef.current.length > 1);
  };

  const loadImageOntoCanvas = (url) => {
    const canvas = canvasRef.current;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 1000;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      historyRef.current = [canvas.toDataURL('image/png')];
      setCanUndo(false);
      setCanvasReady(true);
    };
    img.onerror = () => toast.error('Could not load that image for editing');
    img.src = url;
  };

  const handleSelectOption = (url) => {
    setStep('edit');
    setCanvasReady(false);
    setTimeout(() => loadImageOntoCanvas(absUrl(url)), 0);
  };

  // ── Eraser drawing ──────────────────────────────────────────────────────
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

  // ── Canvas resize (add transparent margin, keeps design centered) ──────
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

  // ── Export / download ────────────────────────────────────────────────
  const canvasToBlob = () => new Promise((resolve) => {
    canvasRef.current.toBlob((blob) => resolve(blob), 'image/png');
  });

  const handleDownload = async () => {
    const blob = await canvasToBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(templateName || 'design').replace(/\s+/g, '-')}-print.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ── Publish live as a Template ───────────────────────────────────────
  const handlePublish = async () => {
    if (!templateName.trim()) { toast.error('Give the design a name first'); return; }
    const cats = Object.entries(categories).filter(([, v]) => v).map(([k]) => k);
    if (cats.length === 0) { toast.error('Pick at least one category'); return; }
    setPublishing(true);
    try {
      const blob = await canvasToBlob();
      const form = new FormData();
      form.append('file', blob, 'final.png');
      const upRes = await fetch(`${API}/admin/design-generator/upload-final`, { method: 'POST', body: form });
      if (!upRes.ok) throw new Error('Failed to upload final design');
      const { url: finalUrl } = await upRes.json();

      const pubRes = await fetch(`${API}/admin/design-generator/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_id: generationId,
          image_url: finalUrl,
          name: templateName,
          categories: cats,
          is_featured: isFeatured,
        }),
      });
      if (!pubRes.ok) throw new Error('Failed to publish template');
      const template = await pubRes.json();
      setPublishedTemplate(template);
      toast.success('Design is live on the site!');
    } catch (e) {
      toast.error(e.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide mb-2 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-[#FF2E63]" /> AI DESIGN GENERATOR
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Type an idea, let Claude turn it into a detailed prompt, generate transparent-background artwork with Ideogram, clean it up, then publish it live as a real template.
        </p>

        {/* ── Step: Prompt ── */}
        {step === 'prompt' && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-gray-500 tracking-wide">YOUR IDEA</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={shortPrompt}
                  onChange={(e) => setShortPrompt(e.target.value)}
                  placeholder='e.g. "A Nurse" or "Darth Vader"'
                  className="flex-1"
                />
                <Button onClick={handleExpandPrompt} disabled={expanding}
                  className="bg-[#252A34] hover:bg-[#1a1e26] text-white rounded-full px-5 font-bold gap-2 flex-shrink-0">
                  {expanding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Improve Prompt
                </Button>
              </div>
            </div>

            {expandedPrompt && (
              <div>
                <Label className="text-xs font-bold text-gray-500 tracking-wide">EXPANDED PROMPT (edit if you like)</Label>
                <Textarea
                  value={expandedPrompt}
                  onChange={(e) => setExpandedPrompt(e.target.value)}
                  rows={5}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-gray-500 tracking-wide">OPTIONS</Label>
                <select value={numImages} onChange={(e) => setNumImages(parseInt(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {[1, 2, 4, 6, 8].map(n => <option key={n} value={n}>{n} image{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <Button onClick={handleGenerate} disabled={generating}
                className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-6 font-bold gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate Designs
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Options gallery ── */}
        {step === 'options' && (
          <div className="space-y-4">
            <button onClick={() => setStep('prompt')} className="text-sm text-gray-500 hover:text-[#FF2E63] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to prompt
            </button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((url, i) => (
                <button key={i} onClick={() => handleSelectOption(url)}
                  className="group relative rounded-xl overflow-hidden border-2 border-gray-200 hover:border-[#FF2E63] transition-colors bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:16px_16px]">
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

        {/* ── Step: Edit + Publish ── */}
        {step === 'edit' && (
          <div className="space-y-5">
            <button onClick={() => setStep('options')} className="text-sm text-gray-500 hover:text-[#FF2E63] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to options
            </button>

            <div className="grid md:grid-cols-[1fr_280px] gap-6">
              {/* Canvas editor */}
              <div>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:20px_20px] flex items-center justify-center p-2">
                  {!canvasReady && <div className="py-24 text-gray-400 flex flex-col items-center gap-2"><ImageOff className="w-6 h-6" />Loading image…</div>}
                  <canvas
                    ref={canvasRef}
                    style={{ maxWidth: '100%', maxHeight: '520px', touchAction: 'none', display: canvasReady ? 'block' : 'none', cursor: 'crosshair' }}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                  />
                </div>
                <div className="flex items-center gap-4 flex-wrap mt-3">
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
                  <Button onClick={handleDownload} variant="outline" size="sm" className="rounded-full gap-1">
                    <Download className="w-4 h-4" /> Download print file
                  </Button>
                </div>
              </div>

              {/* Publish panel */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 h-fit">
                <p className="text-xs font-bold text-gray-500 tracking-wide">PUBLISH TO SITE</p>
                <div>
                  <Label className="text-xs">Design name</Label>
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Nurse" />
                </div>
                <div>
                  <Label className="text-xs">Categories</Label>
                  <div className="flex gap-3 mt-1">
                    {['stag', 'hen', 'party'].map(c => (
                      <label key={c} className="flex items-center gap-1 text-sm capitalize">
                        <input type="checkbox" checked={!!categories[c]}
                          onChange={(e) => setCategories(prev => ({ ...prev, [c]: e.target.checked }))} />
                        {c}
                      </label>
                    ))}
                  </div>
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
        )}
      </div>
    </div>
  );
}
