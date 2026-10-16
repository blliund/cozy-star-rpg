// UI 매니저: 모바일/아이패드 터치 가상 컨트롤러 바인딩, 큼직한 HUD 갱신, 모달 창 제어
import { GameManager } from '../game/game';
import { ITEM_DATABASE } from '../game/items';
import { NPC } from '../game/npc';
import { Quest } from '../game/quests';
import { sound } from '../engine/audio';
import { input } from '../engine/input';

export class UIManager {
  private game: GameManager;

  // DOM 엘리먼트들
  private hudLevel!: HTMLElement;
  private hudHpBar!: HTMLElement;
  private hudHpText!: HTMLElement;
  private hudMpBar!: HTMLElement;
  private hudMpText!: HTMLElement;
  private hudExpBar!: HTMLElement;
  private hudExpText!: HTMLElement;
  private hudGoldText!: HTMLElement;
  private hudMapName!: HTMLElement;
  private quickSlot1Count!: HTMLElement;
  private quickSlot2Count!: HTMLElement;

  // 모달 엘리먼트들
  private inventoryModal!: HTMLElement;
  private questModal!: HTMLElement;
  private statsModal!: HTMLElement;
  private dialogueModal!: HTMLElement;
  private shopModal!: HTMLElement;
  private endingModal!: HTMLElement;
  private bossHpContainer!: HTMLElement;
  private bossHpBar!: HTMLElement;
  private bossHpText!: HTMLElement;

  private toastContainer!: HTMLElement;

  // 대화창 상태
  private currentNpc: NPC | null = null;
  private currentQuest: Quest | null = null;
  private dialogueStep: number = 0;

  constructor(game: GameManager) {
    this.game = game;
    this.initDOMElements();
    this.bindEvents();
    this.bindVirtualControls();
    this.setupGameCallbacks();
  }

  private initDOMElements() {
    this.hudLevel = document.getElementById('hud-level')!;
    this.hudHpBar = document.getElementById('hud-hp-bar')!;
    this.hudHpText = document.getElementById('hud-hp-text')!;
    this.hudMpBar = document.getElementById('hud-mp-bar')!;
    this.hudMpText = document.getElementById('hud-mp-text')!;
    this.hudExpBar = document.getElementById('hud-exp-bar')!;
    this.hudExpText = document.getElementById('hud-exp-text')!;
    this.hudGoldText = document.getElementById('hud-gold-text')!;
    this.hudMapName = document.getElementById('hud-map-name')!;
    this.quickSlot1Count = document.getElementById('quick-slot-1-count')!;
    this.quickSlot2Count = document.getElementById('quick-slot-2-count')!;

    this.inventoryModal = document.getElementById('inventory-modal')!;
    this.questModal = document.getElementById('quest-modal')!;
    this.statsModal = document.getElementById('stats-modal')!;
    this.dialogueModal = document.getElementById('dialogue-modal')!;
    this.shopModal = document.getElementById('shop-modal')!;
    this.endingModal = document.getElementById('ending-modal')!;

    this.bossHpContainer = document.getElementById('boss-hp-container')!;
    this.bossHpBar = document.getElementById('boss-hp-bar')!;
    this.bossHpText = document.getElementById('boss-hp-text')!;

    this.toastContainer = document.getElementById('toast-container')!;
  }

  // 모바일 & 아이패드 & PC 터치/마우스 가상 버튼 바인딩 (화면 좌측 집약 컨트롤러)
  private bindVirtualControls() {
    const bindBtn = (id: string, keyName: string) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const setDown = (e: Event) => {
        e.preventDefault();
        sound.resume();
        input.setVirtualKey(keyName, true);
      };

      const setUp = (e: Event) => {
        e.preventDefault();
        input.setVirtualKey(keyName, false);
      };

      // 마우스 이벤트
      btn.addEventListener('mousedown', setDown);
      btn.addEventListener('mouseup', setUp);
      btn.addEventListener('mouseleave', setUp);

      // 터치 이벤트 (모바일/아이패드 사파리 및 크롬)
      btn.addEventListener('touchstart', setDown, { passive: false });
      btn.addEventListener('touchend', setUp, { passive: false });
      btn.addEventListener('touchcancel', setUp, { passive: false });
    };

    // 방향키 (D-Pad)
    bindBtn('btn-v-left', 'left');
    bindBtn('btn-v-right', 'right');
    bindBtn('btn-v-up', 'up');
    bindBtn('btn-v-down', 'down');

    // 점프 & 대화
    bindBtn('btn-v-jump', 'jump');
    bindBtn('btn-v-interact', 'interact');

