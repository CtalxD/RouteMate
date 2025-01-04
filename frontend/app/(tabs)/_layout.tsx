import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
      }}>
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

    </Tabs>
  );
};

export default TabsLayout;
