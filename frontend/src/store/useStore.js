import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useStore = create(
  persist(
    (set, get) => ({
      // Templates
      templates: [],
      selectedTemplate: null,
      templatesLoading: false,
      
      // Photo/Head
      originalPhoto: null,
      headCutout: null,
      headPlacement: { x: 0.5, y: 0.15, scale: 1.0, rotation: 0 },
      
      // Text
      titleText: '',
      subtitleText: '',
      
      // Back print
      hasBackPrint: false,
      backName: '',
      backNumber: '',
      
      // Mode: 'bulk' or 'multi'
      builderMode: 'bulk',
      
      // Bulk mode sizes
      bulkSizes: { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 },
      bulkBackNames: [], // Array of names for back prints
      useSingleBackName: true,
      singleBackName: '',
      
      // Multi-design mode
      partyMembers: [],
      currentPersonIndex: -1,
      
      // Cart
      cartItems: [],
      
      // Pricing
      pricing: {
        base_price: 19.99,
        back_print_price: 2.50,
        currency: 'GBP',
        currency_symbol: '£'
      },
      
      // Actions
      setTemplates: (templates) => set({ templates }),
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setTemplatesLoading: (loading) => set({ templatesLoading: loading }),
      
      setOriginalPhoto: (photo) => set({ originalPhoto: photo }),
      setHeadCutout: (head) => set({ headCutout: head }),
      setHeadPlacement: (placement) => set((state) => ({
        headPlacement: { ...state.headPlacement, ...placement }
      })),
      
      setTitleText: (text) => set({ titleText: text }),
      setSubtitleText: (text) => set({ subtitleText: text }),
      
      setHasBackPrint: (has) => set({ hasBackPrint: has }),
      setBackName: (name) => set({ backName: name }),
      setBackNumber: (num) => set({ backNumber: num }),
      
      setBuilderMode: (mode) => set({ builderMode: mode }),
      
      setBulkSizes: (sizes) => set({ bulkSizes: sizes }),
      updateBulkSize: (size, qty) => set((state) => ({
        bulkSizes: { ...state.bulkSizes, [size]: Math.max(0, qty) }
      })),
      setBulkBackNames: (names) => set({ bulkBackNames: names }),
      setUseSingleBackName: (use) => set({ useSingleBackName: use }),
      setSingleBackName: (name) => set({ singleBackName: name }),
      
      // Party members for multi-design mode
      addPartyMember: (member) => set((state) => ({
        partyMembers: [...state.partyMembers, { ...member, id: Date.now().toString() }]
      })),
      updatePartyMember: (id, updates) => set((state) => ({
        partyMembers: state.partyMembers.map(m => 
          m.id === id ? { ...m, ...updates } : m
        )
      })),
      removePartyMember: (id) => set((state) => ({
        partyMembers: state.partyMembers.filter(m => m.id !== id)
      })),
      setCurrentPersonIndex: (index) => set({ currentPersonIndex: index }),
      clearPartyMembers: () => set({ partyMembers: [] }),
      
      // Cart actions
      addToCart: (item) => set((state) => ({
        cartItems: [...state.cartItems, { ...item, cartId: Date.now().toString() }]
      })),
      addMultipleToCart: (items) => set((state) => ({
        cartItems: [...state.cartItems, ...items.map((item, i) => ({ 
          ...item, 
          cartId: `${Date.now()}-${i}` 
        }))]
      })),
      removeFromCart: (cartId) => set((state) => ({
        cartItems: state.cartItems.filter(item => item.cartId !== cartId)
      })),
      updateCartItem: (cartId, updates) => set((state) => ({
        cartItems: state.cartItems.map(item =>
          item.cartId === cartId ? { ...item, ...updates } : item
        )
      })),
      clearCart: () => set({ cartItems: [] }),
      
      // Get cart total
      getCartTotal: () => {
        const state = get();
        return state.cartItems.reduce((total, item) => {
          const backPrice = item.hasBackPrint ? state.pricing.back_print_price : 0;
          return total + ((state.pricing.base_price + backPrice) * (item.quantity || 1));
        }, 0);
      },
      
      getCartItemCount: () => {
        const state = get();
        return state.cartItems.reduce((count, item) => count + (item.quantity || 1), 0);
      },
      
      // Reset builder state
      resetBuilder: () => set({
        selectedTemplate: null,
        originalPhoto: null,
        headCutout: null,
        headPlacement: { x: 0.5, y: 0.15, scale: 1.0, rotation: 0 },
        titleText: '',
        subtitleText: '',
        hasBackPrint: false,
        backName: '',
        backNumber: '',
        bulkSizes: { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 },
        bulkBackNames: [],
        useSingleBackName: true,
        singleBackName: '',
        partyMembers: [],
        currentPersonIndex: -1
      }),
      
      // Fetch templates from API
      fetchTemplates: async () => {
        set({ templatesLoading: true });
        try {
          const response = await fetch(`${API}/templates`);
          if (response.ok) {
            const templates = await response.json();
            set({ templates, templatesLoading: false });
          } else {
            console.error('Failed to fetch templates');
            set({ templatesLoading: false });
          }
        } catch (error) {
          console.error('Error fetching templates:', error);
          set({ templatesLoading: false });
        }
      },
      
      // Fetch pricing
      fetchPricing: async () => {
        try {
          const response = await fetch(`${API}/pricing`);
          if (response.ok) {
            const pricing = await response.json();
            set({ pricing });
          }
        } catch (error) {
          console.error('Error fetching pricing:', error);
        }
      }
    }),
    {
      name: 'partytees-storage',
      partialize: (state) => ({
        cartItems: state.cartItems,
        builderMode: state.builderMode
      })
    }
  )
);

export default useStore;
