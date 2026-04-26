import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Foundation from '@expo/vector-icons/Foundation';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Platform, StyleSheet, Text, View } from 'react-native';

const TabLabel = ({ label, focused, color }: { label: string; focused: boolean; color: string }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ color, fontSize: 12, fontFamily: 'Jost-Regular' }}>{label}</Text>
    {focused && (
      <View style={{
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: color,
        marginTop: 3,
      }} />
    )}
  </View>
);


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Foundation size={28} name="home" color={color} />,
          tabBarLabel: ({ focused, color }) => <TabLabel label="Home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <AntDesign size={28} name="code-sandbox" color={color} />,
          tabBarLabel: ({ focused, color }) => <TabLabel label="Orders" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="leases"
        options={{
          title: 'Leases',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="bookmarks-outline" color={color} />,
          tabBarLabel: ({ focused, color }) => <TabLabel label="Leases" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <Entypo size={28} name="chat" color={color} />,
          tabBarLabel: ({ focused, color }) => <TabLabel label="Chats" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person-outline" color={color} />,
          tabBarLabel: ({ focused, color }) => <TabLabel label="Profile" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    elevation: 0,
    height: 75,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 0,
  },
  tabBarBackground: {
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  tabBarItem: {
    paddingTop: 14,
  },
  tabBarLabel: {
    fontSize: 14,
    fontFamily: 'font-display',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 30,
    borderRadius: 20,
    marginTop: 0,
  },

});
