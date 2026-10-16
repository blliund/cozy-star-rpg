// 메인 게임 엔진 코어: 맵 관리, 몬스터 스폰, 전투 충돌, 퀘스트 진행, 세이브/로드
import { Camera } from '../engine/camera';
import { ParticleSystem } from '../engine/particles';
import { PhysicsEngine } from '../engine/physics';
import { input } from '../engine/input';
import { renderer } from '../engine/renderer';
import { sound } from '../engine/audio';
import { Player } from './player';
import { Monster } from './monster';
import { DroppedItem, ITEM_DATABASE } from './items';
import { MAPS, GameMap } from './maps';
import { NPCS, NPC } from './npc';
import { INITIAL_QUESTS, Quest } from './quests';

export class GameManager {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public camera: Camera;
  public physics: PhysicsEngine;
  public particles: ParticleSystem;

  public player: Player;
  public currentMap: GameMap;
  public monsters: Monster[] = [];
  public droppedItems: DroppedItem[] = [];
  public npcs: NPC[] = [];
  public quests: Quest[] = [];

  // 몬스터 리스폰 큐
  private respawnTimers: { type: string; x: number; y: number; timer: number; maxTimer: number }[] = [];
  private portalAnimFrame: number = 0;
  private portalAnimTimer: number = 0;

  // 게임 이벤트 콜백
  public onDialogueOpen?: (npc: NPC, quest?: Quest) => void;
  public onShopOpen?: (npc: NPC) => void;
  public onToastMessage?: (msg: string, icon?: string) => void;
  public onBossFightStart?: () => void;
  public onGameClearEnding?: () => void;

