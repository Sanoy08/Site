import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, Minus, ShoppingCart, Ban } from 'lucide-react-native';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/lib/types'; // আপনার টাইপস ফাইল
import { formatPrice } from '@/lib/utils'; // আপনার ইউটিলস

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((item) => item.id === product.id);
  const isOutOfStock = product.stock <= 0;

  const triggerVibration = async (style: Haptics.ImpactFeedbackStyle) => {
    await Haptics.impactAsync(style);
  };

  const handleAdd = () => {
    if (!isOutOfStock) {
      addItem(product);
      triggerVibration(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleIncrease = () => {
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity + 1);
      triggerVibration(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity - 1);
      triggerVibration(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View className={`bg-white rounded-2xl overflow-hidden shadow-sm m-2 border border-gray-100 ${isOutOfStock ? 'opacity-70' : ''}`}>
      <Link href={`/menus/${product.slug}`} asChild>
        <TouchableOpacity activeOpacity={0.8}>
          <View className="aspect-square relative overflow-hidden bg-gray-100">
            <Image
              source={{ uri: product.images?.[0]?.url || 'https://placehold.co/500x500' }}
              className="w-full h-full"
              contentFit="cover"
              transition={200}
            />
            {isOutOfStock && (
              <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded-full">
                <Text className="text-white text-[10px] font-bold">Out of Stock</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Link>

      <View className="p-3">
        <Text className="font-semibold text-sm h-10 leading-5 text-gray-900" numberOfLines={2}>
          {product.name}
        </Text>
        
        <View className="flex-row items-center justify-between mt-3">
          <Text className={`font-bold text-base ${isOutOfStock ? 'text-gray-400' : 'text-rose-600'}`}>
            {formatPrice(product.price)}
          </Text>

          {isOutOfStock ? (
            <View className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full">
              <Ban size={14} color="#6b7280" />
              <Text className="text-xs font-medium text-gray-500 ml-1">Sold Out</Text>
            </View>
          ) : cartItem ? (
            <View className="flex-row items-center border border-rose-200 rounded-full bg-white shadow-sm">
              <TouchableOpacity onPress={handleDecrease} className="p-1.5">
                <Minus size={16} color="#e11d48" />
              </TouchableOpacity>
              <Text className="w-6 text-center font-bold text-sm">{cartItem.quantity}</Text>
              <TouchableOpacity onPress={handleIncrease} className="p-1.5">
                <Plus size={16} color="#e11d48" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={handleAdd}
              className="bg-rose-600 px-4 py-2 rounded-full flex-row items-center shadow-md shadow-rose-200"
            >
              <ShoppingCart size={14} color="#fff" />
              <Text className="text-white text-xs font-semibold ml-1.5">Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}