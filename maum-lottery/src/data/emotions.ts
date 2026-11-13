export interface EmotionBall {
  name: string;
  color: string;
  textColor?: string;
  description: string;
}

export interface BookItem {
  title: string;
  author: string;
  genre?: string;
  year?: string | number;
  reason: string;
  intro?: string;
  forWhom?: string;
  keywords?: string[];
  emotions?: string[];
}

export interface AIServiceItem {
  name: string;
  category: string;
  badge: string;
  reason: string;
  usageTip: string;
  url: string;
  keywords: string[];
}

export const EMOTIONS: EmotionBall[] = [
  { name: '외로움', color: '#B7D3F2', description: '혼자 있는 시간의 고독과 연결의 갈망' },
  { name: '불안', color: '#F2D49B', description: '미래에 대한 걱정과 마음의 초조함' },
  { name: '우울', color: '#C9C6F0', description: '가라앉은 기분과 무거워진 마음' },
  { name: '분노', color: '#F2B5AD', description: '치밀어 오르는 화와 억울함' },
  { name: '번아웃', color: '#CBD0D6', description: '에너지가 모두 소진된 탈진 상태' },
  { name: '설렘', color: '#F2BDD6', description: '새로운 시작을 앞둔 기분 좋은 두근거림' },
  { name: '슬픔', color: '#A9D8E6', description: '상실과 이별로 인한 아릿한 아픔' },
  { name: '후회', color: '#D9BFEA', description: '지난 선택에 대한 아쉬움과 자책' },
  { name: '무기력', color: '#BFD8B5', description: '아무것도 하고 싶지 않은 무거운 침체' },
  { name: '기쁨', color: '#F4E08F', description: '마음 가득 차오르는 감사와 환희' },
];

