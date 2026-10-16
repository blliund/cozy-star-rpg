// 사용자가 제공한 레퍼런스 이미지 기반 오리지널 도트 그래픽 엔진
// 1. 플레이어: 머리 새싹 + 파란 스카프 + 갈색 가방의 흰색 아기 동물
// 2. NPC 4종: 토리(노란 새 상인), 하루(초록 개구리 모험가), 모모(토끼 치유사), 쿠키(갈색 곰 무기상인)
// 3. 몬스터 4종: 초록 슬라임, 점박이 버섯, 하얀 토끼, 보라 고스트
// 4. 한국풍(기와, 돌담, 장승) & 일본풍(붉은 토리이, 등롱, 벚꽃) 타일

export class PixelRenderer {
  private spriteCache: Map<string, HTMLCanvasElement> = new Map();

  constructor() {
    this.bakeAllSprites();
  }

  private createPixelCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  private px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number = 1, h: number = 1) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  private bakeAllSprites() {
    this.bakePlayerSprites();
    this.bakeNPCSprites();
    this.bakeMonsterSprites();
    this.bakeTileAndDecorSprites();
  }

  // =========================================================================
  // 1. 플레이어: 머리 위 새싹 + 파란 스카프 + 갈색 가방
  // =========================================================================
  private bakePlayerSprites() {
    // 36 x 36 픽셀 스프라이트
    // Idle 0, 1
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createPixelCanvas(36, 36);
      this.drawPlayerFrame(ctx, 0, f === 1 ? 1 : 0, 'idle', f);
      this.spriteCache.set(`player_idle_${f}`, canvas);
    }

    // Walk 0, 1, 2, 3
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createPixelCanvas(36, 36);
      const bob = (f === 1 || f === 3) ? -1 : 0;
      this.drawPlayerFrame(ctx, 0, bob, 'walk', f);
      this.spriteCache.set(`player_walk_${f}`, canvas);
    }

    // Jump
    {
      const { canvas, ctx } = this.createPixelCanvas(36, 36);
      this.drawPlayerFrame(ctx, 0, -2, 'jump', 0);
      this.spriteCache.set('player_jump_0', canvas);
    }

    // Attack 0, 1, 2 (파란색 공격 궤적!)
    for (let f = 0; f < 3; f++) {
      const { canvas, ctx } = this.createPixelCanvas(44, 36);
      this.drawPlayerFrame(ctx, 0, 0, 'attack', f);
      this.spriteCache.set(`player_attack_${f}`, canvas);
    }

    // Hurt
    {
      const { canvas, ctx } = this.createPixelCanvas(36, 36);
      this.drawPlayerFrame(ctx, 0, 0, 'hurt', 0);
      this.spriteCache.set('player_hurt_0', canvas);
    }
  }

  private drawPlayerFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    anim: 'idle' | 'walk' | 'jump' | 'attack' | 'hurt',
    frame: number = 0
  ) {
    const C = {
      outline: '#272023',
      white: '#FFFFFF',
      shadow: '#EAE2DA',
      pink: '#FFA8BA',
      sproutStem: '#4A8505',
      sproutLeaf: '#7BC024',
      scarfBlue: '#4EA8DE',
      scarfDark: '#2B6CB0',
      bagBrown: '#8C5A3C',
      bagLight: '#B87D56',
      eye: '#22191B',
      slashBlue: '#80D0FF'
    };

    const baseY = 8 + oy;
    const baseX = 8 + ox;

    // A. 등에 멘 갈색 배낭 (왼쪽 뒤)
    this.px(ctx, C.outline, baseX - 4, baseY + 9, 5, 8);
    this.px(ctx, C.bagBrown, baseX - 3, baseY + 10, 3, 6);
    this.px(ctx, C.bagLight, baseX - 3, baseY + 11, 2, 4);

    // B. 머리 위 초록 새싹 장식
    const stemY = baseY - 5;
    this.px(ctx, C.sproutStem, baseX + 9, stemY + 1, 2, 4);
    // 왼쪽 잎 & 오른쪽 잎
    this.px(ctx, C.sproutLeaf, baseX + 6, stemY - 1, 3, 3);
    this.px(ctx, C.sproutStem, baseX + 5, stemY - 2, 4, 1);
    this.px(ctx, C.sproutLeaf, baseX + 11, stemY - 1, 3, 3);
    this.px(ctx, C.sproutStem, baseX + 11, stemY - 2, 4, 1);

    // C. 둥근 귓바퀴 (앙증맞은 양쪽 귀)
    this.px(ctx, C.outline, baseX + 1, baseY + 1, 4, 4);
    this.px(ctx, C.white, baseX + 2, baseY + 2, 2, 2);
    this.px(ctx, C.outline, baseX + 15, baseY + 1, 4, 4);
    this.px(ctx, C.white, baseX + 16, baseY + 2, 2, 2);

    // D. 둥글둥글 찹쌀떡 몸통 (하얀 바디)
    this.px(ctx, C.outline, baseX + 1, baseY + 3, 18, 15);
    this.px(ctx, C.outline, baseX, baseY + 5, 20, 11);
    this.px(ctx, C.white, baseX + 2, baseY + 4, 16, 13);
    this.px(ctx, C.white, baseX + 1, baseY + 5, 18, 11);
    // 엉덩이/하단 그림자
    this.px(ctx, C.shadow, baseX + 2, baseY + 15, 16, 2);

    // E. 발그레한 핑크 볼터치
    this.px(ctx, C.pink, baseX + 2, baseY + 10, 3, 2);
    this.px(ctx, C.pink, baseX + 15, baseY + 10, 3, 2);

    // F. 눈과 코 표정
    if (anim === 'hurt') {
      // 잉잉 눈물
      this.px(ctx, C.outline, baseX + 5, baseY + 8, 2, 2);
      this.px(ctx, C.outline, baseX + 13, baseY + 8, 2, 2);
      this.px(ctx, '#5BC0EB', baseX + 4, baseY + 10, 2, 3);
      this.px(ctx, '#5BC0EB', baseX + 14, baseY + 10, 2, 3);
      this.px(ctx, C.pink, baseX + 9, baseY + 11, 2, 1);
    } else if (anim === 'attack') {
      // 기합 눈
      this.px(ctx, C.eye, baseX + 6, baseY + 8, 2, 2);
      this.px(ctx, C.eye, baseX + 13, baseY + 8, 2, 2);
      this.px(ctx, C.white, baseX + 7, baseY + 8, 1, 1);
      this.px(ctx, C.pink, baseX + 9, baseY + 11, 2, 2);
    } else {
      // 초롱초롱 귀여운 눈
      this.px(ctx, C.eye, baseX + 5, baseY + 8, 2, 3);
      this.px(ctx, C.eye, baseX + 13, baseY + 8, 2, 3);
      this.px(ctx, C.white, baseX + 5, baseY + 8, 1, 1);
      this.px(ctx, C.white, baseX + 13, baseY + 8, 1, 1);
      // 아기 코 & 입
      this.px(ctx, C.outline, baseX + 9, baseY + 9, 2, 1);
      this.px(ctx, C.pink, baseX + 9, baseY + 11, 2, 1);
    }

    // G. 파란 모험가 스카프 (목에 멘 스카프)
    this.px(ctx, C.scarfDark, baseX + 3, baseY + 13, 14, 3);
    this.px(ctx, C.scarfBlue, baseX + 4, baseY + 13, 12, 2);
    // 스카프 매듭
    this.px(ctx, C.scarfDark, baseX + 8, baseY + 15, 4, 3);
    this.px(ctx, C.scarfBlue, baseX + 9, baseY + 15, 2, 2);

    // H. 발동동 애니메이션 (발)
    const footY = baseY + 17;
    if (anim === 'walk') {
      const step = frame % 2 === 0 ? 0 : 1;
      this.px(ctx, C.white, baseX + 4, footY - step, 3, 2);
      this.px(ctx, C.white, baseX + 13, footY - (1 - step), 3, 2);
    } else {
      this.px(ctx, C.white, baseX + 4, footY, 3, 2);
      this.px(ctx, C.white, baseX + 13, footY, 3, 2);
    }

    // I. 공격 애니메이션 (파란색 초승달 검기 궤적!)
    if (anim === 'attack') {
      const slashX = baseX + 18;
      if (frame === 0) {
        this.px(ctx, C.slashBlue, slashX, baseY - 2, 3, 8);
      } else if (frame === 1) {
        // 전방에 휘몰아치는 파란 검기 궤적
        this.px(ctx, '#C8EEFF', slashX + 2, baseY - 4, 4, 18);
        this.px(ctx, C.slashBlue, slashX + 5, baseY - 6, 8, 22);
        this.px(ctx, '#FFFFFF', slashX + 4, baseY, 2, 10);
      } else {
        this.px(ctx, C.slashBlue, slashX + 8, baseY + 4, 4, 8);
      }
    }
  }

  // =========================================================================
  // 2. 동료 NPC 4종 (토리, 하루, 모모, 쿠키)
  // =========================================================================
  private bakeNPCSprites() {
    // 1) 토리 (노란 새 상인 + 갈색 탐험가 모자)
    {
      const { canvas, ctx } = this.createPixelCanvas(36, 36);
      const bx = 8, by = 6;
      // 탐험가 모자
      this.px(ctx, '#5A3825', bx - 1, by + 4, 22, 3); // 챙
      this.px(ctx, '#8C5A3C', bx + 2, by, 16, 5); // 윗부분
      this.px(ctx, '#D49B6A', bx + 4, by + 1, 12, 3);
      // 노란 몸체
      this.px(ctx, '#3A2818', bx + 1, by + 6, 18, 16);
      this.px(ctx, '#FFDD55', bx + 2, by + 7, 16, 14);
      this.px(ctx, '#FFEAA7', bx + 4, by + 12, 12, 8); // 배
      // 눈 & 주황 부리
      this.px(ctx, '#22191B', bx + 6, by + 11, 2, 2);
      this.px(ctx, '#22191B', bx + 12, by + 11, 2, 2);
      this.px(ctx, '#FF7700', bx + 8, by + 12, 4, 3); // 귀여운 부리
      this.px(ctx, '#FFA502', bx + 9, by + 13, 2, 1);
      // 볼터치
      this.px(ctx, '#FF7675', bx + 3, by + 13, 2, 2);
      this.px(ctx, '#FF7675', bx + 15, by + 13, 2, 2);
      this.spriteCache.set('npc_tori', canvas);
    }

    // 2) 하루 (초록 개구리 후드 모험가)
    {
      const { canvas, ctx } = this.createPixelCanvas(36, 36);
      const bx = 8, by = 6;
      // 개구리 눈 후드 장식
      this.px(ctx, '#2D6A4F', bx + 2, by, 5, 5);
      this.px(ctx, '#52B788', bx + 3, by + 1, 3, 3);
      this.px(ctx, '#22191B', bx + 4, by + 2, 1, 1);
      this.px(ctx, '#2D6A4F', bx + 13, by, 5, 5);
      this.px(ctx, '#52B788', bx + 14, by + 1, 3, 3);
      this.px(ctx, '#22191B', bx + 15, by + 2, 1, 1);
      // 초록 후드 외곽
      this.px(ctx, '#1B4332', bx + 1, by + 4, 18, 18);
      this.px(ctx, '#52B788', bx + 2, by + 5, 16, 16);
      // 후드 속 얼굴 (크림색)
      this.px(ctx, '#FFF3E0', bx + 4, by + 9, 12, 9);
      // 눈 & 입
      this.px(ctx, '#22191B', bx + 6, by + 12, 2, 2);
      this.px(ctx, '#22191B', bx + 12, by + 12, 2, 2);
      this.px(ctx, '#FF7675', bx + 9, by + 14, 2, 1);
      // 갈색 멜빵 가방
      this.px(ctx, '#8C5A3C', bx + 6, by + 18, 8, 4);
      this.spriteCache.set('npc_haru', canvas);
    }

    // 3) 모모 (토끼 후드 치유사)
    {
      const { canvas, ctx } = this.createPixelCanvas(36, 36);
      const bx = 8, by = 6;
      // 하늘색 토끼 귀
      this.px(ctx, '#4895EF', bx + 3, by - 2, 4, 7);
      this.px(ctx, '#FFCCD5', bx + 4, by, 2, 4); // 핑크 귀 안쪽
      this.px(ctx, '#4895EF', bx + 13, by - 2, 4, 7);
      this.px(ctx, '#FFCCD5', bx + 14, by, 2, 4);
      // 하늘색 후드 옷
      this.px(ctx, '#3A0CA3', bx + 1, by + 4, 18, 18);
      this.px(ctx, '#80C2FF', bx + 2, by + 5, 16, 16);
      // 얼굴
      this.px(ctx, '#FFFFFF', bx + 4, by + 8, 12, 10);
      this.px(ctx, '#22191B', bx + 6, by + 11, 2, 2);
      this.px(ctx, '#22191B', bx + 12, by + 11, 2, 2);
      this.px(ctx, '#FF94B8', bx + 4, by + 13, 2, 2);
      this.px(ctx, '#FF94B8', bx + 14, by + 13, 2, 2);
      // 치유의 십자가/약병
      this.px(ctx, '#FF0055', bx + 9, by + 17, 2, 4);
      this.px(ctx, '#FF0055', bx + 8, by + 18, 4, 2);
      this.spriteCache.set('npc_momo', canvas);
    }

    // 4) 쿠키 (갈색 곰돌이 무기상인)
    {
      const { canvas, ctx } = this.createPixelCanvas(36, 36);
      const bx = 8, by = 6;
      // 둥근 곰 귀
      this.px(ctx, '#5A3825', bx + 1, by + 1, 5, 5);
      this.px(ctx, '#FFCCD5', bx + 2, by + 2, 3, 3);
      this.px(ctx, '#5A3825', bx + 14, by + 1, 5, 5);
      this.px(ctx, '#FFCCD5', bx + 15, by + 2, 3, 3);
      // 곰 얼굴
      this.px(ctx, '#3A2012', bx + 1, by + 4, 18, 18);
      this.px(ctx, '#9C6644', bx + 2, by + 5, 16, 16);
      // 주둥이 (베이지)
      this.px(ctx, '#E6CCB2', bx + 6, by + 11, 8, 6);
      this.px(ctx, '#22191B', bx + 9, by + 12, 2, 2); // 코
      this.px(ctx, '#22191B', bx + 5, by + 9, 2, 2); // 눈
      this.px(ctx, '#22191B', bx + 13, by + 9, 2, 2);
      // 빨간색 무기장인 옷
      this.px(ctx, '#D90429', bx + 3, by + 17, 14, 5);
      this.px(ctx, '#FFE6A7', bx + 8, by + 17, 4, 3);
      this.spriteCache.set('npc_kookie', canvas);
    }
  }

  // =========================================================================
  // 3. 몬스터 4종 (슬라임, 버섯, 토끼, 고스트)
  // =========================================================================
  private bakeMonsterSprites() {
    // 1) 초록 슬라임 (새싹 달린 물방울 슬라임)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createPixelCanvas(30, 30);
      const sq = f === 1 ? 1 : 0;
      const bx = 5, by = 7 + sq;
      // 머리 새싹
      this.px(ctx, '#38B000', bx + 8, by - 4, 2, 4);
      this.px(ctx, '#70E000', bx + 6, by - 5, 3, 2);
      this.px(ctx, '#70E000', bx + 10, by - 5, 3, 2);
      // 슬라임 몸체 (연두빛 젤리)
      this.px(ctx, '#1A5319', bx - 1, by, 20 + sq * 2, 14 - sq);
      this.px(ctx, '#70E000', bx, by + 1, 18 + sq * 2, 12 - sq);
      this.px(ctx, '#9EF01A', bx + 2, by + 2, 4, 3); // 광택
      // 멍한 귀여운 눈
      this.px(ctx, '#1A5319', bx + 5, by + 6, 2, 3);
      this.px(ctx, '#1A5319', bx + 13, by + 6, 2, 3);
      this.px(ctx, '#55A630', bx + 3, by + 8, 2, 1); // 볼
      this.px(ctx, '#55A630', bx + 15, by + 8, 2, 1);
      this.spriteCache.set(`monster_slime_${f}`, canvas);
    }

    // 2) 점박이 버섯 몬스터
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createPixelCanvas(30, 30);
      const bob = f === 1 ? -1 : 0;
      const bx = 4, by = 4 + bob;
      // 붉은 버섯 갓
      this.px(ctx, '#800F2F', bx, by + 2, 22, 12);
      this.px(ctx, '#E63946', bx + 1, by + 3, 20, 10);
      // 흰색 점박이 도트
      this.px(ctx, '#FFFFFF', bx + 3, by + 5, 3, 3);
      this.px(ctx, '#FFFFFF', bx + 15, by + 5, 4, 3);
      this.px(ctx, '#FFFFFF', bx + 9, by + 8, 3, 2);
      // 기둥 몸통
      this.px(ctx, '#5A3825', bx + 5, by + 13, 12, 9);
      this.px(ctx, '#FFF3E0', bx + 6, by + 13, 10, 8);
      // 초롱한 눈
      this.px(ctx, '#22191B', bx + 8, by + 15, 2, 2);
      this.px(ctx, '#22191B', bx + 12, by + 15, 2, 2);
      this.spriteCache.set(`monster_mushroom_${f}`, canvas);
    }

    // 3) 토끼 몬스터 (빠르게 움직이는 하얀 아기 토끼)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createPixelCanvas(30, 30);
      const bob = f === 1 ? -1 : 0;
      const bx = 5, by = 6 + bob;
      // 쫑긋 귀
      this.px(ctx, '#3A2818', bx + 3, by - 3, 3, 7);
      this.px(ctx, '#FFA8BA', bx + 4, by - 2, 1, 5);
      this.px(ctx, '#3A2818', bx + 13, by - 3, 3, 7);
      this.px(ctx, '#FFA8BA', bx + 14, by - 2, 1, 5);
      // 둥근 토끼 바디
      this.px(ctx, '#3A2818', bx + 1, by + 3, 18, 13);
      this.px(ctx, '#FFFFFF', bx + 2, by + 4, 16, 11);
      // 눈 & 핑크 코
      this.px(ctx, '#FF4D6D', bx + 5, by + 7, 2, 2); // 빨간 눈
      this.px(ctx, '#FF4D6D', bx + 13, by + 7, 2, 2);
      this.px(ctx, '#FFA8BA', bx + 9, by + 9, 2, 2);
      this.spriteCache.set(`monster_rabbit_${f}`, canvas);
    }

    // 4) 보라 고스트 몬스터 (어둠의 신비로운 유령)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createPixelCanvas(32, 32);
      const bob = f === 1 ? 1 : -1;
      const bx = 6, by = 6 + bob;
      // 몽환적인 보랏빛 유령 오라
      this.px(ctx, '#240046', bx - 1, by, 22, 16);
      this.px(ctx, '#7B2CBF', bx, by + 1, 20, 14);
      this.px(ctx, '#9D4EDD', bx + 2, by + 2, 16, 12);
      // 물결치는 꼬리
      this.px(ctx, '#7B2CBF', bx + 2, by + 15, 4, 3);
      this.px(ctx, '#7B2CBF', bx + 8, by + 16, 4, 3);
      this.px(ctx, '#7B2CBF', bx + 14, by + 15, 4, 3);
      // 번뜩이는 노란 눈 & 신비로운 이마 별
      this.px(ctx, '#FFE600', bx + 5, by + 7, 3, 3);
      this.px(ctx, '#FFE600', bx + 12, by + 7, 3, 3);
      this.px(ctx, '#FFFFFF', bx + 6, by + 7, 1, 1);
      this.px(ctx, '#FFFFFF', bx + 13, by + 7, 1, 1);
      this.spriteCache.set(`monster_ghost_${f}`, canvas);
    }

    // 5) 보스: 밤도깨비 '쿠루쿠루' (대형 보스)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createPixelCanvas(64, 64);
      const bob = f === 1 ? -2 : 0;
      this.px(ctx, '#1A002C', 10, 12 + bob, 44, 44);
      this.px(ctx, '#4A0E4E', 12, 14 + bob, 40, 40);
      this.px(ctx, '#7B1FA2', 14, 16 + bob, 36, 36);
      // 황금 뿔
      this.px(ctx, '#FFD700', 16, 6 + bob, 8, 12);
      this.px(ctx, '#FFD700', 40, 6 + bob, 8, 12);
      // 붉은 안광 & 송곳니
      this.px(ctx, '#FF0055', 22, 28 + bob, 6, 6);
      this.px(ctx, '#FF0055', 36, 28 + bob, 6, 6);
      this.px(ctx, '#FFFFFF', 26, 40 + bob, 3, 5);
      this.px(ctx, '#FFFFFF', 35, 40 + bob, 3, 5);
      this.spriteCache.set(`monster_boss_${f}`, canvas);
    }
  }

  // =========================================================================
  // 4. 한국풍 & 일본풍 타일 및 장식 스프라이트
  // =========================================================================
  private bakeTileAndDecorSprites() {
    // 1) 한국풍 장승 (천하대장군) - 24 x 48
    {
      const { canvas, ctx } = this.createPixelCanvas(24, 48);
      this.px(ctx, '#5A3825', 4, 10, 16, 38); // 나무 기둥
      this.px(ctx, '#8C5A3C', 5, 11, 14, 36);
      // 장승 사모관대
      this.px(ctx, '#22191B', 2, 4, 20, 6);
      // 장승 부리부리 눈 & 수염
      this.px(ctx, '#FFFFFF', 6, 16, 4, 4);
      this.px(ctx, '#22191B', 7, 17, 2, 2);
      this.px(ctx, '#FFFFFF', 14, 16, 4, 4);
      this.px(ctx, '#22191B', 15, 17, 2, 2);
      this.px(ctx, '#22191B', 7, 24, 10, 2); // 큰 입
      this.spriteCache.set('decor_jangseung', canvas);
    }

    // 2) 일본풍 붉은 토리이 (Torii 신사 기둥 문) - 36 x 52
    {
      const { canvas, ctx } = this.createPixelCanvas(40, 52);
      // 상단 기와/들보 (검정 & 빨강)
      this.px(ctx, '#22191B', 1, 2, 38, 5);
      this.px(ctx, '#D90429', 3, 7, 34, 4);
      // 양쪽 붉은 기둥
      this.px(ctx, '#D90429', 6, 11, 6, 40);
      this.px(ctx, '#EF233C', 8, 11, 3, 40);
      this.px(ctx, '#D90429', 28, 11, 6, 40);
      this.px(ctx, '#EF233C', 30, 11, 3, 40);
      // 기둥 받침석 (회색)
      this.px(ctx, '#495057', 5, 48, 8, 4);
      this.px(ctx, '#495057', 27, 48, 8, 4);
      this.spriteCache.set('decor_torii', canvas);
    }

    // 3) 일본풍 붉은 등롱(석등) - 20 x 36
    {
      const { canvas, ctx } = this.createPixelCanvas(20, 36);
      this.px(ctx, '#2B1E20', 2, 6, 16, 4); // 지붕
      this.px(ctx, '#FFD166', 4, 10, 12, 10); // 등불 빛
      this.px(ctx, '#FF70A6', 7, 12, 6, 6);
      this.px(ctx, '#495057', 7, 20, 6, 14); // 석재 받침대
      this.spriteCache.set('decor_lantern', canvas);
    }

    // 4) 포탈
    for (let f = 0; f < 3; f++) {
      const { canvas, ctx } = this.createPixelCanvas(36, 52);
      const shift = f * 2;
      ctx.fillStyle = '#4EA8DE';
      ctx.fillRect(4, 6, 28, 42);
      ctx.fillStyle = '#FFEAA7';
      ctx.fillRect(10 + shift, 12 + shift, 4, 4);
      ctx.fillRect(20 - shift, 24 + shift, 4, 4);
      this.spriteCache.set(`portal_${f}`, canvas);
    }

    // 5) 아이템 아이콘들
    {
      const { canvas, ctx } = this.createPixelCanvas(16, 16);
      this.px(ctx, '#FFD700', 4, 2, 8, 12);
      this.px(ctx, '#FFFFFF', 6, 4, 4, 4);
      this.spriteCache.set('item_gold', canvas);
    }
    {
      const { canvas, ctx } = this.createPixelCanvas(16, 16);
      this.px(ctx, '#FF85A1', 4, 2, 8, 12);
      this.px(ctx, '#FFFFFF', 6, 4, 4, 4);
      this.spriteCache.set('item_stardust', canvas);
    }
    {
      const { canvas, ctx } = this.createPixelCanvas(16, 16);
      this.px(ctx, '#E64980', 3, 2, 10, 12);
      this.px(ctx, '#FFA8CC', 4, 3, 8, 10);
      this.spriteCache.set('item_potion_hp', canvas);
    }
    {
      const { canvas, ctx } = this.createPixelCanvas(16, 16);
      this.px(ctx, '#1971C2', 3, 2, 10, 12);
      this.px(ctx, '#74C0FC', 4, 3, 8, 10);
      this.spriteCache.set('item_potion_mp', canvas);
    }
    {
      const { canvas, ctx } = this.createPixelCanvas(18, 18);
      this.px(ctx, '#8D6E63', 2, 12, 4, 4);
      this.px(ctx, '#4EA8DE', 5, 4, 8, 8);
      this.spriteCache.set('item_wooden_sword', canvas);
    }
    {
      const { canvas, ctx } = this.createPixelCanvas(18, 18);
      this.px(ctx, '#FFD700', 6, 2, 6, 6);
      this.px(ctx, '#8C5A3C', 3, 10, 4, 6);
      this.spriteCache.set('item_star_wand', canvas);
    }
  }

  // 스프라이트 그리기
  public drawSprite(
    ctx: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    facingLeft: boolean = false,
    scale: number = 1
  ) {
    const sprite = this.spriteCache.get(name);
    if (!sprite) return;

    ctx.save();
    const w = sprite.width * scale;
    const h = sprite.height * scale;

    if (facingLeft) {
      ctx.translate(Math.floor(x) + w, Math.floor(y));
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, w, h);
    } else {
      ctx.drawImage(sprite, Math.floor(x), Math.floor(y), w, h);
    }
    ctx.restore();
  }

  // 한국풍 / 일본풍 타일 그리기
  public drawTile(
    ctx: CanvasRenderingContext2D,
    theme: string,
    x: number,
    y: number,
    w: number,
    h: number,
    isPlatform: boolean = false
  ) {
    ctx.save();
    if (theme === 'korea') {
      // 한국풍 (기와, 툇마루, 돌담길)
      if (isPlatform) {
        // 전통 툇마루 목재 발판
        ctx.fillStyle = '#8C5A3C';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#B87D56';
        ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = '#5A3825';
        ctx.fillRect(x, y + h - 2, w, 2);
      } else {
        // 기와지붕 & 전통 돌담 지형
        ctx.fillStyle = '#2B3A42'; // 기와색
        ctx.fillRect(x, y, w, 8);
        ctx.fillStyle = '#4F6D7A';
        ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = '#A39171'; // 돌담 흙색
        ctx.fillRect(x, y + 8, w, h - 8);
        // 돌담 무늬
        ctx.fillStyle = '#7A6B53';
        for (let i = 0; i < w; i += 24) {
          ctx.fillRect(x + i, y + 14, 20, 6);
        }
      }
    } else {
      // 일본풍 (붉은 신사 목재, 대나무, 다다미/석판길)
      if (isPlatform) {
        // 대나무 / 신사 붉은 난간 발판
        ctx.fillStyle = '#D90429';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#EF233C';
        ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = '#2B1E20';
        ctx.fillRect(x, y + h - 2, w, 2);
      } else {
        // 신사 참배길 석판 & 잔디
        ctx.fillStyle = '#40916C'; // 초록 이끼
        ctx.fillRect(x, y, w, 6);
        ctx.fillStyle = '#6C757D'; // 참배길 석재
        ctx.fillRect(x, y + 6, w, h - 6);
        ctx.fillStyle = '#495057';
        for (let i = 0; i < w; i += 30) {
          ctx.fillRect(x + i, y + 12, 26, 8);
        }
      }
    }
    ctx.restore();
  }
}

export const renderer = new PixelRenderer();
