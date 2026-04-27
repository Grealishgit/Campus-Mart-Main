import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getCurrentUser } from '@/lib/authService';
import {
  createListing,
  CreateListingRequest,
  getCategories,
  getConditions,
} from '@/lib/listingService';
import { getAuthToken } from '@/lib/apiClient';

type ListingType = 'SALE' | 'LEASE';

const defaultConditions = [
  'Brand New',
  'Like New',
  'Excellent',
  'Good',
  'Used - Like New',
  'Fair',
];

const leasePriceUnits = ['/hour', '/day', '/week', '/month'];
const leaseDurationUnits = ['hours', 'days', 'weeks', 'months'];

const CreateListing = () => {
  const router = useRouter();

  const [sellerId, setSellerId] = useState<string>('');
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>(defaultConditions);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    price: '',
    priceUnit: '/day',
    minDuration: '',
    maxDuration: '',
    durationUnit: 'days',
    availableFrom: '',
    availableUntil: '',
    type: 'SALE' as ListingType,
    category: '',
    condition: '',
    location: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        const [userResponse, categoriesResponse, conditionsResponse] =
          await Promise.all([getCurrentUser(), getCategories(), getConditions()]);

        const userData =
          (userResponse.data as any)?.user || (userResponse.data as any);

        if (userResponse.success && userData?.id) {
          setSellerId(String(userData.id));
        } else {
          Alert.alert('Authentication Required', 'Please sign in again.', [
            { text: 'OK', onPress: () => router.replace('/(auth)/login') },
          ]);
          return;
        }

        if (categoriesResponse.success && categoriesResponse.data?.categories) {
          const categoryItems = (categoriesResponse.data.categories as any[])
            .map((item: any) =>
              typeof item === 'string' ? item : item?.category,
            )
            .filter(Boolean);
          setCategories(Array.from(new Set(categoryItems)));
        }

        if (conditionsResponse.success && conditionsResponse.data?.conditions) {
          const conditionItems = (conditionsResponse.data.conditions as any[])
            .map((item: any) =>
              typeof item === 'string' ? item : item?.condition,
            )
            .filter(Boolean);

          if (conditionItems.length > 0) {
            setConditions(Array.from(new Set(conditionItems)));
          }
        }
      } catch {
        Alert.alert('Error', 'Failed to load form data. Please try again.');
      } finally {
        setLoadingPage(false);
      }
    };

    initializeScreen();
  }, [router]);

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.title.trim()) nextErrors.title = 'Title is required.';
    if (!formData.description.trim()) nextErrors.description = 'Description is required.';
    if (!formData.price.trim()) nextErrors.price = 'Price is required.';
    if (formData.price.trim() && Number(formData.price) <= 0) {
      nextErrors.price = 'Price must be greater than zero.';
    }
    if (formData.type === 'LEASE' && !formData.priceUnit.trim()) {
      nextErrors.priceUnit = 'Price unit is required for lease items.';
    }
    if (formData.type === 'LEASE' && formData.minDuration.trim() && Number(formData.minDuration) <= 0) {
      nextErrors.minDuration = 'Minimum duration must be greater than zero.';
    }
    if (formData.type === 'LEASE' && formData.maxDuration.trim() && Number(formData.maxDuration) <= 0) {
      nextErrors.maxDuration = 'Maximum duration must be greater than zero.';
    }
    if (
      formData.type === 'LEASE' &&
      formData.minDuration.trim() &&
      formData.maxDuration.trim() &&
      Number(formData.maxDuration) < Number(formData.minDuration)
    ) {
      nextErrors.maxDuration = 'Maximum duration must be at least the minimum duration.';
    }
    if (!formData.category.trim()) nextErrors.category = 'Category is required.';
    if (!formData.condition.trim()) nextErrors.condition = 'Condition is required.';
    if (!formData.location.trim()) nextErrors.location = 'Location is required.';
    if (!sellerId) nextErrors.seller = 'Unable to detect seller account.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateListing = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      // Build multipart/form-data
      const body = new FormData();

      // Text fields
      body.append('title', formData.title.trim());
      body.append('description', formData.description.trim());
      body.append('price', formData.price);
      body.append('type', formData.type);
      body.append('category', formData.category.trim());
      body.append('condition', formData.condition.trim());
      body.append('location', formData.location.trim());


      if (formData.type === 'LEASE') {
        body.append('price_unit', formData.priceUnit);
        body.append('duration_unit', formData.durationUnit);
        if (formData.minDuration) body.append('min_duration', formData.minDuration);
        if (formData.maxDuration) body.append('max_duration', formData.maxDuration);
        if (formData.availableFrom) body.append('available_from', formData.availableFrom.trim());
        if (formData.availableUntil) body.append('available_until', formData.availableUntil.trim());
      }

      // Image — appended last, only if picked
      if (imageUri) {
        const filename = imageUri.split('/').pop() ?? 'listing.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1].replace('jpg', 'jpeg')}` : 'image/jpeg';

        body.append('image', {
          uri: imageUri,
          name: filename,
          type: mimeType,
        } as any);
      }

      const token = await getAuthToken(); // import from apiClient
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL || 'https://campus-mart.hantardev.tech/api'}/listings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body,
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Your item has been listed successfully.', [
          { text: 'View Listing', onPress: () => router.replace('/(tabs)') },
        ]);
        return;
      }

      console.log('Validation details:', JSON.stringify(data.details, null, 2));
      console.log('location value:', JSON.stringify(formData.location));
      console.log('location length:', formData.location.trim().length);

      if (!response.ok) {
        console.error('Listing creation failed:', {
          status: response.status,
          message: data.message,
          errors: data.errors,
          data,
        });
      }

    } catch (error: any) {
      console.error('Listing creation exception:', {
        message: error?.message,
        stack: error?.stack,
        error,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6769ef" />
          <Text style={styles.loadingText}>Preparing listing form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#6769ef" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Listing</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* <View style={styles.sellerBox}>
            <Text style={styles.sellerLabel}>Seller Account (from auth token)</Text>
            <Text style={styles.sellerValue}>{sellerId}</Text>
          </View> */}

          <Text style={styles.label}>Listing Type</Text>
          <View style={styles.typeRow}>
            {(['SALE', 'LEASE'] as ListingType[]).map((itemType) => (
              <Pressable
                key={itemType}
                onPress={() => updateField('type', itemType)}
                style={[
                  styles.typeButton,
                  formData.type === itemType && styles.typeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    formData.type === itemType && styles.typeTextActive,
                  ]}
                >
                  {itemType}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Image Upload */}
          <Text style={styles.label}>Item Photo</Text>
          <Pressable
            onPress={handlePickImage}
            disabled={uploadingImage}
            style={{
              borderWidth: 1.5,
              borderColor: imageUri ? '#6769ef' : '#d1d5db',
              borderStyle: imageUri ? 'solid' : 'dashed',
              borderRadius: 16,
              height: 180,
              marginBottom: 16,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: imageUri ? '#f5f5ff' : '#fafafa',
            }}
          >
            {uploadingImage ? (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#6769ef" />
                <Text style={{ color: '#6769ef', fontFamily: 'Jost-Medium', fontSize: 13 }}>
                  Uploading...
                </Text>
              </View>
            ) : imageUri ? (
              <>
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                {/* Re-pick overlay */}
                <View style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: 'white', fontFamily: 'Jost-Medium', fontSize: 12 }}>
                    Tap to change photo
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Ionicons name="camera-outline" size={36} color="#9ca3af" />
                <Text style={{ color: '#9ca3af', fontFamily: 'Jost-Medium', fontSize: 14 }}>
                  Tap to add a photo
                </Text>
                <Text style={{ color: '#d1d5db', fontFamily: 'Jost-Regular', fontSize: 12 }}>
                  JPG or PNG · max 5 MB
                </Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={formData.title}
            onChangeText={(value) => updateField('title', value)}
            placeholder="e.g. Engineering Mathematics Textbook"
            placeholderTextColor="#9ca3af"
          />
          {!!errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Describe item condition, specs, and pickup details"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
          />
          {!!errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}

          <Text style={styles.label}>Price (KES)</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            value={formData.price}
            onChangeText={(value) => updateField('price', value)}
            placeholder="e.g. 1500"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
          />
          {!!errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

          {formData.type === 'LEASE' && (
            <>
              <Text style={styles.label}>Price Unit</Text>
              <View style={styles.suggestionRow}>
                {leasePriceUnits.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => updateField('priceUnit', item)}
                    style={[
                      styles.chip,
                      formData.priceUnit === item && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.priceUnit === item && styles.chipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {!!errors.priceUnit && (
                <Text style={styles.errorText}>{errors.priceUnit}</Text>
              )}

              <Text style={styles.label}>Lease Duration</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.rowInput, errors.minDuration && styles.inputError]}
                  value={formData.minDuration}
                  onChangeText={(value) => updateField('minDuration', value)}
                  placeholder="Min"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.rowInput, errors.maxDuration && styles.inputError]}
                  value={formData.maxDuration}
                  onChangeText={(value) => updateField('maxDuration', value)}
                  placeholder="Max"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                />
              </View>
              {!!errors.minDuration && (
                <Text style={styles.errorText}>{errors.minDuration}</Text>
              )}
              {!!errors.maxDuration && (
                <Text style={styles.errorText}>{errors.maxDuration}</Text>
              )}

              <View style={styles.suggestionRow}>
                {leaseDurationUnits.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => updateField('durationUnit', item)}
                    style={[
                      styles.chip,
                      formData.durationUnit === item && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.durationUnit === item && styles.chipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Availability Window</Text>

              {/* Available From */}
              <Pressable
                onPress={() => setShowFromPicker(true)}
                style={[styles.input, { justifyContent: 'center' }]}
              >
                <Text style={{
                  color: formData.availableFrom ? '#111827' : '#9ca3af',
                  fontFamily: 'Jost-Regular',
                  fontSize: 15,
                }}>
                  {formData.availableFrom || 'Available from (tap to pick)'}
                </Text>
              </Pressable>

              {showFromPicker && (
                <DateTimePicker
                  value={formData.availableFrom ? new Date(formData.availableFrom) : new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowFromPicker(Platform.OS === 'ios'); // keep open on iOS
                    if (event.type === 'dismissed') { setShowFromPicker(false); return; }
                    if (selectedDate) updateField('availableFrom', formatDate(selectedDate));
                    if (Platform.OS === 'android') setShowFromPicker(false);
                  }}
                />
              )}

              {/* Available Until */}
              <Pressable
                onPress={() => setShowUntilPicker(true)}
                style={[styles.input, { justifyContent: 'center', marginTop: 8 }]}
              >
                <Text style={{
                  color: formData.availableUntil ? '#111827' : '#9ca3af',
                  fontFamily: 'Jost-Regular',
                  fontSize: 15,
                }}>
                  {formData.availableUntil || 'Available until (optional)'}
                </Text>
              </Pressable>

              {showUntilPicker && (
                <DateTimePicker
                  value={formData.availableUntil ? new Date(formData.availableUntil) : new Date()}
                  mode="date"
                  minimumDate={formData.availableFrom ? new Date(formData.availableFrom) : new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowUntilPicker(Platform.OS === 'ios');
                    if (event.type === 'dismissed') { setShowUntilPicker(false); return; }
                    if (selectedDate) updateField('availableUntil', formatDate(selectedDate));
                    if (Platform.OS === 'android') setShowUntilPicker(false);
                  }}
                />
              )}
            </>
          )}

          <Text style={styles.label}>Category</Text>

          {/* Category Selection Chips */}
          <View style={[styles.categoriesContainer, { marginBottom: 6 }]}>
            {categories.map((item) => {
              const isSelected = formData.category === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => updateField('category', item)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive
                    ]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {!!errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}

          <Text style={styles.label}>Condition</Text>

          {/* Condition Selection Chips */}
          <View style={[styles.categoriesContainer, { marginBottom: 6 }]}>
            {conditions.map((item) => {
              const isSelected = formData.condition === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => updateField('condition', item)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive
                    ]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {!!errors.condition && (
            <Text style={styles.errorText}>{errors.condition}</Text>
          )}

          <Text style={styles.label}>Pickup Location</Text>
          <Text className='mb-2 text-sm text-red-500'>Must be more than 3 characters</Text>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            value={formData.location}
            onChangeText={(value) => updateField('location', value)}
            placeholder="e.g. Hall 5 Gate"
            placeholderTextColor="#9ca3af"
          />
          {!!errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}

          {!!errors.seller && <Text style={styles.errorText}>{errors.seller}</Text>}

          <Pressable
            onPress={handleCreateListing}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Publish Listing</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateListing;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
    fontFamily: 'Jost-Medium',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#111827',
    fontFamily: 'Jost-Bold',
  },
  spacer: {
    width: 40,
    height: 40,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sellerBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sellerLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Jost-Medium',
  },
  sellerValue: {
    marginTop: 4,
    fontSize: 14,
    color: '#0f172a',
    fontFamily: 'Jost-Semibold',
  },
  label: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Jost-Semibold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Jost-Regular',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 120,
    marginBottom: 6,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Jost-Regular',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 10,
    fontSize: 13,
    fontFamily: 'Jost-Medium',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#6769ef',
    borderColor: '#6769ef',
  },
  typeText: {
    color: '#374151',
    fontFamily: 'Jost-Semibold',
    fontSize: 14,
  },
  typeTextActive: {
    color: '#ffffff',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#6769ef',
    borderColor: '#6769ef',
  },
  chipText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: 'Jost-Medium',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: '#6769ef',
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Jost-Bold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#6769ef',
    borderColor: '#6769ef',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Inter_400Regular',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Inter_600SemiBold',
  },
  checkIcon: {
    marginLeft: 4,
  },
});
