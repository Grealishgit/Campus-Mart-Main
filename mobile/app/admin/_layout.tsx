import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function AdminLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#22d3ee",
                tabBarInactiveTintColor: "#94a3b8",
                tabBarStyle: {
                    backgroundColor: "#020617",
                    borderTopColor: "rgba(148, 163, 184, 0.2)",
                    height: 72,
                    paddingTop: 8,
                    paddingBottom: 10,
                },
                tabBarBackground: () => <View style={{ flex: 1, backgroundColor: "#020617" }} />,
                tabBarLabelStyle: {
                    fontFamily: "Jost-SemiBold",
                    fontSize: 12,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="grid-outline" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="users"
                options={{
                    title: "Users",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="people-outline" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="listings"
                options={{
                    title: "Listings",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="pricetags-outline" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="person-outline" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{ href: null, }}

            />
            <Tabs.Screen
                name="login"
                options={{
                    href: null,
                    tabBarStyle: { display: "none" },
                }}
            />
        </Tabs>
    );
}
