"use client";

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, Search, Filter, ChevronDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function MenuView({ vendorId }: { vendorId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Bulk Actions State
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: '',
    image: '',
    preparationTime: '15',
    customPrepTime: '',
    peakPreparationTime: '25',
    isAvailable: true,
    mealType: 'single',
    comboIncludes: [''],
    portionSize: 'regular',
    dailyQuantityMode: 'unlimited',
    dailyQuantity: '',
    tags: [] as string[],
    visibility: 'published'
  });
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await axios.get(`/api/menu?vendorId=${vendorId}`);
      setItems(res.data.items || []);
      setCategories(res.data.categories || []);
      if (res.data.categories?.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: res.data.categories[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [vendorId]);

  const handleToggleStock = async (id: string, currentStatus: boolean) => {
    try {
      setItems(prev => prev.map(i => i.id === id ? { ...i, isAvailable: !currentStatus } : i));
      await axios.patch(`/api/menu/${id}`, { isAvailable: !currentStatus });
    } catch (e) {
      console.error(e);
      fetchMenu();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      setItems(prev => prev.filter(i => i.id !== id));
      await axios.delete(`/api/menu/${id}`);
    } catch (e) {
      console.error(e);
      fetchMenu();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditStart = (item: any) => {
    const prepTimeStr = String(item.preparationTime || 15);
    const prepTimeOptions = ['5', '10', '15', '20', '25', '30', '45', '60'];
    const isCustomPrepTime = !prepTimeOptions.includes(prepTimeStr);

    setFormData({
      name: item.name || '',
      price: String(item.price || ''),
      description: item.description || '',
      categoryId: item.categoryId || '',
      image: item.image || '',
      preparationTime: isCustomPrepTime ? 'custom' : prepTimeStr,
      customPrepTime: isCustomPrepTime ? prepTimeStr : '',
      peakPreparationTime: String(item.peakPreparationTime || '25'),
      isAvailable: item.isAvailable !== false,
      mealType: item.mealType || 'single',
      comboIncludes: item.comboIncludes?.length > 0 ? item.comboIncludes : [''],
      portionSize: item.portionSize || 'regular',
      dailyQuantityMode: item.dailyQuantity != null ? 'limited' : 'unlimited',
      dailyQuantity: item.dailyQuantity != null ? String(item.dailyQuantity) : '',
      tags: item.tags || [],
      visibility: item.visibility || 'published',
    });
    setEditingItem(item);
    setIsAdding(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prepTime = formData.preparationTime === 'custom' ? Number(formData.customPrepTime) : Number(formData.preparationTime);
      
      const payload = {
        vendorId,
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        categoryId: formData.categoryId,
        image: formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        preparationTime: prepTime,
        peakPreparationTime: Number(formData.peakPreparationTime),
        isAvailable: formData.isAvailable,
        mealType: formData.mealType,
        comboIncludes: formData.mealType === 'combo' ? formData.comboIncludes.filter(Boolean) : [],
        portionSize: formData.portionSize,
        dailyQuantity: formData.dailyQuantityMode === 'limited' ? Number(formData.dailyQuantity) : null,
        tags: formData.tags,
        visibility: formData.visibility
      };

      if (editingItem) {
        // Update existing item
        const res = await axios.patch(`/api/menu/${editingItem.id}`, payload);
        setItems(prev => prev.map(i => i.id === editingItem.id ? res.data : i));
      } else {
        // Create new item
        const res = await axios.post('/api/menu', payload);
        setItems(prev => [res.data, ...prev]);
      }
      
      setIsAdding(false);
      setEditingItem(null);
      resetForm();
    } catch (e) {
      console.error("Failed to save item", e);
      alert(editingItem ? "Failed to update item" : "Failed to add item");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', price: '', description: '', categoryId: categories[0]?.id || '', image: '',
      preparationTime: '15', customPrepTime: '', peakPreparationTime: '25', isAvailable: true,
      mealType: 'single', comboIncludes: [''], portionSize: 'regular', dailyQuantityMode: 'unlimited',
      dailyQuantity: '', tags: [], visibility: 'published'
    });
    setEditingItem(null);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsLoading(true);
    try {
      const res = await axios.post('/api/categories', {
        name: newCategoryName,
        vendorId,
      });
      setCategories(prev => [...prev, res.data]);
      setFormData(prev => ({ ...prev, categoryId: res.data.id }));
      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch (e) {
      console.error("Failed to create category", e);
      alert("Failed to create category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => {
      const tags = prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'available' | 'outofstock' | 'delete') => {
    if (selectedItems.length === 0) return;
    
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return;
    }
    
    setIsLoading(true);
    try {
      for (const id of selectedItems) {
        if (action === 'delete') {
          await axios.delete(`/api/menu/${id}`);
          setItems(prev => prev.filter(i => i.id !== id));
        } else {
          const isAvail = action === 'available';
          await axios.patch(`/api/menu/${id}`, { isAvailable: isAvail });
          setItems(prev => prev.map(i => i.id === id ? { ...i, isAvailable: isAvail } : i));
        }
      }
      setSelectedItems([]);
    } catch (e) {
      console.error(e);
      alert("Bulk action failed");
      fetchMenu();
    } finally {
      setIsLoading(false);
    }
  };

  // Derived filtered items
  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAvailability === 'available' && !item.isAvailable) return false;
      if (filterAvailability === 'outofstock' && item.isAvailable) return false;
      if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'newest':
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [items, search, filterAvailability, filterCategory, sortBy]);

  const prepTimeOptions = ['5', '10', '15', '20', '25', '30', '45', '60'];
  const allTags = ['Best Seller', 'Popular', 'Spicy', 'Healthy', 'High Protein', 'Includes Drink', 'Vegetarian'];

  const handleFormClose = () => {
    setIsAdding(false);
    setEditingItem(null);
    resetForm();
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Menu Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your meals, pricing, and availability.</p>
        </div>
        <Button 
          onClick={() => { if (isAdding) { handleFormClose(); } else { resetForm(); setIsAdding(true); } }}
          className="bg-accent text-black font-bold hover:bg-accent/90 shrink-0"
        >
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add New Meal</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6 bg-card/60 border-accent/20 rounded-2xl mb-6 shadow-2xl">
          <form onSubmit={handleAddSubmit} className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-bold text-xl text-white">{editingItem ? 'Edit Meal' : 'Create a New Meal'}</h3>
              <Button type="button" variant="ghost" onClick={handleFormClose}><X className="w-5 h-5"/></Button>
            </div>
            
            {/* 1. Meal Photo */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-white">1. Meal Photo</label>
              <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center bg-black/20 hover:bg-black/40 transition-colors relative group overflow-hidden">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="font-bold">Upload Image</p>
                    <p className="text-xs text-muted-foreground mt-1">Drag & Drop supported (JPG, PNG, WEBP)</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2. Meal Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-white">2. Meal Name <span className="text-accent">*</span></label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Jollof Rice + Chicken" className="bg-black/40" />
              </div>

              {/* 3. Category */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-white">3. Category <span className="text-accent">*</span></label>
                {isCreatingCategory ? (
                  <div className="flex items-center gap-2">
                    <Input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New Category" className="bg-black/40" />
                    <Button type="button" onClick={handleCreateCategory} disabled={!newCategoryName.trim()} className="bg-accent text-black font-bold">Save</Button>
                    <Button type="button" variant="ghost" onClick={() => setIsCreatingCategory(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Button type="button" onClick={() => setIsCreatingCategory(true)} variant="outline" className="border-dashed">+ New</Button>
                  </div>
                )}
              </div>

              {/* 4. Price */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-white">4. Price (₦) <span className="text-accent">*</span></label>
                <Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="2300" className="bg-black/40" />
              </div>

              {/* 10. Portion Size */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-white">10. Portion Size (Optional)</label>
                <select value={formData.portionSize} onChange={e => setFormData({...formData, portionSize: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                  <option value="small">Small</option>
                  <option value="regular">Regular</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

            {/* 5. Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-white">5. Description (Optional)</label>
              <textarea maxLength={250} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none h-24 resize-none" placeholder="Smoky jollof rice served with grilled chicken and fresh salad." />
              <div className="text-right text-xs text-muted-foreground">{formData.description.length}/250</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/10">
              {/* 6. Preparation Time */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">6. Preparation Time <span className="text-yellow-400">⭐</span></label>
                <p className="text-xs text-muted-foreground">Customers will see this estimated preparation time.</p>
                <select value={formData.preparationTime} onChange={e => setFormData({...formData, preparationTime: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                  {prepTimeOptions.map(t => <option key={t} value={t}>{t} mins</option>)}
                  <option value="custom">Custom</option>
                </select>
                {formData.preparationTime === 'custom' && (
                  <Input type="number" placeholder="Enter custom mins" value={formData.customPrepTime} onChange={e => setFormData({...formData, customPrepTime: e.target.value})} className="mt-2 bg-black/40" />
                )}
              </div>

              {/* 7. Peak Preparation Time */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">7. Peak Preparation Time <span className="text-yellow-400">⭐</span></label>
                <p className="text-xs text-muted-foreground">Used automatically when demand is high.</p>
                <Input type="number" placeholder="e.g. 25 mins" value={formData.peakPreparationTime} onChange={e => setFormData({...formData, peakPreparationTime: e.target.value})} className="bg-black/40" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 8. Availability */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-white">8. Availability</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.isAvailable} onChange={() => setFormData({...formData, isAvailable: true})} className="accent-accent" />
                    <span className="text-sm">Available</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!formData.isAvailable} onChange={() => setFormData({...formData, isAvailable: false})} className="accent-accent" />
                    <span className="text-sm">Out of Stock</span>
                  </label>
                </div>
              </div>

              {/* 11. Daily Quantity */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-white">11. Daily Quantity (Optional)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.dailyQuantityMode === 'unlimited'} onChange={() => setFormData({...formData, dailyQuantityMode: 'unlimited'})} className="accent-accent" />
                    <span className="text-sm">Unlimited</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.dailyQuantityMode === 'limited'} onChange={() => setFormData({...formData, dailyQuantityMode: 'limited'})} className="accent-accent" />
                    <span className="text-sm">Limited</span>
                  </label>
                </div>
                {formData.dailyQuantityMode === 'limited' && (
                  <div className="mt-3">
                    <Input type="number" placeholder="Today's Quantity (e.g. 40)" value={formData.dailyQuantity} onChange={e => setFormData({...formData, dailyQuantity: e.target.value})} className="bg-black/40" />
                    <p className="text-xs text-muted-foreground mt-1">Becomes Out of Stock when reaches zero.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 9. Meal Type & Combos */}
            <div className="space-y-4 border border-white/10 p-5 rounded-xl bg-black/20">
              <label className="text-sm font-bold text-white">9. Meal Type</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={formData.mealType === 'single'} onChange={() => setFormData({...formData, mealType: 'single'})} className="accent-accent" />
                  <span className="text-sm">Single Meal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={formData.mealType === 'combo'} onChange={() => setFormData({...formData, mealType: 'combo'})} className="accent-accent" />
                  <span className="text-sm font-bold text-accent">Combo Meal</span>
                </label>
              </div>
              
              {formData.mealType === 'combo' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm font-bold">Combo Includes:</p>
                  {formData.comboIncludes.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input value={item} onChange={e => {
                        const newCombo = [...formData.comboIncludes];
                        newCombo[idx] = e.target.value;
                        setFormData({...formData, comboIncludes: newCombo});
                      }} placeholder="e.g. Jollof Rice" className="bg-black/40" />
                      <Button type="button" variant="ghost" onClick={() => {
                        const newCombo = formData.comboIncludes.filter((_, i) => i !== idx);
                        setFormData({...formData, comboIncludes: newCombo});
                      }}><Trash2 className="w-4 h-4 text-red-400"/></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({...formData, comboIncludes: [...formData.comboIncludes, '']})}>
                    + Add Item
                  </Button>
                </div>
              )}
            </div>

            {/* 12. Tags */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-white">12. Tags (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant={formData.tags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer ${formData.tags.includes(tag) ? 'bg-accent text-black' : 'hover:bg-white/10'}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 13. Visibility & Submit */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 border-t border-white/5 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.visibility === 'published'} onChange={e => setFormData({...formData, visibility: e.target.checked ? 'published' : 'draft'})} className="accent-accent w-4 h-4 rounded" />
                <span className="text-sm font-bold">Show to customers immediately</span>
              </label>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <Button type="button" variant="ghost" onClick={handleFormClose} className="flex-1 sm:flex-none">Cancel</Button>
                <Button type="submit" disabled={categories.length === 0} className="flex-1 sm:flex-none bg-accent text-black font-bold">
                  {editingItem ? 'Save Changes' : 'Save Meal'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Menu Management Features (Search & Filters) */}
      {!isAdding && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meals..." className="pl-9 bg-black/40 border-white/10" />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              <select value={filterAvailability} onChange={e => setFilterAvailability(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none shrink-0">
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="outofstock">Out of Stock</option>
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none shrink-0">
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none shrink-0">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price (Low–High)</option>
                <option value="price-high">Price (High–Low)</option>
              </select>
            </div>
          </div>
          
          {selectedItems.length > 0 && (
            <div className="bg-accent/20 border border-accent/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-bold text-accent px-2">{selectedItems.length} meals selected</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkAction('available')} className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Mark Available</Button>
                <Button size="sm" onClick={() => handleBulkAction('outofstock')} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">Mark Out of Stock</Button>
                <Button size="sm" onClick={() => handleBulkAction('delete')} className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Delete</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const cat = categories.find(c => c.id === item.categoryId);
            const isSelected = selectedItems.includes(item.id);
            
            return (
              <Card key={item.id} className={`bg-card/40 border-white/5 rounded-2xl overflow-hidden transition-all flex flex-col ${!item.isAvailable && 'opacity-70'} ${isSelected ? 'ring-2 ring-accent' : ''}`}>
                <div className="h-40 bg-black/20 relative group">
                  <div className="absolute top-2 left-2 z-10">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItems(prev => [...prev, item.id]);
                        else setSelectedItems(prev => prev.filter(id => id !== item.id));
                      }}
                      className="w-5 h-5 accent-accent rounded cursor-pointer"
                    />
                  </div>
                  
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-white/20" /></div>
                  )}
                  
                  {item.mealType === 'combo' && (
                    <Badge className="absolute top-2 right-2 bg-purple-500/80 text-white font-black backdrop-blur-sm border-none">COMBO</Badge>
                  )}
                  
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Badge variant="destructive" className="font-bold tracking-widest text-xs py-1">OUT OF STOCK</Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{item.name}</h3>
                    <span className="font-black text-accent text-lg shrink-0 pl-2">₦{item.price.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-[10px] bg-white/5 text-muted-foreground">{cat?.name || 'Category'}</Badge>
                    <Badge variant="secondary" className="text-[10px] bg-white/5 text-muted-foreground">⏱️ {item.preparationTime || 15}m</Badge>
                    {item.isAvailable ? (
                      <Badge className="text-[10px] bg-green-500/10 text-green-400 hover:bg-green-500/20 border-none">🟢 Available</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 border-none">🔴 Empty</Badge>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditStart(item)} className="flex-1 text-xs font-bold bg-white/5 hover:bg-white/10"><Edit2 className="w-3 h-3 mr-1"/> Edit</Button>
                    <Button 
                      variant="ghost" size="sm"
                      onClick={() => handleToggleStock(item.id, item.isAvailable)}
                      className={`flex-1 text-xs font-bold border ${item.isAvailable ? 'border-orange-500/20 text-orange-400 hover:bg-orange-500/10' : 'border-green-500/20 text-green-400 hover:bg-green-500/10'}`}
                    >
                      {item.isAvailable ? 'Out of Stock' : 'Available'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="px-2 border border-red-500/20 text-red-500 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {filteredItems.length === 0 && !isAdding && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-bold text-lg mb-1">No meals found</h3>
              <p className="text-muted-foreground text-sm">Your menu is empty or no items match your search.</p>
              <Button onClick={() => setIsAdding(true)} className="mt-4 bg-accent text-black font-bold">Add Your First Meal</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

