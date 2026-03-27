import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShoppingBag, Download, RefreshCw, LogOut,
  CheckCircle, Clock, Truck, Package, Eye, X,
  Plus, Shirt, Trash2, Edit2, Star, Upload
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'swapAdmin2025';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  shipped: 'bg-purple-100 text-purple-800',
};
const STATUS_ICONS = { pending: Clock, processing: Package, completed: CheckCircle, shipped: Truck };

const BLANK_TEMPLATE = {
  id: '', name: '', categories: 'stag',
  body_image_url: '', product_image_url: '',
  head_x: '0.5', head_y: '0.22', head_scale: '0.9',
  title_color: '#FFFFFF', title_outline: '#000000',
  subtitle_color: '#FFE600', subtitle_outline: '#000000',
  is_popular: false, is_new: false,
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === 'true');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [savingReview, setSavingReview] = useState(false);

  // Pricing & discounts
  const DEFAULT_TIERS = [
    { min_qty: 1,  max_qty: 1,    price: 17.99, label: '1 shirt' },
    { min_qty: 2,  max_qty: 6,    price: 15.99, label: '2–6 shirts' },
    { min_qty: 7,  max_qty: 12,   price: 13.99, label: '7–12 shirts' },
    { min_qty: 13, max_qty: 20,   price: 12.99, label: '13–20 shirts' },
    { min_qty: 21, max_qty: 9999, price: 11.99, label: '21+ shirts' },
  ];
  const [pricingForm, setPricingForm] = useState({ back_print_price: 2.50, tiers: DEFAULT_TIERS });
  const [savingPricing, setSavingPricing] = useState(false);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [newCode, setNewCode] = useState({ code: '', percent_off: 10 });
  const [trackingConfig, setTrackingConfig] = useState({ google_tag_id: '', facebook_pixel_id: '', facebook_access_token: '' });
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name:'', location:'', event:'', rating:5, text:'', verified:true });
  const [reviewPhoto, setReviewPhoto] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState(BLANK_TEMPLATE);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    if (authed) { fetchStats(); fetchOrders(); fetchTemplates(); fetchReviews(); fetchPricing(); fetchDiscountCodes(); fetchTrackingConfig(); }
  }, [authed]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', 'true');
      setAuthed(true);
      toast.success('Welcome back!');
    } else { toast.error('Incorrect password'); }
  };

  const handleLogout = () => { sessionStorage.removeItem('admin_authed'); setAuthed(false); };

  const fetchStats = async () => {
    try { const r = await fetch(`${API}/admin/stats`); setStats(await r.json()); } catch(e) {}
  };
  const fetchOrders = async () => {
    setLoading(true);
    try { const r = await fetch(`${API}/orders`); setOrders(await r.json()); } catch(e) { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };
  const fetchTemplates = async () => {
    try { const r = await fetch(`${API}/templates`); setTemplates(await r.json()); } catch(e) {}
  };

  const fetchReviews = async () => {
    try { const r = await fetch(`${API}/admin/reviews`); setReviews(await r.json()); } catch(e) {}
  };

  const handleSaveReview = async () => {
    if (!reviewForm.name.trim() || !reviewForm.text.trim()) { toast.error('Name and review text required'); return; }
    setSavingReview(true);
    try {
      const fd = new FormData();
      fd.append('name', reviewForm.name);
      fd.append('text', reviewForm.text);
      fd.append('rating', String(reviewForm.rating));
      fd.append('location', reviewForm.location || '');
      fd.append('event', reviewForm.event || '');
      fd.append('verified', reviewForm.verified ? 'true' : 'false');
      if (reviewPhoto) fd.append('photo', reviewPhoto);

      const url = editingReview
        ? `${API}/admin/reviews/${editingReview.id}/update`
        : `${API}/admin/reviews`;

      const res = await fetch(url, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.detail || 'Save failed');

      toast.success(editingReview ? 'Review updated!' : 'Review added!');
      setShowReviewForm(false);
      setEditingReview(null);
      setReviewForm({ name:'', location:'', event:'', rating:5, text:'', verified:true });
      setReviewPhoto(null);
      fetchReviews();
    } catch(e) {
      console.error('Save review error:', e);
      toast.error(e.message || 'Failed to save review');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    await fetch(`${API}/admin/reviews/${id}`, { method: 'DELETE' });
    toast.success('Review deleted');
    fetchReviews();
  };

  const handleToggleApproved = async (review) => {
    await fetch(`${API}/admin/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: !review.approved })
    });
    fetchReviews();
  };

  const fetchPricing = async () => {
    try {
      const r = await fetch(`${API}/pricing`);
      if (r.ok) {
        const data = await r.json();
        setPricingForm({ back_print_price: data.back_print_price, tiers: data.tiers || DEFAULT_TIERS });
      }
    } catch(e) {}
  };

  const fetchDiscountCodes = async () => {
    try {
      const r = await fetch(`${API}/admin/discount-codes`);
      if (r.ok) setDiscountCodes(await r.json());
    } catch(e) {}
  };

  const handleSavePricing = async () => {
    setSavingPricing(true);
    try {
      const r = await fetch(`${API}/admin/pricing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ back_print_price: parseFloat(pricingForm.back_print_price), tiers: pricingForm.tiers })
      });
      if (!r.ok) throw new Error();
      toast.success('Pricing updated!');
    } catch(e) { toast.error('Failed to update pricing'); }
    finally { setSavingPricing(false); }
  };

  const handleAddDiscountCode = async () => {
    if (!newCode.code.trim()) { toast.error('Enter a code'); return; }
    setSavingCode(true);
    try {
      const r = await fetch(`${API}/admin/discount-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode.code.toUpperCase(), percent_off: parseInt(newCode.percent_off) })
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || 'Failed');
      }
      toast.success(`Code ${newCode.code.toUpperCase()} created!`);
      setNewCode({ code: '', percent_off: 10 });
      fetchDiscountCodes();
    } catch(e) { toast.error(e.message || 'Failed to create code'); }
    finally { setSavingCode(false); }
  };

  const handleDeleteCode = async (code) => {
    if (!window.confirm(`Delete code ${code}?`)) return;
    await fetch(`${API}/admin/discount-codes/${code}`, { method: 'DELETE' });
    toast.success('Code deleted');
    fetchDiscountCodes();
  };

  const handleToggleCode = async (code, active) => {
    await fetch(`${API}/admin/discount-codes/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    });
    fetchDiscountCodes();
  };

  const fetchTrackingConfig = async () => {
    try {
      const r = await fetch(`${API}/admin/tracking-config`);
      if (r.ok) setTrackingConfig(await r.json());
    } catch(e) {}
  };

  const handleSaveTracking = async () => {
    setSavingTracking(true);
    try {
      const r = await fetch(`${API}/admin/tracking-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingConfig)
      });
      if (!r.ok) throw new Error();
      toast.success('Tracking config saved!');
    } catch(e) { toast.error('Failed to save tracking config'); }
    finally { setSavingTracking(false); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await fetch(`${API}/orders/${orderId}/status?status=${status}`, { method: 'PATCH' });
      toast.success(`Updated to ${status}`);
      fetchOrders(); fetchStats();
      if (selectedOrder?.id === orderId) setSelectedOrder(p => ({ ...p, status }));
    } catch(e) { toast.error('Failed to update status'); }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.id || !templateForm.name || !templateForm.body_image_url) {
      toast.error('ID, name and design image URL are required'); return;
    }
    setSavingTemplate(true);
    try {
      const payload = {
        id: templateForm.id.toLowerCase().replace(/\s+/g, '-'),
        name: templateForm.name,
        categories: templateForm.categories.split(',').map(c => c.trim()),
        category: templateForm.categories.split(',')[0].trim(),
        body_image_url: templateForm.body_image_url,
        product_image_url: templateForm.product_image_url || templateForm.body_image_url,
        head_placement: { x: parseFloat(templateForm.head_x), y: parseFloat(templateForm.head_y), scale: parseFloat(templateForm.head_scale), rotation: 0 },
        text_fields: {
          title: { font: 'Anton', size: 48, color: templateForm.title_color, outline: templateForm.title_outline },
          subtitle: { font: 'Anton', size: 32, color: templateForm.subtitle_color, outline: templateForm.subtitle_outline },
        },
        is_popular: templateForm.is_popular,
        is_new: templateForm.is_new,
      };
      const r = await fetch(`${API}/templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('Failed to save');
      toast.success('Template saved!');
      setShowTemplateForm(false);
      setTemplateForm(BLANK_TEMPLATE);
      fetchTemplates(); fetchStats();
    } catch(e) { toast.error('Failed to save template'); }
    finally { setSavingTemplate(false); }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await fetch(`${API}/templates/${templateId}`, { method: 'DELETE' });
      toast.success('Template deleted');
      fetchTemplates(); fetchStats();
    } catch(e) { toast.error('Failed to delete template'); }
  };

  const filteredOrders = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);
  const setF = (k, v) => setTemplateForm(f => ({ ...f, [k]: v }));

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FF2E63] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-['Anton'] text-2xl text-[#252A34] tracking-wide">ADMIN DASHBOARD</h1>
            <p className="text-gray-500 text-sm mt-2">Swap My Face Tees</p>
          </div>
          <div className="space-y-4">
            <Input type="password" placeholder="Enter admin password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="text-center" />
            <Button onClick={handleLogin} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full font-bold uppercase tracking-wider py-5">Login</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-['Anton'] text-xl text-[#252A34] tracking-wide">ADMIN DASHBOARD</h1>
            <p className="text-xs text-gray-400">Swap My Face Tees</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { fetchOrders(); fetchTemplates(); fetchStats(); }} className="rounded-full gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout} className="rounded-full gap-2 text-sm text-red-500 border-red-200">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: stats.total_orders, color: 'bg-[#FF2E63]' },
              { label: 'Pending', value: stats.pending_orders, color: 'bg-yellow-500' },
              { label: 'Templates', value: stats.total_templates, color: 'bg-[#08D9D6]' },
              { label: 'Revenue', value: `£${stats.total_revenue?.toFixed(2)}`, color: 'bg-green-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className={`w-3 h-3 rounded-full ${s.color} mb-3`} />
                <p className="text-2xl font-bold text-[#252A34]">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {[{id:'orders',label:'Orders',icon:ShoppingBag},{id:'templates',label:'Templates',icon:Shirt},{id:'reviews',label:'Reviews',icon:Star},{id:'settings',label:'Settings',icon:Edit2}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab===tab.id?'border-[#FF2E63] text-[#FF2E63]':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* ── Orders Tab ── */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">ORDERS</h2>
              <div className="flex gap-2 flex-wrap">
                {['all','pending','processing','completed','shipped'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${statusFilter===s?'bg-[#FF2E63] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-200" /><p>No orders yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Order</th>
                      <th className="px-6 py-3 text-left">Customer</th>
                      <th className="px-6 py-3 text-left">Items</th>
                      <th className="px-6 py-3 text-left">Total</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrders.map(order => {
                      const StatusIcon = STATUS_ICONS[order.status] || Clock;
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4"><p className="font-mono text-sm font-bold text-[#252A34]">{order.order_number}</p></td>
                          <td className="px-6 py-4"><p className="text-sm font-medium text-gray-700">{order.customer_name}</p><p className="text-xs text-gray-400">{order.customer_email}</p></td>
                          <td className="px-6 py-4"><span className="text-sm text-gray-600">{order.items?.length || 0} item{order.items?.length !== 1?'s':''}</span></td>
                          <td className="px-6 py-4"><span className="font-bold text-[#FF2E63]">£{order.total_amount?.toFixed(2)}</span></td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]||'bg-gray-100 text-gray-600'}`}>
                              <StatusIcon className="w-3 h-3" />{order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4"><span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="View"><Eye className="w-4 h-4"/></button>
                              <button onClick={() => window.open(`${API}/orders/${order.id}/download`, '_blank')} className="p-1.5 rounded-lg hover:bg-[#FF2E63]/10 text-[#FF2E63] transition-colors" title="Download"><Download className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Templates Tab ── */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">TEMPLATES ({templates.length})</h2>
              <Button onClick={() => { setTemplateForm(BLANK_TEMPLATE); setShowTemplateForm(true); }} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full gap-2">
                <Plus className="w-4 h-4" /> Add Template
              </Button>
            </div>

            {/* Add template form */}
            {showTemplateForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">NEW TEMPLATE</h3>
                  <button onClick={() => setShowTemplateForm(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400"/></button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Template ID <span className="text-[#FF2E63]">*</span></Label>
                    <Input value={templateForm.id} onChange={e=>setF('id',e.target.value)} placeholder="e.g. gangster-stag" className="mt-1 font-mono text-sm"/>
                    <p className="text-xs text-gray-400 mt-1">Unique slug, no spaces</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Display Name <span className="text-[#FF2E63]">*</span></Label>
                    <Input value={templateForm.name} onChange={e=>setF('name',e.target.value)} placeholder="e.g. Gangster Stag" className="mt-1"/>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Categories</Label>
                  <Input value={templateForm.categories} onChange={e=>setF('categories',e.target.value)} placeholder="stag, party" className="mt-1"/>
                  <p className="text-xs text-gray-400 mt-1">Comma separated: stag, hen, party</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Design Image URL (no head) <span className="text-[#FF2E63]">*</span></Label>
                    <Input value={templateForm.body_image_url} onChange={e=>setF('body_image_url',e.target.value)} placeholder="https://res.cloudinary.com/..." className="mt-1 text-sm font-mono"/>
                    <p className="text-xs text-gray-400 mt-1">Upload PNG to Cloudinary and paste the URL here</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Preview Image URL (with sample head)</Label>
                    <Input value={templateForm.product_image_url} onChange={e=>setF('product_image_url',e.target.value)} placeholder="https://res.cloudinary.com/..." className="mt-1 text-sm font-mono"/>
                    <p className="text-xs text-gray-400 mt-1">JPG shown in gallery. Leave blank to use design image.</p>
                  </div>
                </div>

                {/* Preview URLs side by side */}
                {(templateForm.body_image_url || templateForm.product_image_url) && (
                  <div className="flex gap-4">
                    {templateForm.body_image_url && (
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">Design preview:</p>
                        <img src={templateForm.body_image_url} alt="design" className="w-full max-h-40 object-contain bg-gray-50 rounded-xl border border-gray-100" crossOrigin="anonymous" onError={e => e.target.style.display='none'}/>
                      </div>
                    )}
                    {templateForm.product_image_url && (
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">Gallery preview:</p>
                        <img src={templateForm.product_image_url} alt="product" className="w-full max-h-40 object-contain bg-gray-50 rounded-xl border border-gray-100" crossOrigin="anonymous" onError={e => e.target.style.display='none'}/>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Head Placement (starting position)</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[{k:'head_x',label:'X centre (0-1)',hint:'0.5 = centred'},{k:'head_y',label:'Y position (0-1)',hint:'0.22 = near top'},{k:'head_scale',label:'Scale',hint:'0.9 = default size'}].map(f=>(
                      <div key={f.k}>
                        <Label className="text-xs text-gray-500">{f.label}</Label>
                        <Input value={templateForm[f.k]} onChange={e=>setF(f.k,e.target.value)} className="mt-1 text-sm"/>
                        <p className="text-xs text-gray-400 mt-0.5">{f.hint}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Default Text Colours</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">Title</p>
                      <div className="flex items-center gap-2"><input type="color" value={templateForm.title_color} onChange={e=>setF('title_color',e.target.value)} className="w-8 h-8 rounded cursor-pointer"/><Label className="text-xs">Text colour ({templateForm.title_color})</Label></div>
                      <div className="flex items-center gap-2"><input type="color" value={templateForm.title_outline} onChange={e=>setF('title_outline',e.target.value)} className="w-8 h-8 rounded cursor-pointer"/><Label className="text-xs">Stroke ({templateForm.title_outline})</Label></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">Subtitle</p>
                      <div className="flex items-center gap-2"><input type="color" value={templateForm.subtitle_color} onChange={e=>setF('subtitle_color',e.target.value)} className="w-8 h-8 rounded cursor-pointer"/><Label className="text-xs">Text colour ({templateForm.subtitle_color})</Label></div>
                      <div className="flex items-center gap-2"><input type="color" value={templateForm.subtitle_outline} onChange={e=>setF('subtitle_outline',e.target.value)} className="w-8 h-8 rounded cursor-pointer"/><Label className="text-xs">Stroke ({templateForm.subtitle_outline})</Label></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={templateForm.is_popular} onChange={e=>setF('is_popular',e.target.checked)} className="rounded"/><span className="text-sm text-gray-700">Mark as Popular</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={templateForm.is_new} onChange={e=>setF('is_new',e.target.checked)} className="rounded"/><span className="text-sm text-gray-700">Mark as New</span></label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="flex-1 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full font-bold py-5">
                    {savingTemplate ? 'Saving...' : 'Save Template'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowTemplateForm(false)} className="rounded-full px-6">Cancel</Button>
                </div>
              </div>
            )}

            {/* Templates grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {templates.map(t => (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img src={t.product_image_url || t.body_image_url} alt={t.name} className="w-full h-full object-contain p-2" crossOrigin="anonymous"/>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-[#252A34] truncate">{t.name}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(t.categories || [t.category]).map(c=><span key={c} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full capitalize">{c}</span>)}
                      {t.is_popular && <span className="text-xs bg-[#FF2E63]/10 text-[#FF2E63] px-1.5 py-0.5 rounded-full">Popular</span>}
                      {t.is_new && <span className="text-xs bg-[#08D9D6]/10 text-[#08D9D6] px-1.5 py-0.5 rounded-full">New</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 font-mono truncate">{t.id}</p>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="mt-3 flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3 h-3"/> Delete
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && <div className="col-span-4 text-center py-12 text-gray-400">No templates yet</div>}
            </div>
          </div>
        )}

        {/* ── Reviews Tab ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-['Anton'] text-lg text-[#252A34'] tracking-wide">REVIEWS ({reviews.length})</h2>
              <Button onClick={() => { setEditingReview(null); setReviewForm({ name:'', location:'', event:'', rating:5, text:'', verified:true }); setReviewPhoto(null); setShowReviewForm(true); }}
                className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full gap-2">
                <Plus className="w-4 h-4" /> Add Review
              </Button>
            </div>

            {/* Add/Edit Review Form */}
            {showReviewForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">{editingReview ? 'EDIT REVIEW' : 'ADD REVIEW'}</h3>
                  <button onClick={() => { setShowReviewForm(false); setEditingReview(null); }} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400"/></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Name</Label><Input value={reviewForm.name} onChange={e=>setReviewForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Sarah M." className="mt-1"/></div>
                  <div><Label>Location</Label><Input value={reviewForm.location} onChange={e=>setReviewForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Manchester" className="mt-1"/></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Event</Label>
                    <select value={reviewForm.event} onChange={e=>setReviewForm(f=>({...f,event:e.target.value}))} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      {['Stag Do','Hen Party','Birthday Party','Work Event','Other'].map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><Label className="mb-2 block">Rating</Label>
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4,5].map(i=>(
                        <button key={i} onClick={()=>setReviewForm(f=>({...f,rating:i}))}>
                          <Star className={`w-7 h-7 ${i<=reviewForm.rating?'fill-[#FFE600] text-[#FFE600]':'text-gray-200'}`}/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div><Label>Review Text</Label><Textarea value={reviewForm.text} onChange={e=>setReviewForm(f=>({...f,text:e.target.value}))} placeholder="Customer review..." rows={3} className="mt-1"/></div>
                <div>
                  <Label className="mb-1 block">Photo (optional)</Label>
                  {reviewPhoto ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img src={URL.createObjectURL(reviewPhoto)} alt="preview" className="w-12 h-12 rounded-lg object-cover"/>
                      <p className="text-sm text-gray-600 flex-1 truncate">{reviewPhoto.name}</p>
                      <button onClick={()=>setReviewPhoto(null)} className="text-red-400"><X className="w-4 h-4"/></button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#FF2E63]">
                      <Upload className="w-4 h-4 text-gray-400"/>
                      <span className="text-sm text-gray-500">Upload customer photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e=>setReviewPhoto(e.target.files?.[0]||null)}/>
                    </label>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={reviewForm.verified} onChange={e=>setReviewForm(f=>({...f,verified:e.target.checked}))} className="rounded"/>
                  <span className="text-sm text-gray-700">Mark as Verified</span>
                </label>
                <div className="flex gap-3">
                  <Button onClick={handleSaveReview} disabled={savingReview} className="flex-1 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-4 font-bold">
                    {savingReview ? 'Saving...' : editingReview ? 'Update Review' : 'Add Review'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowReviewForm(false); setEditingReview(null); }} className="rounded-full px-6">Cancel</Button>
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {review.photo_url && <img src={review.photo_url} alt={review.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" crossOrigin="anonymous"/>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[#252A34]">{review.name}</p>
                          {review.location && <span className="text-xs text-gray-400">{review.location}</span>}
                          {review.event && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{review.event}</span>}
                          {review.verified && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">✓ Verified</span>}
                        </div>
                        <div className="flex gap-0.5 my-1">
                          {[1,2,3,4,5].map(i=><Star key={i} className={`w-3.5 h-3.5 ${i<=review.rating?'fill-[#FFE600] text-[#FFE600]':'text-gray-200'}`}/>)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">"{review.text}"</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleToggleApproved(review)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${review.approved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {review.approved ? 'Live' : 'Hidden'}
                      </button>
                      <button onClick={() => { setEditingReview(review); setReviewForm({ name:review.name, location:review.location||'', event:review.event||'', rating:review.rating, text:review.text, verified:review.verified||false }); setShowReviewForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteReview(review.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && <div className="text-center py-12 text-gray-400">No reviews yet — add your first one!</div>}
            </div>
          </div>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && (
          <div className="space-y-8">

            {/* Pricing */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">PRICING TIERS</h2>
              <p className="text-sm text-gray-500">Set prices per shirt based on quantity. The lowest price shows as "from £X" across the site.</p>

              {/* Tier editor */}
              <div className="space-y-3">
                {(pricingForm.tiers || []).map((tier, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{tier.label}</p>
                      <p className="text-xs text-gray-400">{tier.min_qty === tier.max_qty ? `${tier.min_qty} shirt` : tier.max_qty === 9999 ? `${tier.min_qty}+ shirts` : `${tier.min_qty}–${tier.max_qty} shirts`}</p>
                    </div>
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                      <input
                        type="number" step="0.01" min="0"
                        value={tier.price}
                        onChange={e => {
                          const updated = [...pricingForm.tiers];
                          updated[i] = { ...updated[i], price: parseFloat(e.target.value) || 0 };
                          setPricingForm(f => ({ ...f, tiers: updated }));
                        }}
                        className="w-full pl-7 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E63]/20 focus:border-[#FF2E63]"
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-20 text-right">per shirt</span>
                  </div>
                ))}
              </div>

              {/* Back print */}
              <div>
                <Label>Back Print Add-on (£)</Label>
                <div className="relative mt-1 w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                  <Input
                    type="number" step="0.01" min="0"
                    value={pricingForm.back_print_price}
                    onChange={e => setPricingForm(f => ({...f, back_print_price: e.target.value}))}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Extra cost per shirt for back name print</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-2">Site will show</p>
                <p>From <strong className="text-[#FF2E63]">£{Math.min(...(pricingForm.tiers||[]).map(t=>t.price)).toFixed(2)}</strong> per shirt</p>
                <p className="text-xs text-gray-400 mt-1">Back print: +£{parseFloat(pricingForm.back_print_price||0).toFixed(2)} per shirt</p>
              </div>

              <Button onClick={handleSavePricing} disabled={savingPricing} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider">
                {savingPricing ? 'Saving...' : 'Save Pricing'}
              </Button>
            </div>

            {/* Tracking & Pixels */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">TRACKING & PIXELS</h2>
              <p className="text-sm text-gray-500">Add your pixel IDs here — leave blank to disable. Scripts load automatically when IDs are saved.</p>

              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    Google Tag ID
                  </Label>
                  <Input
                    value={trackingConfig.google_tag_id}
                    onChange={e => setTrackingConfig(t => ({...t, google_tag_id: e.target.value}))}
                    placeholder="e.g. G-XXXXXXXXXX or AW-XXXXXXXXX"
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Found in Google Ads → Tools → Conversions, or Google Analytics → Admin → Data Streams</p>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                    Facebook Pixel ID
                  </Label>
                  <Input
                    value={trackingConfig.facebook_pixel_id}
                    onChange={e => setTrackingConfig(t => ({...t, facebook_pixel_id: e.target.value}))}
                    placeholder="e.g. 1234567890123456"
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Found in Facebook Business Manager → Events Manager → Your Pixel</p>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                    Facebook Conversions API Token
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Server-side</span>
                  </Label>
                  <Input
                    type="password"
                    value={trackingConfig.facebook_access_token}
                    onChange={e => setTrackingConfig(t => ({...t, facebook_access_token: e.target.value}))}
                    placeholder="Your Conversions API access token"
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Found in Events Manager → Settings → Conversions API → Generate Access Token. Enables server-side purchase tracking that bypasses ad blockers.</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 space-y-1">
                <p className="font-bold">What gets tracked automatically:</p>
                <p>• Google — page views on every page</p>
                <p>• Facebook Pixel — page views + Purchase event on order completion</p>
                <p>• Facebook Conversions API — Purchase event sent server-side when order is placed (most accurate)</p>
              </div>

              <Button onClick={handleSaveTracking} disabled={savingTracking} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider">
                {savingTracking ? 'Saving...' : 'Save Tracking Config'}
              </Button>
            </div>

            {/* Discount Codes */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">DISCOUNT CODES</h2>

              {/* Add new code */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="font-medium text-gray-700 text-sm">Create New Code</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Label>Code</Label>
                    <Input
                      value={newCode.code}
                      onChange={e => setNewCode(c => ({...c, code: e.target.value.toUpperCase()}))}
                      placeholder="e.g. STAG10"
                      className="mt-1 uppercase"
                    />
                  </div>
                  <div>
                    <Label>% Off</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number" min="1" max="100"
                        value={newCode.percent_off}
                        onChange={e => setNewCode(c => ({...c, percent_off: e.target.value}))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>
                </div>
                <Button onClick={handleAddDiscountCode} disabled={savingCode} className="bg-[#252A34] hover:bg-black text-white rounded-full px-6 py-2.5 font-bold uppercase tracking-wider text-sm gap-2">
                  <Plus className="w-4 h-4" /> {savingCode ? 'Creating...' : 'Create Code'}
                </Button>
              </div>

              {/* Existing codes */}
              <div className="space-y-3">
                {discountCodes.length === 0 ? (
                  <p className="text-center py-6 text-gray-400">No discount codes yet</p>
                ) : discountCodes.map(code => (
                  <div key={code.code} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#252A34] text-white px-3 py-1.5 rounded-lg font-['Anton'] tracking-wider text-sm">{code.code}</div>
                      <div>
                        <p className="font-bold text-[#FF2E63]">{code.percent_off}% off</p>
                        <p className="text-xs text-gray-400">{code.uses || 0} uses</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCode(code.code, code.active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${code.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {code.active ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={() => handleDeleteCode(code.code)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">{selectedOrder.order_number}</h2>
                <p className="text-sm text-gray-500">{selectedOrder.customer_name} — {selectedOrder.customer_email}</p>
                {selectedOrder.customer_phone && <p className="text-sm text-gray-500">📱 {selectedOrder.customer_phone}</p>}
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 tracking-wide mb-3">UPDATE STATUS</p>
                <div className="flex gap-2 flex-wrap">
                  {['pending','processing','completed','shipped'].map(s=>(
                    <button key={s} onClick={() => updateStatus(selectedOrder.id, s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium capitalize border-2 ${selectedOrder.status===s?'bg-[#FF2E63] border-[#FF2E63] text-white':'border-gray-200 text-gray-600 hover:border-[#FF2E63]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 tracking-wide mb-3">ORDER ITEMS ({selectedOrder.items?.length})</p>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item,i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-[#252A34]">{item.templateName}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.shirtType && <span className="capitalize">{item.shirtType} • </span>}Size {item.size}{item.shirtColor && ` • ${item.shirtColor}`}</p>
                          {item.titleText && <p className="text-sm text-gray-500">Line 1: "{item.titleText}"</p>}
                          {item.subtitleText && <p className="text-sm text-gray-500">Line 2/3: "{item.subtitleText}"</p>}
                          {item.hasBackPrint && item.backName && <p className="text-sm text-gray-500">Back: {item.backName}</p>}
                        </div>
                        <span className="font-bold text-[#FF2E63]">£{((item.price||19.99)+(item.hasBackPrint?(item.backPrice||2.50):0)).toFixed(2)}</span>
                      </div>
                      {item.previewUrl && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-gray-500 mb-2 tracking-wide">DESIGN PREVIEW</p>
                          <div className="flex items-start gap-3">
                            <img src={item.previewUrl.startsWith('http')?item.previewUrl:`${process.env.REACT_APP_BACKEND_URL}${item.previewUrl}`} alt="Design" className="w-24 h-28 object-contain bg-white rounded-lg border border-gray-200" crossOrigin="anonymous"/>
                            <a href={item.previewUrl.startsWith('http')?item.previewUrl:`${process.env.REACT_APP_BACKEND_URL}${item.previewUrl}`} target="_blank" rel="noreferrer" className="text-xs text-[#FF2E63] font-medium hover:underline flex items-center gap-1 mt-1">
                              <Download className="w-3 h-3"/> Download print file
                            </a>
                          </div>
                        </div>
                      )}
                      {item.headUrl && (
                        <div className="mt-3 flex items-center gap-3">
                          <img src={item.headUrl.startsWith('http')?item.headUrl:`${process.env.REACT_APP_BACKEND_URL}${item.headUrl}`} alt="Face" className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" crossOrigin="anonymous"/>
                          <a href={item.headUrl.startsWith('http')?item.headUrl:`${process.env.REACT_APP_BACKEND_URL}${item.headUrl}`} target="_blank" rel="noreferrer" className="text-xs text-[#FF2E63] font-medium hover:underline">Download face PNG</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#252A34] text-white rounded-xl p-5 flex justify-between items-center">
                <span className="font-['Anton'] text-lg tracking-wide">ORDER TOTAL</span>
                <span className="font-['Anton'] text-2xl text-[#F9ED69]">£{selectedOrder.total_amount?.toFixed(2)}</span>
              </div>
              <Button onClick={() => window.open(`${API}/orders/${selectedOrder.id}/download`, '_blank')} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-5 font-bold uppercase tracking-wider gap-2">
                <Download className="w-5 h-5"/> Download All Files (ZIP)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
