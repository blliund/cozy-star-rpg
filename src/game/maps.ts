// 한국풍 & 일본풍 2개 테마 맵 데이터 정의
import { Platform } from '../engine/physics';

export interface PortalDef {
  x: number;
  y: number;
  w: number;
  h: number;
  targetMapId: string;
  targetX: number;
  targetY: number;
  label: string;
}

export interface MonsterSpawnDef {
  type: string;
  x: number;
  y: number;
  respawnTime: number;
}

export interface GameMap {
  id: string;
  name: string;
  theme: 'korea' | 'japan';
  bgm: string;
  width: number;
  height: number;
  bgColorTop: string;
  bgColorBottom: string;
  platforms: Platform[];
  portals: PortalDef[];
  monsterSpawns: MonsterSpawnDef[];
}

export const MAPS: Record<string, GameMap> = {
  // 1. 한국적인 풍: 달빛 기와마을 (한옥, 돌담길, 장승, 툇마루)
  'korea': {
    id: 'korea',
    name: '달빛 기와마을 (한국풍)',
    theme: 'korea',
    bgm: 'korea',
    width: 1800,
    height: 600,
    bgColorTop: '#1D2A44', // 은은한 청사초롱 밤하늘
    bgColorBottom: '#3B4D61',
    platforms: [
      // 돌담 바닥
      { x: 0, y: 440, w: 1800, h: 160, isOneWay: false },
      // 한옥 툇마루 복층 발판들
      { x: 200, y: 350, w: 180, h: 14, isOneWay: true },
      { x: 440, y: 330, w: 200, h: 14, isOneWay: true },
      { x: 700, y: 270, w: 180, h: 14, isOneWay: true },
      { x: 940, y: 350, w: 220, h: 14, isOneWay: true },
      { x: 1220, y: 310, w: 200, h: 14, isOneWay: true },
      { x: 1480, y: 260, w: 180, h: 14, isOneWay: true }
    ],
    portals: [
      {
        x: 1700,
        y: 388,
        w: 36,
        h: 52,
        targetMapId: 'japan',
        targetX: 80,
        targetY: 400,
        label: '🌸 벚꽃 신사숲 (일본풍)'
      }
    ],
    monsterSpawns: [
      // 마을 외곽 필드 몬스터: 초록 슬라임 & 점박이 버섯
      { type: 'slime', x: 800, y: 410, respawnTime: 4 },
      { type: 'slime', x: 1050, y: 410, respawnTime: 4 },
      { type: 'slime', x: 1300, y: 410, respawnTime: 4 },
      { type: 'slime', x: 740, y: 240, respawnTime: 5 },
      { type: 'mushroom', x: 980, y: 320, respawnTime: 5 },
      { type: 'mushroom', x: 1400, y: 410, respawnTime: 5 },
      { type: 'mushroom', x: 1550, y: 410, respawnTime: 5 }
    ]
  },

  // 2. 일본적인 풍: 벚꽃 신사숲 (토리이, 등롱, 벚꽃잎, 신사 제단)
  'japan': {
    id: 'japan',
    name: '벚꽃 신사숲 (일본풍)',
    theme: 'japan',
    bgm: 'japan',
    width: 2000,
    height: 600,
    bgColorTop: '#2B1055', // 몽환적인 벚꽃빛 보라 밤하늘
    bgColorBottom: '#591A75',
    platforms: [
      // 참배길 바닥
      { x: 0, y: 440, w: 2000, h: 160, isOneWay: false },
      // 붉은 난간 및 대나무 복층 발판들
      { x: 240, y: 350, w: 200, h: 14, isOneWay: true },
      { x: 500, y: 300, w: 220, h: 14, isOneWay: true },
      { x: 780, y: 240, w: 200, h: 14, isOneWay: true },
      { x: 1040, y: 330, w: 220, h: 14, isOneWay: true },
      { x: 1320, y: 270, w: 240, h: 14, isOneWay: true },
      // 신사 제단 (보스 구역)
      { x: 1600, y: 320, w: 320, h: 16, isOneWay: true }
    ],
    portals: [
      {
        x: 40,
        y: 388,
        w: 36,
        h: 52,
        targetMapId: 'korea',
        targetX: 1620,
        targetY: 400,
        label: '🏮 달빛 기와마을 (한국풍)'
      }
    ],
    monsterSpawns: [
      // 뜀박질 토끼 몬스터 & 보라 고스트
      { type: 'rabbit', x: 400, y: 410, respawnTime: 4 },
      { type: 'rabbit', x: 750, y: 410, respawnTime: 4 },
      { type: 'rabbit', x: 1100, y: 410, respawnTime: 4 },
      { type: 'rabbit', x: 1350, y: 240, respawnTime: 4 },
      { type: 'ghost', x: 600, y: 260, respawnTime: 4 },
      { type: 'ghost', x: 950, y: 270, respawnTime: 4 },
      { type: 'ghost', x: 1450, y: 280, respawnTime: 4 },
      // 신사 안쪽 최종 보스
      { type: 'boss', x: 1750, y: 376, respawnTime: 25 }
    ]
  }
};
