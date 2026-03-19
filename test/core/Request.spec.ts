import { describe, it, expect } from 'vitest'
import { Request, Response, ProxyResponse, RequestError, ResponseError, ValidationError } from '../../src'

// --- Response ---

describe('Response', () => {
  it('getData() returns response data', () => {
    const res = new Response({ data: { id: 1 }, status: 200, headers: {} })
    expect(res.getData()).toEqual({ id: 1 })
  })

  it('getStatus() returns status code', () => {
    const res = new Response({ data: null, status: 404, headers: {} })
    expect(res.getStatus()).toBe(404)
  })

  it('getHeaders() returns headers', () => {
    const headers = { 'content-type': 'application/json' }
    const res = new Response({ data: null, status: 200, headers })
    expect(res.getHeaders()).toEqual(headers)
  })

  it('getValidationErrors() returns data as errors', () => {
    const errors = { name: ['Required'] }
    const res = new Response({ data: errors, status: 422, headers: {} })
    expect(res.getValidationErrors()).toEqual(errors)
  })

  it('handles empty response', () => {
    const res = new Response()
    expect(res.getData()).toBeNull()
  })
})

// --- ProxyResponse ---

describe('ProxyResponse', () => {
  it('wraps data, status, headers', () => {
    const res = new ProxyResponse(201, { id: 1, name: 'John' }, { 'x-custom': '1' })
    expect(res.getData()).toEqual({ id: 1, name: 'John' })
    expect(res.getStatus()).toBe(201)
    expect(res.getHeaders()).toEqual({ 'x-custom': '1' })
  })

  it('defaults to empty data and headers', () => {
    const res = new ProxyResponse(200)
    expect(res.getData()).toEqual({})
    expect(res.getHeaders()).toEqual({})
  })
})

// --- Error classes ---

describe('RequestError', () => {
  it('wraps error and response', () => {
    const res = new Response({ data: null, status: 500, headers: {} })
    const err = new RequestError('Server error', new Error('fail'), res)
    expect(err.message).toBe('Server error')
    expect(err.getError()).toBeInstanceOf(Error)
    expect(err.getResponse()).toBe(res)
  })
})

describe('ResponseError', () => {
  it('wraps message and optional response', () => {
    const err = new ResponseError('Bad data')
    expect(err.message).toBe('Bad data')
    expect(err.getResponse()).toBeUndefined()
  })

  it('wraps message with response', () => {
    const res = new Response({ data: null, status: 400, headers: {} })
    const err = new ResponseError('Bad request', res)
    expect(err.getResponse()).toBe(res)
  })
})

describe('ValidationError', () => {
  it('wraps validation errors', () => {
    const errors = { name: 'Required', email: 'Invalid' }
    const err = new ValidationError(errors, 'Validation failed')
    expect(err.message).toBe('Validation failed')
    expect(err.getValidationErrors()).toEqual(errors)
  })
})

// --- Request ---

describe('Request', () => {
  it('stores axios config', () => {
    const config = { url: '/api/users', method: 'GET' as const }
    const req = new Request(config)
    expect(req.config).toEqual(config)
  })
})
