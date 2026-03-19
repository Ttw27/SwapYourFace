import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShoppingBag, Download, RefreshCw, LogOut,
  CheckCircle, Clock, Truck, Package, Eye, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'swapAdmin2025';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  shipped: 'bg-purple-100 text-purple-800',
};

const STATUS_ICONS = {
  pending: Clock,
  processing: Package,
  completed: CheckCircle,
  shipped: Truck,
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === 'true');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (authed) {
      fetchStats();
      fetchOrders();
    }
  }, [authed]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', 'true');
      setAuthed(true);
      toast.success('Welcome back!');
    } else {
      toast.error('Incorrect password');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authed');
    setAuthed(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/admin/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await fetch(`${API}/orders/${orderId}/status?status=${status}`, { method: 'PATCH' });
      toast.success(`Status updated to ${status}`);
      fetchOrders();
      fetchStats();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status }));
      }
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const downloadOrderFiles = (orderId, orderNumber) => {
    window.open(`${API}/orders/${orderId}/download`, '_blank');
    toast.success(`Downloading files for ${orderNumber}`);
  };

  const filteredOrders = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);

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
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="text-center"
            />
            <Button onClick={handleLogin} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full font-bold uppercase tracking-wider py-5">
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-['Anton'] text-xl text-[#252A34] tracking-wide">ADMIN DASHBOARD</h1>
            <p className="text-xs text-gray-400">Swap My Face Tees</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchOrders} className="rounded-full gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout} className="rounded-full gap-2 text-sm text-red-500 border-red-200">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

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

        {/* Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">ORDERS</h2>
            <div className="flex gap-2 flex-wrap">
              {['all','pending','processing','completed','shipped'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p>No orders yet</p>
            </div>
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
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-bold text-[#252A34]">{order.order_number}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-700">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">{order.customer_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#FF2E63]">£{order.total_amount?.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            <StatusIcon className="w-3 h-3" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="View order">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => downloadOrderFiles(order.id, order.order_number)} className="p-1.5 rounded-lg hover:bg-[#FF2E63]/10 text-[#FF2E63] transition-colors" title="Download files">
                              <Download className="w-4 h-4" />
                            </button>
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
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">{selectedOrder.order_number}</h2>
                <p className="text-sm text-gray-500">{selectedOrder.customer_name} — {selectedOrder.customer_email}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status updater */}
              <div>
                <p className="text-xs font-bold text-gray-500 tracking-wide mb-3">UPDATE STATUS</p>
                <div className="flex gap-2 flex-wrap">
                  {['pending','processing','completed','shipped'].map(s => (
                    <button key={s} onClick={() => updateStatus(selectedOrder.id, s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors border-2 ${selectedOrder.status === s ? 'bg-[#FF2E63] border-[#FF2E63] text-white' : 'border-gray-200 text-gray-600 hover:border-[#FF2E63]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order items */}
              <div>
                <p className="text-xs font-bold text-gray-500 tracking-wide mb-3">ORDER ITEMS ({selectedOrder.items?.length})</p>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-[#252A34]">{item.templateName}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.shirtType && <span className="capitalize">{item.shirtType} • </span>}
                            Size: {item.size} • Qty: {item.quantity}
                            {item.shirtColor && <span> • Colour: {item.shirtColor}</span>}
                          </p>
                          {item.titleText && <p className="text-sm text-gray-500">Line 1: "{item.titleText}"</p>}
                          {item.subtitleText && <p className="text-sm text-gray-500">Line 2/3: "{item.subtitleText}"</p>}
                          {item.hasBackPrint && item.backName && <p className="text-sm text-gray-500">Back name: {item.backName}</p>}
                        </div>
                        <span className="font-bold text-[#FF2E63]">£{((item.price || 19.99) + (item.hasBackPrint ? (item.backPrice || 2.50) : 0)).toFixed(2)}</span>
                      </div>

                      {/* Preview PNG — full composite design */}
                      {item.previewUrl && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-gray-500 mb-2 tracking-wide">DESIGN PREVIEW</p>
                          <div className="flex items-start gap-3">
                            <img
                              src={item.previewUrl.startsWith('http') ? item.previewUrl : `${process.env.REACT_APP_BACKEND_URL}${item.previewUrl}`}
                              alt="Design preview"
                              className="w-24 h-28 object-contain bg-white rounded-lg border border-gray-200"
                              crossOrigin="anonymous"
                            />
                            <div className="flex flex-col gap-2 mt-1">
                              <a
                                href={item.previewUrl.startsWith('http') ? item.previewUrl : `${process.env.REACT_APP_BACKEND_URL}${item.previewUrl}`}
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-xs text-[#FF2E63] font-medium hover:underline"
                              >
                                <Download className="w-3 h-3" /> Download preview PNG
                              </a>
                              <p className="text-xs text-gray-400">Full composite — use for printing</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Face cutout */}
                      {item.headUrl && (
                        <div className="mt-3 flex items-center gap-3">
                          <img
                            src={item.headUrl.startsWith('http') ? item.headUrl : `${process.env.REACT_APP_BACKEND_URL}${item.headUrl}`}
                            alt="Face cutout"
                            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                            crossOrigin="anonymous"
                          />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Face cutout</p>
                            <a
                              href={item.headUrl.startsWith('http') ? item.headUrl : `${process.env.REACT_APP_BACKEND_URL}${item.headUrl}`}
                              target="_blank" rel="noreferrer"
                              className="text-xs text-[#FF2E63] font-medium hover:underline"
                            >
                              Download face PNG
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-[#252A34] text-white rounded-xl p-5 flex justify-between items-center">
                <span className="font-['Anton'] text-lg tracking-wide">ORDER TOTAL</span>
                <span className="font-['Anton'] text-2xl text-[#F9ED69]">£{selectedOrder.total_amount?.toFixed(2)}</span>
              </div>

              {/* Download all files */}
              <Button onClick={() => downloadOrderFiles(selectedOrder.id, selectedOrder.order_number)} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-5 font-bold uppercase tracking-wider gap-2">
                <Download className="w-5 h-5" /> Download All Files (ZIP)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
