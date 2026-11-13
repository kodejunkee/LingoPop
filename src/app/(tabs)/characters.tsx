import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioControlRow } from '@/components/AudioControlRow';
import { HanziCanvas } from '@/components/HanziCanvas';
import { DOJO_CHARACTERS, type HanziCharacterDef } from '@/curriculum/hanziData';
import { speakMandarin, stopMandarinSpeech } from '@/engines/audioService';
import { triggerSuccessHaptic, triggerTapHaptic } from '@/engines/haptics';
import {
  getHanziByChar,
  searchHanziCatalog,
  type HanziCatalogItem,
} from '@/storage/corpusQueries';
import { Colors, Radii, Spacing, ToneColors } from '@/theme/tokens';

type CharacterTabSection = 'dojo' | 'pinyin' | 'radicals';

interface RadicalInfo {
  radical: string;
  name: string;
  meaning: string;
  strokes: number;
  examples: { char: string; pinyin: string; meaning: string }[];
}

const ESSENTIAL_RADICALS: RadicalInfo[] = [
  {
    radical: '氵',
    name: '三点水 (sān diǎn shuǐ)',
    meaning: 'Water / Liquid',
    strokes: 3,
    examples: [
      { char: '汉', pinyin: 'hàn', meaning: 'Han / Chinese' },
      { char: '江', pinyin: 'jiāng', meaning: 'River' },
      { char: '海', pinyin: 'hǎi', meaning: 'Sea / Ocean' },
      { char: '渴', pinyin: 'kě', meaning: 'Thirsty' },
    ],
  },
  {
    radical: '亻 / 人',
    name: '单人旁 (dān rén páng)',
    meaning: 'Person / Human behavior',
    strokes: 2,
    examples: [
      { char: '你', pinyin: 'nǐ', meaning: 'You' },
      { char: '他', pinyin: 'tā', meaning: 'He / Him' },
      { char: '们', pinyin: 'men', meaning: 'Plural marker' },
      { char: '休', pinyin: 'xiū', meaning: 'Rest' },
    ],
  },
  {
    radical: '口',
    name: '口字旁 (kǒu zì páng)',
    meaning: 'Mouth / Speech / Intake',
    strokes: 3,
    examples: [
      { char: '吃', pinyin: 'chī', meaning: 'To eat' },
      { char: '喝', pinyin: 'hē', meaning: 'To drink' },
      { char: '叫', pinyin: 'jiào', meaning: 'To call / be called' },
      { char: '问', pinyin: 'wèn', meaning: 'To ask' },
    ],
  },
  {
    radical: '木',
    name: '木字旁 (mù zì páng)',
    meaning: 'Tree / Wood / Vegetation',
    strokes: 4,
    examples: [
      { char: '本', pinyin: 'běn', meaning: 'Root / Book volume' },
      { char: '杯', pinyin: 'bēi', meaning: 'Cup / Glass' },
      { char: '机', pinyin: 'jī', meaning: 'Machine / Plane' },
      { char: '校', pinyin: 'xiào', meaning: 'School' },
    ],
  },
  {
    radical: '日',
    name: '日字旁 (rì zì páng)',
    meaning: 'Sun / Day / Time',
    strokes: 4,
    examples: [
      { char: '明', pinyin: 'míng', meaning: 'Bright / Tomorrow' },
      { char: '早', pinyin: 'zǎo', meaning: 'Early / Morning' },
      { char: '时', pinyin: 'shí', meaning: 'Time / Hour' },
      { char: '昨', pinyin: 'zuó', meaning: 'Yesterday' },
    ],
  },
  {
    radical: '月',
    name: '月字旁 / 肉月旁',
    meaning: 'Moon / Month / Flesh & Body',
    strokes: 4,
    examples: [
      { char: '朋', pinyin: 'péng', meaning: 'Friend' },
      { char: '期', pinyin: 'qī', meaning: 'Period / Date' },
      { char: '服', pinyin: 'fú', meaning: 'Clothes' },
      { char: '脸', pinyin: 'liǎn', meaning: 'Face' },
    ],
  },
  {
    radical: '女',
    name: '女字旁 (nǚ zì páng)',
    meaning: 'Woman / Female relations',
    strokes: 3,
    examples: [
      { char: '好', pinyin: 'hǎo', meaning: 'Good / Well' },
      { char: '妈', pinyin: 'mā', meaning: 'Mother' },
      { char: '她', pinyin: 'tā', meaning: 'She / Her' },
      { char: '妹', pinyin: 'mèi', meaning: 'Younger sister' },
    ],
  },
  {
    radical: '心 / 忄',
    name: '竖心旁 / 心字底',
    meaning: 'Heart / Mind / Emotions',
    strokes: 4,
    examples: [
      { char: '想', pinyin: 'xiǎng', meaning: 'To think / miss' },
      { char: '快', pinyin: 'kuài', meaning: 'Fast / Joyful' },
      { char: '忙', pinyin: 'máng', meaning: 'Busy' },
      { char: '懂', pinyin: 'dǒng', meaning: 'Understand' },
    ],
  },
  {
    radical: '手 / 扌',
    name: '提手旁 (tí shǒu páng)',
    meaning: 'Hand / Physical actions',
    strokes: 3,
    examples: [
      { char: '打', pinyin: 'dǎ', meaning: 'To hit / call' },
      { char: '找', pinyin: 'zhǎo', meaning: 'To look for' },
      { char: '拿', pinyin: 'ná', meaning: 'To hold / take' },
      { char: '提', pinyin: 'tí', meaning: 'To carry / lift' },
    ],
  },
  {
    radical: '讠 / 言',
    name: '言字旁 (yán zì páng)',
    meaning: 'Speech / Language / Words',
    strokes: 2,
    examples: [
      { char: '说', pinyin: 'shuō', meaning: 'To speak' },
      { char: '话', pinyin: 'huà', meaning: 'Words / Speech' },
      { char: '语', pinyin: 'yǔ', meaning: 'Spoken language' },
      { char: '读', pinyin: 'dú', meaning: 'To read' },
    ],
  },
  {
    radical: '饣 / 食',
    name: '食字旁 (shí zì páng)',
    meaning: 'Food / Meals / Eating',
    strokes: 3,
    examples: [
      { char: '饭', pinyin: 'fàn', meaning: 'Rice / Meal' },
      { char: '饮', pinyin: 'yǐn', meaning: 'Drink / Beverage' },
      { char: '饱', pinyin: 'bǎo', meaning: 'Full / Satiated' },
      { char: '饺', pinyin: 'jiǎo', meaning: 'Dumpling' },
    ],
  },
  {
    radical: '辶',
    name: '走之底 (zǒu zhī dǐ)',
    meaning: 'Walking / Movement / Distance',
    strokes: 3,
    examples: [
      { char: '进', pinyin: 'jìn', meaning: 'To enter' },
      { char: '远', pinyin: 'yuǎn', meaning: 'Far / Distant' },
      { char: '近', pinyin: 'jìn', meaning: 'Near / Close' },
      { char: '边', pinyin: 'biān', meaning: 'Side / Edge' },
    ],
  },
];

