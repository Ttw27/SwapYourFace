import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShoppingBag, Download, RefreshCw, LogOut,
  CheckCircle, Clock, Truck, Package, Eye, X,
  Plus, Shirt, Trash2, Edit2, Star, Upload, CreditCard, Sparkles, Copy, ExternalLink
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
  is_featured: false, featured_order: 0,
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
  const [seoSettings, setSeoSettings] = useState({});
  const [savingSEO, setSavingSEO] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [importingTemplates, setImportingTemplates] = useState(false);
  const [fixingUrls, setFixingUrls] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);

  const handleFixAllCloudinary = async () => {
    setFixingAll(true);
    try {
      const r = await fetch(`${API}/admin/templates/fix-all-cloudinary`, { method: 'POST' });
      const data = await r.json();
      toast.success(data.message);
      fetchTemplates();
    } catch(e) {
      toast.error('Fix failed');
    } finally {
      setFixingAll(false);
    }
  };

  const handleFixUrls = async () => {
    setFixingUrls(true);
    try {
      const r = await fetch(`${API}/admin/templates/fix-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixes: [{"id": "e0785da5-5f68-4d08-b87e-7684086f8319", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/LifeguardIIDESIGN-Stag-11.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/LifeguardIIDESIGN-Stag-11.jpg"}, {"id": "eb34a61f-d858-4dbf-8026-d6cd97a87428", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/ChickenmanDESIGN-Stag-4.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/ChickenmanDESIGN-Stag-4.jpg"}, {"id": "2774541d-582e-4e74-8d4f-e90dee7f2609", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/CvemanDESIGN-Stag-12.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/CvemanDESIGN-Stag-12.jpg"}, {"id": "c0b872c3-e18a-447e-a621-7aaed1630de7", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WrestlerIIDESIGN-Stag-17.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WrestlerIIDESIGN-Stag-17.jpg"}, {"id": "b2da379a-cd00-4aaf-9a72-3dea0fd9b6ef", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/80sDiscoIIDESIGN-Stag-10.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/80sDiscoIIDESIGN-Stag-10.jpg"}, {"id": "c1e628fc-810f-4115-a5b8-4c12160e24cd", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/CheerleaderIIDESIGN-Stag-7.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/CheerleaderIIDESIGN-Stag-7.jpg"}, {"id": "a060fad5-4c57-48aa-8dae-c7a2a3dfcda1", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BallerinaIIDESIGN-Stag-21.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/BallerinaIIDESIGN-Stag-21.jpg"}, {"id": "d5ee5713-7a0e-4fa9-8bdb-34031fbab01b", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WrestlerIDESIGN-TGPHEN25-47.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WrestlerI-TGPHEN25-47.jpg"}, {"id": "7f5fa622-8230-4d00-a4e5-c5716c4e44a6", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/TGPHEN25-25.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/TGPHEN25-25.jpg"}, {"id": "6220a243-f856-4ce6-85f0-28a9b1a0f0db", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SumoIIDESIGN-TGPHEN25-56.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SumoII-TGPHEN25-56.jpg"}, {"id": "5c29f574-5206-4b1d-8a62-29c0965bba83", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/FunkyShirtDESIGN-TGPHEN25-30.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/FunkyShirt-TGPHEN25-30.jpg"}, {"id": "4094dedb-59e2-4a05-8b19-06671ac03034", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/DJBrideDESIGN-TGPHEN25-17.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/DJBride-TGPHEN25-17.jpg"}, {"id": "005d8a42-cb14-4a26-9d12-128ddfdfef7f", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BridefuelDESIGN-TGPHEN25-18.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Bridefuel-TGPHEN25-18.jpg"}, {"id": "e02b3f3f-83f5-4b8c-9e95-2253572232e0", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WrestlerIIDESIGN-TGPHEN25-46.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WrestlerII-TGPHEN25-46.jpg"}, {"id": "6c63cb31-5cae-4ec1-add2-6f2e573154ae", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/UnicornDESIGN-TGPHEN25-34.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Unicorn-TGPHEN25-34.jpg"}, {"id": "d454ab55-4c3e-4454-99ba-7d02b6042a4f", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SuperheroIIIDESIGN-TGPHEN25-41.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SuperheroIII-TGPHEN25-41.jpg"}, {"id": "8dd931e0-2eb9-48d3-906d-7ce7e987f2e3", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SuperheroIIDESIGN-TGPHEN25-43.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SuperheroII-TGPHEN25-43.jpg"}, {"id": "b86e66d0-0bfe-48a8-bfee-21bf53f00cab", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/80DiscoIIDESIGN-TGPHEN25-20.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/80DiscoII-TGPHEN25-20.jpg"}, {"id": "bf60a991-36df-4f65-9fad-5cc476b33816", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BodybuilderDESIGN-TGPHEN25-15.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Bodybuilder-TGPHEN25-15.jpg"}, {"id": "aa3e6b30-e291-4aec-9db0-c82918fb6af0", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/80sDiscoIDESIGN-TGPHEN25-19.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/80sDiscoI-TGPHEN25-19.jpg"}, {"id": "9225ea51-20f2-416e-9b0f-969d6b32f90c", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BarbieDollDESIGN-TGPHEN25-1.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/BarbieDoll-TGPHEN25-1.jpg"}, {"id": "superhero-stag", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SuperheroDESIGN-Stag-2.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Superhero-Stag-2.jpg"}] })
      });
      const data = await r.json();
      toast.success(data.message);
      fetchTemplates();
    } catch(e) {
      toast.error('Fix failed');
    } finally {
      setFixingUrls(false);
    }
  };

  const handleBulkImportTemplates = async () => {
    if (!window.confirm('This will import/update all 62 templates from R2. Continue?')) return;
    setImportingTemplates(true);
    try {
      const r = await fetch(`${API}/admin/templates/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: [{"name": "80s Disco I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/80sDiscoIDESIGN.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/80sDiscoIDESIGN.jpg", "categories": ["stag"]}, {"name": "80s Disco I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/80sDiscoIIDESIGN-Stag-10.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/80sDiscoIIDESIGN-Stag-10.jpg", "categories": ["stag"]}, {"name": "Ballerina I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BallerinaIDESIGN-Stag-20.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/BallerinaIDESIGN-Stag-20.jpg", "categories": ["stag"]}, {"name": "Ballerina I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BallerinaIIDESIGN-Stag-21.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/BallerinaIIDESIGN-Stag-21.jpg", "categories": ["stag"]}, {"name": "Bodybuilder", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BodybuilderDESIGN-Stag-16.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/BodyBuilder-Stag-16.jpg", "categories": ["stag"]}, {"name": "Cheerleader I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/CheerleaderIDESIGN-Stag-8.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/CheerleaderIDESIGN-Stag-8.jpg", "categories": ["stag"]}, {"name": "Cheerleader I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/CheerleaderIIDESIGN-Stag-7.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/CheerleaderIIDESIGN-Stag-7.jpg", "categories": ["stag"]}, {"name": "Chickenman", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/ChickenmanDESIGN-Stag-4.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/ChickenmanDESIGN-Stag-4.jpg", "categories": ["stag"]}, {"name": "Cowboy", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/CowboyDESIGN-Stag-13.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/CowboyDESIGN-Stag-13.jpg", "categories": ["stag"]}, {"name": "Cveman", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/CvemanDESIGN-Stag-12.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/CvemanDESIGN-Stag-12.jpg", "categories": ["stag"]}, {"name": "Disco King", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/DiscoKingDESIGN-Stag-25.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/DiscoKingDESIGN-Stag-25.jpg", "categories": ["stag"]}, {"name": "Drag Queen", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/DragQueenDESIGN-Stag-23.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/DragQueenDESIGN-Stag-23.jpg", "categories": ["stag"]}, {"name": "Funky Shirt", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/FunkyShirtDESIGN-TGPSTAG-7.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/FunkyShirtDESIGN-TGPSTAG-7.jpg", "categories": ["stag"]}, {"name": "Gamer Warrior", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/GamerWarriorDESIGN-Stag-3.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/GamerWarriorDESIGN-Stag-3.jpg", "categories": ["stag"]}, {"name": "Grandad", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/GrandadDESIGN-Stag-1.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/GrandadDESIGN-Stag-1.jpg", "categories": ["stag"]}, {"name": "Hip Hop King", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/HipHopKingDESIGN-Stag-6.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/HipHipKing-Stag-6.jpg", "categories": ["stag"]}, {"name": "Lifeguard I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/LifeguardIDESIGN-Stag-14.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/LifeguardIDESIGN-Stag-14.jpg", "categories": ["stag"]}, {"name": "Lifeguard I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/LifeguardIIDESIGN-Stag-11.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/LifeguardIIDESIGN-Stag-11.jpg", "categories": ["stag"]}, {"name": "Original", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/OriginalDESIGN-Stag-0.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/OriginalDESIGN-Stag-0.jpg", "categories": ["stag"]}, {"name": "Pink Shirt", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/PinkShirtDESIGN-Stag-5.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/PinkShirtDESIGN-Stag-5.jpg", "categories": ["stag"]}, {"name": "Rapper", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/RapperDESIGN-Stag-28.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/RapperDESIGN-Stag-28.jpg", "categories": ["stag"]}, {"name": "Rhinestone Cowboy", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/RhinestoneCowboyDESIGN-Stag-15.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/RhinestoneCowboyDESIGN-Stag-15.jpg", "categories": ["stag"]}, {"name": "Sumo", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SumoDESIGN-Stag-27.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SumoDESIGN-Stag-27.jpg", "categories": ["stag"]}, {"name": "Superhero", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SuperheroDESIGN-Stag-2.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Superhero-Stag-2.jpg", "categories": ["stag"]}, {"name": "Unicorn", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/UnicornDESIGN-TGPSTAG-6.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/UnicornDESIGN-TGPSTAG-6.jpg", "categories": ["stag"]}, {"name": "Velvet King", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/VelvetKingDESIGN-Stag-22.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/VelvetKingDESIGN-Stag-22.jpg", "categories": ["stag"]}, {"name": "Wedding Dress", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WeddingDressDESIGN-Stag-26.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WeddingDressDESIGN-Stag-26.jpg", "categories": ["stag"]}, {"name": "Workout Guru", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WorkoutGuruDESIGN-Stag-24.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WorkoutGuruDESIGN-Stag-24.jpg", "categories": ["stag"]}, {"name": "Wrestler I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WrestlerIDESIGN-Stag-18.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WrestlerIDESIGN-Stag-18.jpg", "categories": ["stag"]}, {"name": "Wrestler I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WrestlerIIDESIGN-Stag-17.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WrestlerIIDESIGN-Stag-17.jpg", "categories": ["stag"]}, {"name": "80 Disco I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/80DiscoIIDESIGN-TGPHEN25-20.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/80DiscoII-TGPHEN25-20.jpg", "categories": ["hen"]}, {"name": "80s Disco I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/80sDiscoIDESIGN-TGPHEN25-19.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/80sDiscoI-TGPHEN25-19.jpg", "categories": ["hen"]}, {"name": "Air Hostess", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/AirHostessDESIGN-TGPHEN25-16.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/AirHostess-TGPHEN25-16.jpg", "categories": ["hen"]}, {"name": "Barbie Doll", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BarbieDollDESIGN-TGPHEN25-1.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/BarbieDoll-TGPHEN25-1.jpg", "categories": ["hen"]}, {"name": "Bodybuilder", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BodybuilderDESIGN-TGPHEN25-15.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Bodybuilder-TGPHEN25-15.jpg", "categories": ["hen"]}, {"name": "Bridefuel", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BridefuelDESIGN-TGPHEN25-18.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Bridefuel-TGPHEN25-18.jpg", "categories": ["hen"]}, {"name": "Bridezilla", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/BridezillaDESIGN-TGPHEN25-9.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Bridezilla-TGPHEN25-9.jpg", "categories": ["hen"]}, {"name": "Cavewoman", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/CavewomanDESIGN-TGPHEN25-10.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Cavewoman-TGPHEN25-10.jpg", "categories": ["hen"]}, {"name": "Cowgirl", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/CowgirlDESIGN-TGPHEN25-26.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Cowgirl-TGPHEN25-26.jpg", "categories": ["hen"]}, {"name": "Disco Diva", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/DiscoDivaDESIGN-TGPHEN25-40.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/DiscoDiva-TGPHEN25-40.jpg", "categories": ["hen"]}, {"name": "D J Bride", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/DJBrideDESIGN-TGPHEN25-17.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/DJBride-TGPHEN25-17.jpg", "categories": ["hen"]}, {"name": "Funky Shirt", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/FunkyShirtDESIGN-TGPHEN25-30.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/FunkyShirt-TGPHEN25-30.jpg", "categories": ["hen"]}, {"name": "Glitter Bomb", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/GlitterBombDESIGN-TGPHEN25-14.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/GlitterBomb-TGPHEN25-14.jpg", "categories": ["hen"]}, {"name": "Hip Hop Queen", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/HipHopQueenDESIGN-TGPHEN25-38.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/HipHopQueen-TGPHEN25-38.jpg", "categories": ["hen"]}, {"name": "Karoke Queen", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/KarokeQueenDESIGN-TGPHEN25-7.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/KarokeQueen-TGPHEN25-7.jpg", "categories": ["hen"]}, {"name": "Mermaid", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/MermaidDESIGN-TGPHEN25-49.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Mermaid-TGPHEN25-49.jpg", "categories": ["hen"]}, {"name": "Moonlight Queen", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/MoonlightQueenDESIGN-TGPHEN25-36.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/MoonlightQueen-TGPHEN25-36.jpg", "categories": ["hen"]}, {"name": "Mugshot", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/MugshotDESIGN-TGPHEN25-52.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Mugshot-TGPHEN25-52.jpg", "categories": ["hen"]}, {"name": "Pink Queen", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/PinkQueenDESIGN-TGPHEN25-3.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/PinkQueen-TGPHEN25-3.jpg", "categories": ["hen"]}, {"name": "Rockstar", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/RockstarDESIGN-TGPHEN25-37.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Rockstar-TGPHEN25-37.jpg", "categories": ["hen"]}, {"name": "Runaway Bride", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/RunawayBrideDESIGN-TGPHEN25-55.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/RunawayBride-TGPHEN25-55.jpg", "categories": ["hen"]}, {"name": "Sumo I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SumoIDESIGN-TGPHEN25-57.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SumoI-TGPHEN25-57.jpg", "categories": ["hen"]}, {"name": "Sumo I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SumoIIDESIGN-TGPHEN25-56.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SumoII-TGPHEN25-56.jpg", "categories": ["hen"]}, {"name": "Superhero I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SuperheroIDESIGN-TGPHEN25-42.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SuperheroI-TGPHEN25-42.jpg", "categories": ["hen"]}, {"name": "Superhero I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SuperheroIIDESIGN-TGPHEN25-43.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SuperheroII-TGPHEN25-43.jpg", "categories": ["hen"]}, {"name": "Superhero I I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/SuperheroIIIDESIGN-TGPHEN25-41.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/SuperheroIII-TGPHEN25-41.jpg", "categories": ["hen"]}, {"name": "", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/TGPHEN25-25.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/TGPHEN25-25.jpg", "categories": ["hen"]}, {"name": "The Bridefather", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/TheBridefatherDESIGN-TGPHEN25-24.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/TheBridefather-TGPHEN25-24.jpg", "categories": ["hen"]}, {"name": "Unicorn", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/UnicornDESIGN-TGPHEN25-34.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Unicorn-TGPHEN25-34.jpg", "categories": ["hen"]}, {"name": "Witch", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WitchDESIGN-TGPHEN25-39.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/Witch-TGPHEN25-39.jpg", "categories": ["hen"]}, {"name": "Wrestler I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WrestlerIDESIGN-TGPHEN25-47.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WrestlerI-TGPHEN25-47.jpg", "categories": ["hen"]}, {"name": "Wrestler I I", "body_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/templates/WrestlerIIDESIGN-TGPHEN25-46.png", "product_image_url": "https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev/products/WrestlerII-TGPHEN25-46.jpg", "categories": ["hen"]}] })
      });
      const data = await r.json();
      toast.success(data.message);
      fetchTemplates();
    } catch(e) {
      toast.error('Import failed');
    } finally {
      setImportingTemplates(false);
    }
  };
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
    if (authed) { fetchStats(); fetchOrders(); fetchTemplates(); fetchReviews(); fetchPricing(); fetchDiscountCodes(); fetchTrackingConfig(); fetchSEOSettings(); }
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

  const fetchSEOSettings = async () => {
    try {
      const r = await fetch(`${API}/admin/seo-settings`);
      if (r.ok) setSeoSettings(await r.json());
    } catch(e) {}
  };

  const handleSaveSEO = async () => {
    setSavingSEO(true);
    try {
      const r = await fetch(`${API}/admin/seo-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seoSettings)
      });
      if (!r.ok) throw new Error();
      toast.success('SEO settings saved!');
    } catch(e) { toast.error('Failed to save SEO settings'); }
    finally { setSavingSEO(false); }
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

  // Payment Links
  const [paymentLinkForm, setPaymentLinkForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    description: '', amount: '', send_email: true
  });
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState([]);

  const handleGeneratePaymentLink = async () => {
    if (!paymentLinkForm.customer_name.trim() || !paymentLinkForm.customer_email.trim() || !paymentLinkForm.amount) {
      toast.error('Please enter customer name, email and amount'); return;
    }
    if (parseFloat(paymentLinkForm.amount) <= 0) {
      toast.error('Please enter a valid amount'); return;
    }
    setGeneratingLink(true);
    try {
      const r = await fetch(`${API}/admin/payment-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentLinkForm,
          amount: parseFloat(paymentLinkForm.amount)
        })
      });
      if (!r.ok) throw new Error('Failed to generate link');
      const data = await r.json();
      setGeneratedLink(data.checkout_url);
      setPaymentLinks(prev => [data, ...prev]);
      toast.success('Payment link generated!');
      if (paymentLinkForm.send_email) toast.success('Email sent to customer!');
    } catch(e) {
      toast.error(e.message || 'Failed to generate payment link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
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
        is_featured: templateForm.is_featured,
        featured_order: parseInt(templateForm.featured_order) || 0,
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

  const handleToggleFeatured = async (t) => {
    const featuredCount = templates.filter(x => x.is_featured).length;
    if (!t.is_featured && featuredCount >= 10) {
      toast.error('Already 10 featured templates — remove one first');
      return;
    }
    try {
      const nextFeatured = !t.is_featured;
      await fetch(`${API}/admin/templates/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_featured: nextFeatured,
          featured_order: nextFeatured ? (featuredCount + 1) : 0,
        })
      });
      toast.success(nextFeatured ? 'Added to homepage carousel' : 'Removed from homepage carousel');
      fetchTemplates();
    } catch(e) { toast.error('Failed to update template'); }
  };

  const handleSetFeaturedOrder = async (t, order) => {
    try {
      await fetch(`${API}/admin/templates/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured_order: parseInt(order) || 0 })
      });
      fetchTemplates();
    } catch(e) { toast.error('Failed to update order'); }
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
          {[{id:'orders',label:'Orders',icon:ShoppingBag},{id:'templates',label:'Templates',icon:Shirt},{id:'reviews',label:'Reviews',icon:Star},{id:'settings',label:'Settings',icon:Edit2},{id:'payment-links',label:'Payment Links',icon:CreditCard},{id:'builder',label:'Builder',icon:Sparkles}].map(tab => (
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
                          <td className="px-6 py-4"><p className="font-mono text-sm font-bold text-[#252A34]">{order.order_number}</p>{order.order_type === 'staff' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Staff</span>}{order.order_type === 'custom_payment_link' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Payment Link</span>}</td>
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
              <div className="flex gap-2">
                <Button onClick={handleFixAllCloudinary} disabled={fixingAll} variant="outline" className="rounded-full gap-2 border-red-500 text-red-500 hover:bg-red-50">
                  <Upload className="w-4 h-4" /> {fixingAll ? 'Fixing...' : '🔧 Fix All Cloudinary'}
                </Button>
                <Button onClick={handleFixUrls} disabled={fixingUrls} variant="outline" className="rounded-full gap-2 border-orange-500 text-orange-500 hover:bg-orange-50">
                  <Upload className="w-4 h-4" /> {fixingUrls ? 'Fixing...' : 'Fix Cloudinary URLs'}
                </Button>
                <Button onClick={handleBulkImportTemplates} disabled={importingTemplates} variant="outline" className="rounded-full gap-2 border-[#252A34] text-[#252A34]">
                  <Upload className="w-4 h-4" /> {importingTemplates ? 'Importing...' : 'Import All from R2'}
                </Button>
                <Button onClick={() => { setTemplateForm(BLANK_TEMPLATE); setShowTemplateForm(true); }} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full gap-2">
                  <Plus className="w-4 h-4" /> Add Template
                </Button>
              </div>
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

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={templateForm.is_popular} onChange={e=>setF('is_popular',e.target.checked)} className="rounded"/><span className="text-sm text-gray-700">Mark as Popular</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={templateForm.is_new} onChange={e=>setF('is_new',e.target.checked)} className="rounded"/><span className="text-sm text-gray-700">Mark as New</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={templateForm.is_featured} onChange={e=>setF('is_featured',e.target.checked)} className="rounded"/><span className="text-sm text-gray-700">Featured on Homepage</span></label>
                  {templateForm.is_featured && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-500">Order</Label>
                      <Input type="number" value={templateForm.featured_order} onChange={e=>setF('featured_order',e.target.value)} className="w-20 text-sm" min="1" max="10" />
                    </div>
                  )}
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
                <div key={t.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${t.is_featured ? 'border-[#FFE600] ring-2 ring-[#FFE600]/40' : 'border-gray-100'}`}>
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    <img src={t.product_image_url || t.body_image_url} alt={t.name} className="w-full h-full object-contain p-2" crossOrigin="anonymous"/>
                    <button
                      onClick={() => handleToggleFeatured(t)}
                      title={t.is_featured ? 'Remove from homepage carousel' : 'Add to homepage carousel'}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${t.is_featured ? 'bg-[#FFE600] text-[#252A34]' : 'bg-white/90 text-gray-400 hover:text-[#FFE600]'}`}>
                      <Star className="w-4 h-4" fill={t.is_featured ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-[#252A34] truncate">{t.name}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(t.categories || [t.category]).map(c=><span key={c} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full capitalize">{c}</span>)}
                      {t.is_popular && <span className="text-xs bg-[#FF2E63]/10 text-[#FF2E63] px-1.5 py-0.5 rounded-full">Popular</span>}
                      {t.is_new && <span className="text-xs bg-[#08D9D6]/10 text-[#08D9D6] px-1.5 py-0.5 rounded-full">New</span>}
                    </div>
                    {t.is_featured && (
                      <div className="flex items-center gap-2 mt-2">
                        <Label className="text-xs text-gray-500">Carousel order</Label>
                        <Input type="number" defaultValue={t.featured_order} onBlur={e=>handleSetFeaturedOrder(t, e.target.value)} className="w-16 h-7 text-xs" min="1" max="10" />
                      </div>
                    )}
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

            {/* SEO Settings */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <div>
                <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">SEO SETTINGS</h2>
                <p className="text-sm text-gray-500 mt-1">Edit page titles and descriptions to improve Google rankings. Changes take effect on next site deploy.</p>
              </div>
              {[
                { key: 'home', label: 'Homepage' },
                { key: 'gallery', label: 'Gallery / Templates' },
                { key: 'bespoke', label: 'Bespoke Character' },
                { key: 'faq', label: 'FAQ' },
                { key: 'reviews', label: 'Reviews' },
              ].map(page => (
                <div key={page.key} className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <p className="font-bold text-sm text-[#252A34]">{page.label}</p>
                  <div>
                    <Label className="text-xs">Page Title</Label>
                    <Input
                      value={seoSettings[`${page.key}_title`] || ''}
                      onChange={e => setSeoSettings(s => ({...s, [`${page.key}_title`]: e.target.value}))}
                      placeholder={`e.g. Custom Face T-Shirts — ${page.label}`}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Meta Description (150-160 chars)</Label>
                    <textarea
                      value={seoSettings[`${page.key}_desc`] || ''}
                      onChange={e => setSeoSettings(s => ({...s, [`${page.key}_desc`]: e.target.value}))}
                      placeholder="Brief description of this page for Google search results..."
                      rows={2}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E63]/20 focus:border-[#FF2E63] resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">{(seoSettings[`${page.key}_desc`] || '').length}/160 chars</p>
                  </div>
                </div>
              ))}
              <Button onClick={handleSaveSEO} disabled={savingSEO} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider">
                {savingSEO ? 'Saving...' : 'Save SEO Settings'}
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

        {/* ── Payment Links Tab ── */}
        {activeTab === 'payment-links' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">GENERATE PAYMENT LINK</h2>
              <p className="text-sm text-gray-500">Create a Stripe payment link for custom WhatsApp orders. Send via email or copy the link to share on WhatsApp.</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name <span className="text-[#FF2E63]">*</span></Label>
                  <Input value={paymentLinkForm.customer_name}
                    onChange={e => setPaymentLinkForm(f => ({...f, customer_name: e.target.value}))}
                    placeholder="e.g. John Smith" className="mt-1" />
                </div>
                <div>
                  <Label>Customer Email <span className="text-[#FF2E63]">*</span></Label>
                  <Input type="email" value={paymentLinkForm.customer_email}
                    onChange={e => setPaymentLinkForm(f => ({...f, customer_email: e.target.value}))}
                    placeholder="customer@email.com" className="mt-1" />
                </div>
                <div>
                  <Label>Customer Phone</Label>
                  <Input type="tel" value={paymentLinkForm.customer_phone}
                    onChange={e => setPaymentLinkForm(f => ({...f, customer_phone: e.target.value}))}
                    placeholder="07911 123456" className="mt-1" />
                </div>
                <div>
                  <Label>Amount (£) <span className="text-[#FF2E63]">*</span></Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                    <Input type="number" step="0.01" min="0"
                      value={paymentLinkForm.amount}
                      onChange={e => setPaymentLinkForm(f => ({...f, amount: e.target.value}))}
                      placeholder="0.00" className="pl-7" />
                  </div>
                </div>
              </div>

              <div>
                <Label>Order Description</Label>
                <Textarea value={paymentLinkForm.description}
                  onChange={e => setPaymentLinkForm(f => ({...f, description: e.target.value}))}
                  placeholder="e.g. Custom stag do order — 8 shirts, Hip Hop King template, back names included"
                  rows={3} className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">This description is shown to the customer on the payment page and in their email</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" checked={paymentLinkForm.send_email}
                  onChange={e => setPaymentLinkForm(f => ({...f, send_email: e.target.checked}))}
                  className="rounded" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Send payment link by email automatically</p>
                  <p className="text-xs text-gray-400">Customer receives an email with their order details and a Pay Now button</p>
                </div>
              </label>

              <Button onClick={handleGeneratePaymentLink} disabled={generatingLink}
                className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-4 font-bold uppercase tracking-wider gap-2">
                <CreditCard className="w-5 h-5" />
                {generatingLink ? 'Generating...' : 'Generate Payment Link'}
              </Button>

              {/* Generated link */}
              {generatedLink && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                  <p className="text-sm font-bold text-green-800">✅ Payment link generated!</p>
                  <div className="flex gap-2">
                    <input readOnly value={generatedLink}
                      className="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 font-mono text-gray-600 truncate" />
                    <Button onClick={() => copyToClipboard(generatedLink)}
                      className="bg-[#252A34] hover:bg-black text-white rounded-lg px-4 gap-2 flex-shrink-0">
                      <Copy className="w-4 h-4" /> Copy
                    </Button>
                    <a href={generatedLink} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="rounded-lg px-3">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                  <p className="text-xs text-green-700">Copy and paste this link into WhatsApp, SMS or any message to the customer</p>
                </div>
              )}
            </div>

            {/* Recent payment links */}
            {paymentLinks.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">RECENT LINKS THIS SESSION</h3>
                <div className="space-y-3">
                  {paymentLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{link.customer_name}</p>
                        <p className="text-xs text-gray-500 truncate">{link.description}</p>
                        <p className="text-sm font-bold text-[#FF2E63]">£{link.amount?.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button onClick={() => copyToClipboard(link.checkout_url)} className="bg-[#252A34] text-white rounded-lg px-3 py-2 text-xs gap-1">
                          <Copy className="w-3 h-3" /> Copy
                        </Button>
                        <a href={`https://wa.me/${link.customer_phone?.replace(/\D/g,'').replace(/^0/,'44')}?text=${encodeURIComponent(`Hi ${link.customer_name}! Here's your payment link for your custom order: ${link.checkout_url}`)}`}
                          target="_blank" rel="noreferrer">
                          <Button className="bg-[#25D366] text-white rounded-lg px-3 py-2 text-xs">WhatsApp</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Admin Builder Tab ── */}
        {activeTab === 'builder' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide mb-2">STAFF BUILDER</h2>
              <p className="text-sm text-gray-500 mb-4">Create custom orders for customers. Works exactly like the customer builder — templates update automatically as you add new ones.</p>
              <div className="p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl text-sm text-gray-600 mb-4">
                <p className="font-bold text-[#1C1C1C] mb-1">How to use:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Enter the customer name below for reference</li>
                  <li>Click "Open Builder" — the full builder opens in a new tab</li>
                  <li>Create the design as normal</li>
                  <li>At the sizes step, add to cart</li>
                  <li>The order saves in your Orders tab tagged as a staff order</li>
                  <li>Download the files from the Orders tab as normal</li>
                </ol>
              </div>
              <div className="flex gap-3">
                <Input placeholder="Customer name (for reference)" className="flex-1"
                  id="staff-customer-name" />
                <Button onClick={() => {
                  const name = document.getElementById('staff-customer-name')?.value || 'Staff Order';
                  window.open(`/builder?staff=true&customer=${encodeURIComponent(name)}`, '_blank');
                }} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-6 font-bold gap-2 flex-shrink-0">
                  <Sparkles className="w-4 h-4" /> Open Builder
                </Button>
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