export const STATIC_BOOKS_BY_EMOTION: Record<string, BookItem[]> = {
  '외로움': [
    {
      title: '어린 왕자',
      author: '앙투안 드 생텍쥐페리',
      genre: '소설',
      year: 1943,
      reason: '관계를 맺는다는 것과 길들여진다는 의미를 천천히 돌아보게 하는 따뜻한 이야기입니다.',
      intro: '사막에 불시착한 조종사가 다른 별에서 온 어린 왕자를 만나 이야기를 듣는 짧은 소설.',
      forWhom: '관계와 어른의 삶을 짧고 부드럽게 돌아보고 싶은 분',
      keywords: ['관계', '순수', '책임'],
      emotions: ['외로움'],
    },
    {
      title: '모모',
      author: '미하엘 엔데',
      genre: '소설',
      year: 1973,
      reason: '곁에서 가만히 귀 기울여 들어주는 일의 치유력을 아름답게 보여줍니다.',
      intro: '마을 사람들의 이야기를 들어주는 소녀 모모가 시간 도둑에 맞서는 이야기.',
      forWhom: '바쁜 일상에서 여유와 경청의 시간을 되찾고 싶은 분',
      keywords: ['시간', '경청', '여유'],
      emotions: ['외로움'],
    },
    {
      title: '나는 나로 살기로 했다',
      author: '김수현',
      genre: '에세이',
      year: 2016,
      reason: '혼자인 시간을 외로움이 아닌 나 자신을 돌보고 채우는 충만한 시간으로 바꾸어줍니다.',
      intro: '타인의 기준 대신 온전한 자기 방식으로 사는 삶을 다독이는 에세이.',
      forWhom: '남의 기준과 눈치에 지친 마음을 다독이고 싶은 분',
      keywords: ['자기돌봄', '내방식', '위로'],
      emotions: ['외로움'],
    },
  ],
  '불안': [
    {
      title: '불안',
      author: '알랭 드 보통',
      genre: '인문·철학',
      year: 2004,
      reason: '불안이 어디서 오는지 인문학적으로 풀어내어 마음과의 안전한 거리를 두게 해 줍니다.',
      intro: '사회적 지위와 평가에 대한 불안을 역사, 철학, 예술을 통해 풀어내는 명작.',
      forWhom: '비교와 평가에서 오는 불안의 본질을 이해하고 싶은 분',
      keywords: ['지위', '비교', '불안이해'],
      emotions: ['불안'],
    },
    {
      title: '미움받을 용기',
      author: '기시미 이치로, 고가 후미타케',
      genre: '심리·자기계발',
      year: 2013,
      reason: '타인의 시선과 과제의 분리를 통해 내 삶의 주도권을 되찾는 단단한 용기를 줍니다.',
      intro: '아들러 심리학을 철학자와 청년의 대화 형식으로 풀어낸 밀리언셀러.',
      forWhom: '타인의 평가와 눈치에서 벗어나 자유로워지고 싶은 분',
      keywords: ['아들러', '자유', '대인관계'],
      emotions: ['불안'],
    },
    {
      title: '죽음의 수용소에서',
      author: '빅터 프랭클',
      genre: '논픽션·심리',
      year: 1946,
      reason: '극심한 혼돈과 불확실성 속에서도 삶의 숭고한 의미를 발견하는 관점을 선사합니다.',
      intro: '강제수용소의 극한 속에서도 인간 존엄과 의미를 찾아낸 로고테라피의 고전.',
      forWhom: '삶의 방향성과 존재의 의미를 깊이 탐색하고 싶은 분',
      keywords: ['의미', '회복탄력성', '인간존엄'],
      emotions: ['불안'],
    },
  ],
  '우울': [
    {
      title: '우울할 땐 뇌과학',
      author: '앨릭스 코브',
      genre: '심리·과학',
      year: 2017,
      reason: '작은 신체적 행동과 호흡이 뇌의 기분 회로를 어떻게 긍정적으로 반전시키는지 알려줍니다.',
      intro: '신경과학자가 우울한 마음의 메커니즘을 설명하고 일상 속 작은 실천을 제시합니다.',
      forWhom: '가라앉은 기분을 과학적이고 현실적인 방법으로 전환하고 싶은 분',
      keywords: ['뇌과학', '작은실천', '기분전환'],
      emotions: ['우울'],
    },
    {
      title: '당신이 옳다',
      author: '정혜신',
      genre: '심리·에세이',
      year: 2018,
      reason: '평가나 충고 없이 내 감정이 결코 틀리지 않았다는 온전한 심리적 CPR을 제공합니다.',
      intro: '정신건강의학과 전문의가 전하는 있는 그대로의 인정과 적정 심리학.',
      forWhom: '자신의 감정을 끊임없이 의심하고 자책하는 분',
      keywords: ['공감', '적정심리학', '치유'],
      emotions: ['우울'],
    },
    {
      title: '아몬드',
      author: '손원평',
      genre: '소설',
      year: 2017,
      reason: '감정을 느끼지 못하는 소년의 여정을 통해 감정과 사랑의 진정한 가치를 깨닫게 합니다.',
      intro: '알렉시티미아를 앓는 소년 윤재가 세상과 관계를 맺어가는 성장 소설.',
      forWhom: '마음의 감각을 잃어버렸다고 느끼는 분',
      keywords: ['공감', '성장', '사랑'],
      emotions: ['우울'],
    },
  ],
  '번아웃': [
    {
      title: '피로사회',
      author: '한병철',
      genre: '철학',
      year: 2010,
      reason: '자신을 스스로 착취하게 만드는 현대 성과사회의 본질을 날카롭게 통찰합니다.',
      intro: '긍정성의 과잉으로 인한 현대인의 피로와 번아웃을 철학적으로 진단한 책.',
      forWhom: '쉬어도 늘 피로하고 무언가를 계속 해야만 할 것 같은 분',
      keywords: ['성과사회', '쉼', '철학'],
      emotions: ['번아웃'],
    },
    {
      title: '하마터면 열심히 살 뻔했다',
      author: '하완',
      genre: '에세이',
      year: 2018,
      reason: '열심히만 내달리던 삶에서 잠시 힘을 빼고 웃으며 숨을 고를 수 있게 해줍니다.',
      intro: '경주마처럼 살던 인생에 브레이크를 걸고 나만의 속도를 찾는 유쾌한 에세이.',
      forWhom: '열심히 살아온 모든 것에 지쳐 휴식이 절실한 분',
      keywords: ['힘빼기', '유머', '여유'],
      emotions: ['번아웃'],
    },
    {
      title: '아무것도 하지 않는 기술',
      author: '제니 오델',
      genre: '논픽션·사회',
      year: 2019,
      reason: '디지털 세상의 끊임없는 알림과 자극으로부터 내 시간과 주의력을 온전히 탈환하는 법.',
      intro: '주의력을 상품화하는 경제에 저항하며 자연과 일상의 감각을 되찾는 지침서.',
      forWhom: '늘 스마트폰과 업무 메시지에 쫓겨 진짜 휴식을 잊은 분',
      keywords: ['주의력', '디지털디톡스', '진짜쉼'],
      emotions: ['번아웃'],
    },
  ],
};

