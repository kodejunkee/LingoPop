export interface VocabEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyinNumbered: string;
  tonePattern: string;
  english: string;
  hskLevel: number;
  partOfSpeech: string;
}

export const HSK1_VOCAB: VocabEntry[] = [
  { simplified: '我', traditional: '我', pinyin: 'wǒ', pinyinNumbered: 'wo3', tonePattern: '3', english: 'I / me', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '你', traditional: '你', pinyin: 'nǐ', pinyinNumbered: 'ni3', tonePattern: '3', english: 'you', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '他', traditional: '他', pinyin: 'tā', pinyinNumbered: 'ta1', tonePattern: '1', english: 'he / him', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '她', traditional: '她', pinyin: 'tā', pinyinNumbered: 'ta1', tonePattern: '1', english: 'she / her', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '老师', traditional: '老師', pinyin: 'lǎoshī', pinyinNumbered: 'lao3shi1', tonePattern: '3-1', english: 'teacher', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '学生', traditional: '學生', pinyin: 'xuéshēng', pinyinNumbered: 'xue2sheng1', tonePattern: '2-1', english: 'student', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '朋友', traditional: '朋友', pinyin: 'péngyou', pinyinNumbered: 'peng2you5', tonePattern: '2-5', english: 'friend', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '人', traditional: '人', pinyin: 'rén', pinyinNumbered: 'ren2', tonePattern: '2', english: 'person / people', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '中国', traditional: '中國', pinyin: 'Zhōngguó', pinyinNumbered: 'zhong1guo2', tonePattern: '1-2', english: 'China', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '是', traditional: '是', pinyin: 'shì', pinyinNumbered: 'shi4', tonePattern: '4', english: 'to be (am / is / are)', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '不', traditional: '不', pinyin: 'bù', pinyinNumbered: 'bu4', tonePattern: '4', english: 'not / no', hskLevel: 1, partOfSpeech: 'adverb' },
  { simplified: '吗', traditional: '嗎', pinyin: 'ma', pinyinNumbered: 'ma5', tonePattern: '5', english: 'yes/no question particle', hskLevel: 1, partOfSpeech: 'particle' },
  { simplified: '的', traditional: '的', pinyin: 'de', pinyinNumbered: 'de5', tonePattern: '5', english: 'possessive / modifier particle', hskLevel: 1, partOfSpeech: 'particle' },
  { simplified: '很', traditional: '很', pinyin: 'hěn', pinyinNumbered: 'hen3', tonePattern: '3', english: 'very (adjective linker)', hskLevel: 1, partOfSpeech: 'adverb' },
  { simplified: '好', traditional: '好', pinyin: 'hǎo', pinyinNumbered: 'hao3', tonePattern: '3', english: 'good / well', hskLevel: 1, partOfSpeech: 'adjective' },
  { simplified: '有', traditional: '有', pinyin: 'yǒu', pinyinNumbered: 'you3', tonePattern: '3', english: 'to have / there is', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '没', traditional: '沒', pinyin: 'méi', pinyinNumbered: 'mei2', tonePattern: '2', english: 'not (for 有 or past action)', hskLevel: 1, partOfSpeech: 'adverb' },
  { simplified: '个', traditional: '個', pinyin: 'gè', pinyinNumbered: 'ge4', tonePattern: '4', english: 'general measure word', hskLevel: 1, partOfSpeech: 'measure word' },
  { simplified: '本', traditional: '本', pinyin: 'běn', pinyinNumbered: 'ben3', tonePattern: '3', english: 'measure word for books', hskLevel: 1, partOfSpeech: 'measure word' },
  { simplified: '杯', traditional: '杯', pinyin: 'bēi', pinyinNumbered: 'bei1', tonePattern: '1', english: 'cup / glass (measure word)', hskLevel: 1, partOfSpeech: 'measure word' },
  { simplified: '书', traditional: '書', pinyin: 'shū', pinyinNumbered: 'shu1', tonePattern: '1', english: 'book', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '水', traditional: '水', pinyin: 'shuǐ', pinyinNumbered: 'shui3', tonePattern: '3', english: 'water', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '茶', traditional: '茶', pinyin: 'chá', pinyinNumbered: 'cha2', tonePattern: '2', english: 'tea', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '咖啡', traditional: '咖啡', pinyin: 'kāfēi', pinyinNumbered: 'ka1fei1', tonePattern: '1-1', english: 'coffee', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '喝', traditional: '喝', pinyin: 'hē', pinyinNumbered: 'he1', tonePattern: '1', english: 'to drink', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '吃', traditional: '吃', pinyin: 'chī', pinyinNumbered: 'chi1', tonePattern: '1', english: 'to eat', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '喜欢', traditional: '喜歡', pinyin: 'xǐhuan', pinyinNumbered: 'xi3huan5', tonePattern: '3-5', english: 'to like', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '看', traditional: '看', pinyin: 'kàn', pinyinNumbered: 'kan4', tonePattern: '4', english: 'to look / read / watch', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '去', traditional: '去', pinyin: 'qù', pinyinNumbered: 'qu4', tonePattern: '4', english: 'to go', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '在', traditional: '在', pinyin: 'zài', pinyinNumbered: 'zai4', tonePattern: '4', english: 'at / in / ongoing action', hskLevel: 1, partOfSpeech: 'verb / prep' },
  { simplified: '了', traditional: '了', pinyin: 'le', pinyinNumbered: 'le5', tonePattern: '5', english: 'completed action / state change', hskLevel: 1, partOfSpeech: 'particle' },
  { simplified: '今天', traditional: '今天', pinyin: 'jīntiān', pinyinNumbered: 'jin1tian1', tonePattern: '1-1', english: 'today', hskLevel: 1, partOfSpeech: 'time noun' },
  { simplified: '明天', traditional: '明天', pinyin: 'míngtiān', pinyinNumbered: 'ming2tian1', tonePattern: '2-1', english: 'tomorrow', hskLevel: 1, partOfSpeech: 'time noun' },
  { simplified: '昨天', traditional: '昨天', pinyin: 'zuótiān', pinyinNumbered: 'zuo2tian1', tonePattern: '2-1', english: 'yesterday', hskLevel: 1, partOfSpeech: 'time noun' },
  { simplified: '叫', traditional: '叫', pinyin: 'jiào', pinyinNumbered: 'jiao4', tonePattern: '4', english: 'to be called', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '名字', traditional: '名字', pinyin: 'míngzi', pinyinNumbered: 'ming2zi5', tonePattern: '2-5', english: 'name', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '什么', traditional: '什麼', pinyin: 'shénme', pinyinNumbered: 'shen2me5', tonePattern: '2-5', english: 'what', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '谁', traditional: '誰', pinyin: 'shéi', pinyinNumbered: 'shei2', tonePattern: '2', english: 'who', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '这', traditional: '這', pinyin: 'zhè', pinyinNumbered: 'zhe4', tonePattern: '4', english: 'this', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '那', traditional: '那', pinyin: 'nà', pinyinNumbered: 'na4', tonePattern: '4', english: 'that', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '大', traditional: '大', pinyin: 'dà', pinyinNumbered: 'da4', tonePattern: '4', english: 'big / large', hskLevel: 1, partOfSpeech: 'adjective' },
  { simplified: '小', traditional: '小', pinyin: 'xiǎo', pinyinNumbered: 'xiao3', tonePattern: '3', english: 'small / little', hskLevel: 1, partOfSpeech: 'adjective' },
  { simplified: '一', traditional: '一', pinyin: 'yī', pinyinNumbered: 'yi1', tonePattern: '1', english: 'one', hskLevel: 1, partOfSpeech: 'number' },
  { simplified: '两', traditional: '兩', pinyin: 'liǎng', pinyinNumbered: 'liang3', tonePattern: '3', english: 'two (before measure words)', hskLevel: 1, partOfSpeech: 'number' },
  { simplified: '三', traditional: '三', pinyin: 'sān', pinyinNumbered: 'san1', tonePattern: '1', english: 'three', hskLevel: 1, partOfSpeech: 'number' },
  { simplified: '想', traditional: '想', pinyin: 'xiǎng', pinyinNumbered: 'xiang3', tonePattern: '3', english: 'would like to / think / miss', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '请', traditional: '請', pinyin: 'qǐng', pinyinNumbered: 'qing3', tonePattern: '3', english: 'please / invite', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '热', traditional: '熱', pinyin: 'rè', pinyinNumbered: 're4', tonePattern: '4', english: 'hot / warm', hskLevel: 1, partOfSpeech: 'adjective' },
  { simplified: '呢', traditional: '呢', pinyin: 'ne', pinyinNumbered: 'ne5', tonePattern: '5', english: 'and you? / follow-up particle', hskLevel: 1, partOfSpeech: 'particle' },
  { simplified: '哪儿', traditional: '哪兒', pinyin: 'nǎr', pinyinNumbered: 'nar3', tonePattern: '3', english: 'where', hskLevel: 1, partOfSpeech: 'pronoun' },
  { simplified: '家', traditional: '家', pinyin: 'jiā', pinyinNumbered: 'jia1', tonePattern: '1', english: 'home / family', hskLevel: 1, partOfSpeech: 'noun' },
  { simplified: '认识', traditional: '認識', pinyin: 'rènshi', pinyinNumbered: 'ren4shi5', tonePattern: '4-5', english: 'to know / meet', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '高兴', traditional: '高興', pinyin: 'gāoxìng', pinyinNumbered: 'gao1xing4', tonePattern: '1-4', english: 'happy / glad', hskLevel: 1, partOfSpeech: 'adjective' },
  { simplified: '谢谢', traditional: '謝謝', pinyin: 'xièxie', pinyinNumbered: 'xie4xie5', tonePattern: '4-5', english: 'thank you', hskLevel: 1, partOfSpeech: 'verb' },
  { simplified: '再见', traditional: '再見', pinyin: 'zàijiàn', pinyinNumbered: 'zai4jian4', tonePattern: '4-4', english: 'goodbye', hskLevel: 1, partOfSpeech: 'verb' },
];
