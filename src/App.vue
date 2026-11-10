<template>
  <!-- 📜 Встроенный поп-ап уведомлений поверх экрана -->
  <div v-if="vitals.activeNotification" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999;">
    <div style="background: linear-gradient(135deg, #1e1b4b, #11131e); border: 2px solid #34d399; padding: 24px; border-radius: 8px; text-align: center; max-width: 360px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <h4 style="margin-top: 0; margin-bottom: 10px; color: #fbbf24; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">📜 Звістка з лавки</h4>
      <p style="font-size: 14px; color: #f1f5f9; margin-bottom: 16px; line-height: 1.4;">{{ vitals.activeNotification }}</p>
      <button @click="vitals.closeNotification" style="width: 100%; background-color: #243e33; color: #34d399; border: 1px solid #34d399; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer;">Зрозуміло</button>
    </div>
  </div>

  <div class="game-container">
    <!-- 🧙‍♂️ МИНИМАЛИСТИЧНЫЙ КОМПАКТНЫЙ ХЕДЕР -->
    <header>
      <div>
        <h1>🔮 Лавка алхіміка</h1>
        <span style="color: #6ee7b7; font-size: 11px;">Ранг майстра: {{ vitals.masterRank }}</span>
      </div>

      <!-- Полоски здоровья и маны встроенные по центру строки -->
      <div class="header-vitals-inline">
        <div class="vital-bar-group">
          <div class="bar-label-inline"><span style="color: #f87171;">❤️ HP</span> <span>{{ vitals.hp }}/{{ vitals.maxHp }}</span></div>
          <div class="bar-outer"><div class="bar-inner bg-hp" :style="{ width: (vitals.hp / vitals.maxHp) * 100 + '%' }"></div></div>
        </div>
        <div class="vital-bar-group">
          <div class="bar-label-inline"><span style="color: #60a5fa;">🧪 MP</span> <span>{{ vitals.mp }}/{{ vitals.maxMp }}</span></div>
          <div class="bar-outer"><div class="bar-inner bg-mp" :style="{ width: (vitals.mp / vitals.maxMp) * 100 + '%' }"></div></div>
        </div>
      </div>

      <!-- Монеты и уровни -->
      <div class="header-info-inline">
        <span style="color: #fbbf24;">💰 {{ pantry.gold }}</span>
        <span style="color: #c084fc;">✨ Lvl {{ vitals.level }} <span style="font-size: 11px; color: #9ca3af;">({{ vitals.xp }}/{{ vitals.xpNeededForNextLevel }} XP)</span></span>
      </div>
    </header>

    <!-- Экран смерти -->
    <div v-if="!vitals.isAlive" class="death-screen">
      <h2 style="color: #ef4444; margin-top: 0;">💀 Алхімік загинув</h2>
      <p style="margin-bottom: 16px; font-size: 14px; color: #fca5a5;">Робота призупинена. Воскресіння відновлює життя, але скидає рівень до 1-го.</p>
      <button @click="resurrect" style="border-color: #ef4444; color: #ef4444; background: transparent;">Воскресити алхіміка</button>
    </div>

    <!-- Основной интерфейс (3 колонки) -->
    <div v-else class="game-grid">
      
      <!-- Колонка 1: Торговля сыровиною и Комора (с возможностью сворачивания) -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Секция: Ринок сировини -->
        <section>
          <div @click="showMarket = !showMarket" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
            <h3 style="color: #34d399; margin: 0; border: none; padding: 0;">🛒 Ринок сировини</h3>
            <span style="font-size: 12px; color: #9ca3af;">{{ showMarket ? '▲ Сховати' : '▼ Відкрити' }}</span>
          </div>
          
          <div v-show="showMarket" style="margin-top: 12px; border-top: 2px solid #2d4a3e; padding-top: 8px;">
            <table class="market-table">
              <tr v-for="ing in pantry.marketIngredients" :key="ing.id" :class="getIngClass(ing.id)">
                <td style="font-size: 14px; font-weight: 500;">{{ ing.name }}</td>
                <td style="font-weight: bold; text-align: center; width: 60px; color: #fbbf24;">{{ ing.price }} 💰</td>
                <td style="text-align: right;">
                  <button @click="pantry.buyIngredient(ing.id)" :disabled="pantry.gold < ing.price" style="font-size: 11px; padding: 4px 8px;">Купити</button>
                </td>
              </tr>
            </table>
          </div>
        </section>

        <!-- Секция: Комора інгредієнтів -->
        <section>
          <div @click="showPantry = !showPantry" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
            <h3 style="color: #fbbf24; margin: 0; border: none; padding: 0;">📦 Комора інгредієнтів</h3>
            <span style="font-size: 12px; color: #9ca3af;">{{ showPantry ? '▲ Сховати' : '▼ Відкрити' }}</span>
          </div>

          <div v-show="showPantry" style="margin-top: 12px; border-top: 2px solid #2d4a3e; padding-top: 8px;">
            <p style="font-size: 11px; color: #9ca3af; margin-top: 0; margin-bottom: 12px;">Натисніть на предмет, щоб додати у котел</p>
            <div class="pantry-grid">
              <div v-for="(count, id) in pantry.pantry" :key="id" @click="pantry.addToCauldron(id)" class="pantry-item" :class="getIngClass(id)">
                <div style="font-size: 12px; color: #9ca3af; font-weight: 500;">{{ getIngName(id) }}</div>
                <div style="font-size: 18px; font-weight: bold; margin-top: 2px; color: #fff;">x{{ count }}</div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- Колонка 2: Алхімічний котел и Гримуар -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <section style="border-color: #6366f1;">
          <h3 style="color: #818cf8;">🔮 Котел синтезу</h3>
          <div class="slots-container">
            <div v-for="(slot, index) in pantry.cauldron" :key="index" @click="pantry.removeFromCauldron(index)" class="cauldron-slot" :class="slot ? getIngClass(slot) : ''">
              <span v-if="slot">{{ getIngName(slot) }}</span>
              <span v-else style="color: #4b5563; font-weight: normal;">Порожньо</span>
            </div>
          </div>
          <button @click="handleSynthesis" :disabled="pantry.cauldron.includes(null)" style="width: 100%; padding: 10px; background-color: #312e81; border-color: #818cf8; color: #a5b4fc;">
            Зварити зілля (15 MP)
          </button>
          <div v-if="logMessage" class="log-box">
            {{ logMessage }}
          </div>
        </section>

        <section>
          <h3 style="color: #c084fc;">📖 Гримуар рецептів</h3>
          <div v-for="recipe in pantry.recipes" :key="recipe.potionId" class="list-item" style="font-size: 13px;">
            <div>
              <span v-if="pantry.discoveredRecipes.includes(recipe.potionId)" style="font-weight: bold; color: #e9d5ff;">🧪 {{ recipe.name }}</span>
              <span v-else style="color: #6b7280; font-style: italic;">Невідомий рецепт</span>
            </div>
            <div style="font-size: 11px; color: #9ca3af; background-color: #0d1411; padding: 2px 6px; border-radius: 4px;">
              {{ getIngName(recipe.ingredients[0]) }} + {{ getIngName(recipe.ingredients[1]) }}
            </div>
          </div>
        </section>
      </div>

      <!-- Колонка 3: Вітрина та Покупці -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <section>
          <h3 style="color: #38bdf8;">🍾 Вітрина зіль</h3>
          <div v-for="(count, id) in pantry.potions" :key="id" class="list-item" style="font-size: 14px;" :class="getPotionClass(id)">
            <span>{{ getPotionName(id) }} (<b>x{{ count }}</b>)</span>
            <button v-if="id !== 'strength_potion'" @click="pantry.drinkPotion(id)" :disabled="count <= 0" style="font-size: 11px; padding: 2px 6px;">Випити</button>
          </div>
        </section>

        <section>
          <h3 style="color: #f59e0b;">👥 Черга покупців</h3>
          <div v-if="shop.currentCustomer" style="font-size: 14px;">
            <div style="margin-bottom: 4px;"><b>Клієнт:</b> <span style="color: #fcd34d;">{{ shop.currentCustomer.name }}</span></div>
            <div><b>Шукає:</b> <span style="text-decoration: underline;">{{ shop.currentCustomer.potionName }}</span></div>
            <div style="margin: 10px 0; border-top: 1px dashed #b45309; padding-top: 8px; display: flex; justify-content: space-between;">
              <span style="color: #fbbf24; font-weight: bold;">Ціна: {{ shop.currentCustomer.price }} 💰</span>
              <span style="color: #c084fc; font-weight: bold;">+{{ shop.currentCustomer.xp }} XP</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button @click="shop.sellPotion" class="btn-sell-action">Продати</button>
              <button @click="shop.rejectCustomer" style="background-color: transparent; border-color: #7c2d12; color: #f97316;">Відмовити</button>
            </div>
          </div>
          <div v-else style="text-align: center; color: #a8a29e; font-style: italic;">Очікування клієнта...</div>
        </section>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVitalsStore } from './stores/vitals'