    // 스킬 & 공격
    bindBtn('btn-v-attack', 'attack');
    bindBtn('btn-v-skill1', 'skill1');
    bindBtn('btn-v-skill2', 'skill2');
  }

  private setupGameCallbacks() {
    this.game.onToastMessage = (msg: string, icon: string = '✨') => {
      this.showToast(msg, icon);
    };

    this.game.onDialogueOpen = (npc: NPC, quest?: Quest) => {
      this.openDialogue(npc, quest);
    };

    this.game.onShopOpen = (npc: NPC) => {
      this.openShop(npc);
    };

    this.game.onGameClearEnding = () => {
      this.endingModal.classList.remove('hidden');
    };
  }

  private bindEvents() {
    // 음소거 토글
    const muteBtn = document.getElementById('btn-mute');
    muteBtn?.addEventListener('click', () => {
      sound.resume();
      const isMuted = sound.toggleMute();
      muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    // 저장 버튼
    document.getElementById('btn-save')?.addEventListener('click', () => {
      this.game.saveGame();
      this.showToast('게임이 안전하게 저장되었습니다!', '💾');
      sound.playClick();
    });

    // 재시작 버튼
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      if (confirm('모든 모험 기록을 초기화하고 처음부터 다시 시작할까요?')) {
        this.game.resetGame();
      }
    });

    document.getElementById('btn-close-ending')?.addEventListener('click', () => {
      this.endingModal.classList.add('hidden');
    });

    // 가방, 퀘스트, 능력치 창 열기
    document.getElementById('btn-open-inv')?.addEventListener('click', () => this.toggleInventory());
    document.getElementById('btn-open-quest')?.addEventListener('click', () => this.toggleQuest());
    document.getElementById('btn-open-stats')?.addEventListener('click', () => this.toggleStats());

    // 단축키
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyI') this.toggleInventory();
      if (e.code === 'KeyQ') this.toggleQuest();
      if (e.code === 'KeyC') this.toggleStats();
      if (e.code === 'Digit1') this.useQuickSlot('potion_hp');
      if (e.code === 'Digit2') this.useQuickSlot('potion_mp');
      if (e.code === 'Escape') this.closeAllModals();
    });

    // 퀵슬롯
    document.getElementById('quick-slot-1')?.addEventListener('click', () => this.useQuickSlot('potion_hp'));
    document.getElementById('quick-slot-2')?.addEventListener('click', () => this.useQuickSlot('potion_mp'));

    document.querySelectorAll('.btn-modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    document.getElementById('btn-dialogue-next')?.addEventListener('click', () => {
      this.advanceDialogue();
    });
  }

  private useQuickSlot(itemId: string) {
    const success = this.game.player.useItem(itemId, this.game.particles);
    if (success) {
      this.updateHUD();
    }
  }

  public updateHUD() {
    const p = this.game.player;
    const stats = p.stats;

    this.hudLevel.textContent = `Lv.${stats.level}`;

    const hpPct = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
    this.hudHpBar.style.width = `${hpPct}%`;
    this.hudHpText.textContent = `${stats.hp} / ${stats.maxHp}`;

    const mpPct = Math.max(0, Math.min(100, (stats.mp / stats.maxMp) * 100));
    this.hudMpBar.style.width = `${mpPct}%`;
    this.hudMpText.textContent = `${stats.mp} / ${stats.maxMp}`;

    const expPct = Math.max(0, Math.min(100, (stats.exp / stats.maxExp) * 100));
    this.hudExpBar.style.width = `${expPct}%`;
    this.hudExpText.textContent = `EXP: ${stats.exp} / ${stats.maxExp} (${expPct.toFixed(1)}%)`;

    this.hudGoldText.textContent = stats.gold.toLocaleString();
    this.hudMapName.textContent = this.game.currentMap.name;

    const hpCount = p.inventory.find(i => i.itemId === 'potion_hp')?.count || 0;
    const mpCount = p.inventory.find(i => i.itemId === 'potion_mp')?.count || 0;
    this.quickSlot1Count.textContent = `${hpCount}`;
    this.quickSlot2Count.textContent = `${mpCount}`;

    // 일본풍 신사 맵에 보스가 있을 때 체력바 표시
    if (this.game.currentMap.id === 'japan') {
      const boss = this.game.monsters.find(m => m.type === 'boss');
      if (boss && !boss.isDead) {
        this.bossHpContainer.classList.remove('hidden');
        const bPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
        this.bossHpBar.style.width = `${bPct}%`;
        this.bossHpText.textContent = `${boss.name} [ ${boss.hp} / ${boss.maxHp} ]`;
      } else {
        this.bossHpContainer.classList.add('hidden');
      }
    } else {
      this.bossHpContainer.classList.add('hidden');
    }
  }

  public toggleInventory() {
    sound.playClick();
    if (!this.inventoryModal.classList.contains('hidden')) {
      this.inventoryModal.classList.add('hidden');
    } else {
      this.closeAllModals();
      this.renderInventory();
      this.inventoryModal.classList.remove('hidden');
    }
  }

  public toggleQuest() {
    sound.playClick();
    if (!this.questModal.classList.contains('hidden')) {
      this.questModal.classList.add('hidden');
    } else {
      this.closeAllModals();
      this.renderQuests();
      this.questModal.classList.remove('hidden');
    }
  }

  public toggleStats() {
    sound.playClick();
    if (!this.statsModal.classList.contains('hidden')) {
      this.statsModal.classList.add('hidden');
    } else {
      this.closeAllModals();
      this.renderStats();
      this.statsModal.classList.remove('hidden');
    }
  }

  public closeAllModals() {
    this.inventoryModal.classList.add('hidden');
    this.questModal.classList.add('hidden');
    this.statsModal.classList.add('hidden');
    this.dialogueModal.classList.add('hidden');
    this.shopModal.classList.add('hidden');
    this.game.setDialogueActive(false);
  }

  private renderInventory() {
    const p = this.game.player;
    const invGrid = document.getElementById('inventory-grid')!;
    invGrid.innerHTML = '';

    for (let i = 0; i < 24; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';

      const item = p.inventory[i];
      if (item && item.count > 0) {
        const def = ITEM_DATABASE[item.itemId];
        if (def) {
          slot.innerHTML = `
            <div class="inv-item-name">${def.name}</div>
            <div class="inv-item-count">x${item.count}</div>
          `;
          slot.title = `${def.name}\n${def.description}`;
          slot.addEventListener('click', () => {
            this.handleItemClick(item.itemId);
          });
        }
      }
      invGrid.appendChild(slot);
    }

    const weaponSlot = document.getElementById('equip-slot-weapon')!;
    const armorSlot = document.getElementById('equip-slot-armor')!;
    const accSlot = document.getElementById('equip-slot-acc')!;

    weaponSlot.textContent = p.equipment.weapon ? ITEM_DATABASE[p.equipment.weapon]?.name || '없음' : '무기 미착용';
    armorSlot.textContent = p.equipment.armor ? ITEM_DATABASE[p.equipment.armor]?.name || '없음' : '방어구 미착용';
    accSlot.textContent = p.equipment.accessory ? ITEM_DATABASE[p.equipment.accessory]?.name || '없음' : '장신구 미착용';

    weaponSlot.onclick = () => { if (p.equipment.weapon) { p.unequipItem('weapon'); this.renderInventory(); this.updateHUD(); } };
    armorSlot.onclick = () => { if (p.equipment.armor) { p.unequipItem('armor'); this.renderInventory(); this.updateHUD(); } };
    accSlot.onclick = () => { if (p.equipment.accessory) { p.unequipItem('accessory'); this.renderInventory(); this.updateHUD(); } };
  }

  private handleItemClick(itemId: string) {
    const success = this.game.player.useItem(itemId, this.game.particles);
    if (success) {
      this.renderInventory();
      this.updateHUD();
    }
  }

  private renderStats() {
    const p = this.game.player;
    document.getElementById('stat-level')!.textContent = `Lv.${p.stats.level}`;
    document.getElementById('stat-hp')!.textContent = `${p.stats.hp} / ${p.stats.maxHp}`;
    document.getElementById('stat-mp')!.textContent = `${p.stats.mp} / ${p.stats.maxMp}`;
    document.getElementById('stat-attack')!.textContent = `${p.getTotalAttack()}`;
    document.getElementById('stat-defense')!.textContent = `${p.getTotalDefense()}`;
    document.getElementById('stat-crit')!.textContent = `${(p.stats.critRate * 100).toFixed(0)}%`;
    document.getElementById('stat-speed')!.textContent = `${p.getSpeed()}`;
    document.getElementById('stat-gold')!.textContent = `${p.stats.gold.toLocaleString()} G`;
  }

  private renderQuests() {
    const questList = document.getElementById('quest-list')!;
    questList.innerHTML = '';

    for (const q of this.game.quests) {
      const card = document.createElement('div');
      card.className = `quest-card ${q.completed ? 'completed' : ''} ${q.rewardClaimed ? 'claimed' : ''}`;

      let progressText = '';
      if (q.targetMonsterCount) {
        progressText = `사냥 진행도: ${q.currentMonsterCount} / ${q.targetMonsterCount}`;
      } else if (q.targetItemCount) {
        const has = this.game.player.inventory.find(i => i.itemId === q.targetItem)?.count || 0;
        progressText = `수집 진행도: ${has} / ${q.targetItemCount}`;
      }

      card.innerHTML = `
        <div class="quest-card-header">
          <span class="quest-card-title">${q.title}</span>
          <span class="quest-card-giver">[${q.giver}]</span>
        </div>
        <div class="quest-card-desc">${q.description}</div>
        <div class="quest-card-progress">${progressText}</div>
        <div class="quest-card-reward">보상: EXP +${q.rewardExp}, 골드 +${q.rewardGold}</div>
        ${
          q.completed && !q.rewardClaimed
            ? `<button class="btn-claim-reward" data-id="${q.id}">🎁 보상 받기</button>`
            : q.rewardClaimed
            ? `<span class="badge-claimed">완료됨</span>`
            : `<span class="badge-progress">진행 중</span>`
        }
      `;

      questList.appendChild(card);
    }

    questList.querySelectorAll('.btn-claim-reward').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qId = (e.currentTarget as HTMLElement).getAttribute('data-id')!;
        this.game.claimQuestReward(qId);
        this.renderQuests();
        this.updateHUD();
      });
    });
  }

  public openDialogue(npc: NPC, quest?: Quest) {
    this.closeAllModals();
    this.currentNpc = npc;
    this.currentQuest = quest || null;
    this.dialogueStep = 0;
    this.game.setDialogueActive(true);

    document.getElementById('dialogue-npc-name')!.textContent = `${npc.name} (${npc.title})`;
    this.updateDialogueContent();
    this.dialogueModal.classList.remove('hidden');
  }

  private updateDialogueContent() {
    if (!this.currentNpc) return;
    const textEl = document.getElementById('dialogue-text')!;
    const nextBtn = document.getElementById('btn-dialogue-next')!;

    if (this.currentQuest && this.currentQuest.completed && !this.currentQuest.rewardClaimed) {
      textEl.textContent = `포미야! 부탁했던 일을 멋지게 해냈구나! 정말 고마워. 여기 약속했던 보상을 받으렴!`;
      nextBtn.textContent = '보상 받기 (완료)';
      return;
    }

    if (this.dialogueStep < this.currentNpc.dialogue.length) {
      textEl.textContent = this.currentNpc.dialogue[this.dialogueStep];
      nextBtn.textContent = this.dialogueStep === this.currentNpc.dialogue.length - 1 ? '대화 마치기' : '다음 ▶';
    }
  }

  private advanceDialogue() {
    if (this.currentQuest && this.currentQuest.completed && !this.currentQuest.rewardClaimed) {
      this.game.claimQuestReward(this.currentQuest.id);
      this.closeAllModals();
      return;
    }

    if (!this.currentNpc) return;
    this.dialogueStep++;
    if (this.dialogueStep >= this.currentNpc.dialogue.length) {
      this.closeAllModals();
    } else {
      this.updateDialogueContent();
    }
  }

  public openShop(npc: NPC) {
    this.closeAllModals();
    this.game.setDialogueActive(true);
    document.getElementById('shop-title')!.textContent = `${npc.name}의 ${npc.title}`;
    this.renderShopItems(npc);
    this.shopModal.classList.remove('hidden');
  }

  private renderShopItems(npc: NPC) {
    const shopList = document.getElementById('shop-item-list')!;
    shopList.innerHTML = '';

    // 토리는 소비/잡화 위주, 쿠키는 무기/장비 위주
    const shopItems = npc.id === 'npc_kookie'
      ? ['wood_branch', 'star_wand', 'hero_sword', 'rabbit_ribbon', 'star_cloak', 'golden_candy']
      : ['potion_hp', 'potion_mp', 'wood_branch', 'star_wand', 'rabbit_ribbon', 'golden_candy'];

    for (const id of shopItems) {
      const def = ITEM_DATABASE[id];
      if (!def) continue;

      const itemRow = document.createElement('div');
      itemRow.className = 'shop-item-row';
      itemRow.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-name">${def.name}</div>
          <div class="shop-item-desc">${def.description}</div>
        </div>
        <div class="shop-item-price">💰 ${def.price} 골드</div>
        <button class="btn-shop-buy" data-id="${id}">구매</button>
      `;
      shopList.appendChild(itemRow);
    }

    shopList.querySelectorAll('.btn-shop-buy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id')!;
        const def = ITEM_DATABASE[id];
        if (this.game.player.stats.gold >= def.price) {
          this.game.player.stats.gold -= def.price;
          this.game.player.addItem(id, 1);
          sound.playPickup();
          this.showToast(`${def.name}을(를) 구매했습니다!`, '🛍️');
          this.updateHUD();
        } else {
          this.showToast('골드가 부족합니다!', '⚠️');
        }
      });
    });
  }

  public showToast(text: string, icon: string = '✨') {
    const toast = document.createElement('div');
    toast.className = 'toast-bubble';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-text">${text}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 2400);
  }
}
