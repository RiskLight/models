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

  it('deleting and fatal flags are tracked', () => {
    const genre = new Genre()
    const state = computed(() => [genre.deleting, genre.fatal])
    expect(state.value).toEqual([false, false])
    genre.deleting = true
    genre.fatal = true
    expect(state.value).toEqual([true, true])
  })

  it('clone() gets its own reactive errors', async () => {
    const genre = new Genre()
    const copy = genre.clone()
    const copyError = computed(() => copy.errors.name)
    await genre.validate()
    expect(copyError.value).toBeUndefined()
    await copy.validate()
    expect(copyError.value).toEqual(['Name is required'])
  })

  it('patches boot only once when the adapter is imported again', async () => {
    const boot = Model.prototype.boot
    await import('../../src/vue/index.ts?again')
    expect(Model.prototype.boot).toBe(boot)
  })
})

