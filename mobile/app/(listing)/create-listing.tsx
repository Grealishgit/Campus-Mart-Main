import React, { useEffect, useState } from 'react';
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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
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
            { text: 'OK', onPress: () => router.replace('/(auth)/SignIn') },
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

    // Backend sets seller_id from req.user.id (JWT), so it is not sent in the body.
    const payload: CreateListingRequest = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      type: formData.type,
      category: formData.category.trim(),
      condition: formData.condition.trim(),
      location: formData.location.trim(),
    };

    if (formData.type === 'LEASE') {
      payload.price_unit = formData.priceUnit.trim();
      if (formData.minDuration.trim()) {
        payload.min_duration = Number(formData.minDuration);
      }
      if (formData.maxDuration.trim()) {
        payload.max_duration = Number(formData.maxDuration);
      }
      payload.duration_unit = formData.durationUnit;
      if (formData.availableFrom.trim()) {
        payload.available_from = formData.availableFrom.trim();
      }
      if (formData.availableUntil.trim()) {
        payload.available_until = formData.availableUntil.trim();
      }
    }

    try {
      setSubmitting(true);
      const response = await createListing(payload);

      if (response.success) {
        Alert.alert('Success', 'Your item has been listed successfully.', [
          { text: 'Go Home', onPress: () => router.replace('/(tabs)') },
        ]);
        return;
      }

      Alert.alert('Failed', response.error || 'Could not create listing.');
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while creating listing.');
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
              <TextInput
                style={styles.input}
                value={formData.availableFrom}
                onChangeText={(value) => updateField('availableFrom', value)}
                placeholder="Available from (YYYY-MM-DD)"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.input}
                value={formData.availableUntil}
                onChangeText={(value) => updateField('availableUntil', value)}
                placeholder="Available until (optional, YYYY-MM-DD)"
                placeholderTextColor="#9ca3af"
              />
            </>
          )}

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={[styles.input, errors.category && styles.inputError]}
            value={formData.category}
            onChangeText={(value) => updateField('category', value)}
            placeholder="e.g. Textbooks, Electronics"
            placeholderTextColor="#9ca3af"
          />
          {categories.length > 0 && (
            <View style={styles.suggestionRow}>
              {categories.slice(0, 6).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => updateField('category', item)}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {!!errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}

          <Text style={styles.label}>Condition</Text>
          <TextInput
            style={[styles.input, errors.condition && styles.inputError]}
            value={formData.condition}
            onChangeText={(value) => updateField('condition', value)}
            placeholder="e.g. Like New"
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.suggestionRow}>
            {conditions.slice(0, 6).map((item) => (
              <Pressable
                key={item}
                onPress={() => updateField('condition', item)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          {!!errors.condition && (
            <Text style={styles.errorText}>{errors.condition}</Text>
          )}

          <Text style={styles.label}>Pickup Location</Text>
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
});
