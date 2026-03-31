<script setup lang="ts">
import { ref } from 'vue'
import UsersPage from './views/UsersPage.vue'
import TestsPage from './views/TestsPage.vue'

const tab = ref<'users' | 'tests'>('users')
</script>

<template>
  <div style="background: #333; padding: 8px 20px; display: flex; gap: 10px;">
    <button @click="tab = 'users'"
      :style="{ padding: '6px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: tab === 'users' ? '#2196F3' : '#555', color: 'white' }">
      Users (CRUD)
    </button>
    <button @click="tab = 'tests'"
      :style="{ padding: '6px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: tab === 'tests' ? '#2196F3' : '#555', color: 'white' }">
      Advanced Tests
    </button>
  </div>

  <UsersPage v-if="tab === 'users'" />
  <TestsPage v-if="tab === 'tests'" />
</template>

<style>
body { margin: 0; background: #fafafa; }
* { box-sizing: border-box; }
</style>
