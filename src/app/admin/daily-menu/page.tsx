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
  Sun, Moon, Sparkles, RefreshCw, Check, Search, 
  CheckSquare, Square, Layers, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DailyMenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specials, setSpecials] = useState<any[]>([]);
  const [availableDishes, setAvailableDishes] = useState<any[]>([]);

  // 1. Single Available Date: Defaults to Today if before 10 AM, else Tomorrow!
  const getInitialDate = () => {
    const now = new Date();
    if (now.getHours() < 10) {
      return format(now, 'yyyy-MM-dd');
    }
    const tomorrow = new Date(now.getTime() + 86400000);
    return format(tomorrow, 'yyyy-MM-dd');
  };

  const [specialDate, setSpecialDate] = useState<string>(getInitialDate);
  const [mealType, setMealType] = useState<'lunch' | 'dinner' | 'both'>('lunch');

  // Multi-Select Dishes State
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hideAlreadyAdded, setHideAlreadyAdded] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

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

  // Map of dishes already added for the currently selected specialDate
  const alreadyAddedMap = useMemo(() => {
    const map = new Map<string, any>();
    specials.forEach(s => {
      if (s.date === specialDate) {
        if (s.dishId) map.set(s.dishId, s);
        if (s.name) map.set(s.name.toLowerCase().trim(), s);
      }
    });
    return map;
  }, [specials, specialDate]);

  // When date changes, automatically remove any selected dishes that are already added for that new date
  useEffect(() => {
    setSelectedDishIds(prev => 
      prev.filter(id => {
        const dish = availableDishes.find(d => d._id === id);
        if (!dish) return false;
        return !alreadyAddedMap.has(id) && !alreadyAddedMap.has(dish.name.toLowerCase().trim());
      })
    );
  }, [specialDate, alreadyAddedMap, availableDishes]);

  // Toggle single dish selection (Prevents selecting already added dish)
  const handleToggleDish = (dish: any) => {
    const isAlreadyAdded = alreadyAddedMap.has(dish._id) || alreadyAddedMap.has(dish.name.toLowerCase().trim());
    if (isAlreadyAdded) {
      const existing = alreadyAddedMap.get(dish._id) || alreadyAddedMap.get(dish.name.toLowerCase().trim());
      toast.info(`"${dish.name}" is already in Today's Special for this date (${existing?.mealType || 'added'}).`);
      return;
    }

    setSelectedDishIds(prev => 
      prev.includes(dish._id) ? prev.filter(id => id !== dish._id) : [...prev, dish._id]
    );
  };

  // Select all visible dishes that are NOT already added
  const handleSelectAllVisible = () => {
    const selectableDishes = filteredAvailableDishes.filter(d => 
      !alreadyAddedMap.has(d._id) && !alreadyAddedMap.has(d.name.toLowerCase().trim())
    );
    const selectableIds = selectableDishes.map(d => d._id);
    
    if (selectableIds.length === 0) return;

    const allSelected = selectableIds.every(id => selectedDishIds.includes(id));
    if (allSelected) {
      setSelectedDishIds(prev => prev.filter(id => !selectableIds.includes(id)));
    } else {
      setSelectedDishIds(prev => Array.from(new Set([...prev, ...selectableIds])));
    }
  };

  // Bulk Add Dishes to Today's Special
  const handleBulkAdd = async () => {
    if (selectedDishIds.length === 0) {
      toast.error("Please select at least one dish");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/daily-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-add',
          dishIds: selectedDishIds,
          date: specialDate,
          mealType: mealType
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Added dishes to Today's Special!`);
        setSelectedDishIds([]);
        fetchData();
      } else {
        throw new Error(data.error || "Failed to add dishes");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add specials");
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
        toast.success(newStock ? "Marked In Stock" : "Marked Out of Stock");
      }
    } catch (err) {
      fetchData();
    }
  };

  // Delete single special
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

  // Categories list (strictly without Thalis)
  const categories = useMemo(() => {
    const set = new Set<string>();
    availableDishes.forEach(d => {
      if (d.category) set.add(d.category.trim());
    });
    return Array.from(set).sort();
  }, [availableDishes]);

  // Filtered dishes for selection
  const filteredAvailableDishes = useMemo(() => {
    return availableDishes.filter(d => {
      const matchesSearch = !searchQuery || 
        d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || d.category?.toLowerCase() === selectedCategory.toLowerCase();
      
      const isAlreadyAdded = alreadyAddedMap.has(d._id) || alreadyAddedMap.has(d.name.toLowerCase().trim());
      if (hideAlreadyAdded && isAlreadyAdded) return false;

      return matchesSearch && matchesCat;
    });
  }, [availableDishes, searchQuery, selectedCategory, hideAlreadyAdded, alreadyAddedMap]);

  const totalAddedCount = alreadyAddedMap.size;

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
                Bulk select dishes for Lunch, Dinner, or Both with automatic duplicate prevention.
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

      {/* Global Control Bar: Available Date & Meal Timing */}
      <Card className="border shadow-md rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            {/* 1. Single Available Date Control */}
            <div className="space-y-2 flex-1 max-w-md">
              <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                Available Date (কোন তারিখে দেওয়া হবে)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={specialDate}
                  onChange={(e) => setSpecialDate(e.target.value)}
                  className="h-11 rounded-xl bg-background font-semibold"
                />
                <Button
                  type="button"
                  variant={specialDate === todayStr ? "default" : "outline"}
                  onClick={() => setSpecialDate(todayStr)}
                  className="h-11 rounded-xl px-3 text-xs font-bold shrink-0"
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant={specialDate === tomorrowStr ? "default" : "outline"}
                  onClick={() => setSpecialDate(tomorrowStr)}
                  className="h-11 rounded-xl px-3 text-xs font-bold shrink-0"
                >
                  Tomorrow
                </Button>
              </div>
            </div>

            {/* 2. Meal Timing Selector (Bulk Timing) */}
            <div className="space-y-2 flex-1 max-w-md">
              <Label className="text-xs font-bold text-gray-800">
                Meal Timing (Lunch, Dinner or Both)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMealType('lunch')}
                  className={`h-11 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all border ${
                    mealType === 'lunch'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-background hover:bg-muted text-gray-700 border-gray-200'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Lunch Only
                </button>

                <button
                  type="button"
                  onClick={() => setMealType('dinner')}
                  className={`h-11 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all border ${
                    mealType === 'dinner'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-background hover:bg-muted text-gray-700 border-gray-200'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Dinner Only
                </button>

                <button
                  type="button"
                  onClick={() => setMealType('both')}
                  className={`h-11 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all border ${
                    mealType === 'both'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-background hover:bg-muted text-gray-700 border-gray-200'
                  }`}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  Both
                </button>
              </div>
            </div>

            {/* 3. Bulk Add Action Button */}
            <div className="shrink-0 flex items-center gap-3">
              <Button
                onClick={handleBulkAdd}
                disabled={isSubmitting || selectedDishIds.length === 0}
                className="h-11 px-6 rounded-xl font-bold text-sm shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-white gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Add {selectedDishIds.length > 0 ? `(${selectedDishIds.length}) Dishes` : 'Selected Dishes'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Select Dishes (Left) & Active Specials (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Bulk Dish Selection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Select Dishes from Menu
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tick dishes to add for {mealType === 'lunch' ? 'Lunch' : mealType === 'dinner' ? 'Dinner' : 'Lunch & Dinner'} on {specialDate === todayStr ? 'Today' : specialDate === tomorrowStr ? 'Tomorrow' : specialDate}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={hideAlreadyAdded ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setHideAlreadyAdded(!hideAlreadyAdded)}
                  className="rounded-xl text-xs font-medium h-8"
                >
                  {hideAlreadyAdded ? "Showing Unadded" : "Hide Added"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllVisible}
                  className="rounded-xl text-xs font-semibold gap-1.5 h-8 shrink-0"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-primary" />
                  Select Unadded
                </Button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-muted/30 text-xs"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-muted text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({availableDishes.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-gray-900 text-white'
                        : 'bg-muted text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Selection Grid */}
            {isLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Loading dishes...</p>
              </div>
            ) : filteredAvailableDishes.length === 0 ? (
              <div className="py-12 text-center border border-dashed rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-600">No dishes found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
                {filteredAvailableDishes.map((dish) => {
                  const existingSpecial = alreadyAddedMap.get(dish._id) || alreadyAddedMap.get(dish.name.toLowerCase().trim());
                  const isAlreadyAdded = !!existingSpecial;
                  const isSelected = selectedDishIds.includes(dish._id);

                  return (
                    <div
                      key={dish._id}
                      onClick={() => handleToggleDish(dish)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 select-none ${
                        isAlreadyAdded
                          ? 'border-green-200 bg-green-50/40 opacity-70 cursor-not-allowed'
                          : isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm cursor-pointer' 
                          : 'border-border/60 bg-white hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {dish.imageUrl ? (
                          <img src={dish.imageUrl} alt={dish.name} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-muted" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-200/50">
                            <UtensilsCrossed className="h-5 w-5 text-amber-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{dish.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs font-black text-primary font-headline">₹{dish.price}</span>
                            <span className="text-[10px] text-muted-foreground">• {dish.category}</span>
                            {isAlreadyAdded && (
                              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.2 rounded-md">
                                ✓ Added ({existingSpecial.mealType})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                        isAlreadyAdded
                          ? 'bg-green-600 border-green-600 text-white'
                          : isSelected 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isAlreadyAdded ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : isSelected ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Specials List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Active Specials ({specials.length})
              </h2>
              <p className="text-xs text-muted-foreground">Live on Mobile App</p>
            </div>

            {selectedDishIds.length > 0 && (
              <Badge className="bg-primary text-white font-bold text-xs px-2.5 py-1">
                {selectedDishIds.length} Selected to Add
              </Badge>
            )}
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
              <p className="text-xs text-muted-foreground mt-1">Select dishes from the menu on the left and click Add!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
              {specials.map((item) => {
                const isSpecialToday = item.date === todayStr;
                const isSpecialTomorrow = item.date === tomorrowStr;

                return (
                  <Card key={item._id} className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-13 h-13 rounded-lg object-cover border shrink-0 bg-muted" 
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                            <UtensilsCrossed className="h-5 w-5 text-amber-700" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-gray-900 truncate">
                              {item.name}
                            </h3>
                            <span className="text-sm font-black text-primary shrink-0">
                              ₹{item.price}
                            </span>
                          </div>

                          {/* Badges: Meal Type & Date */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.mealType === 'lunch' && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300 text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5">
                                <Sun className="h-2.5 w-2.5 text-amber-600" />
                                Lunch
                              </Badge>
                            )}
                            {item.mealType === 'dinner' && (
                              <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-300 text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5">
                                <Moon className="h-2.5 w-2.5 text-indigo-600" />
                                Dinner
                              </Badge>
                            )}
                            {item.mealType === 'both' && (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5">
                                <UtensilsCrossed className="h-2.5 w-2.5 text-emerald-600" />
                                Both
                              </Badge>
                            )}

                            {/* Date Badge */}
                            <Badge variant="outline" className={`text-[10px] font-semibold px-1.5 py-0.5 flex items-center gap-1 ${
                              isSpecialToday ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-gray-50'
                            }`}>
                              <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                              {isSpecialToday ? 'Today' : isSpecialTomorrow ? 'Tomorrow' : item.date}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stock Switch & Delete */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Switch
                          checked={item.inStock}
                          onCheckedChange={() => handleToggleStock(item._id, item.inStock)}
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSpecial(item._id, item.name)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50"
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
