// 한국풍/일본풍 세계관 및 4인 동료(토리, 하루, 모모, 쿠키) 퀘스트 라인

export interface Quest {
  id: string;
  title: string;
  giver: string;
  summary: string;
  description: string;
  targetMonster?: string;
  targetMonsterCount?: number;
  currentMonsterCount: number;
  targetItem?: string;
  targetItemCount?: number;
  completed: boolean;
  rewardClaimed: boolean;
  rewardExp: number;
  rewardGold: number;
  rewardItems?: { itemId: string; count: number }[];
}

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_1',
    title: '기와마을의 첫 인사',
    giver: '토리',
    summary: '잡화 상점 주인 토리와 대화하세요.',
    description: '안녕! 난 토리야! 기와마을 밖으로 나가기 전에 조작법(좌측 이동패드/방향키, 공격, 스킬)을 익혀보렴!',
    currentMonsterCount: 0,
    completed: true,
    rewardClaimed: false,
    rewardExp: 50,
    rewardGold: 60,
    rewardItems: [{ itemId: 'wood_branch', count: 1 }]
  },
  {
    id: 'quest_2',
    title: '마을 외곽의 초록 슬라임',
    giver: '토리',
    summary: '초록 슬라임 3마리를 처치하세요.',
    description: '기와마을 외곽에 연두빛 슬라임들이 통통 튀어다니고 있어! 슬라임 3마리를 진정시켜 줘!',
    targetMonster: 'slime',
    targetMonsterCount: 3,
    currentMonsterCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardExp: 90,
    rewardGold: 90,
    rewardItems: [{ itemId: 'potion_hp', count: 4 }]
  },
  {
    id: 'quest_3',
    title: '치유사 모모의 비약 재료',
    giver: '모모',
    summary: '점박이 버섯 갓 3개를 모아 모모에게 전달하세요.',
    description: '치유사 모모예요... 버섯 몬스터의 갓은 훌륭한 회복 물약의 재료가 된답니다. 3개만 구해다 주실래요?',
    targetItem: 'mush_cap',
    targetItemCount: 3,
    currentMonsterCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardExp: 150,
    rewardGold: 130,
    rewardItems: [{ itemId: 'rabbit_ribbon', count: 1 }]
  },
  {
    id: 'quest_4',
    title: '벚꽃 신사숲의 모험가 하루',
    giver: '하루',
    summary: '벚꽃 신사숲에서 뜀박질 토끼 4마리를 조사하세요.',
    description: '포탈을 넘어 신사숲으로 왔구나... 여긴 날쌘 토끼 몬스터들이 뛰놀고 있어. 4마리만 조사해줘.',
    targetMonster: 'rabbit',
    targetMonsterCount: 4,
    currentMonsterCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardExp: 260,
    rewardGold: 200,
    rewardItems: [{ itemId: 'star_wand', count: 1 }]
  },
  {
    id: 'quest_5',
    title: '무기 장인 쿠키의 담금질',
    giver: '쿠키',
    summary: '보라 고스트 3마리를 처치하세요.',
    description: '신사 안쪽을 떠도는 보라 고스트들의 어둠의 기운을 물리쳐주게! 보답으로 튼튼한 수호 망토를 주마!',
    targetMonster: 'ghost',
    targetMonsterCount: 3,
    currentMonsterCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardExp: 380,
    rewardGold: 260,
    rewardItems: [{ itemId: 'star_cloak', count: 1 }]
  },
  {
    id: 'quest_6',
    title: '신사의 어둠을 정화하라!',
    giver: '하루',
    summary: '벚꽃 신사 안쪽의 보스 밤도깨비 쿠루쿠루를 물리치세요!',
    description: '신사의 별빛을 빼앗아 삐뚤어진 밤도깨비를 진정시키고 원래대로 되돌려줘! 우리들의 마지막 희망이야!',
    targetMonster: 'boss',
    targetMonsterCount: 1,
    currentMonsterCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardExp: 1200,
    rewardGold: 1200,
    rewardItems: [{ itemId: 'hero_sword', count: 1 }, { itemId: 'golden_candy', count: 3 }]
  }
];
