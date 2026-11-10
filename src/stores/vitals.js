import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useVitalsStore = defineStore('vitals', () => {
  const saved = JSON.parse(localStorage.getItem('alchemist_vitals') || '{}')

  const hp = ref(saved.hp !== undefined ? saved.hp : 100)
  const maxHp = ref(saved.maxHp || 100)
  const mp = ref(saved.mp !== undefined ? saved.mp : 100)
  const maxMp = ref(saved.maxMp || 100)
  const level = ref(saved.level || 1)
  const xp = ref(saved.xp || 0)
  const isAlive = ref(saved.isAlive !== undefined ? saved.isAlive : true)

  // 🔔 Состояние поп-апа
  const activeNotification = ref(null)

  function showNotification(text) {
    activeNotification.value = text
  }

  function closeNotification() {
    activeNotification.value = null
  }

  const xpNeededForNextLevel = computed(() => level.value * 50)
  const masterRank = computed(() => Math.floor(level.value / 5))
  const priceBonusMultiplier = computed(() => 1 + (masterRank.value * 0.05))

  function takeDamage(amount) {
    if (!isAlive.value) return
    hp.value = Math.max(0, hp.value - amount)
    if (hp.value === 0) isAlive.value = false
  }

  function useMana(amount) {
    if (mp.value >= amount) {
      mp.value -= amount
      return true
    }
    return false
  }

  function heal(amount) {
    if (!isAlive.value) return
    hp.value = Math.min(maxHp.value, hp.value + amount)
  }

  function restoreMana(amount) {
    if (!isAlive.value) return
    mp.value = Math.min(maxMp.value, mp.value + amount)
  }

  function addXp(amount) {
    if (!isAlive.value) return
    xp.value += amount
    
    while (xp.value >= xpNeededForNextLevel.value) {
      xp.value -= xpNeededForNextLevel.value
      level.value++
      
      if (level.value % 5 === 0) {
        hp.value = maxHp.value
        mp.value = maxMp.value
        showNotification(`🏆 Рівень Майстра досягнуто! (Ранг ${level.value / 5}). Цінність зіль зросла на 5%!`)
      } else {
        const choice = confirm(`Новий рівень: ${level.value}! Прокачати Макс. HP (+15)? Ок — HP, Скасувати — Макс. MP (+15).`)
        if (choice) maxHp.value += 15
        else maxMp.value += 15
        hp.value = maxHp.value
        mp.value = maxMp.value
      }
    }
  }

  function resurrect() {
    if (isAlive.value) return
    level.value = 1
    xp.value = 0
    maxHp.value = 100
    maxMp.value = 100
    hp.value = 100
    mp.value = 100
    isAlive.value = true
  }

  watch([hp, maxHp, mp, maxMp, level, xp, isAlive], () => {
    localStorage.setItem('alchemist_vitals', JSON.stringify({
      hp: hp.value, maxHp: maxHp.value, mp: mp.value, maxMp: maxMp.value,
      level: level.value, xp: xp.value, isAlive: isAlive.value
    }))
  }, { deep: true })

  return {
    hp, maxHp, mp, maxMp, level, xp, isAlive, xpNeededForNextLevel, priceBonusMultiplier, masterRank,
    activeNotification, showNotification, closeNotification,
    takeDamage, useMana, heal, restoreMana, addXp, resurrect
  }
})
