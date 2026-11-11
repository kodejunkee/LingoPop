import type { ToneNumber } from '../theme/tokens';

export interface Point {
  x: number;
  y: number;
}

export interface HanziStrokeDef {
  /** Stroke type name in Chinese/English (e.g. "横 Héng (Horizontal)") */
  name: string;
  /** Polyline points in normalized 0..100 coordinate space */
  points: Point[];
  /** Direction hint shown when learner traces backwards */
  hint: string;
}

export interface HanziCharacterDef {
  char: string;
  pinyin: string;
  tone: ToneNumber;
  meaning: string;
  radical: string;
  radicalMeaning: string;
  componentsSummary: string;
  etymologyStory: string;
  strokes: HanziStrokeDef[];
}

export const HANZI_DATABASE: Record<string, HanziCharacterDef> = {
  一: {
    char: '一',
    pinyin: 'yī',
    tone: 1,
    meaning: 'one',
    radical: '一',
    radicalMeaning: 'one / horizontal stroke',
    componentsSummary: 'Single horizontal stroke (横 héng)',
    etymologyStory: 'One single horizontal bar representing the number 1.',
    strokes: [
      {
        name: '横 (Héng · Horizontal)',
        points: [
          { x: 14, y: 50 },
          { x: 86, y: 50 },
        ],
        hint: 'Draw straight from left to right.',
      },
    ],
  },
  二: {
    char: '二',
    pinyin: 'èr',
    tone: 4,
    meaning: 'two',
    radical: '二',
    radicalMeaning: 'two',
    componentsSummary: 'Short top horizontal + longer bottom horizontal',
    etymologyStory: 'Two parallel horizontal bars stacked top to bottom.',
    strokes: [
      {
        name: '横 (Héng · Short Top)',
        points: [
          { x: 26, y: 34 },
          { x: 74, y: 34 },
        ],
        hint: 'Top stroke first, left to right.',
      },
      {
        name: '横 (Héng · Long Base)',
        points: [
          { x: 14, y: 68 },
          { x: 86, y: 68 },
        ],
        hint: 'Bottom stroke longer, left to right.',
      },
    ],
  },
  三: {
    char: '三',
    pinyin: 'sān',
    tone: 1,
    meaning: 'three',
    radical: '一',
    radicalMeaning: 'horizontal line',
    componentsSummary: 'Three horizontals (Top -> Middle -> Bottom)',
    etymologyStory: 'Three stacked bars: heaven, earth, and humanity in between.',
    strokes: [
      {
        name: '横 (Héng · Top)',
        points: [
          { x: 24, y: 24 },
          { x: 76, y: 24 },
        ],
        hint: 'Top stroke first, left to right.',
      },
      {
        name: '横 (Héng · Middle)',
        points: [
          { x: 30, y: 49 },
          { x: 70, y: 49 },
        ],
        hint: 'Shorter middle bar, left to right.',
      },
      {
        name: '横 (Héng · Base)',
        points: [
          { x: 14, y: 76 },
          { x: 86, y: 76 },
        ],
        hint: 'Wide base bar last, left to right.',
      },
    ],
  },
  十: {
    char: '十',
    pinyin: 'shí',
    tone: 2,
    meaning: 'ten',
    radical: '十',
    radicalMeaning: 'ten / cross',
    componentsSummary: 'Horizontal first, then vertical down',
    etymologyStory: 'A knotted cord or cross-mark used historically to tally 10.',
    strokes: [
      {
        name: '横 (Héng · Horizontal)',
        points: [
          { x: 14, y: 45 },
          { x: 86, y: 45 },
        ],
        hint: 'Horizontal always comes BEFORE vertical when crossing!',
      },
      {
        name: '竖 (Shù · Vertical)',
        points: [
          { x: 50, y: 14 },
          { x: 50, y: 88 },
        ],
        hint: 'Vertical stroke straight down from top to bottom.',
      },
    ],
  },
  人: {
    char: '人',
    pinyin: 'rén',
    tone: 2,
    meaning: 'person',
    radical: '人',
    radicalMeaning: 'person / human',
    componentsSummary: 'Left-falling piě, then right-falling nà',
    etymologyStory: 'A person seen from the side standing on two legs.',
    strokes: [
      {
        name: '撇 (Piě · Left sweep)',
        points: [
          { x: 52, y: 16 },
          { x: 42, y: 52 },
          { x: 16, y: 84 },
        ],
        hint: 'Sweep down and left first.',
      },
      {
        name: '捺 (Nà · Right leg)',
        points: [
          { x: 46, y: 44 },
          { x: 65, y: 66 },
          { x: 86, y: 84 },
        ],
        hint: 'Anchor near the middle and press down to the right.',
      },
    ],
  },
  大: {
    char: '大',
    pinyin: 'dà',
    tone: 4,
    meaning: 'big',
    radical: '大',
    radicalMeaning: 'big',
    componentsSummary: '一 (arms) + 人 (person)',
    etymologyStory: 'A person stretching both arms wide to show "this BIG!"',
    strokes: [
      {
        name: '横 (Héng · Arms)',
        points: [
          { x: 18, y: 38 },
          { x: 82, y: 38 },
        ],
        hint: 'Horizontal arms first, left to right.',
      },
      {
        name: '撇 (Piě · Left leg)',
        points: [
          { x: 50, y: 14 },
          { x: 44, y: 54 },
          { x: 16, y: 86 },
        ],
        hint: 'Down through the center and sweep left.',
      },
      {
        name: '捺 (Nà · Right leg)',
        points: [
          { x: 50, y: 44 },
          { x: 68, y: 68 },
          { x: 86, y: 86 },
        ],
        hint: 'Sweep down and right.',
      },
    ],
  },
  口: {
    char: '口',
    pinyin: 'kǒu',
    tone: 3,
    meaning: 'mouth / opening',
    radical: '口',
    radicalMeaning: 'mouth / eating / speaking',
    componentsSummary: '3 strokes: Left wall -> Top-Right corner -> Close bottom',
    etymologyStory: 'Pictograph of an open mouth. Appears in 吃 (eat), 喝 (drink), 吗 (ask).',
    strokes: [
      {
        name: '竖 (Shù · Left wall)',
        points: [
          { x: 24, y: 26 },
          { x: 26, y: 78 },
        ],
        hint: 'Draw the left vertical wall down first.',
      },
      {
        name: '横折 (Héngzhé · Top & Right turn)',
        points: [
          { x: 25, y: 27 },
          { x: 75, y: 27 },
          { x: 73, y: 76 },
        ],
        hint: 'Go across the top, then turn straight down the right side in ONE stroke.',
      },
      {
        name: '横 (Héng · Close bottom)',
        points: [
          { x: 27, y: 74 },
          { x: 73, y: 74 },
        ],
        hint: 'Close the box at the bottom LAST!',
      },
    ],
  },
  日: {
    char: '日',
    pinyin: 'rì',
    tone: 4,
    meaning: 'sun / day',
    radical: '日',
    radicalMeaning: 'sun / day / time',
    componentsSummary: 'Outside frame -> Inside bar -> Close bottom last',
    etymologyStory: 'Originally a circle with a dot in the center—squared off for brush writing.',
    strokes: [
      {
        name: '竖 (Shù · Left wall)',
        points: [
          { x: 28, y: 18 },
          { x: 28, y: 82 },
        ],
        hint: 'Left vertical wall down first.',
      },
      {
        name: '横折 (Héngzhé · Top & Right)',
        points: [
          { x: 29, y: 19 },
          { x: 72, y: 19 },
          { x: 72, y: 82 },
        ],
        hint: 'Across the top and down the right side in one stroke.',
      },
      {
        name: '横 (Héng · Inside bar)',
        points: [
          { x: 29, y: 49 },
          { x: 71, y: 49 },
        ],
        hint: 'Fill the inside horizontal BEFORE closing the bottom.',
      },
      {
        name: '横 (Héng · Close base)',
        points: [
          { x: 29, y: 79 },
          { x: 71, y: 79 },
        ],
        hint: 'Close the bottom door last!',
      },
    ],
  },
  月: {
    char: '月',
    pinyin: 'yuè',
    tone: 4,
    meaning: 'moon / month',
    radical: '月',
    radicalMeaning: 'moon / flesh / body',
    componentsSummary: '4 strokes: Left curve -> Top-right hook -> Two inside bars',
    etymologyStory: 'A crescent moon with cloud bands inside.',
    strokes: [
      {
        name: '撇 (Piě · Left curve)',
        points: [
          { x: 32, y: 18 },
          { x: 31, y: 58 },
          { x: 20, y: 84 },
        ],
        hint: 'Draw down and curve gently left at the bottom.',
      },
      {
        name: '横折钩 (Héngzhégōu · Top & Right hook)',
        points: [
          { x: 33, y: 19 },
          { x: 70, y: 19 },
          { x: 70, y: 84 },
          { x: 58, y: 77 },
        ],
        hint: 'Across top, down right, and flick a tiny hook left.',
      },
      {
        name: '横 (Héng · Upper bar)',
        points: [
          { x: 32, y: 42 },
          { x: 69, y: 42 },
        ],
        hint: 'Upper inside bar, left to right.',
      },
      {
        name: '横 (Héng · Lower bar)',
        points: [
          { x: 31, y: 61 },
          { x: 69, y: 61 },
        ],
        hint: 'Lower inside bar, left to right.',
      },
    ],
  },
  木: {
    char: '木',
    pinyin: 'mù',
    tone: 4,
    meaning: 'tree / wood',
    radical: '木',
    radicalMeaning: 'tree / wood / plant',
    componentsSummary: '4 strokes: Cross (一 then 丨) + left branch + right branch',
    etymologyStory: 'Trunk down the center, branches spreading across, roots sweeping out.',
    strokes: [
      {
        name: '横 (Héng · Branches)',
        points: [
          { x: 18, y: 36 },
          { x: 82, y: 36 },
        ],
        hint: 'Horizontal bar first.',
      },
      {
        name: '竖 (Shù · Trunk)',
        points: [
          { x: 50, y: 14 },
          { x: 50, y: 88 },
        ],
        hint: 'Vertical trunk straight down.',
      },
      {
        name: '撇 (Piě · Left root)',
        points: [
          { x: 49, y: 38 },
          { x: 34, y: 60 },
          { x: 16, y: 78 },
        ],
        hint: 'Sweep down-left from the center junction.',
      },
      {
        name: '捺 (Nà · Right root)',
        points: [
          { x: 51, y: 38 },
          { x: 68, y: 60 },
          { x: 86, y: 78 },
        ],
        hint: 'Sweep down-right from the center junction.',
      },
    ],
  },
  水: {
    char: '水',
    pinyin: 'shuǐ',
    tone: 3,
    meaning: 'water',
    radical: '水 / 氵',
    radicalMeaning: 'water / liquid',
    componentsSummary: 'Center vertical-hook FIRST, then left wing, then right strokes',
    etymologyStory: 'A flowing central river stream with ripples on both banks. Demonstrates "Center before Wings".',
    strokes: [
      {
        name: '竖钩 (Shùgōu · Center stream)',
        points: [
          { x: 50, y: 14 },
          { x: 50, y: 86 },
          { x: 38, y: 76 },
        ],
        hint: 'Symmetrical center FIRST! Straight down with a small left hook.',
      },
      {
        name: '横撇 (Héngpiě · Left bank)',
        points: [
          { x: 16, y: 44 },
          { x: 36, y: 44 },
          { x: 18, y: 74 },
        ],
        hint: 'Left side next: short across, then sweep down-left.',
      },
      {
        name: '撇 (Piě · Right upper ripple)',
        points: [
          { x: 76, y: 28 },
          { x: 54, y: 46 },
        ],
        hint: 'Short downward-left stroke on the upper right.',
      },
      {
        name: '捺 (Nà · Right lower bank)',
        points: [
          { x: 52, y: 44 },
          { x: 69, y: 62 },
          { x: 88, y: 76 },
        ],
        hint: 'Sweep down-right from the center out.',
      },
    ],
  },
  女: {
    char: '女',
    pinyin: 'nǚ',
    tone: 3,
    meaning: 'woman / female',
    radical: '女',
    radicalMeaning: 'woman / family',
    componentsSummary: '3 strokes: Bent angle -> Cross sweep -> Long horizontal',
    etymologyStory: 'A graceful kneeling figure with arms folded.',
    strokes: [
      {
        name: '撇点 (Piědiǎn · Kneeling body)',
        points: [
          { x: 48, y: 16 },
          { x: 34, y: 54 },
          { x: 74, y: 78 },
        ],
        hint: 'Sweep down-left, then angle down-right in ONE stroke.',
      },
      {
        name: '撇 (Piě · Crossing sweep)',
        points: [
          { x: 68, y: 36 },
          { x: 56, y: 64 },
          { x: 24, y: 84 },
        ],
        hint: 'Curve down from upper-right toward bottom-left.',
      },
      {
        name: '横 (Héng · Arms)',
        points: [
          { x: 14, y: 38 },
          { x: 86, y: 38 },
        ],
        hint: 'Long horizontal bar across the top.',
      },
    ],
  },
  子: {
    char: '子',
    pinyin: 'zǐ',
    tone: 3,
    meaning: 'child / son',
    radical: '子',
    radicalMeaning: 'child / small',
    componentsSummary: '3 strokes: Top-down hook -> Vertical curve -> Arms horizontal',
    etymologyStory: 'A swaddled baby with outstretched arms.',
    strokes: [
      {
        name: '横撇 (Héngpiě · Head)',
        points: [
          { x: 28, y: 20 },
          { x: 72, y: 20 },
          { x: 50, y: 38 },
        ],
        hint: 'Across the top, then angle inward toward center.',
      },
      {
        name: '竖钩 (Shùgōu · Body)',
        points: [
          { x: 50, y: 38 },
          { x: 52, y: 86 },
          { x: 38, y: 76 },
        ],
        hint: 'Down the center with a tiny left hook at the bottom.',
      },
      {
        name: '横 (Héng · Outstretched arms)',
        points: [
          { x: 14, y: 52 },
          { x: 86, y: 52 },
        ],
        hint: 'Horizontal arms straight across last.',
      },
    ],
  },
  好: {
    char: '好',
    pinyin: 'hǎo',
    tone: 3,
    meaning: 'good / well',
    radical: '女',
    radicalMeaning: 'woman',
    componentsSummary: '女 (woman) on left + 子 (child) on right',
    etymologyStory: 'A mother holding her child = good, love, harmony!',
    strokes: [
      {
        name: '撇点 (女 Left 1)',
        points: [
          { x: 30, y: 18 },
          { x: 20, y: 54 },
          { x: 43, y: 74 },
        ],
        hint: 'Left side 女 first: sweep down-left, angle right.',
      },
      {
        name: '撇 (女 Left 2)',
        points: [
          { x: 42, y: 36 },
          { x: 35, y: 64 },
          { x: 16, y: 84 },
        ],
        hint: 'Cross sweep down-left on the left half.',
      },
      {
        name: '提 (女 Left 3 · Rising)',
        points: [
          { x: 12, y: 42 },
          { x: 46, y: 34 },
        ],
        hint: 'Angle slightly upward from left to right (makes room for 子!).',
      },
      {
        name: '横撇 (子 Right 1)',
        points: [
          { x: 56, y: 20 },
          { x: 82, y: 20 },
          { x: 68, y: 40 },
        ],
        hint: 'Now right side 子: across top, angle in.',
      },
      {
        name: '竖钩 (子 Right 2)',
        points: [
          { x: 68, y: 40 },
          { x: 69, y: 86 },
          { x: 58, y: 77 },
        ],
        hint: 'Straight down the right half with a small left hook.',
      },
      {
        name: '横 (子 Right 3)',
        points: [
          { x: 47, y: 52 },
          { x: 89, y: 52 },
        ],
        hint: 'Horizontal cross-bar on the right half last.',
      },
    ],
  },
  明: {
    char: '明',
    pinyin: 'míng',
    tone: 2,
    meaning: 'bright / tomorrow',
    radical: '日',
    radicalMeaning: 'sun',
    componentsSummary: '日 (sun) on left + 月 (moon) on right',
    etymologyStory: 'Sun + Moon shining together = Bright! Also used in 明天 (tomorrow).',
    strokes: [
      {
        name: '竖 (日 Left 1)',
        points: [
          { x: 16, y: 24 },
          { x: 16, y: 74 },
        ],
        hint: 'Left side 日 first: left vertical down.',
      },
      {
        name: '横折 (日 Left 2)',
        points: [
          { x: 17, y: 25 },
          { x: 40, y: 25 },
          { x: 40, y: 74 },
        ],
        hint: 'Across top and down right of 日.',
      },
      {
        name: '横 (日 Left 3)',
        points: [
          { x: 17, y: 48 },
          { x: 39, y: 48 },
        ],
        hint: 'Middle bar inside 日.',
      },
      {
        name: '横 (日 Left 4)',
        points: [
          { x: 17, y: 71 },
          { x: 39, y: 71 },
        ],
        hint: 'Close bottom of 日.',
      },
      {
        name: '撇 (月 Right 1)',
        points: [
          { x: 54, y: 18 },
          { x: 53, y: 58 },
          { x: 42, y: 86 },
        ],
        hint: 'Right side 月: left curve down.',
      },
      {
        name: '横折钩 (月 Right 2)',
        points: [
          { x: 55, y: 19 },
          { x: 84, y: 19 },
          { x: 84, y: 86 },
          { x: 73, y: 78 },
        ],
        hint: 'Top and right wall of 月 with hook.',
      },
      {
        name: '横 (月 Right 3)',
        points: [
          { x: 54, y: 42 },
          { x: 83, y: 42 },
        ],
        hint: 'Upper bar inside 月.',
      },
      {
        name: '横 (月 Right 4)',
        points: [
          { x: 54, y: 61 },
          { x: 83, y: 61 },
        ],
        hint: 'Lower bar inside 月.',
      },
    ],
  },
  休: {
    char: '休',
    pinyin: 'xiū',
    tone: 1,
    meaning: 'rest',
    radical: '亻',
    radicalMeaning: 'person (standing side-radical)',
    componentsSummary: '亻 (person) on left + 木 (tree) on right',
    etymologyStory: 'A person leaning against a tree to take a rest!',
    strokes: [
      {
        name: '撇 (亻 Left 1)',
        points: [
          { x: 34, y: 16 },
          { x: 22, y: 38 },
          { x: 12, y: 54 },
        ],
        hint: 'Left radical 亻 first: short diagonal sweep down-left.',
      },
      {
        name: '竖 (亻 Left 2)',
        points: [
          { x: 26, y: 36 },
          { x: 26, y: 88 },
        ],
        hint: 'Straight down the vertical leg of 亻.',
      },
      {
        name: '横 (木 Right 1)',
        points: [
          { x: 40, y: 38 },
          { x: 88, y: 38 },
        ],
        hint: 'Now right side 木: horizontal branches.',
      },
      {
        name: '竖 (木 Right 2)',
        points: [
          { x: 64, y: 14 },
          { x: 64, y: 88 },
        ],
        hint: 'Tree trunk straight down.',
      },
      {
        name: '撇 (木 Right 3)',
        points: [
          { x: 63, y: 40 },
          { x: 50, y: 60 },
          { x: 36, y: 78 },
        ],
        hint: 'Left root down from junction.',
      },
      {
        name: '捺 (木 Right 4)',
        points: [
          { x: 65, y: 40 },
          { x: 76, y: 60 },
          { x: 90, y: 78 },
        ],
        hint: 'Right root down from junction.',
      },
    ],
  },
  心: {
    char: '心',
    pinyin: 'xīn',
    tone: 1,
    meaning: 'heart / mind',
    radical: '心 / 忄',
    radicalMeaning: 'heart / feeling / thought',
    componentsSummary: '4 strokes: Left dot -> Reclining hook -> Center dot -> Right dot',
    etymologyStory: 'A sketch of the human heart. Appears in 想 (think), 忙 (busy), and 懂 (understand)!',
    strokes: [
      {
        name: '点 (Diǎn · Left dot)',
        points: [
          { x: 22, y: 46 },
          { x: 16, y: 64 },
        ],
        hint: 'Left dot drops slightly down-left.',
      },
      {
        name: '卧钩 (Wògōu · Lying crescent hook)',
        points: [
          { x: 30, y: 48 },
          { x: 36, y: 74 },
          { x: 66, y: 76 },
          { x: 74, y: 60 },
        ],
        hint: 'Curve down into a gentle bowl and flick a hook up-left.',
      },
      {
        name: '点 (Diǎn · Center dot)',
        points: [
          { x: 48, y: 28 },
          { x: 54, y: 42 },
        ],
        hint: 'Short dot above the bowl.',
      },
      {
        name: '点 (Diǎn · Right dot)',
        points: [
          { x: 76, y: 36 },
          { x: 86, y: 52 },
        ],
        hint: 'Final dot outside on the upper right.',
      },
    ],
  },
  去: {
    char: '去',
    pinyin: 'qù',
    tone: 4,
    meaning: 'to go',
    radical: '土 / 厶',
    radicalMeaning: 'earth / leave',
    componentsSummary: 'Top 土 (earth/cross+base) + Bottom 厶 (private/motion)',
    etymologyStory: 'A person leaving their home territory (土) — to go!',
    strokes: [
      {
        name: '横 (Héng · Top bar)',
        points: [
          { x: 24, y: 30 },
          { x: 76, y: 30 },
        ],
        hint: 'Short top horizontal first.',
      },
      {
        name: '竖 (Shù · Center spine)',
        points: [
          { x: 50, y: 12 },
          { x: 50, y: 52 },
        ],
        hint: 'Vertical down through the top bar.',
      },
      {
        name: '横 (Héng · Middle wide bar)',
        points: [
          { x: 14, y: 52 },
          { x: 86, y: 52 },
        ],
        hint: 'Wide horizontal base of 土.',
      },
      {
        name: '撇折 (Piězhé · Bottom triangle)',
        points: [
          { x: 48, y: 54 },
          { x: 26, y: 82 },
          { x: 74, y: 76 },
        ],
        hint: 'Sweep down-left, then cut across right in one stroke.',
      },
    ],
  },
  见: {
    char: '见',
    pinyin: 'jiàn',
    tone: 4,
    meaning: 'to see / meet',
    radical: '见',
    radicalMeaning: 'eye / see',
    componentsSummary: '4 strokes: Box frame (2 strokes) + Left leg + Curved right leg hook',
    etymologyStory: 'A giant eye perched on walking legs — "to see" or "to meet" (再见 goodbye = see again!).',
    strokes: [
      {
        name: '竖 (Shù · Left frame)',
        points: [
          { x: 30, y: 18 },
          { x: 30, y: 60 },
        ],
        hint: 'Left side vertical down.',
      },
      {
        name: '横折 (Héngzhé · Top & Right)',
        points: [
          { x: 31, y: 19 },
          { x: 70, y: 19 },
          { x: 70, y: 60 },
        ],
        hint: 'Across top and down right side.',
      },
      {
        name: '撇 (Piě · Left leg)',
        points: [
          { x: 48, y: 32 },
          { x: 42, y: 64 },
          { x: 18, y: 88 },
        ],
        hint: 'Start inside the box and sweep down-left.',
      },
      {
        name: '竖弯钩 (Shùwāngōu · Curved leg)',
        points: [
          { x: 54, y: 52 },
          { x: 54, y: 84 },
          { x: 82, y: 84 },
          { x: 84, y: 70 },
        ],
        hint: 'Down, curve flat right, and flick upward hook.',
      },
    ],
  },
  买: {
    char: '买',
    pinyin: 'mǎi',
    tone: 3,
    meaning: 'to buy',
    radical: '乙',
    radicalMeaning: 'hook / trade',
    componentsSummary: '6 strokes: Top hook + Two dots + 大 (big) base',
    etymologyStory: 'Gathering goods with a net and taking them home — to buy!',
    strokes: [
      {
        name: '横钩 (Hénggōu · Top bar)',
        points: [
          { x: 22, y: 20 },
          { x: 74, y: 20 },
          { x: 64, y: 32 },
        ],
        hint: 'Across the top with a short inward hook.',
      },
      {
        name: '点 (Diǎn · Upper dot)',
        points: [
          { x: 42, y: 28 },
          { x: 50, y: 36 },
        ],
        hint: 'Small top dot.',
      },
      {
        name: '点 (Diǎn · Lower dot)',
        points: [
          { x: 38, y: 42 },
          { x: 48, y: 50 },
        ],
        hint: 'Second dot just below.',
      },
      {
        name: '横 (Héng · Wide bar)',
        points: [
          { x: 16, y: 58 },
          { x: 84, y: 58 },
        ],
        hint: 'Wide horizontal bar across.',
      },
      {
        name: '撇 (Piě · Left leg)',
        points: [
          { x: 52, y: 44 },
          { x: 42, y: 70 },
          { x: 18, y: 88 },
        ],
        hint: 'Sweep down-left from center.',
      },
      {
        name: '点 (Diǎn · Right anchor)',
        points: [
          { x: 54, y: 66 },
          { x: 78, y: 84 },
        ],
        hint: 'Firm downward-right press.',
      },
    ],
  },
};

export const DOJO_CHARACTERS: HanziCharacterDef[] = Object.values(HANZI_DATABASE);

export function getHanziDef(char: string): HanziCharacterDef | undefined {
  return HANZI_DATABASE[char];
}