import { usePantryStore } from './stores/pantry'
import { useShopStore } from './stores/shop'

const vitals = useVitalsStore()
const pantry = usePantryStore()
const shop = useShopStore()

const logMessage = ref('')
const isSuccessLog = ref(true)

// Состояние для управления видимостью панелей (скрыть/открыть)
const showMarket = ref(true)
const showPantry = ref(true)

onMounted(() => {
  if (!shop.currentCustomer && vitals.isAlive) {
    shop.generateCustomer()
  }
})

function handleSynthesis() {
  const result = pantry.synthesize()
  if (result) {
    logMessage.value = result.message
    isSuccessLog.value = result.success
  }
}

function resurrect() {
  vitals.resurrect()
  shop.generateCustomer()
  logMessage.value = ''
}

function getIngName(id) {
  const mapping = { red_root: 'Червоний корінь', moon_shroom: 'Місячний гриб', sun_leaf: 'Сонячний листок', ectoplasm: 'Ектоплазма' }
  return mapping[id] || id
}

function getPotionName(id) {
  const mapping = { health_potion: 'Зілля лікування', mana_potion: 'Зілля мани', strength_potion: 'Зілля сили' }
  return mapping[id] || id
}

function getIngClass(id) {
  const classes = { red_root: 'ing-red', moon_shroom: 'ing-moon', sun_leaf: 'ing-sun', ectoplasm: 'ing-ecto' }
  return classes[id] || ''
}

function getPotionClass(id) {
  const classes = { health_potion: 'ing-red', mana_potion: 'ing-moon', strength_potion: 'ing-sun' }
  return classes[id] || ''
}
</script>