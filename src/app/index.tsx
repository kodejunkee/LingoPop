import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDatabase } from '@/storage/database';
import { getStoredNumber, StorageKeys } from '@/storage/mmkv';

const TIERS = [
  {
    id: 'tier-0',
    badge: 'Stage 0',
    title: 'The Sound Engine',
    subtitle: 'Pinyin, 4 Tones + Neutral, Minimal Pairs & Tone Sandhi',
    icon: 'volume-high' as const,
    color: '#FF6B35',
  },
  {
    id: 'tier-1',
    badge: 'Stage 1',
    title: 'Anatomy of Hanzi',
    subtitle: '8 Core Strokes, Stroke Order Rules & Top 100 Radicals',
    icon: 'brush' as const,
    color: '#2EC4B6',
  },
  {
    id: 'tier-2',
    badge: 'Stage 2',
    title: 'Sentence Architecture',
    subtitle: 'HSK 1–3 Grammar, Measure Words & Aspect Particles',
    icon: 'construct' as const,
    color: '#3A86FF',
  },
  {
    id: 'tier-3',
    badge: 'Stage 3',
    title: 'Fluency & Immersion',
    subtitle: 'HSK 4–9 Graded Readers, Idioms & Speaking Drills',
    icon: 'sparkles' as const,
    color: '#8338EC',
  },
];

export default function HomeScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [xp] = useState(() => getStoredNumber(StorageKeys.TOTAL_XP, 0));
  const [streak] = useState(() => getStoredNumber(StorageKeys.STREAK_DAYS, 0));

  useEffect(() => {
    let mounted = true;
    getDatabase()
      .then(() => {
        if (mounted) setDbReady(true);
      })
      .catch((err) => {
        console.warn('SQLite initialization error:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>LingoPop</Text>
            <Text style={styles.subtitle}>Mandarin Chinese · Zero to Fluency</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="flame" size={16} color="#FF6B35" />
              <Text style={styles.statText}>{streak}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="star" size={16} color="#FFB703" />
              <Text style={styles.statText}>{xp} XP</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusBanner}>
          <Ionicons
            name={dbReady ? 'checkmark-circle' : 'hourglass-outline'}
            size={18}
            color={dbReady ? '#1B9AAA' : '#6C757D'}
          />
          <Text style={styles.statusText}>
            {dbReady
              ? 'Offline Engine Ready (MMKV + SQLite FTS5 initialized)'
              : 'Initializing offline database...'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Curriculum Path</Text>

        {TIERS.map((tier) => (
          <View key={tier.id} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: `${tier.color}18` }]}>
              <Ionicons name={tier.icon} size={24} color={tier.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardBadge, { color: tier.color }]}>{tier.badge}</Text>
              <Text style={styles.cardTitle}>{tier.title}</Text>
              <Text style={styles.cardSubtitle}>{tier.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1C1E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDF6F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8ECF0',
  },
  statusText: {
    fontSize: 13,
    color: '#1D3557',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardBadge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
    lineHeight: 18,
  },
});
