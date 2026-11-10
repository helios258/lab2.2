import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useVitalsStore } from './vitals'

export const usePantryStore = defineStore('pantry', () => {
  const vitals = useVitalsStore()
  const saved = JSON.parse(localStorage.getItem('alchemist_pantry') || '{}')

  const gold = ref(saved.gold !== undefined ? saved.gold : 50)
  
  const marketIngredients = ref([
    { id: 'red_root', name: 'Червоний корінь', price: 5 },
    { id: 'moon_shroom', name: 'Місячний гриб', price: 8 },
    { id: 'sun_leaf', name: 'Сонячний листок', price: 12 },
    { id: 'ectoplasm', name: 'Ектоплазма', price: 20 }
  ])

  const pantry = ref(saved.pantry || { red_root: 0, moon_shroom: 0, sun_leaf: 0, ectoplasm: 0 })
  const cauldron = ref([null, null])
  const potions = ref(saved.potions || { health_potion: 0, mana_potion: 0, strength_potion: 0 })

  const recipes = [
    { ingredients: ['red_root', 'moon_shroom'], potionId: 'health_potion', name: 'Зілля лікування', basePrice: 25 },
    { ingredients: ['moon_shroom', 'sun_leaf'], potionId: 'mana_potion', name: 'Зілля мани', basePrice: 30 },
    { ingredients: ['sun_leaf', 'ectoplasm'], potionId: 'strength_potion', name: 'Зілля сили', basePrice: 50 }
  ]
  
  const discoveredRecipes = ref(saved.discoveredRecipes || [])

  function buyIngredient(id) {
    if (!vitals.isAlive) return
    const ing = marketIngredients.value.find(i => i.id === id)
    if (ing && gold.value >= ing.price) {
      gold.value -= ing.price
      pantry.value[id]++
    }
  }

  function addToCauldron(id) {
    if (!vitals.isAlive) return
    if (pantry.value[id] <= 0) return
    const freeSlot = cauldron.value.findIndex(s => s === null)
    if (freeSlot !== -1) {
      cauldron.value[freeSlot] = id
      pantry.value[id]--
    }
  }

  function removeFromCauldron(index) {
    if (!vitals.isAlive) return
    const id = cauldron.value[index]
    if (id) {
      pantry.value[id]++
      cauldron.value[index] = null
    }
  }

  function synthesize() {
    if (!vitals.isAlive) return null
    if (cauldron.value[0] === null || cauldron.value[1] === null) return null
    if (!vitals.useMana(15)) {
      vitals.showNotification("Недостатньо мани!")
      return null
    }

    const currentMix = [...cauldron.value].sort()
    cauldron.value = [null, null]

    const found = recipes.find(r => [...r.ingredients].sort().every((v, i) => v === currentMix[i]))

    if (found) {
      potions.value[found.potionId]++
      if (!discoveredRecipes.value.includes(found.potionId)) discoveredRecipes.value.push(found.potionId)
      return { success: true, message: `Успіх! Зварено: ${found.name}` }
    } else {
      const rand = Math.random()
      let damage = 25
      let severity = "Звичайний вибух"
      if (rand > 0.85) { damage = 75; severity = "Катастрофічний вибух (x3 Шкода!)" }
      else if (rand > 0.60) { damage = 50; severity = "Важкий вибух (x2 Шкода!)" }
      vitals.takeDamage(damage)
      return { success: false, severity, damage, message: `Колба вибухнула! ${severity} завдав -${damage} HP.` }
    }
  }

  function drinkPotion(id) {
    if (!vitals.isAlive || potions.value[id] <= 0) return
    if (id === 'health_potion' && vitals.hp < vitals.maxHp) { vitals.heal(40); potions.value[id]-- }
    if (id === 'mana_potion' && vitals.mp < vitals.maxMp) { vitals.restoreMana(40); potions.value[id]-- }
  }

  watch([gold, pantry, potions, discoveredRecipes], () => {
    localStorage.setItem('alchemist_pantry', JSON.stringify({
      gold: gold.value, pantry: pantry.value, potions: potions.value, discoveredRecipes: discoveredRecipes.value
    }))
  }, { deep: true })

  return {
    gold, marketIngredients, pantry, cauldron, potions, recipes, discoveredRecipes,
    buyIngredient, addToCauldron, removeFromCauldron, synthesize, drinkPotion
  }
})
