// 플레이어 캐릭터 '포미' 로직: 물리 이동, 공격, 스킬, 인벤토리, 레벨업
import { InputState } from '../engine/input';
import { Platform, PhysicsEngine } from '../engine/physics';
import { renderer } from '../engine/renderer';
import { sound } from '../engine/audio';
import { ParticleSystem } from '../engine/particles';
import { ITEM_DATABASE, EquipSlot } from './items';

export interface PlayerStats {
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  baseAttack: number;
  baseDefense: number;
  critRate: number;
}

export interface SkillProjectile {
  x: number;
  y: number;
  vx: number;
  life: number;
  damage: number;
  size: number;
}

export class Player {
  public x: number = 200;
  public y: number = 380;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 28;
  public height: number = 30;

  public facingLeft: boolean = false;
  public isGrounded: boolean = false;
  public isDroppingDown: boolean = false;
  private dropTimer: number = 0;

  // 상태 애니메이션
  public animState: 'idle' | 'walk' | 'jump' | 'attack' | 'hurt' = 'idle';
  public animFrame: number = 0;
  private animTimer: number = 0;
  private attackTimer: number = 0;
  public invulnerableTimer: number = 0;

  // 스탯
  public stats: PlayerStats = {
    level: 1,
    exp: 0,
    maxExp: 80,
    hp: 120,
    maxHp: 120,
    mp: 80,
    maxMp: 80,
    gold: 100,
    baseAttack: 14,
    baseDefense: 5,
    critRate: 0.15
  };

  // 인벤토리 & 장비
  public inventory: { itemId: string; count: number }[] = [
    { itemId: 'potion_hp', count: 5 },
    { itemId: 'potion_mp', count: 5 }
  ];
  public equipment: Record<EquipSlot, string | null> = {
    weapon: null,
    armor: null,
    accessory: null
  };

  // 스킬 투사체 목록
  public projectiles: SkillProjectile[] = [];
  public shieldTimer: number = 0;

  constructor(startX: number = 200, startY: number = 380) {
    this.x = startX;
    this.y = startY;
  }

  // 총 공격력 계산 (기본 + 장비 보너스)
  public getTotalAttack(): number {
    let atk = this.stats.baseAttack;
    if (this.equipment.weapon) {
      const def = ITEM_DATABASE[this.equipment.weapon];
      if (def?.attack) atk += def.attack;
    }
    return atk;
  }

  // 총 방어력 계산
  public getTotalDefense(): number {
    let def = this.stats.baseDefense;
    if (this.equipment.armor) {
      const item = ITEM_DATABASE[this.equipment.armor];
      if (item?.defense) def += item.defense;
    }
    if (this.shieldTimer > 0) def += 15; // 수호막 보너스
    return def;
  }

  // 총 이동 속도
  public getSpeed(): number {
    let spd = 160;
    if (this.equipment.accessory) {
      const item = ITEM_DATABASE[this.equipment.accessory];
      if (item?.speed) spd += item.speed;
    }
    if (this.shieldTimer > 0) spd += 40;
    return spd;
  }

  // 데미지 받기
  public takeDamage(dmg: number, particles: ParticleSystem): boolean {
    if (this.invulnerableTimer > 0) return false;

    const actualDmg = Math.max(1, Math.floor(dmg - this.getTotalDefense() * 0.4));
    this.stats.hp = Math.max(0, this.stats.hp - actualDmg);
    this.invulnerableTimer = 1.0;
    this.animState = 'hurt';
    this.vy = -120; // 살짝 튀어오름
    sound.playHit(false);

    // 피격 데미지 팝업
    particles.addDamage(this.x + this.width / 2, this.y, actualDmg, false, true);

    return this.stats.hp <= 0;
  }

  // 경험치 획득 및 레벨업
  public addExp(amount: number, particles: ParticleSystem) {
    this.stats.exp += amount;
    while (this.stats.exp >= this.stats.maxExp) {
      this.stats.exp -= this.stats.maxExp;
      this.stats.level += 1;
      this.stats.maxExp = Math.floor(this.stats.maxExp * 1.5);

      // 스탯 상승
      this.stats.maxHp += 25;
      this.stats.maxMp += 15;
      this.stats.hp = this.stats.maxHp;
      this.stats.mp = this.stats.maxMp;
      this.stats.baseAttack += 3;
      this.stats.baseDefense += 2;

      // 팡파레 효과음 및 파티클
      sound.playLevelUp();
      particles.addLevelUp(this.x + this.width / 2, this.y);
    }
  }

  // 아이템 획득
  public addItem(itemId: string, count: number = 1) {
    const existing = this.inventory.find(i => i.itemId === itemId);
    if (existing) {
      existing.count += count;
    } else {
      this.inventory.push({ itemId, count });
    }
  }