const PINYIN_INITIALS = [
  { group: 'Labials (Lips)', items: ['b', 'p', 'm', 'f'] },
  { group: 'Alveolars (Tongue Tip)', items: ['d', 't', 'n', 'l'] },
  { group: 'Velars (Back of Tongue)', items: ['g', 'k', 'h'] },
  { group: 'Palatals (Flat Tongue)', items: ['j', 'q', 'x'] },
  { group: 'Retroflex (Curled Tongue)', items: ['zh', 'ch', 'sh', 'r'] },
  { group: 'Dental Sibilants (Teeth)', items: ['z', 'c', 's'] },
  { group: 'Zero-Initial Semivowels', items: ['y', 'w'] },
];

const PINYIN_FINALS = [
  { group: 'Simple Finals', items: ['a', 'o', 'e', 'i', 'u', 'ü'] },
  { group: 'Compound Finals', items: ['ai', 'ei', 'ao', 'ou', 'ia', 'ie', 'ua', 'uo', 'üe'] },
  { group: 'Nasal Finals', items: ['an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'] },
];

const PINYIN_TONES = [
  { tone: 1, name: '1st Tone', contour: '55', desc: 'High & Level', example: 'mā (妈 - mom)', color: ToneColors[1] },
  { tone: 2, name: '2nd Tone', contour: '35', desc: 'Rising (like "Huh?")', example: 'má (麻 - hemp)', color: ToneColors[2] },
  { tone: 3, name: '3rd Tone', contour: '214', desc: 'Low & Dipping', example: 'mǎ (马 - horse)', color: ToneColors[3] },
  { tone: 4, name: '4th Tone', contour: '51', desc: 'Sharp Drop (assertive)', example: 'mà (骂 - scold)', color: ToneColors[4] },
  { tone: 5, name: 'Neutral', contour: '·', desc: 'Short & Light', example: 'ma (吗 - question)', color: ToneColors[5] },
];

