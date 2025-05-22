import { Stack } from 'expo-router';

const TabLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="lists" options={{ headerShown: false }} />
      <Stack.Screen name="map" options={{ headerShown: false }} />
      <Stack.Screen name="driver" options={{ headerShown: false }} />
      <Stack.Screen name="busdocs" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen name="uiTicks" options={{ headerShown: false }} />
      <Stack.Screen name="prf" options={{ headerShown: false }} />
      <Stack.Screen name="booked" options={{ headerShown: false }} />
      <Stack.Screen name="pass" options={{ headerShown: false }} />
    </Stack>
  );
};

export default TabLayout;
