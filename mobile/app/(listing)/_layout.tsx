
import { Stack } from 'expo-router'

const ListingLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='create-listing' />
      <Stack.Screen name='edit-listing' />
    </Stack>
  )
}

export default ListingLayout;