  // 아이템 사용
  public useItem(itemId: string, particles: ParticleSystem): boolean {
    const item = ITEM_DATABASE[itemId];
    if (!item) return false;

    const invItem = this.inventory.find(i => i.itemId === itemId);
    if (!invItem || invItem.count <= 0) return false;

    if (item.type === 'consumable') {
      let used = false;
      if (item.healHp && this.stats.hp < this.stats.maxHp) {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + item.healHp);
        particles.addHitSparks(this.x + this.width / 2, this.y, 8, '#70D6FF');
        sound.playPickup();
        used = true;
      }
      if (item.healMp && this.stats.mp < this.stats.maxMp) {
        this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + item.healMp);
        particles.addHitSparks(this.x + this.width / 2, this.y, 8, '#C77DFF');
        sound.playPickup();
        used = true;
      }
      if (used) {
        invItem.count--;
        if (invItem.count <= 0) {
          this.inventory = this.inventory.filter(i => i.itemId !== itemId);
        }
        return true;
      }
    } else if (item.type === 'equip' && item.slot) {
      // 장비 착용/교체
      this.equipItem(item.slot, itemId);
      sound.playPickup();
      return true;
    }
    return false;
  }

  // 장비 착용
  public equipItem(slot: EquipSlot, itemId: string) {
    this.equipment[slot] = itemId;
  }

  // 장비 해제
  public unequipItem(slot: EquipSlot) {
    this.equipment[slot] = null;
  }

  // 매 프레임 업데이트
  public update(dt: number, inputState: InputState, platforms: Platform[], physics: PhysicsEngine, particles: ParticleSystem) {
    // 1. 버프 / 쿨다운 타이머
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.dropTimer > 0) {
      this.dropTimer -= dt;
      if (this.dropTimer <= 0) this.isDroppingDown = false;
    }

    // 2. 공격 쿨다운
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0 && this.animState === 'attack') {
        this.animState = 'idle';
      }
    }

    // 3. 이동 입력
    const speed = this.getSpeed();
    if (this.attackTimer <= 0.1) {
      if (inputState.left) {
        this.vx = -speed;
        this.facingLeft = true;
      } else if (inputState.right) {
        this.vx = speed;
        this.facingLeft = false;
      } else {
        this.vx = 0;
      }
    }

    // 4. 점프 및 하향 점프 (아래 + 점프)
    if (inputState.jump) {
      if (inputState.down) {
        // 하향 점프! (메이플스토리 시그니처)
        this.isDroppingDown = true;
        this.dropTimer = 0.25;
        this.vy = 80; // 살짝 아래로 툭 떨어짐
        sound.playJump();
      } else if (this.isGrounded) {
        this.vy = -380; // 시원한 도약 점프
        this.isGrounded = false;
        sound.playJump();
        particles.addDust(this.x + this.width / 2, this.y + this.height);
      }
    }

    // 5. 스킬 1 발동 (별가루 폭풍)
    if (inputState.skill1 && this.stats.mp >= 20) {
      this.stats.mp -= 20;
      sound.playSkill();
      const dir = this.facingLeft ? -1 : 1;
      this.projectiles.push({
        x: this.x + (this.facingLeft ? -10 : this.width + 10),
        y: this.y + 10,
        vx: dir * 360,
        life: 1.5,
        damage: Math.floor(this.getTotalAttack() * 1.8),
        size: 14
      });
      particles.addHitSparks(this.x + this.width / 2, this.y + 10, 8, '#FFF75C');
    }

    // 6. 스킬 2 발동 (별빛 수호막)
    if (inputState.skill2 && this.stats.mp >= 30) {
      this.stats.mp -= 30;
      this.shieldTimer = 8.0; // 8초 유지
      sound.playSkill();
      particles.addHitSparks(this.x + this.width / 2, this.y + 10, 16, '#70D6FF');
    }

    // 7. 공격 애니메이션 트리거 (J 키)
    if (inputState.attack && this.attackTimer <= 0) {
      this.attackTimer = 0.28;
      this.animState = 'attack';
      this.animFrame = 0;
      sound.playAttackSwing();
    }

    // 8. 중력 및 물리 충돌
    this.vy += physics.gravity * dt;
    if (this.vy > physics.terminalVelocity) this.vy = physics.terminalVelocity;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 지형 충돌 검사
    const colResult = physics.resolvePlatformCollision(
      { x: this.x, y: this.y, w: this.width, h: this.height },
      this.vy,
      platforms,
      this.isDroppingDown
    );

    if (colResult.landed) {
      this.y = colResult.y;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // 9. 애니메이션 상태 결정
    if (this.attackTimer > 0) {
      this.animState = 'attack';
      // 3프레임 공격 애니메이션
      const progress = 1 - (this.attackTimer / 0.28);
      this.animFrame = Math.min(2, Math.floor(progress * 3));
    } else if (!this.isGrounded) {
      this.animState = 'jump';
      this.animFrame = 0;
    } else if (Math.abs(this.vx) > 10) {
      this.animState = 'walk';
      this.animTimer += dt;
      if (this.animTimer >= 0.12) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
        if (this.animFrame === 1 || this.animFrame === 3) {
          particles.addDust(this.x + this.width / 2, this.y + this.height);
        }
      }
    } else {
      this.animState = 'idle';
      this.animTimer += dt;
      if (this.animTimer >= 0.4) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    }

    // 10. 스킬 투사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.life -= dt;
      particles.addAmbientParticle(p.x, p.y, 'temple');
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // 공격 히트박스 판정
  public getAttackHitbox(): { x: number; y: number; w: number; h: number } | null {
    if (this.attackTimer > 0.05 && this.attackTimer < 0.22) {
      const reach = 42;
      return {
        x: this.facingLeft ? this.x - reach : this.x + this.width,
        y: this.y - 4,
        w: reach,
        h: this.height + 8
      };
    }
    return null;
  }

  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    const screenX = Math.floor(this.x - camX);
    const screenY = Math.floor(this.y - camY);

    // 무적 상태 시 깜빡임
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
    }

    // 수호막 오라 (스킬 2 활성화 시)
    if (this.shieldTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#70D6FF';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(screenX + 16, screenY + 16, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 플레이어 픽셀 스프라이트 그리기
    const spriteName = `player_${this.animState}_${this.animFrame}`;
    renderer.drawSprite(ctx, spriteName, screenX, screenY, this.facingLeft);

    // 투사체 렌더링
    for (const p of this.projectiles) {
      const pScreenX = Math.floor(p.x - camX);
      const pScreenY = Math.floor(p.y - camY);
      ctx.save();
      ctx.fillStyle = '#FFE600';
      ctx.shadowColor = '#FFA500';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(pScreenX, pScreenY, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
