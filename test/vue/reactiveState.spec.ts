import { describe, it, expect } from 'vitest'
import { computed, nextTick, reactive, ref } from 'vue'
import { z } from 'zod'
import { Model } from '../../src'
import '../../src/vue'

class Genre extends Model {
  defaults() {
    return { name: '', info: { title: '' } }
  }
  schema() {
    return z.object({
      name: z.string().min(1, 'Name is required'),
      info: z.object({ title: z.string().min(1, 'Title is required') }),
    })
  }
}

describe('Vue adapter: reactive errors and state', () => {
  it('errors read through a plain model are tracked', async () => {
    const genre = new Genre()
    const nameError = computed(() => genre.errors.name)
    expect(nameError.value).toBeUndefined()
    await genre.validate()
    expect(nameError.value).toEqual(['Name is required'])
  })

  it('errors read through ref() are tracked', async () => {
    const genre = ref(new Genre())
    const titleError = computed(() => genre.value.errors['info.title'])
    await genre.value.validate()
    expect(titleError.value).toEqual(['Title is required'])
    genre.value.info.title = 'Owl'
    genre.value.name = 'Birds'
    await genre.value.validate()
    expect(titleError.value).toBeUndefined()
  })

  it('errors read through reactive() are tracked', async () => {
    const genre = reactive(new Genre())
    const count = computed(() => Object.keys(genre.errors).length)
    await genre.validate()
    expect(count.value).toBe(2)
    genre.clearErrors()
    expect(count.value).toBe(0)
  })

  it('setErrors from a backend response is tracked', async () => {
    const genre = new Genre()
    const nameError = computed(() => genre.errors.name)
    expect(nameError.value).toBeUndefined()
    genre.setErrors({ name: ['Taken'] })
    await nextTick()
    expect(nameError.value).toEqual(['Taken'])
  })

  it('saving and loading flags are tracked', () => {
    const genre = new Genre()
    const busy = computed(() => genre.saving || genre.loading)
    expect(busy.value).toBe(false)
    genre.saving = true
    expect(busy.value).toBe(true)
    genre.saving = false
    genre.loading = true
    expect(busy.value).toBe(true)
  })
})