export const STATIC_AI_SERVICES: Record<string, AIServiceItem[]> = {
  '외로움': [
    {
      name: 'Pi (Inflection AI)',
      category: '감성 대화 & 공감',
      badge: '다정한 공감 파트너',
      reason: '판단이나 훈계 없이 당신의 이야기를 조용히 끝까지 경청해주며 마음의 빈 공간을 온기 있게 채워줍니다.',
      usageTip: '"오늘 종일 혼자 있었더니 마음이 조금 쓸쓸한데, 오늘 있었던 사소한 이야기 들어줄래?"',
      url: 'https://pi.ai',
      keywords: ['공감대화', '다정함', '경청'],
    },
    {
      name: 'Claude 3.7 Sonnet',
      category: '심층 대화 & 마음일기',
      badge: '지적이고 사려 깊은 대화',
      reason: '혼자만의 고독 속에서 떠오른 복잡한 감정이나 생각을 글로 풀어낼 때 훌륭한 대화 상대가 되어줍니다.',
      usageTip: '"내가 느끼는 외로움의 감정을 한 편의 시나 잔잔한 에세이로 표현할 수 있게 도와줘."',
      url: 'https://claude.ai',
      keywords: ['사색', '글쓰기', '깊은대화'],
    },
    {
      name: 'Suno AI',
      category: '음악 & 사운드테라피',
      badge: '나만의 위로곡 작곡',
      reason: '혼자 있는 공간을 채워줄 잔잔한 어쿠스틱이나 로파이 인디 포크 음악을 즉석에서 선물해줍니다.',
      usageTip: '"Warm nostalgic indie acoustic ballad with soothing piano for a quiet lonely evening."',
      url: 'https://suno.com',
      keywords: ['음악생성', '감성사운드', '위로'],
    },
  ],
  '불안': [
    {
      name: 'Claude 3.7 Sonnet',
      category: '마인드셋 & 생각정리',
      badge: '인지 재구조화 도우미',
      reason: '과장된 걱정이나 최악의 시나리오에 갇혀 있을 때, 논리적이고 차분하게 현실을 재조명해줍니다.',
      usageTip: '"지금 내일 회의 때문에 극도로 긴장돼. 불안을 줄일 수 있는 3단계 객관화 질문을 던져줘."',
      url: 'https://claude.ai',
      keywords: ['불안해소', '객관화', '사고정리'],
    },
    {
      name: 'Perplexity AI',
      category: '불확실성 해소 검색',
      badge: '출처 기반 명확한 답변',
      reason: '불안은 모호함에서 커집니다. 검증된 의학·학술 출처를 바탕으로 핵심만 정확하게 전달하여 걱정을 덜어줍니다.',
      usageTip: '"발표 불안을 빠르게 완화하는 4-7-8 호흡법과 신체 이완 가이드"',
      url: 'https://perplexity.ai',
      keywords: ['정확한정보', '출처명시', '불안완화'],
    },
    {
      name: 'Notion AI',
      category: '업무 & 할 일 구조화',
      badge: '혼란을 질서로',
      reason: '불안할수록 해야 할 일들이 머릿속에서 거대한 괴물처럼 느껴집니다. 이를 쪼개어 체크리스트로 만들어줍니다.',
      usageTip: '"이 큰 프로젝트 과제를 오늘 당장 15분 만에 끝낼 수 있는 초소형 액션 5개로 쪼개줘."',
      url: 'https://notion.so',
      keywords: ['할일정리', '체크리스트', '실천'],
    },
  ],
  '번아웃': [
    {
      name: 'ChatGPT Plus (GPT-4o)',
      category: '업무 대행 & 자동화',
      badge: '뇌 피로 줄이기',
      reason: '기력이 다했을 때 긴 보고서 요약, 이메일 답장 초안, 데이터 정리 등 손이 많이 가는 일을 덜어줍니다.',
      usageTip: '"이 회의 메모를 읽고 팀원들에게 공유할 정중하고 간결한 슬랙 공유문으로 다듬어줘."',
      url: 'https://chatgpt.com',
      keywords: ['초안작성', '에너지절약', '효율'],
    },
    {
      name: 'Google Gemini (Gemini 2.5 / 3.8)',
      category: '스마트 브레인스토밍',
      badge: '구글 생태계 & 빠른 연동',
      reason: '머리가 굳어 아이디어가 떠오르지 않을 때 다양한 관점의 해결책과 휴식 계획을 쉽게 제안합니다.',
      usageTip: '"주말에 스마트폰을 끄고 완전히 뇌를 재부팅할 수 있는 1박 2일 휴식 루틴을 짜줘."',
      url: 'https://gemini.google.com',
      keywords: ['휴식계획', '브레인스토밍', '회복'],
    },
    {
      name: 'v0 by Vercel',
      category: '디자인 & 인터페이스 제작',
      badge: '즉시 구현 AI',
      reason: '새로운 사이트나 앱을 만들고 싶지만 기획과 코딩에 지쳤을 때, 말 한마디로 완전한 UI 컴포넌트를 생성합니다.',
      usageTip: '"포근한 미니멀 다크 모드 음악 플레이어 웹 앱 화면을 만들어줘."',
      url: 'https://v0.dev',
      keywords: ['UI생성', '프로토타입', '개발부담경감'],
    },
  ],
  '기본': [
    {
      name: 'Google Gemini (3.8 Flash)',
      category: '멀티모달 올인원 AI',
      badge: '초고속 & 스마트',
      reason: '사용자의 고민 분석, 글쓰기, 코드 작성, 아이디어 검증까지 전천후로 지원하는 최신 플래그십 AI입니다.',
      usageTip: '"현재 내 상황에서 가장 먼저 시작하면 기분이 나아질 작은 행동 3가지를 알려줘."',
      url: 'https://gemini.google.com',
      keywords: ['올인원', '스마트', '실시간분석'],
    },
    {
      name: 'Claude 3.7 Sonnet',
      category: '코딩 & 깊은 추론',
      badge: '섬세한 문장력',
      reason: '사람처럼 자연스럽고 유려한 문장 표현과 정교한 문제 해결 능력으로 깊은 영감을 줍니다.',
      usageTip: '"내가 쓴 거친 아이디어 메모를 명확하고 매력적인 기획안 구조로 재구성해줘."',
      url: 'https://claude.ai',
      keywords: ['문장력', '깊은생각', '아이디어'],
    },
    {
      name: 'Midjourney',
      category: '시각 예술 & 이미지',
      badge: '시각적 영감',
      reason: '상상 속의 풍경과 감정의 형태를 환상적인 비주얼 작품으로 시각화하여 창작의 즐거움을 되살려줍니다.',
      usageTip: '"Dreamy peaceful bookstore filled with books, warm sunlight streaming through big windows, anime style."',
      url: 'https://midjourney.com',
      keywords: ['이미지생성', '예술', '시각영감'],
    },
  ],
};
