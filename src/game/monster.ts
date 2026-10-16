// 이미지 레퍼런스 기반 몬스터 정의: 슬라임, 버섯, 토끼, 고스트, 보스
import { renderer } from '../engine/renderer';
import { DroppedItem } from './items';
import { sound } from '../engine/audio';

export interface MonsterDef {
  name: string;
  type: string;
  maxHp: number;
  attack: number;
  exp: number;
  goldMin: number;
  goldMax: number;
  width: number;
  height: number;
  speed: number;
  isFlying?: boolean;
  dropTable: { itemId: string; chance: number }[];
}

export const MONSTER_DEFS: Record<string, MonsterDef> = {
  // 1. 초록 슬라임
  slime: {
    name: '초록 슬라임',
    type: 'slime',
    maxHp: 40,
    attack: 6,
    exp: 20,
    goldMin: 8,
    goldMax: 15,
    width: 26,
    height: 24,
    speed: 40,
    dropTable: [
      { itemId: 'potion_hp', chance: 0.4 },
      { itemId: 'stardust', chance: 0.5 },
      { itemId: 'jelly_drop', chance: 0.7 }
    ]
  },
  // 2. 버섯 몬스터
  mushroom: {
    name: '점박이 버섯',
    type: 'mushroom',
    maxHp: 65,
    attack: 9,
    exp: 30,
    goldMin: 12,
    goldMax: 22,
    width: 26,
    height: 26,
    speed: 35,
    dropTable: [
      { itemId: 'potion_hp', chance: 0.45 },
      { itemId: 'mush_cap', chance: 0.8 },
      { itemId: 'stardust', chance: 0.4 }
    ]
  },
  // 3. 토끼 몬스터 (빠른 이동)
  rabbit: {
    name: '뜀박질 토끼',
    type: 'rabbit',
    maxHp: 95,
    attack: 14,
    exp: 48,
    goldMin: 20,
    goldMax: 35,
    width: 26,
    height: 24,
    speed: 75, // 빠른 발
    dropTable: [
      { itemId: 'potion_hp', chance: 0.5 },
      { itemId: 'potion_mp', chance: 0.5 },
      { itemId: 'stardust', chance: 0.6 }
    ]
  },
  // 4. 고스트 몬스터 (신비로운 보라 유령 - 부유)
  ghost: {
    name: '보라 고스트',
    type: 'ghost',
    maxHp: 140,
    attack: 18,
    exp: 70,
    goldMin: 25,
    goldMax: 45,
    width: 28,
    height: 26,
    speed: 55,
    isFlying: true,
    dropTable: [
      { itemId: 'potion_mp', chance: 0.7 },
      { itemId: 'stardust', chance: 0.7 }
    ]
  },
  // 5. 밤도깨비 쿠루쿠루 (보스)
  boss: {
    name: '밤도깨비 쿠루쿠루',
    type: 'boss',
    maxHp: 1600,
    attack: 28,
    exp: 1000,
    goldMin: 300,
    goldMax: 500,
    width: 64,
    height: 64,
    speed: 60,
    dropTable: [
      { itemId: 'golden_candy', chance: 1.0 },
      { itemId: 'hero_sword', chance: 0.9 },
      { itemId: 'star_cloak', chance: 0.9 },
      { itemId: 'stardust', chance: 1.0 }
    ]
  }
};

export class Monster {
  public id: string;
  public type: string;
  public name: string;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number;
  public height: number;
  public hp: number;
  public maxHp: number;
  public attackPower: number;
  public expValue: number;
  public facingLeft: boolean = false;
  public isDead: boolean = false;
  public hurtTimer: number = 0;
  public animTimer: number = 0;
  public animFrame: number = 0;

  private moveTimer: number = 0;
  private isFlying: boolean = false;
  private bossSkillTimer: number = 0;

  constructor(type: string, x: number, y: number) {
    this.id = 'm_' + Math.random().toString(36).substring(2, 9);
    this.type = type;
    const def = MONSTER_DEFS[type] || MONSTER_DEFS.slime;

    this.name = def.name;
    this.x = x;
    this.y = y;
    this.width = def.width;
    this.height = def.height;
    this.hp = def.maxHp;
    this.maxHp = def.maxHp;
    this.attackPower = def.attack;
    this.expValue = def.exp;
    this.isFlying = !!def.isFlying;
    this.moveTimer = Math.random() * 2;
  }

