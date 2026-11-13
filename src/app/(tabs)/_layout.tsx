import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Radii } from '@/theme/tokens';

function TabItem({
  label,
  activeIcon,
  inactiveIcon,
  focused,
}: {
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  if (focused) {
    return (
      <View style={styles.activePill}>
        <Ionicons name={activeIcon} size={15} color="#FFFFFF" />
        <Text style={styles.activePillText}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.inactiveItem}>
      <Ionicons name={inactiveIcon} size={20} color="#94A3B8" />
      <Text style={styles.inactiveLabel}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Home"
              activeIcon="home"
              inactiveIcon="home-outline"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Learn"
              activeIcon="school"
              inactiveIcon="school-outline"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: 'Characters',
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Characters"
              activeIcon="brush"
              inactiveIcon="brush-outline"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Practice"
              activeIcon="game-controller"
              inactiveIcon="game-controller-outline"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Profile"
              activeIcon="person"
              inactiveIcon="person-outline"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1ECE6',
    height: 64,
    paddingTop: 6,
    paddingBottom: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inactiveItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
