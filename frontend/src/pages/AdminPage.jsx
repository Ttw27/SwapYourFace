import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Download, Package, Clock, CheckCircle, 
  Truck, RefreshCw, Eye, ChevronDown, ChevronUp,
  Loader2, BarChart3, Users, Shirt, DollarSign
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const url = filterStatus === 'all' 
        ? `${API}/orders` 
        : `${API}/orders?status=${filterStatus}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [filterStatus]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API}/orders/${orderId}/status?status=${newStatus}`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        toast.success('Order status updated');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
    }
  };

  const downloadOrderFiles = async (orderId, orderNumber) => {
    try {
      const response = await fetch(`${API}/orders/${orderId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order_${orderNumber}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('Download started');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to download files');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <RefreshCw className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF2E63] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide">
            ADMIN DASHBOARD
          </h1>
          <Button
            onClick={() => { fetchOrders(); fetchStats(); }}
            variant="outline"
            className="rounded-full"
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-party p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF2E63]/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#FF2E63]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-[#252A34]">{stats.total_orders}</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-party p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-[#252A34]">{stats.pending_orders}</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-party p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#08D9D6]/10 flex items-center justify-center">
                  <Shirt className="w-6 h-6 text-[#08D9D6]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Templates</p>
                  <p className="text-2xl font-bold text-[#252A34]">{stats.total_templates}</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-party p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-2xl font-bold text-[#252A34]">£{stats.total_revenue.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-gray-600">Filter by status:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40" data-testid="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="card-party p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="order-card"
                data-testid={`order-${idx}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-bold text-[#252A34]">{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {order.customer_name} • {order.customer_email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </span>
                    <span className="font-bold text-[#FF2E63]">
                      £{order.total_amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      data-testid={`expand-order-${idx}`}
                    >
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t"
                  >
                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Items */}
                      <div>
                        <h4 className="font-bold text-gray-700 mb-3">
                          Items ({order.items?.length || 0})
                        </h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {order.items?.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0">
                                {item.headUrl && (
                                  <img 
                                    src={`${process.env.REACT_APP_BACKEND_URL}${item.headUrl}`}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.templateName || 'Custom Design'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Size: {item.size || 'M'}
                                  {item.hasBackPrint && ` • Back: ${item.backName}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h4 className="font-bold text-gray-700 mb-3">Actions</h4>
                        <div className="space-y-3">
                          <Select 
                            value={order.status}
                            onValueChange={(val) => updateOrderStatus(order.id, val)}
                          >
                            <SelectTrigger data-testid={`update-status-${idx}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            onClick={() => downloadOrderFiles(order.id, order.order_number)}
                            className="w-full bg-[#08D9D6] hover:bg-[#06B5B2] text-[#252A34] rounded-full font-bold"
                            data-testid={`download-${idx}`}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Files (ZIP)
                          </Button>
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Created</p>
                          <p className="text-sm text-gray-700">
                            {new Date(order.created_at).toLocaleString('en-GB')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
