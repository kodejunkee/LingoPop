import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RadicalOption } from '../curriculum/types';
import { triggerTapHaptic } from '../engines/haptics';
import { Colors, Radii, Spacing } from '../theme/tokens';

interface ChoiceOptionListProps {
  options: RadicalOption[];
  targetOptionId: string;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}

export function ChoiceOptionList({
  options,
  targetOptionId,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: ChoiceOptionListProps) {
  return (
    <View style={styles.optionsColumn}>
      {options.map((opt) => {
        const isSelected = selectedAnswer === opt.id;
        const isTarget = opt.id === targetOptionId;

        let borderColor: string = Colors.border;
        let bgColor: string = Colors.surface;

        if (isChecked) {
          if (isTarget) {
            borderColor = Colors.success;
            bgColor = Colors.successSoft;
          } else if (isSelected) {
            borderColor = Colors.error;
            bgColor = Colors.errorSoft;
          }
        } else if (isSelected) {
          borderColor = Colors.primary;
          bgColor = Colors.primarySoft;
        }

        return (
          <Pressable
            key={opt.id}
            disabled={isChecked}
            onPress={() => {
              triggerTapHaptic();
              onSelectAnswer(opt.id);
            }}
            style={[styles.choiceRow, { borderColor, backgroundColor: bgColor }]}
          >
            <View style={styles.optionBody}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              {opt.sublabel ? (
                <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
              ) : null}
            </View>
            <Ionicons
              name={isSelected ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={isSelected ? Colors.primary : Colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  optionsColumn: {
    gap: Spacing.md,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 2,
  },
  optionBody: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  optionSublabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