  public takeDamage(dmg: number, knockbackDir: number): boolean {
    this.hp -= dmg;
    this.hurtTimer = 0.25;
    this.vx = knockbackDir * (this.type === 'boss' ? 40 : 160);
    this.vy = -60;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      return true;
    }
    return false;
  }

  public update(dt: number, playerX: number, playerY: number, groundY: number = 440) {
    if (this.isDead) return;

    this.animTimer += dt;
    if (this.animTimer >= 0.25) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    this.moveTimer -= dt;
    const def = MONSTER_DEFS[this.type] || MONSTER_DEFS.slime;
    const distToPlayer = Math.hypot(playerX - this.x, playerY - this.y);

    if (this.type === 'boss') {
      this.bossSkillTimer += dt;
      this.facingLeft = playerX < this.x;
      if (distToPlayer < 400) {
        const dir = playerX < this.x ? -1 : 1;
        this.vx += (dir * def.speed - this.vx) * 0.1;
      } else {
        this.vx *= 0.9;
      }
      if (this.bossSkillTimer > 4.0 && Math.abs(this.y + this.height - groundY) < 10) {
        this.bossSkillTimer = 0;
        this.vy = -280;
        sound.playAttackSwing();
      }
    } else if (this.isFlying) {
      // 고스트: 둥실둥실 부유 비행
      const targetY = 270 + Math.sin(Date.now() * 0.003) * 40;
      this.y += (targetY - this.y) * 0.05;
      if (distToPlayer < 240) {
        this.facingLeft = playerX < this.x;
        this.vx = (playerX < this.x ? -1 : 1) * def.speed;
      } else {
        if (this.moveTimer <= 0) {
          this.moveTimer = 2 + Math.random() * 2;
          this.vx = (Math.random() > 0.5 ? 1 : -1) * (def.speed * 0.7);
          this.facingLeft = this.vx < 0;
        }
      }
    } else {
      // 지상형 (슬라임, 버섯, 토끼)
      if (distToPlayer < 200) {
        this.facingLeft = playerX < this.x;
        this.vx = (playerX < this.x ? -1 : 1) * def.speed;
      } else {
        if (this.moveTimer <= 0) {
          this.moveTimer = 1.5 + Math.random() * 2;
          const choice = Math.random();
          if (choice < 0.4) {
            this.vx = -def.speed * 0.6;
            this.facingLeft = true;
          } else if (choice < 0.8) {
            this.vx = def.speed * 0.6;
            this.facingLeft = false;
          } else {
            this.vx = 0;
          }
        }
      }

      // 토끼나 슬라임은 자주 폴짝폴짝 뜀
      const jumpChance = this.type === 'rabbit' ? 0.03 : 0.015;
      if (Math.random() < jumpChance && Math.abs(this.y + this.height - groundY) < 5) {
        this.vy = this.type === 'rabbit' ? -240 : -180;
      }
    }

    if (!this.isFlying) {
      this.vy += 800 * dt;
      this.y += this.vy * dt;
      if (this.y + this.height >= groundY) {
        this.y = groundY - this.height;
        this.vy = 0;
      }
    }

    this.x += this.vx * dt;
  }

  public generateDrops(): DroppedItem[] {
    const drops: DroppedItem[] = [];
    const def = MONSTER_DEFS[this.type] || MONSTER_DEFS.slime;

    const goldAmt = Math.floor(def.goldMin + Math.random() * (def.goldMax - def.goldMin + 1));
    drops.push({
      id: 'drop_gold_' + Math.random().toString(36).substring(2, 8),
      itemId: 'gold',
      isGold: true,
      goldAmount: goldAmt,
      x: this.x + this.width / 2,
      y: this.y,
      vx: (Math.random() - 0.5) * 80,
      vy: -150 - Math.random() * 60,
      life: 20,
      bounceCount: 0
    });

    for (const drop of def.dropTable) {
      if (Math.random() <= drop.chance) {
        drops.push({
          id: 'drop_' + drop.itemId + '_' + Math.random().toString(36).substring(2, 8),
          itemId: drop.itemId,
          isGold: false,
          x: this.x + this.width / 2,
          y: this.y,
          vx: (Math.random() - 0.5) * 100,
          vy: -160 - Math.random() * 80,
          life: 25,
          bounceCount: 0
        });
      }
    }

    return drops;
  }

  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    if (this.isDead) return;

    const screenX = Math.floor(this.x - camX);
    const screenY = Math.floor(this.y - camY);

    ctx.save();
    if (this.hurtTimer > 0) {
      ctx.filter = 'brightness(1.8) drop-shadow(0 0 6px #FF4D6D)';
    }

    const spriteName = `monster_${this.type}_${this.animFrame}`;
    renderer.drawSprite(ctx, spriteName, screenX, screenY, this.facingLeft);
    ctx.restore();

    if (this.type !== 'boss' && this.hp < this.maxHp) {
      const barW = this.width;
      const barH = 4;
      const barX = screenX;
      const barY = screenY - 8;
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#FF4D6D';
      ctx.fillRect(barX, barY, barW * hpPct, barH);
    }
  }
}
