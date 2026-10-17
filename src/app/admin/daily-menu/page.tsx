'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Plus, Trash2, UtensilsCrossed, Calendar, 
  Sun, Moon, Sparkles, RefreshCw, AlertCircle, 
  Info, Check, Search, Tag, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DailyMenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specials, setSpecials] = useState<any[]>([]);
  const [availableDishes, setAvailableDishes] = useState<any[]>([]);

  // Form States for adding new special
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [mealType, setMealType] = useState<'lunch' | 'dinner' | 'both'>('lunch');
  const [specialDate, setSpecialDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [portionStock, setPortionStock] = useState<string>("50");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/daily-special');
      const data = await res.json();
      if (data.success) {
        setSpecials(data.data || []);
        setAvailableDishes(data.availableDishes || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load today's specials");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When a dish is chosen from dropdown, pre-populate price
  const handleDishSelect = (dishId: string) => {
    setSelectedDishId(dishId);
    const dish = availableDishes.find(d => d._id === dishId);
    if (dish) {
      setCustomPrice(dish.price ? String(dish.price) : "");
    }
  };

  // Add new special
  const handleAddSpecial = async () => {
    if (!selectedDishId) {
      toast.error("Please select a dish from the menu");
      return;
    }
    const dish = availableDishes.find(d => d._id === selectedDishId);
    if (!dish) return;

    if (!customPrice || parseFloat(customPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/daily-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          dishId: dish._id,
          name: dish.name,
          price: customPrice,
          description: dish.description,
          category: dish.category,
          mealType: mealType,
          date: specialDate,
          imageUrl: dish.imageUrl,
          stock: portionStock,
          inStock: true
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Added "${dish.name}" to Today's Special!`);
        setSelectedDishId("");
        setCustomPrice("");
        fetchData();
      } else {
        throw new Error(data.error || "Failed to add");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add special dish");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle inStock
  const handleToggleStock = async (id: string, currentStock: boolean) => {
    const newStock = !currentStock;
    setSpecials(prev => prev.map(s => s._id === id ? { ...s, inStock: newStock } : s));

    try {
      const res = await fetch('/api/admin/daily-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-stock', id, inStock: newStock })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(newStock ? "Dish marked In Stock" : "Dish marked Out of Stock");
      }
    } catch (err) {
      fetchData();
    }
  };

  // Delete Special
  const handleDeleteSpecial = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from Today's Specials?`)) return;

    try {
      const res = await fetch('/api/admin/daily-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Removed "${name}"`);
        setSpecials(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete special");
    }
  };

  // Filtered available dishes for search
  const filteredAvailableDishes = useMemo(() => {
    if (!searchQuery) return availableDishes;
    return availableDishes.filter(d => 
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableDishes, searchQuery]);

  const selectedDish = availableDishes.find(d => d._id === selectedDishId);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 p-6 rounded-2xl border border-amber-200/60 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-700">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline flex items-center gap-2">
                Today's Special Manager
                <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Add special daily dishes with specific dates & meal timings (Lunch, Dinner, or Both).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3.5 py-1.5 text-sm bg-white font-bold border-amber-300 text-amber-900 shadow-sm">
            ⭐ {specials.length} Active Specials
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchData} 
            disabled={isLoading}
            className="rounded-full bg-white shadow-sm border hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900 leading-relaxed">
          <span className="font-bold">Dedicated Specials Collection:</span> Thalis are excluded from Today's Special and will have a separate dedicated Thali section later. Here you can add special non-thali dishes (Fish, Chicken, Veg, Mutton, Rice delicacies, etc.) for specific dates & meal times.
        </div>
      </div>

      {/* Main Grid: Add Form (Left) & Active Specials List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Add to Today's Special Form */}
        <Card className="lg:col-span-5 border shadow-sm rounded-2xl overflow-hidden bg-white">
          <div className="p-4 sm:p-5 border-b bg-muted/20">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Dish to Today's Special
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select any menu item, choose date and whether it is for Lunch or Dinner.
            </p>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* 1. Dish Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">1. Select Menu Dish (No Thalis)</Label>
              <Select value={selectedDishId} onValueChange={handleDishSelect}>
                <SelectTrigger className="h-12 rounded-xl bg-background border-primary/20 font-medium">
                  <SelectValue placeholder="Choose a dish from menu..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {availableDishes.map(d => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name} • ₹{d.price} ({d.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Dish Preview */}
            {selectedDish && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center gap-3">
                {selectedDish.imageUrl && (
                  <img src={selectedDish.imageUrl} alt={selectedDish.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{selectedDish.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDish.category} • Base Price: ₹{selectedDish.price}</p>
                </div>
              </div>
            )}

            {/* 2. Date Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                2. Available Date (কোন তারিখে পাওয়া যাবে)
              </Label>
              <Input
                type="date"
                value={specialDate}
                onChange={(e) => setSpecialDate(e.target.value)}
                className="h-11 rounded-xl bg-background"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSpecialDate(format(new Date(), 'yyyy-MM-dd'))}
                  className="text-xs px-2.5 py-1 rounded-md bg-muted text-gray-700 hover:bg-gray-200 font-medium"
                >
                  Today ({format(new Date(), 'dd MMM')})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmr = new Date();
                    tmr.setDate(tmr.getDate() + 1);
                    setSpecialDate(format(tmr, 'yyyy-MM-dd'));
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-muted text-gray-700 hover:bg-gray-200 font-medium"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* 3. Meal Timing (Lunch / Dinner / Both) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">3. Meal Timing (Lunch / Dinner)</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMealType('lunch')}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center border font-bold text-xs transition-all ${
                    mealType === 'lunch'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-background hover:bg-muted text-gray-700 border-gray-200'
                  }`}
                >
                  <Sun className="h-4 w-4 mb-0.5" />
                  Lunch Only
                </button>

                <button
                  type="button"
                  onClick={() => setMealType('dinner')}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center border font-bold text-xs transition-all ${
                    mealType === 'dinner'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-background hover:bg-muted text-gray-700 border-gray-200'
                  }`}
                >
                  <Moon className="h-4 w-4 mb-0.5" />
                  Dinner Only
                </button>

                <button
                  type="button"
                  onClick={() => setMealType('both')}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center border font-bold text-xs transition-all ${
                    mealType === 'both'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-background hover:bg-muted text-gray-700 border-gray-200'
                  }`}
                >
                  <UtensilsCrossed className="h-4 w-4 mb-0.5" />
                  Both (All Day)
                </button>
              </div>
            </div>

            {/* 4. Special Price & Portion Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Special Price (₹)</Label>
                <Input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Price in ₹"
                  className="h-11 rounded-xl bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Daily Portions</Label>
                <Input
                  type="number"
                  value={portionStock}
                  onChange={(e) => setPortionStock(e.target.value)}
                  placeholder="e.g. 50"
                  className="h-11 rounded-xl bg-background"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleAddSpecial}
              disabled={isSubmitting || !selectedDishId}
              className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Plus className="h-5 w-5 mr-2" />
              )}
              Add to Today's Special
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: Active Specials List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Active Today's Specials ({specials.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Directly synced with Mobile App
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center bg-white rounded-2xl border">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Loading specials...</p>
            </div>
          ) : specials.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed p-6">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-base font-semibold text-gray-700">No Today's Specials Active</p>
              <p className="text-xs text-muted-foreground mt-1">Use the form on the left to add your first special dish for today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {specials.map((item) => {
                const isToday = item.date === format(new Date(), 'yyyy-MM-dd');

                return (
                  <Card key={item._id} className="border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left: Image & Info */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-16 h-16 rounded-xl object-cover border shrink-0 bg-muted" 
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                            <UtensilsCrossed className="h-6 w-6 text-amber-700" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-base text-gray-900 truncate">
                              {item.name}
                            </h3>
                            <span className="text-base font-black text-primary">
                              ₹{item.price}
                            </span>
                          </div>

                          {/* Badges: Meal Type & Date */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Meal Type */}
                            {item.mealType === 'lunch' && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300 text-[11px] font-bold flex items-center gap-1">
                                <Sun className="h-3 w-3 text-amber-600" />
                                Lunch Special
                              </Badge>
                            )}
                            {item.mealType === 'dinner' && (
                              <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-300 text-[11px] font-bold flex items-center gap-1">
                                <Moon className="h-3 w-3 text-indigo-600" />
                                Dinner Special
                              </Badge>
                            )}
                            {item.mealType === 'both' && (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 text-[11px] font-bold flex items-center gap-1">
                                <UtensilsCrossed className="h-3 w-3 text-emerald-600" />
                                Lunch & Dinner
                              </Badge>
                            )}

                            {/* Date Badge */}
                            <Badge variant="outline" className={`text-[11px] font-semibold flex items-center gap-1 ${isToday ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-gray-50'}`}>
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {isToday ? 'Today' : item.date}
                            </Badge>

                            {/* Category */}
                            {item.category && (
                              <span className="text-[11px] text-muted-foreground font-medium">
                                • {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Controls */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                        {/* Stock Switch */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${item.inStock ? 'text-green-700' : 'text-red-500'}`}>
                            {item.inStock ? 'In Stock' : 'Sold Out'}
                          </span>
                          <Switch
                            checked={item.inStock}
                            onCheckedChange={() => handleToggleStock(item._id, item.inStock)}
                          />
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSpecial(item._id, item.name)}
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          title="Remove Special"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
