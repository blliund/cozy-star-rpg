// 아이템 및 인벤토리 데이터 구조

export type ItemType = 'consumable' | 'equip' | 'etc';
export type EquipSlot = 'weapon' | 'armor' | 'accessory';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  slot?: EquipSlot;
  description: string;
  icon: string;
  price: number;
  // 스탯 보너스
  attack?: number;
  defense?: number;
  maxHp?: number;
  maxMp?: number;
  critRate?: number;
  speed?: number;
  // 회복 효과
  healHp?: number;
  healMp?: number;
}

export const ITEM_DATABASE: Record<string, ItemDef> = {
  // 소비 아이템
  'potion_hp': {
    id: 'potion_hp',
    name: '딸기우유',
    type: 'consumable',
    description: '달콤한 딸기우유. HP를 60 회복한다.',
    icon: 'item_potion_hp',
    price: 30,
    healHp: 60
  },
  'potion_mp': {
    id: 'potion_mp',
    name: '별사탕',
    type: 'consumable',
    description: '입안에서 톡 터지는 별사탕. MP를 50 회복한다.',
    icon: 'item_potion_mp',
    price: 25,
    healMp: 50
  },
  'golden_candy': {
    id: 'golden_candy',
    name: '황금 별사탕',
    type: 'consumable',
    description: '전설의 황금 별사탕. HP와 MP를 100% 회복한다!',
    icon: 'item_stardust',
    price: 150,
    healHp: 9999,
    healMp: 9999
  },

  // 장비 아이템
  'wood_branch': {
    id: 'wood_branch',
    name: '단단한 나뭇가지',
    type: 'equip',
    slot: 'weapon',
    description: '숲에서 주운 나뭇가지. 휘두르기 딱 좋다. (공격력 +6)',
    icon: 'item_wooden_sword',
    price: 50,
    attack: 6
  },
  'star_wand': {
    id: 'star_wand',
    name: '별빛 요술봉',
    type: 'equip',
    slot: 'weapon',
    description: '별빛이 깃든 신비로운 지팡이. (공격력 +16, MP +25)',
    icon: 'item_star_wand',
    price: 250,
    attack: 16,
    maxMp: 25
  },
  'hero_sword': {
    id: 'hero_sword',
    name: '용사의 빛무리검',
    type: 'equip',
    slot: 'weapon',
    description: '포근별의 전설이 깃든 궁극의 검. (공격력 +32, 크리티컬 +20%)',
    icon: 'item_wooden_sword',
    price: 600,
    attack: 32,
    critRate: 0.2
  },
  'rabbit_ribbon': {
    id: 'rabbit_ribbon',
    name: '아기토끼 분홍리본',
    type: 'equip',
    slot: 'accessory',
    description: '포근하고 깜찍한 리본. (HP +40, 이동속도 +15)',
    icon: 'item_potion_hp',
    price: 120,
    maxHp: 40,
    speed: 20
  },
  'star_cloak': {
    id: 'star_cloak',
    name: '별가루 수호 망토',
    type: 'equip',
    slot: 'armor',
    description: '은은하게 반짝이는 망토. (방어력 +10, HP +60)',
    icon: 'item_stardust',
    price: 300,
    defense: 10,
    maxHp: 60
  },

  // 기타/수집 아이템
  'stardust': {
    id: 'stardust',
    name: '잃어버린 별가루',
    type: 'etc',
    description: '하늘에서 떨어진 반짝이는 가루. 퀘스트에 필요하다.',
    icon: 'item_stardust',
    price: 15
  },
  'jelly_drop': {
    id: 'jelly_drop',
    name: '말랑젤리 조각',
    type: 'etc',
    description: '말랑젤리가 떨어뜨린 촉촉한 조각.',
    icon: 'item_potion_hp',
    price: 10
  },
  'mush_cap': {
    id: 'mush_cap',
    name: '포포버섯 갓',
    type: 'etc',
    description: '포포버섯의 알록달록한 버섯 갓.',
    icon: 'item_potion_hp',
    price: 15
  }
};

// 필드에 떨어진 아이템
export interface DroppedItem {
  id: string; // 고유 인스턴스 id
  itemId: string;
  isGold: boolean;
  goldAmount?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  bounceCount: number;
}
