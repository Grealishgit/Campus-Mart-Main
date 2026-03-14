import { View, Text, Pressable, TextInput, ScrollView, Modal } from 'react-native'
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const BrowseScreen = () => {

  const router = useRouter();


  const mainFilters = [
    'Filter',
    'Under 5k KES',
    'On-Campus',
    'Verified'
  ];

  const recommendedItems = [1, 2, 3, 4, 5, 6];

  const categories = [
    'TextBooks',
    'Electronics',
    'Clothing',
    'Household'
  ];

  const [activeCategory, setActiveCategory] = useState<string>('TextBooks');

  const [selectedFilter, setSelectedFilter] = useState<string | null>('Under 5k KES');

  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  const [priceRange, setPriceRange] = useState([0, 50000]);

  const [searchValue, setSearchValue] = useState<string>('');


  const handleClearSearchValue = () => {
    setSearchValue('');
  }

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
                onChangeText={setSearchValue}

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


          <View className="flex-row items-center gap-2 px-2 pb-4 overflow-x-auto no-scrollbar">

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {mainFilters.map((filter, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    if (filter === 'Filter') {
                      setSelectedFilter(filter);
                      setShowFilterModal(true);
                      return;
                    }
                    setSelectedFilter(filter);
                  }}
                  className={`flex-row items-center justify-center h-10 px-4 border rounded-xl ${selectedFilter === filter
                    ? 'bg-primary border-primary'
                    : 'bg-slate-100 border-slate-200'
                    }`}
                >
                  {filter === 'Filter' && (
                    <Ionicons name='filter' size={16} color={selectedFilter === filter ? 'white' : '#9CA3AF'} className="mr-2" />
                  )}
                  <Text className={`text-lg font-display-semibold ${selectedFilter === filter
                    ? 'text-white'
                    : 'text-slate-600'
                    }`}>
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-2 px-4 py-4">
            <Text className="mb-4 text-xl uppercase font-display-bold text-slate-400">Recommended for you</Text>

            <View className="flex-row flex-wrap justify-between">
              {recommendedItems.map(i => (
                <View
                  key={i}
                  className="w-[48%] mb-4 overflow-hidden bg-white border shadow-sm
                 rounded-2xl border-slate-100 animate-pulse"
                >
                  <View className="h-40 bg-slate-200"></View>
                  <View className="p-3 space-y-2">
                    <View className="w-1/2 h-3 rounded bg-slate-100"></View>
                    <View className="w-full h-4 rounded bg-slate-100"></View>
                    <View className="w-1/3 h-4 rounded bg-slate-100"></View>
                  </View>
                </View>
              ))}
            </View>
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

                <View className='p-2 px-2 bg-white border-t border-slate-100'>
                  <Text className="mb-4 ml-4 text-lg tracking-widest uppercase font-display-bold text-primary">Category</Text>

                  <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {categories.map(cat => (
                        <Pressable onPress={() => setActiveCategory(cat)}
                          key={cat} className={`flex items-center rounded-xl px-5 py-3
                           ${activeCategory === cat ? 'bg-primary ' : 'bg-slate-100 '}`}>
                          <Text className={`text-black ${activeCategory === cat ? 'text-white' : 'text-slate-700'} font-display-medium text-md`}>{cat}</Text>
                        </Pressable>
                      ))}
                    </View>


                    <View className="mt-5 mb-8">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-md tracking-widest uppercase font-display-medium text-slate-400">
                          Price Range (KES)
                        </Text>
                        <Text className="font-display-bold text-lg text-primary">
                          {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                        </Text>
                      </View>

                      <View className='flex justify-center items-center'>
                        <MultiSlider
                          values={priceRange}
                          onValuesChange={setPriceRange}
                          min={0}
                          max={50000}
                          step={1000}
                          sliderLength={320}
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
                      <Pressable className="items-center justify-center flex-1 border h-14 rounded-2xl border-slate-200">
                        <Text className="font-display-semibold text-slate-700">Clear All</Text>
                      </Pressable>
                      <Pressable className="flex-[2] items-center justify-center h-14 rounded-2xl bg-primary shadow-xl shadow-primary/30">
                        <Text className="text-white font-display-bold">Apply Filters</Text>
                      </Pressable>
                    </View>
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