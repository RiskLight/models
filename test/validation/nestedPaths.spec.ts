import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { Model, required } from '../../src'

describe('Validation: nested error paths', () => {
  const ArtworkSchema = z.object({
    basic_info: z.object({
      title: z.string().min(1, 'Title is required'),
      author: z.string().min(1, 'Author is required'),
      year: z.number().optional(),
    }),
    genres: z.array(z.string().min(1, 'Empty genre')),
    price: z.number().min(0, 'Negative price'),
  })

  class Artwork extends Model {
    defaults() {
      return { basic_info: { title: '', author: '' }, genres: [], price: 0 }
    }
    schema() {
      return ArtworkSchema
    }
  }

  it('keys zod errors by the full dotted path', async () => {
    const artwork = new Artwork({ basic_info: { title: '', author: 'Rina' } })
    const errors = await artwork.validate()
    expect(errors).toHaveProperty(['basic_info.title'])
    expect(errors).not.toHaveProperty(['basic_info.author'])
    expect(errors).not.toHaveProperty('basic_info')
  })

  it('keys array item errors by index', async () => {
    const artwork = new Artwork({ basic_info: { title: 'a', author: 'b' }, genres: ['ok', ''] })
    const errors = await artwork.validate()
    expect(Object.keys(errors)).toEqual(['genres.1'])
  })

  it('keeps top-level keys unchanged', async () => {
    const artwork = new Artwork({ basic_info: { title: 'a', author: 'b' }, price: -1 })
    const errors = await artwork.validate()
    expect(Object.keys(errors)).toEqual(['price'])
  })

  it('respects useFirstErrorOnly for nested keys', async () => {
    class FirstOnly extends Artwork {
      options() {
        return { useFirstErrorOnly: true }
      }
    }
    const artwork = new FirstOnly({ basic_info: { title: '', author: '' } })
    const errors = await artwork.validate()
    expect(errors['basic_info.title']).toBe('Title is required')
    expect(errors['basic_info.author']).toBe('Author is required')
  })

  it('reports schema errors on save() with dotted keys', async () => {
    const artwork = new Artwork()
    await expect(artwork.save()).rejects.toBeTruthy()
    expect(artwork.errors).toHaveProperty(['basic_info.title'])
  })

  it('validation() rules accept dotted keys for nested attributes', async () => {
    class Legacy extends Model {
      defaults() {
        return { basic_info: { title: '' } }
      }
      validation() {
        return { 'basic_info.title': required }
      }
    }
    const empty = await new Legacy().validate()
    expect(empty).toHaveProperty(['basic_info.title'])
    const filled = await new Legacy({ basic_info: { title: 'Owl' } }).validate()
    expect(filled).toEqual({})
  })
})
