// 이미지 레퍼런스 기반 4명의 동료 NPC 데이터 (토리, 하루, 모모, 쿠키)

export interface NPC {
  id: string;
  name: string;
  title: string;
  mapId: string;
  x: number;
  y: number;
  sprite: string;
  dialogue: string[];
  isShop?: boolean;
  isHealer?: boolean;
}

export const NPCS: NPC[] = [
  // 1. 토리 (마을 상점 주인 - 노란 새/병아리 탐험가)
  {
    id: 'npc_tori',
    name: '토리',
    title: '잡화 상점 주인',
    mapId: 'korea',
    x: 480,
    y: 350,
    sprite: 'npc_tori',
    isShop: true,
    dialogue: [
      '안녕! 반가워~ 난 활발하고 호기심 많은 토리야!',
      '모험에 필요한 딸기우유랑 별사탕 같은 달콤한 간식들을 잔뜩 챙겨왔다구!',
      '물건을 사고 싶다면 언제든 상점을 열어봐! (E키를 누르거나 상점을 클릭해줘)'
    ]
  },

  // 2. 모모 (치유사 - 하늘색 토끼 후드)
  {
    id: 'npc_momo',
    name: '모모',
    title: '마을의 따뜻한 치유사',
    mapId: 'korea',
    x: 250,
    y: 350,
    sprite: 'npc_momo',
    isHealer: true,
    dialogue: [
      '안녕, 작은 모험가님... 다친 곳은 없으신가요?',
      '포근한 달빛 기와마을에 오신 걸 환영해요. 제가 상처를 치료해 드릴게요.',
      '짜잔! 모모의 따뜻한 축복으로 HP와 MP가 완전히 회복되었어요! 힘내세요~'
    ]
  },

  // 3. 하루 (퀘스트 NPC - 초록 개구리 후드 모험가)
  {
    id: 'npc_haru',
    name: '하루',
    title: '조용한 모험가',
    mapId: 'japan',
    x: 320,
    y: 350,
    sprite: 'npc_haru',
    dialogue: [
      '...안녕. 벚꽃 신사 숲의 비밀을 조사하고 있는 하루야.',
      '숲 안쪽에 나타나는 날쌘 토끼들과 보라색 유령 몬스터들을 조심해야 해.',
      '신사 안쪽에 도사리는 밤도깨비를 진정시켜 주겠어? [Q] 키를 눌러 모험 일지를 확인해봐.'
    ]
  },

  // 4. 쿠키 (무기 상점 주인 - 갈색 곰돌이)
  {
    id: 'npc_kookie',
    name: '쿠키',
    title: '든든한 무기 장인',
    mapId: 'japan',
    x: 650,
    y: 350,
    sprite: 'npc_kookie',
    isShop: true,
    dialogue: [
      '허허! 듬직한 무기 장인 쿠키다!',
      '몬스터들을 혼내줄 날카롭고 튼튼한 무기와 수호 망토가 필요하지 않나?',
      '내가 직접 담금질한 명품 장비들을 구경해보게나!'
    ]
  }
];
