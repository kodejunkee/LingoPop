import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { speakMandarin } from '../engines/audioService';
import { triggerTapHaptic } from '../engines/haptics';
import { Colors, Radii, Spacing } from '../theme/tokens';

interface AudioControlRowProps {
  hanziText: string;
  label?: string;
  compact?: boolean;
}

export function AudioControlRow({
  hanziText,
  label = 'Listen',
  compact = false,
}: AudioControlRowProps) {
  const [activeSpeed, setActiveSpeed] = useState<'normal' | 'slow' | null>(null);

  const handlePlay = (slow: boolean) => {
    triggerTapHaptic();
    speakMandarin(hanziText, {
      slow,
      onStart: () => setActiveSpeed(slow ? 'slow' : 'normal'),
      onDone: () => setActiveSpeed(null),
      onError: () => setActiveSpeed(null),
    });
  };

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Pressable
        onPress={() => handlePlay(false)}
        style={({ pressed }) => [
          styles.playBtn,
          activeSpeed === 'normal' && styles.playBtnActive,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Play ${label} at normal speed`}
      >
        <Ionicons
          name={activeSpeed === 'normal' ? 'volume-high' : 'play'}
          size={18}
          color="#FFFFFF"
        />
        <Text style={styles.playBtnText}>{label}</Text>
      </Pressable>

      <Pressable
        onPress={() => handlePlay(true)}
        style={({ pressed }) => [
          styles.slowBtn,
          activeSpeed === 'slow' && styles.slowBtnActive,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Play ${label} slowly at 0.7x speed`}
      >
        <Ionicons
          name="speedometer-outline"
          size={17}
          color={activeSpeed === 'slow' ? '#FFFFFF' : Colors.primary}
        />
        <Text
          style={[
            styles.slowBtnText,
            activeSpeed === 'slow' && styles.slowBtnTextActive,
          ]}
        >
          0.7x Slow
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  rowCompact: {
    justifyContent: 'flex-start',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.pill,
  },
  playBtnActive: {
    backgroundColor: '#E55A28',
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  slowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#FFD6C4',
  },
  slowBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slowBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  slowBtnTextActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