  public isGameClear: boolean = false;
  private isDialogueActive: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.camera = new Camera(canvas.width, canvas.height);
    this.physics = new PhysicsEngine();
    this.particles = new ParticleSystem();
    this.player = new Player(200, 380);

    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));
    this.currentMap = MAPS['korea']; // 한국풍 달빛 기와마을 시작!

    this.loadGame();
    this.changeMap(this.currentMap.id, false);
  }

  // 캔버스 크기 모니터/화면에 맞춰 반응형 리사이징
  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
    this.camera.width = width;
    this.camera.height = height;
  }

  public setDialogueActive(active: boolean) {
    this.isDialogueActive = active;
  }

  // 맵 전환
  public changeMap(mapId: string, playSound: boolean = true) {
    const map = MAPS[mapId];
    if (!map) return;

    this.currentMap = map;
    this.camera.setBounds(0, map.width, 0, map.height);

    sound.resume();
    sound.playBGM(map.bgm);
    if (playSound) sound.playPortal();

    this.npcs = NPCS.filter(n => n.mapId === mapId);
    this.monsters = [];
    this.droppedItems = [];
    this.respawnTimers = [];

    for (const sp of map.monsterSpawns) {
      this.monsters.push(new Monster(sp.type, sp.x, sp.y));
    }

    if (mapId === 'japan' && this.onBossFightStart) {
      this.onBossFightStart();
    }
  }

  public update(dt: number) {
    input.update();
    const inputState = input.getState();

    if (!this.isDialogueActive) {
      this.player.update(dt, inputState, this.currentMap.platforms, this.physics, this.particles);
    } else {
      this.player.vx = 0;
    }

    // 맵 좌우 경계 클램핑
    if (this.player.x < 10) this.player.x = 10;
    if (this.player.x > this.currentMap.width - this.player.width - 10) {
      this.player.x = this.currentMap.width - this.player.width - 10;
    }

    this.camera.follow(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
    this.camera.update(dt);
    this.particles.update(dt);

    this.portalAnimTimer += dt;
    if (this.portalAnimTimer >= 0.2) {
      this.portalAnimTimer = 0;
      this.portalAnimFrame = (this.portalAnimFrame + 1) % 3;
    }

    // 환경 파티클 (한국풍: 반딧불이/달빛별가루, 일본풍: 흩날리는 벚꽃잎)
    if (Math.random() < 0.12) {
      const px = this.camera.x + Math.random() * this.camera.width;
      const py = this.camera.y - 10;
      this.particles.addAmbientParticle(px, py, this.currentMap.theme === 'korea' ? 'cave' : 'plains');
    }

    this.updateMonsters(dt);
    this.updateDroppedItems(dt);
    this.checkInteractions(inputState);

    if (Math.random() < 0.001) {
      this.saveGame();
    }
  }

  private updateMonsters(dt: number) {
    const atkHitbox = this.player.getAttackHitbox();
    const groundY = 440;

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      m.update(dt, this.player.x, this.player.y, groundY);

      if (m.isDead) {
        const drops = m.generateDrops();
        this.droppedItems.push(...drops);

        this.player.addExp(m.expValue, this.particles);
        this.onToastMessage?.(`+${m.expValue} EXP`, '✨');

        this.trackQuestMonsterKill(m.type);

        if (m.type === 'boss') {
          this.isGameClear = true;
          this.onGameClearEnding?.();
          sound.playQuestComplete();
        }

        const spawnDef = this.currentMap.monsterSpawns.find(s => s.type === m.type);
        if (spawnDef) {
          this.respawnTimers.push({
            type: m.type,
            x: spawnDef.x,
            y: spawnDef.y,
            timer: spawnDef.respawnTime,
            maxTimer: spawnDef.respawnTime
          });
        }

        this.monsters.splice(i, 1);
        continue;
      }

      const mBox = { x: m.x, y: m.y, w: m.width, h: m.height };

      // 플레이어 기본 공격 타격
      if (atkHitbox && PhysicsEngine.checkOverlap(atkHitbox, mBox) && m.hurtTimer <= 0) {
        const isCrit = Math.random() < this.player.stats.critRate;
        const rawDmg = this.player.getTotalAttack() * (isCrit ? 1.8 : 1.0) * (0.85 + Math.random() * 0.3);
        const dmg = Math.floor(rawDmg);

        const knockbackDir = this.player.facingLeft ? -1 : 1;
        m.takeDamage(dmg, knockbackDir);

        this.particles.addDamage(m.x + m.width / 2, m.y, dmg, isCrit, false);
        sound.playHit(isCrit);
        this.camera.shake(0.15, isCrit ? 6 : 3);
      }

      // 플레이어 스킬 투사체 충돌
      for (let pIdx = this.player.projectiles.length - 1; pIdx >= 0; pIdx--) {
        const proj = this.player.projectiles[pIdx];
        const projBox = { x: proj.x - proj.size / 2, y: proj.y - proj.size / 2, w: proj.size, h: proj.size };

        if (PhysicsEngine.checkOverlap(projBox, mBox)) {
          const dmg = proj.damage;
          m.takeDamage(dmg, proj.vx > 0 ? 1 : -1);
          this.particles.addDamage(m.x + m.width / 2, m.y, dmg, true, false);
          sound.playHit(true);
          this.player.projectiles.splice(pIdx, 1);
        }
      }

      // 몬스터 vs 플레이어 몸체 충돌 (피격)
      const pBox = { x: this.player.x, y: this.player.y, w: this.player.width, h: this.player.height };
      if (PhysicsEngine.checkOverlap(pBox, mBox)) {
        const dead = this.player.takeDamage(m.attackPower, this.particles);
        if (dead) {
          this.onToastMessage?.('쓰러졌습니다... 달빛 기와마을에서 부활합니다.', '💔');
          this.player.stats.hp = this.player.stats.maxHp;
          this.player.stats.mp = this.player.stats.maxMp;
          this.changeMap('korea');
          this.player.x = 200;
          this.player.y = 380;
        }
      }
    }

    for (let i = this.respawnTimers.length - 1; i >= 0; i--) {
      const resp = this.respawnTimers[i];
      resp.timer -= dt;
      if (resp.timer <= 0) {
        this.monsters.push(new Monster(resp.type, resp.x, resp.y));
        this.respawnTimers.splice(i, 1);
      }
    }
  }

  private updateDroppedItems(dt: number) {
    const groundY = 440;
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      item.life -= dt;
      if (item.life <= 0) {
        this.droppedItems.splice(i, 1);
        continue;
      }

      item.vy += 650 * dt;
      item.x += item.vx * dt;
      item.y += item.vy * dt;

      if (item.y >= groundY - 8) {
        item.y = groundY - 8;
        if (item.bounceCount < 2) {
          item.vy = -item.vy * 0.45;
          item.vx *= 0.6;
          item.bounceCount++;
        } else {
          item.vy = 0;
          item.vx = 0;
        }
      }

      const dist = Math.hypot(playerCenterX - item.x, playerCenterY - item.y);
      if (dist < 90) {
        const pullSpeed = (90 - dist) * 4.5;
        item.x += ((playerCenterX - item.x) / dist) * pullSpeed * dt;
        item.y += ((playerCenterY - item.y) / dist) * pullSpeed * dt;
      }

      if (dist < 32) {
        if (item.isGold && item.goldAmount) {
          this.player.stats.gold += item.goldAmount;
          this.onToastMessage?.(`+${item.goldAmount} 골드`, '💰');
        } else {
          this.player.addItem(item.itemId, 1);
          const def = ITEM_DATABASE[item.itemId];
          this.onToastMessage?.(`${def?.name || '아이템'} 획득!`, '🎒');
          this.trackQuestItemCollection(item.itemId);
        }
        sound.playPickup();
        this.droppedItems.splice(i, 1);
      }
    }
  }

  private checkInteractions(inputState: { interact: boolean }) {
    const pCenter = this.player.x + this.player.width / 2;

    // 포탈 검사
    for (const portal of this.currentMap.portals) {
      if (
        pCenter >= portal.x &&
        pCenter <= portal.x + portal.w &&
        this.player.y + this.player.height >= portal.y &&
        this.player.y <= portal.y + portal.h
      ) {
        if (inputState.interact) {
          this.changeMap(portal.targetMapId);
          this.player.x = portal.targetX;
          this.player.y = portal.targetY;
          this.player.vx = 0;
          this.player.vy = 0;
          return;
        }
      }
    }

    // NPC 상호작용
    for (const npc of this.npcs) {
      const dist = Math.abs(pCenter - (npc.x + 18));
      if (dist < 55 && Math.abs(this.player.y - npc.y) < 70) {
        if (inputState.interact) {
          sound.playClick();

          // 치유사 모모의 경우 즉시 체력/마나 회복 지원
          if (npc.isHealer) {
            this.player.stats.hp = this.player.stats.maxHp;
            this.player.stats.mp = this.player.stats.maxMp;
            this.particles.addHitSparks(this.player.x + 14, this.player.y, 16, '#70D6FF');
            this.onToastMessage?.('치유사 모모의 축복으로 HP/MP가 모두 회복되었습니다!', '💖');
          }

          if (npc.isShop && this.onShopOpen) {
            this.onShopOpen(npc);
          } else if (this.onDialogueOpen) {
            const activeQuest = this.quests.find(q => q.giver.includes(npc.name) && !q.rewardClaimed);
            this.onDialogueOpen(npc, activeQuest);
          }
          return;
        }
      }
    }
  }

  public trackQuestMonsterKill(monsterType: string) {
    for (const quest of this.quests) {
      if (!quest.completed && quest.targetMonster === monsterType) {
        quest.currentMonsterCount++;
        if (quest.targetMonsterCount && quest.currentMonsterCount >= quest.targetMonsterCount) {
          quest.completed = true;
          sound.playQuestComplete();
          this.onToastMessage?.(`[퀘스트 완료] ${quest.title}!`, '🎉');
        } else {
          this.onToastMessage?.(`[${quest.title}] (${quest.currentMonsterCount}/${quest.targetMonsterCount})`, '📜');
        }
      }
    }
  }

  public trackQuestItemCollection(itemId: string) {
    for (const quest of this.quests) {
      if (!quest.completed && quest.targetItem === itemId) {
        const count = this.player.inventory.find(i => i.itemId === itemId)?.count || 0;
        if (quest.targetItemCount && count >= quest.targetItemCount) {
          quest.completed = true;
          sound.playQuestComplete();
          this.onToastMessage?.(`[퀘스트 완료] ${quest.title}!`, '🎉');
        }
      }
    }
  }

  public claimQuestReward(questId: string): boolean {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.rewardClaimed) return false;

    quest.rewardClaimed = true;
    this.player.addExp(quest.rewardExp, this.particles);
    this.player.stats.gold += quest.rewardGold;

    if (quest.rewardItems) {
      for (const item of quest.rewardItems) {
        this.player.addItem(item.itemId, item.count);
      }
    }

    sound.playLevelUp();
    this.onToastMessage?.(`퀘스트 보상: EXP +${quest.rewardExp}, 골드 +${quest.rewardGold}`, '🎁');
    this.saveGame();
    return true;
  }

  public render() {
    const ctx = this.ctx;
    const camX = this.camera.getDrawX();
    const camY = this.camera.getDrawY();

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. 패럴랙스 배경 (한옥 / 신사 배경)
    this.renderBackground(ctx, camX, camY);

    // 2. 배경 전통 장식물 렌더링 (한국풍: 장승 / 일본풍: 토리이 & 등롱)
    if (this.currentMap.theme === 'korea') {
      renderer.drawSprite(ctx, 'decor_jangseung', 120 - camX, 392 - camY);
      renderer.drawSprite(ctx, 'decor_jangseung', 1620 - camX, 392 - camY);
    } else {
      renderer.drawSprite(ctx, 'decor_torii', 100 - camX, 388 - camY);
      renderer.drawSprite(ctx, 'decor_lantern', 280 - camX, 404 - camY);
      renderer.drawSprite(ctx, 'decor_lantern', 720 - camX, 404 - camY);
      renderer.drawSprite(ctx, 'decor_lantern', 1200 - camX, 404 - camY);
    }

    // 3. 타일 및 플랫폼
    for (const plat of this.currentMap.platforms) {
      renderer.drawTile(
        ctx,
        this.currentMap.theme,
        Math.floor(plat.x - camX),
        Math.floor(plat.y - camY),
        plat.w,
        plat.h,
        plat.isOneWay
      );
    }

    // 4. 포탈
    for (const portal of this.currentMap.portals) {
      renderer.drawSprite(
        ctx,
        `portal_${this.portalAnimFrame}`,
        Math.floor(portal.x - camX),
        Math.floor(portal.y - camY)
      );

      ctx.save();
      ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      const textX = Math.floor(portal.x + portal.w / 2 - camX);
      const textY = Math.floor(portal.y - 10 - camY);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(textX - 70, textY - 14, 140, 20);
      ctx.fillStyle = '#FFE600';
      ctx.fillText(portal.label, textX, textY);
      ctx.restore();
    }

    // 5. NPC 4인방 (토리, 하루, 모모, 쿠키)
    for (const npc of this.npcs) {
      const screenX = Math.floor(npc.x - camX);
      const screenY = Math.floor(npc.y - camY);
      renderer.drawSprite(ctx, npc.sprite, screenX, screenY);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#FFF';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(`${npc.name} (${npc.title})`, screenX + 18, screenY - 8);

      const hasQuest = this.quests.some(q => q.giver.includes(npc.name) && !q.rewardClaimed);
      if (hasQuest) {
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('⭐', screenX + 18, screenY - 24);
      }
      ctx.restore();
    }

    // 6. 드롭 아이템
    for (const item of this.droppedItems) {
      const screenX = Math.floor(item.x - camX);
      const screenY = Math.floor(item.y - camY);
      const spriteName = item.isGold ? 'item_gold' : (ITEM_DATABASE[item.itemId]?.icon || 'item_stardust');
      renderer.drawSprite(ctx, spriteName, screenX - 8, screenY - 8);
    }

    // 7. 몬스터
    for (const monster of this.monsters) {
      monster.render(ctx, camX, camY);
    }

    // 8. 플레이어 (새싹 + 스카프 + 배낭 도트 캐릭터!)
    this.player.render(ctx, camX, camY);

    // 9. 파티클 & 데미지 넘버
    this.particles.render(ctx, camX, camY);
  }

  // 전통 테마 패럴랙스 배경
  private renderBackground(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    const map = this.currentMap;
    // 1단: 밤하늘 그라데이션
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, map.bgColorTop);
    grad.addColorStop(1, map.bgColorBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 달빛 (한국풍: 둥근 보름달 / 일본풍: 붉은 초승달)
    ctx.save();
    if (map.theme === 'korea') {
      ctx.fillStyle = '#FFF8D6';
      ctx.shadowColor = '#FFF1A8';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(this.canvas.width * 0.75, 90, 48, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#FFB5D5';
      ctx.shadowColor = '#FF70A6';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(this.canvas.width * 0.8, 85, 42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2단: 원경 구름 & 실루엣 산맥
    ctx.save();
    const parallaxX = -camX * 0.15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 6; i++) {
      const cx = (i * 380 + parallaxX) % (this.canvas.width + 380) - 100;
      const cy = 70 + (i % 2) * 45;
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.arc(cx + 40, cy - 15, 60, 0, Math.PI * 2);
      ctx.arc(cx + 80, cy, 50, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3단: 중경 전통 한옥 지붕 / 신사 지붕 능선 실루엣 (패럴랙스 0.3)
    const midParallaxX = -camX * 0.3;
    ctx.fillStyle = map.theme === 'korea' ? 'rgba(25, 35, 55, 0.4)' : 'rgba(50, 15, 60, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height);
    for (let x = 0; x <= this.canvas.width + 120; x += 120) {
      const hillY = 320 + Math.sin((x - midParallaxX) * 0.007) * 40 - camY * 0.1;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  public saveGame() {
    try {
      const saveData = {
        stats: this.player.stats,
        inventory: this.player.inventory,
        equipment: this.player.equipment,
        currentMapId: this.currentMap.id,
        playerX: this.player.x,
        playerY: this.player.y,
        quests: this.quests,
        isGameClear: this.isGameClear
      };
      localStorage.setItem('cozy_rpg_save', JSON.stringify(saveData));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  public loadGame(): boolean {
    try {
      const str = localStorage.getItem('cozy_rpg_save');
      if (!str) return false;
      const data = JSON.parse(str);
      if (data.stats) this.player.stats = data.stats;
      if (data.inventory) this.player.inventory = data.inventory;
      if (data.equipment) this.player.equipment = data.equipment;
      if (data.quests) this.quests = data.quests;
      if (data.isGameClear) this.isGameClear = data.isGameClear;
      if (data.currentMapId && MAPS[data.currentMapId]) {
        this.currentMap = MAPS[data.currentMapId];
        this.player.x = data.playerX || 200;
        this.player.y = data.playerY || 380;
      }
      return true;
    } catch (e) {
      console.warn('Load failed:', e);
      return false;
    }
  }

  public resetGame() {
    localStorage.removeItem('cozy_rpg_save');
    location.reload();
  }
}
