import { View, Text, Pressable, TextInput, ScrollView, Modal, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native'
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getAllListings, getCategories } from '@/lib/listingService'
import ListingCard from '@/components/ListingCard'

const BrowseScreen = () => {

  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2;

  const [categories, setCategories] = useState<string[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [tempPriceRange, setTempPriceRange] = useState([0, 50000]);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data?.categories) {
        setCategories(['All', ...response.data.categories.map((c: any) => c.category || c)]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Search listings with current filters
  const searchListings = useCallback(async (search?: string, cat?: string, min?: number, max?: number) => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: 1,
        limit: 20,
      };

      if (search || searchValue) {
        filters.search = search || searchValue;
      }

      if (cat && cat !== 'All') {
        filters.category = cat;
      } else if (activeCategory && activeCategory !== 'All') {
        filters.category = activeCategory;
      }

      if (typeof min === 'number') {
        filters.minPrice = min;
      } else {
        filters.minPrice = priceRange[0];
      }

      if (typeof max === 'number') {
        filters.maxPrice = max;
      } else {
        filters.maxPrice = priceRange[1];
      }

      const response = await getAllListings(filters);
      if (response.success && response.data?.listings) {
        setListings(response.data.listings);
      } else {
        setError(response.error || 'Failed to load listings');
        setListings([]);
      }
    } catch (err) {
      setError('An error occurred');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, priceRange, searchValue]);

  // Fetch categories on mount
  useEffect(() => {
    loadCategories();
    searchListings();
  }, [searchListings]);

  const handleClearSearchValue = () => {
    setSearchValue('');
    searchListings('', activeCategory, priceRange[0], priceRange[1]);
  };

  const handleSearchChange = (text: string) => {
    setSearchValue(text);
    // Debounce search or fetch on text change
  };

  const handleSearchSubmit = () => {
    searchListings(searchValue, activeCategory, priceRange[0], priceRange[1]);
  };

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat);
    searchListings(searchValue, cat, priceRange[0], priceRange[1]);
  };

  const handleApplyFilters = () => {
    setPriceRange(tempPriceRange);
    searchListings(searchValue, activeCategory, tempPriceRange[0], tempPriceRange[1]);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setActiveCategory('All');
    setTempPriceRange([0, 50000]);
    setPriceRange([0, 50000]);
    setSearchValue('');
  };

  const handleListingClick = (item: any) => {
    router.push({
      pathname: '/product-item/[id]',
      params: {
        id: item.id,
        title: item.title,
        price: item.price,
        priceUnit: item.priceUnit || item.price_unit || '',
        type: item.type,
        category: item.category,
        condition: item.condition,
        location: item.location,
        distance: item.distance || '0 km',
        imageUrl: item.imageUrl || item.image_url || '',
        isVerified: String(item.isVerified || item.is_verified || false),
        description: item.description,
        sellerName: item.seller?.name || item.seller_name || 'Unknown',
        sellerRating: item.seller?.rating || item.seller_rating || 0,
        sellerAvatar: item.seller?.avatarUrl || item.seller_avatar || '',
        sellerVerified: String(item.seller?.isVerified || item.seller_verified || false),
      }
    } as any);
  };

  return (
    <SafeAreaView className='flex-1'>
      <View className="flex flex-col h-full bg-background-light animate-slide-up">
        <View className="sticky top-0 z-10 pt-4 bg-background-light/80 backdrop-blur-md">

          <View className="flex-row items-center justify-between px-4 pb-2">
            <Pressable onPress={() => router.navigate('/')} className="flex items-center justify-start size-12">
              <Ionicons name='chevron-back' size={24} color="primary" />
            </Pressable>
            <Text className="text-2xl tracking-tight text-center font-display-bold ">Search</Text>
            <Pressable onPress={handleClearSearchValue} className="flex justify-center">
              <Text className='text-xl text-right font-display-semibold text-primary'>Clear</Text>
            </Pressable>
          </View>

          <View className="px-4 py-3">
            <View className="flex-row items-center bg-white border border-gray-300 rounded-xl">
              <View className="flex-row items-center pl-4 pr-3 ">
                <Ionicons name='search' size={24} color="#9CA3AF" />
              </View>
          <TextInput
                className="flex-1 p-3.5 pl-3 text-xl font-display"
                placeholder="Search textbooks, tech, furniture..."
                keyboardType='default'
                value={searchValue}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
              />
              {searchValue.length > 0 && (
                <View className="flex-row items-center pl-4 pr-3 ">
                  <Pressable onPress={handleClearSearchValue} className='p-1 bg-gray-300 rounded-full'>
                    <Ionicons name='close' size={20} color="#9CA3AF" />
                  </Pressable>
                </View>
              )}

            </View>

          </View>


          <View className="flex-row items-center gap-2 px-2 pb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              <Pressable
                onPress={() => setShowFilterModal(true)}
                className="flex-row items-center justify-center h-10 px-4 border rounded-xl bg-slate-100 border-slate-200"
              >
                <Ionicons name='filter' size={16} color="#9CA3AF" />
                <Text className="ml-2 text-lg font-display-semibold text-slate-600">
                  Filter
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-2 px-4 py-4">
            {loading && (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#6769ef" />
                <Text className="mt-4 text-gray-600">Searching...</Text>
              </View>
            )}

            {error && !loading && (
              <View className="p-4 bg-red-50 rounded-lg">
                <Text className="text-red-600 font-display-medium">Error</Text>
                <Text className="text-red-500 mt-1">{error}</Text>
                <Pressable
                  onPress={() => searchListings(searchValue, activeCategory, priceRange[0], priceRange[1])}
                  className="mt-3 px-4 py-2 bg-red-600 rounded-lg"
                >
                  <Text className="text-white text-center font-display-medium">Retry</Text>
                </Pressable>
              </View>
            )}

            {!loading && !error && listings.length === 0 && (
              <View className="items-center justify-center py-20">
                <Ionicons name="search" size={48} color="#9CA3AF" />
                <Text className="mt-4 text-lg text-gray-600">No items found</Text>
                <Text className="mt-2 text-sm text-gray-400">Try adjusting your filters or search terms</Text>
              </View>
            )}

            {!loading && listings.length > 0 && (
              <>
                <Text className="mb-4 text-xl uppercase font-display-bold text-slate-400">
                  {listings.length} results found
                </Text>
                <FlatList
                  data={listings}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                  renderItem={({ item }) => (
                    <ListingCard
                      listing={item}
                      onClick={() => handleListingClick(item)}
                      cardWidth={cardWidth}
                    />
                  )}
                />
              </>
            )}
          </View>
        </ScrollView>

        {showFilterModal && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showFilterModal}
            onRequestClose={() => setShowFilterModal(false)}
          >
            <View className="justify-end flex-1 bg-black/40">

              <View className="bg-white rounded-t-3xl shadow-2xl max-h-[75vh]">

                <View className="flex items-center justify-center w-full pt-3 pb-2">
                  <View className="h-1.5 w-12 rounded-full bg-slate-300" />
                </View>

                <View className="flex-row items-center justify-between px-6 pb-4">
                  <Text className="text-2xl font-display-bold">Filters</Text>
                  <Pressable onPress={() => setShowFilterModal(false)}>
                    <Ionicons name="close" size={22} color="#6769ef" />
                  </Pressable>
                </View>

                <ScrollView className='p-2 px-2 bg-white border-t border-slate-100' showsVerticalScrollIndicator={false}>
                  <Text className="mb-4 ml-4 text-lg tracking-widest uppercase font-display-bold text-primary">Category</Text>

                  <View className="px-4 flex-row gap-2 flex-wrap mb-6">
                    {categories.map(cat => (
                      <Pressable onPress={() => handleCategorySelect(cat)}
                        key={cat} className={`rounded-xl px-5 py-3 
                         ${activeCategory === cat ? 'bg-primary' : 'bg-slate-100'}`}>
                        <Text className={`${activeCategory === cat ? 'text-white' : 'text-slate-700'} font-display-medium text-md`}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View className="mt-5 mb-8 px-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-md tracking-widest uppercase font-display-medium text-slate-400">
                        Price Range (KES)
                      </Text>
                      <Text className="font-display-bold text-lg text-primary">
                        {tempPriceRange[0].toLocaleString()} - {tempPriceRange[1].toLocaleString()}
                      </Text>
                    </View>

                    <View className='flex justify-center items-center'>
                      <MultiSlider
                        values={tempPriceRange}
                        onValuesChange={setTempPriceRange}
                        min={0}
                        max={50000}
                        step={1000}
                        sliderLength={300}
                        selectedStyle={{ backgroundColor: '#6769ef' }}
                        unselectedStyle={{ backgroundColor: '#e2e8f0' }}
                        markerStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#6769ef',
                          borderWidth: 2,
                          height: 20,
                          width: 20,
                          marginTop: 5,
                          borderRadius: 10,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3
                        }}
                        containerStyle={{ height: 40 }}
                        trackStyle={{ height: 6, borderRadius: 3 }}
                      />
                    </View>
                  </View>
                </ScrollView>

                <View className="p-6 bg-white border-t border-slate-100">
                  <View className="flex-row gap-4">
                    <Pressable onPress={handleClearFilters} className="items-center justify-center flex-1 border h-14 rounded-2xl border-slate-200">
                      <Text className="font-display-semibold text-slate-700">Clear All</Text>
                    </Pressable>
                    <Pressable onPress={handleApplyFilters} className="flex-[2] items-center justify-center h-14 rounded-2xl bg-primary shadow-xl shadow-primary/30">
                      <Text className="text-white font-display-bold">Apply Filters</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}


      </View>
    </SafeAreaView>
  )
}

export default BrowseScreen
