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
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getCategories, getConditions, updateListing } from '@/lib/listingService';
import { getAuthToken } from '@/lib/apiClient';

type ListingType = 'SALE' | 'LEASE';

const defaultConditions = [
  'Brand New', 'Like New', 'Excellent',
  'Good', 'Used - Like New', 'Fair',
];

const leasePriceUnits = ['/hour', '/day', '/week', '/month'];
const leaseDurationUnits = ['hours', 'days', 'weeks', 'months'];

const EditListing = () => {
  const router = useRouter();

  // Receive existing listing data via params
  const params = useLocalSearchParams<{
    id: string;
    type: string;
    title: string;
    description: string;
    price: string;
    priceUnit: string;
    minDuration: string;
    maxDuration: string;
    durationUnit: string;
    availableFrom: string;
    availableUntil: string;
    category: string;
    condition: string;
    location: string;
    imageUrl: string;
  }>();

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>(defaultConditions);
  const [imageUri, setImageUri] = useState<string | null>(params.imageUrl || null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: params.title || '',
    description: params.description || '',
    price: params.price || '',
    priceUnit: params.priceUnit || '/day',
    minDuration: params.minDuration || '',
    maxDuration: params.maxDuration || '',
    durationUnit: params.durationUnit || 'days',
    availableFrom: params.availableFrom || '',
    availableUntil: params.availableUntil || '',
    type: (params.type as ListingType) || 'SALE',
    category: params.category || '',
    condition: params.condition || '',
    location: params.location || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      try {
        const [categoriesRes, conditionsRes] = await Promise.all([
          getCategories(), getConditions(),
        ]);

        if (categoriesRes.success && categoriesRes.data?.categories) {
          const items = (categoriesRes.data.categories as any[])
            .map((i: any) => typeof i === 'string' ? i : i?.category)
            .filter(Boolean);
          setCategories(Array.from(new Set(items)));
        }

        if (conditionsRes.success && conditionsRes.data?.conditions) {
          const items = (conditionsRes.data.conditions as any[])
            .map((i: any) => typeof i === 'string' ? i : i?.condition)
            .filter(Boolean);
          if (items.length > 0) setConditions(Array.from(new Set(items)));
        }
      } catch {
        Alert.alert('Error', 'Failed to load form data.');
      } finally {
        setLoadingPage(false);
      }
    };
    init();
  }, []);

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const c = { ...prev }; delete c[key]; return c; });
  };

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
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.title.trim()) next.title = 'Title is required.';
    if (!formData.description.trim()) next.description = 'Description is required.';
    if (!formData.price.trim()) next.price = 'Price is required.';
    if (formData.price.trim() && Number(formData.price) <= 0)
      next.price = 'Price must be greater than zero.';
    if (formData.type === 'LEASE' && !formData.priceUnit.trim())
      next.priceUnit = 'Price unit is required for lease items.';
    if (formData.type === 'LEASE' && formData.minDuration && Number(formData.minDuration) <= 0)
      next.minDuration = 'Minimum duration must be greater than zero.';
    if (formData.type === 'LEASE' && formData.maxDuration && Number(formData.maxDuration) <= 0)
      next.maxDuration = 'Maximum duration must be greater than zero.';
    if (
      formData.type === 'LEASE' && formData.minDuration && formData.maxDuration &&
      Number(formData.maxDuration) < Number(formData.minDuration)
    ) next.maxDuration = 'Maximum must be at least the minimum.';
    if (!formData.category.trim()) next.category = 'Category is required.';
    if (!formData.condition.trim()) next.condition = 'Condition is required.';
    if (!formData.location.trim()) next.location = 'Location is required.';
    else if (formData.location.trim().length < 3) next.location = 'Location must be at least 3 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpdateListing = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const body = new FormData();
      body.append('title', formData.title.trim());
      body.append('description', formData.description.trim());
      body.append('price', formData.price);
      body.append('category', formData.category.trim());
      body.append('condition', formData.condition.trim());
      body.append('location', formData.location.trim());

      if (formData.type === 'LEASE') {
        body.append('price_unit', formData.priceUnit);
        body.append('duration_unit', formData.durationUnit);
        if (formData.minDuration) body.append('min_duration', formData.minDuration);
        if (formData.maxDuration) body.append('max_duration', formData.maxDuration);
        if (formData.availableFrom) body.append('available_from', formData.availableFrom);
        if (formData.availableUntil) body.append('available_until', formData.availableUntil);
      }

      // Only append image if the user picked a NEW one (not the existing URL)
      if (imageUri && imageUri !== params.imageUrl) {
        const filename = imageUri.split('/').pop() ?? 'listing.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1].replace('jpg', 'jpeg')}` : 'image/jpeg';
        body.append('image', { uri: imageUri, name: filename, type: mimeType } as any);
      }

      const token = await getAuthToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL || 'https://campus-mart.hantardev.tech/api'}/listings/${params.id}?type=${formData.type}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          body,
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('Updated', 'Your listing has been updated.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      if (response.status === 400 && data.details) {
        const backendErrors: Record<string, string> = {};
        for (const err of data.details) {
          const key = err.path?.replace('body.', '');
          if (key) backendErrors[key] = err.message;
        }
        setErrors(backendErrors);
        Alert.alert('Validation Error', 'Please fix the highlighted fields.');
        return;
      }

      if (response.status === 403) {
        Alert.alert('Unauthorized', 'You can only edit your own listings.');
        return;
      }

      Alert.alert('Failed', data.message || 'Could not update listing.');
    } catch (error: any) {
      if (error?.message?.includes('Network request failed')) {
        Alert.alert('No connection', 'Check your internet and try again.');
        return;
      }
      Alert.alert('Error', error?.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6769ef" />
          <Text style={styles.loadingText}>Loading listing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#6769ef" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Listing</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Type — read-only for edits, changing type is not supported by backend */}
          <Text style={styles.label}>Listing Type</Text>
          <View style={styles.typeRow}>
            {(['SALE', 'LEASE'] as ListingType[]).map(t => (
              <View
                key={t}
                style={[styles.typeButton, formData.type === t && styles.typeButtonActive]}
              >
                <Text style={[styles.typeText, formData.type === t && styles.typeTextActive]}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
          <Text className='mt-2 mb-4 text-sm text-red-500'>
            Listing type cannot be changed after creation.
          </Text>

          {/* Image */}
          <Text style={styles.label}>Item Photo</Text>
          <Pressable
            onPress={handlePickImage}
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
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8, alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontFamily: 'Jost-Medium', fontSize: 12 }}>Tap to change photo</Text>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Ionicons name="camera-outline" size={36} color="#9ca3af" />
                <Text style={{ color: '#9ca3af', fontFamily: 'Jost-Medium', fontSize: 14 }}>Tap to add a photo</Text>
                <Text style={{ color: '#d1d5db', fontFamily: 'Jost-Regular', fontSize: 12 }}>JPG or PNG · max 5 MB</Text>
              </View>
            )}
          </Pressable>

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={formData.title}
            onChangeText={v => updateField('title', v)}
            placeholder="e.g. Engineering Mathematics Textbook"
            placeholderTextColor="#9ca3af"
          />
          {!!errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={v => updateField('description', v)}
            placeholder="Describe item condition, specs, and pickup details"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
          />
          {!!errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

          {/* Price */}
          <Text style={styles.label}>Price (KES)</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            value={formData.price}
            onChangeText={v => updateField('price', v)}
            placeholder="e.g. 1500"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
          />
          {!!errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

          {/* LEASE-only fields */}
          {formData.type === 'LEASE' && (
            <>
              <Text style={styles.label}>Price Unit</Text>
              <View style={styles.suggestionRow}>
                {leasePriceUnits.map(item => (
                  <Pressable
                    key={item}
                    onPress={() => updateField('priceUnit', item)}
                    style={[styles.chip, formData.priceUnit === item && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, formData.priceUnit === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
              {!!errors.priceUnit && <Text style={styles.errorText}>{errors.priceUnit}</Text>}

              <Text style={styles.label}>Lease Duration</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.rowInput, errors.minDuration && styles.inputError]}
                  value={formData.minDuration}
                  onChangeText={v => updateField('minDuration', v)}
                  placeholder="Min"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.rowInput, errors.maxDuration && styles.inputError]}
                  value={formData.maxDuration}
                  onChangeText={v => updateField('maxDuration', v)}
                  placeholder="Max"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                />
              </View>
              {!!errors.minDuration && <Text style={styles.errorText}>{errors.minDuration}</Text>}
              {!!errors.maxDuration && <Text style={styles.errorText}>{errors.maxDuration}</Text>}

              <View style={styles.suggestionRow}>
                {leaseDurationUnits.map(item => (
                  <Pressable
                    key={item}
                    onPress={() => updateField('durationUnit', item)}
                    style={[styles.chip, formData.durationUnit === item && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, formData.durationUnit === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Availability Window</Text>

              <Pressable onPress={() => setShowFromPicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
                <Text style={{ color: formData.availableFrom ? '#111827' : '#9ca3af', fontFamily: 'Jost-Regular', fontSize: 15 }}>
                  {formData.availableFrom || 'Available from (tap to pick)'}
                </Text>
              </Pressable>
              {showFromPicker && (
                <DateTimePicker
                  value={formData.availableFrom ? new Date(formData.availableFrom) : new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (event.type === 'dismissed') { setShowFromPicker(false); return; }
                    if (date) updateField('availableFrom', formatDate(date));
                    setShowFromPicker(false);
                  }}
                />
              )}

              <Pressable onPress={() => setShowUntilPicker(true)} style={[styles.input, { justifyContent: 'center', marginTop: 8 }]}>
                <Text style={{ color: formData.availableUntil ? '#111827' : '#9ca3af', fontFamily: 'Jost-Regular', fontSize: 15 }}>
                  {formData.availableUntil || 'Available until (optional)'}
                </Text>
              </Pressable>
              {showUntilPicker && (
                <DateTimePicker
                  value={formData.availableUntil ? new Date(formData.availableUntil) : new Date()}
                  mode="date"
                  minimumDate={formData.availableFrom ? new Date(formData.availableFrom) : new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (event.type === 'dismissed') { setShowUntilPicker(false); return; }
                    if (date) updateField('availableUntil', formatDate(date));
                    setShowUntilPicker(false);
                  }}
                />
              )}
            </>
          )}

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={[styles.categoriesContainer, { marginBottom: 6 }]}>
            {categories.map(item => {
              const isSelected = formData.category === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => updateField('category', item)}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>{item}</Text>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </Pressable>
              );
            })}
          </View>
          {!!errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

          {/* Condition */}
          <Text style={styles.label}>Condition</Text>
          <View style={[styles.categoriesContainer, { marginBottom: 6 }]}>
            {conditions.map(item => {
              const isSelected = formData.condition === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => updateField('condition', item)}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>{item}</Text>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </Pressable>
              );
            })}
          </View>
          {!!errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}

          {/* Location */}
          <Text style={styles.label}>Pickup Location</Text>
          <Text style={{ marginBottom: 8, fontSize: 12, color: '#ef4444', fontFamily: 'Jost-Regular' }}>
            Must be more than 3 characters
          </Text>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            value={formData.location}
            onChangeText={v => updateField('location', v)}
            placeholder="e.g. Hall 5 Gate"
            placeholderTextColor="#9ca3af"
          />
          {!!errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

          {/* Submit */}
          <Pressable
            onPress={handleUpdateListing}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          >
            {submitting
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.submitButtonText}>Save Changes</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditListing;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
    fontFamily: 'Jost-Medium',
    fontSize: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 22,
    color: '#111827',
    fontFamily: 'Jost-Bold'
  },
  spacer: {
    width: 40,
    height: 40
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32
  },
  label: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Jost-Semibold'
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
    fontFamily: 'Jost-Regular'
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
    fontFamily: 'Jost-Regular'
  },
  inputError: {
    borderColor: '#ef4444'
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 10,
    fontSize: 13,
    fontFamily: 'Jost-Medium'
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  typeButtonActive: {
    backgroundColor: '#6769ef',
    borderColor: '#6769ef'
  },
  typeText: {
    color: '#374151',
    fontFamily: 'Jost-Semibold',
    fontSize: 14
  },
  typeTextActive: {
    color: '#ffffff'
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 10
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  chipActive: {
    backgroundColor: '#6769ef',
    borderColor: '#6769ef'
  },
  chipText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: 'Jost-Medium'
  },
  chipTextActive: {
    color: '#ffffff'
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  rowInput: {
    flex: 1
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: '#6769ef',
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Jost-Bold'
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8
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
    gap: 6
  },
  categoryChipActive: {
    backgroundColor: '#6769ef',
    borderColor: '#6769ef'
  },
  categoryChipText: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Jost-Regular'
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Jost-Semibold'
  },
});