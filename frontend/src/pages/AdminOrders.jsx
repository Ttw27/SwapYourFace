import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Download, Eye, Edit, Trash2, Search, Filter, ChevronDown, Package
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Fetch all orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch orders');
      
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search
  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId?.includes(searchTerm) ||
      order.email?.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  // Download file from R2
  const handleDownload = (url, filename) => {
    if (!url) {
      toast.error('File not available');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    toast.success(`Downloaded: ${filename}`);
  };

  // Download all files for an order (as zip would be ideal, but we'll do individual downloads)
  const handleDownloadAll = async (order) => {
    toast.info('Downloading all files...');
    
    // Download design PNG
    if (order.designPngUrl) {
      handleDownload(order.designPngUrl, `design-${order.orderId}.png`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Stagger downloads
    }
    
    // Download raw photo
    if (order.originalPhotoUrl) {
      handleDownload(order.originalPhotoUrl, `photo-raw-${order.orderId}.jpg`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Download face cutout
    if (order.headCutoutUrl) {
      handleDownload(order.headCutoutUrl, `face-cutout-${order.orderId}.png`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    toast.success('All files downloaded!');
  };

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const res = await fetch(`${API}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete order');
      
      setOrders(orders.filter(o => o.orderId !== orderId));
      toast.success('Order deleted');
    } catch (err) {
      toast.error('Failed to delete order');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Package className="w-8 h-8"/>Orders</h1>
          <p className="text-gray-600">Manage customer orders, download designs & files</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, order ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF2E63]"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No orders found</div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.orderId} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Order Summary Row */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    
                    {/* Order ID & Date */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
                      <p className="text-lg font-bold text-gray-900">{order.orderId}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Customer */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
                      <p className="font-bold text-gray-900">{order.customerName || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.email}</p>
                    </div>

                    {/* Details */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Details</p>
                      <p className="font-medium text-gray-900">{order.quantity} × {order.size}</p>
                      <p className="text-xs text-gray-600 mt-1 capitalize">{order.shirtColor} {order.shirtType}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrder === order.orderId ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.orderId && (
                  <div className="border-t bg-gray-50 p-6 space-y-6">
                    
                    {/* Design Preview */}
                    {order.designPngUrl && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Eye className="w-4 h-4"/>Design Preview</h4>
                        <img 
                          src={order.designPngUrl} 
                          alt="Design" 
                          className="max-w-xs h-auto border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}

                    {/* Text Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name Text</p>
                        <p className="font-bold text-gray-900">{order.partyMembers?.[0]?.titleText || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Event Text</p>
                        <p className="font-bold text-gray-900">{order.partyMembers?.[0]?.subtitleText || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Template</p>
                        <p className="font-bold text-gray-900">{order.partyMembers?.[0]?.templateName || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Available Files */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Download className="w-4 h-4"/>Available Files</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        
                        {/* Design PNG */}
                        <button
                          onClick={() => handleDownload(order.designPngUrl, `design-${order.orderId}.png`)}
                          disabled={!order.designPngUrl}
                          className="p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Design PNG</p>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            <Download className="w-4 h-4"/>
                            {order.designPngUrl ? 'Download' : 'Not Available'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Ready for print</p>
                        </button>

                        {/* Raw Photo */}
                        <button
                          onClick={() => handleDownload(order.originalPhotoUrl, `photo-${order.orderId}.jpg`)}
                          disabled={!order.originalPhotoUrl}
                          className="p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Raw Photo</p>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            <Download className="w-4 h-4"/>
                            {order.originalPhotoUrl ? 'Download' : 'Not Available'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Original upload</p>
                        </button>

                        {/* Face Cutout */}
                        <button
                          onClick={() => handleDownload(order.headCutoutUrl, `face-${order.orderId}.png`)}
                          disabled={!order.headCutoutUrl}
                          className="p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Face Cutout</p>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            <Download className="w-4 h-4"/>
                            {order.headCutoutUrl ? 'Download' : 'Not Available'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Extracted head</p>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button 
                        onClick={() => handleDownloadAll(order)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2"/>Download All
                      </Button>
                      <Button 
                        onClick={() => toast.info('Edit feature coming soon')}
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2"/>Edit Design
                      </Button>
                      <Button 
                        onClick={() => handleDeleteOrder(order.orderId)}
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2"/>Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