const HSK_FILTERS: { label: string; value: number | null }[] = [
  { label: 'Curated', value: -1 },
  { label: 'All HSK', value: null },
  { label: 'HSK 1', value: 1 },
  { label: 'HSK 2', value: 2 },
  { label: 'HSK 3', value: 3 },
  { label: 'HSK 4', value: 4 },
  { label: 'HSK 5', value: 5 },
  { label: 'HSK 6', value: 6 },
  { label: 'HSK 7–9', value: 7 },
];

const CURATED_ITEMS: HanziCatalogItem[] = DOJO_CHARACTERS.map((d) => ({
  char: d.char,
  pinyin: d.pinyin,
  tone: d.tone,
  meaning: d.meaning,
  radical: d.radical,
  strokeCount: d.strokes.length,
  hskLevel: d.hskLevel ?? 1,
}));

export default function CharactersScreen() {
  const [section, setSection] = useState<CharacterTabSection>('dojo');

  // Hanzi Dojo State
  const [selectedChar, setSelectedChar] = useState<HanziCharacterDef>(DOJO_CHARACTERS[0]);
  const [query, setQuery] = useState('');
  const [hskFilter, setHskFilter] = useState<number | null>(-1);
  const [catalog, setCatalog] = useState<HanziCatalogItem[]>(CURATED_ITEMS);
  const [selectedRadical, setSelectedRadical] = useState<RadicalInfo | null>(null);

  useEffect(() => {
    return () => {
      stopMandarinSpeech();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (hskFilter === -1 && !query.trim()) {
        if (active) setCatalog(CURATED_ITEMS);
        return;
      }
      const levelArg = hskFilter === -1 ? null : hskFilter;
      searchHanziCatalog(query, levelArg, 80)
        .then((items) => {
          if (active) {
            setCatalog(items);
          }
        })
        .catch((err) => console.warn('Hanzi catalog query error:', err));
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, hskFilter]);

  const handleSelectChar = async (item: HanziCatalogItem) => {
    triggerTapHaptic();
    const curated = DOJO_CHARACTERS.find((d) => d.char === item.char);
    if (curated) {
      setSelectedChar(curated);
      return;
    }

    try {
      const full = await getHanziByChar(item.char);
      if (full) {
        setSelectedChar(full);
      }
    } catch (e) {
      console.warn('Failed to load character strokes:', e);
    }
  };

  const handlePlaySound = (text: string) => {
    triggerTapHaptic();
    speakMandarin(text);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Characters & Writing</Text>
          <Text style={styles.headerSubtitle}>Pinyin · Radicals · Stroke Order Dojo</Text>
        </View>
      </View>

      {/* Segmented Section Switcher */}
      <View style={styles.segmentContainer}>
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setSection('dojo');
          }}
          style={[styles.segmentBtn, section === 'dojo' && styles.segmentBtnActive]}
        >
          <Ionicons
            name="brush"
            size={16}
            color={section === 'dojo' ? '#FFFFFF' : Colors.textSecondary}
          />
          <Text
            style={[styles.segmentText, section === 'dojo' && styles.segmentTextActive]}
          >
            Hanzi Dojo
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setSection('pinyin');
          }}
          style={[styles.segmentBtn, section === 'pinyin' && styles.segmentBtnActive]}
        >
          <Ionicons
            name="volume-medium"
            size={16}
            color={section === 'pinyin' ? '#FFFFFF' : Colors.textSecondary}
          />
          <Text
            style={[styles.segmentText, section === 'pinyin' && styles.segmentTextActive]}
          >
            Pinyin Chart
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setSection('radicals');
          }}
          style={[styles.segmentBtn, section === 'radicals' && styles.segmentBtnActive]}
        >
          <Ionicons
            name="cube"
            size={16}
            color={section === 'radicals' ? '#FFFFFF' : Colors.textSecondary}
          />
          <Text
            style={[styles.segmentText, section === 'radicals' && styles.segmentTextActive]}
          >
            Radicals
          </Text>
        </Pressable>
      </View>

      {/* SECTION 1: HANZI DOJO */}
      {section === 'dojo' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Active Character Practice Card */}
          <View style={styles.card}>
            <View style={styles.charInfoRow}>
              <View style={styles.charPill}>
                <Text style={styles.charPillText}>{selectedChar.char}</Text>
              </View>
              <View style={styles.charMeta}>
                <Text style={styles.charPinyin}>{selectedChar.pinyin}</Text>
                <Text style={styles.charMeaning}>{selectedChar.meaning}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.miniBadge}>
                    <Text style={styles.miniBadgeText}>Radical: {selectedChar.radical}</Text>
                  </View>
                  <View style={styles.miniBadge}>
                    <Text style={styles.miniBadgeText}>{selectedChar.strokes.length} strokes</Text>
                  </View>
                  {selectedChar.hskLevel && (
                    <View style={[styles.miniBadge, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={[styles.miniBadgeText, { color: Colors.primary }]}>
                        HSK {selectedChar.hskLevel}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <AudioControlRow
              hanziText={selectedChar.char}
            />

            {/* Interactive Canvas */}
            <View style={styles.canvasWrapper}>
              <HanziCanvas
                character={selectedChar}
                onComplete={() => {
                  triggerSuccessHaptic();
                }}
              />
            </View>
          </View>

          {/* Search & Level Filters */}
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Browse Character Catalog</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Hanzi, pinyin, meaning..."
                placeholderTextColor={Colors.textMuted}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* HSK Level Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {HSK_FILTERS.map((f) => {
                const isActive = hskFilter === f.value;
                return (
                  <Pressable
                    key={f.label}
                    onPress={() => {
                      triggerTapHaptic();
                      setHskFilter(f.value);
                    }}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Character Grid */}
            <View style={styles.charGrid}>
              {catalog.map((item) => {
                const isSelected = selectedChar.char === item.char;
                return (
                  <Pressable
                    key={item.char}
                    onPress={() => handleSelectChar(item)}
                    style={[styles.gridCell, isSelected && styles.gridCellSelected]}
                  >
                    <Text style={styles.gridCellChar}>{item.char}</Text>
                    <Text style={styles.gridCellPinyin} numberOfLines={1}>
                      {item.pinyin}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* SECTION 2: PINYIN & TONE SOUND CHART */}
      {section === 'pinyin' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Tones Explanation */}
          <Text style={styles.sectionTitle}>The 4 Mandarin Tones</Text>
          <Text style={styles.sectionSub}>
            Mandarin is tonal: the pitch contour changes word meaning entirely. Tap each tone to hear native audio!
          </Text>

          <View style={styles.card}>
            {PINYIN_TONES.map((t) => (
              <Pressable
                key={t.tone}
                onPress={() => handlePlaySound(t.example.split(' ')[0])}
                style={styles.toneRow}
              >
                <View style={[styles.toneBadge, { backgroundColor: `${t.color}20` }]}>
                  <Text style={[styles.toneNumber, { color: t.color }]}>{t.tone}</Text>
                </View>
                <View style={styles.toneDetails}>
                  <View style={styles.toneTitleRow}>
                    <Text style={styles.toneName}>{t.name} ({t.contour})</Text>
                    <Text style={styles.toneDesc}>{t.desc}</Text>
                  </View>
                  <Text style={styles.toneExample}>{t.example}</Text>
                </View>
                <Ionicons name="volume-high" size={20} color={t.color} />
              </Pressable>
            ))}
          </View>

          {/* 21 Initials */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
            21 Initials (聲母 · Consonants)
          </Text>
          <Text style={styles.sectionSub}>Tap any consonant to hear its acoustic sound:</Text>

          {PINYIN_INITIALS.map((group) => (
            <View key={group.group} style={styles.pinyinGroupCard}>
              <Text style={styles.groupHeading}>{group.group}</Text>
              <View style={styles.pinyinChipsRow}>
                {group.items.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => handlePlaySound(`${item}a`)}
                    style={styles.pinyinChip}
                  >
                    <Text style={styles.pinyinChipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* 36 Finals */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
            Key Finals (韻母 · Vowels)
          </Text>
          {PINYIN_FINALS.map((group) => (
            <View key={group.group} style={styles.pinyinGroupCard}>
              <Text style={styles.groupHeading}>{group.group}</Text>
              <View style={styles.pinyinChipsRow}>
                {group.items.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => handlePlaySound(item)}
                    style={styles.pinyinChip}
                  >
                    <Text style={styles.pinyinChipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* SECTION 3: RADICALS EXPLORER */}
      {section === 'radicals' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>The Building Blocks of Characters</Text>
          <Text style={styles.sectionSub}>
            Chinese characters are built from radicals that carry semantic clues (e.g. 氵= water, 口= mouth). Master these to instantly recognize and decode thousands of characters!
          </Text>

          {ESSENTIAL_RADICALS.map((item) => (
            <Pressable
              key={item.radical}
              onPress={() => {
                triggerTapHaptic();
                setSelectedRadical(selectedRadical?.radical === item.radical ? null : item);
              }}
              style={styles.radicalCard}
            >
              <View style={styles.radicalTopRow}>
                <View style={styles.radicalBox}>
                  <Text style={styles.radicalChar}>{item.radical}</Text>
                </View>
                <View style={styles.radicalInfo}>
                  <Text style={styles.radicalName}>{item.name}</Text>
                  <Text style={styles.radicalMeaning}>{item.meaning}</Text>
                  <Text style={styles.radicalStrokes}>{item.strokes} strokes</Text>
                </View>
                <Ionicons
                  name={selectedRadical?.radical === item.radical ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textMuted}
                />
              </View>

              {/* Character Examples */}
              <View style={styles.examplesRow}>
                {item.examples.map((ex) => (
                  <Pressable
                    key={ex.char}
                    onPress={() => {
                      triggerTapHaptic();
                      speakMandarin(ex.char);
                    }}
                    style={styles.examplePill}
                  >
                    <Text style={styles.exampleChar}>{ex.char}</Text>
                    <Text style={styles.examplePinyin}>{ex.pinyin}</Text>
                    <Text style={styles.exampleMeaning}>{ex.meaning}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radii.pill,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  charInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  charPill: {
    width: 60,
    height: 60,
    borderRadius: Radii.lg,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charPillText: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.primary,
  },
  charMeta: {
    flex: 1,
    gap: 3,
  },
  charPinyin: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  charMeaning: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  miniBadge: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  canvasWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  searchSection: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  filterRow: {
    gap: 6,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  charGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  gridCell: {
    width: 62,
    height: 66,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#FAF5FF',
  },
  gridCellChar: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  gridCellPinyin: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toneBadge: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  toneDetails: {
    flex: 1,
  },
  toneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toneName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  toneDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  toneExample: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  pinyinGroupCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  groupHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  pinyinChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pinyinChip: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pinyinChipText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  radicalCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  radicalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radicalBox: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radicalChar: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
  },
  radicalInfo: {
    flex: 1,
  },
  radicalName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  radicalMeaning: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  radicalStrokes: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  examplePill: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  exampleChar: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  examplePinyin: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  exampleMeaning: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
