/**
 * Tests for search API functionality
 */

import axios from 'axios'
import { getProductSearchResults } from '../../api/search'
import config from '../../config'

// Mock axios
jest.mock('axios')
const mockedAxios = axios

// Mock config
jest.mock('../../config', () => ({
  aito: {
    url: 'https://test.aito.app',
    apiKey: 'test-api-key'
  }
}))

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProductSearchResults', () => {
    const mockResponse = {
      data: {
        hits: [
          {
            id: 'milk-001',
            name: 'Organic Milk 1L',
            tags: 'organic dairy milk',
            price: 3.99,
            $matches: ['milk'],
            $p: 0.95
          },
          {
            id: 'milk-002', 
            name: 'Almond Milk 1L',
            tags: 'plant-based dairy-alternative milk',
            price: 4.49,
            $matches: ['milk'],
            $p: 0.87
          }
        ]
      }
    }

    test('should search products successfully with user context', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      const results = await getProductSearchResults('larry', 'milk')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.aito.app/api/v1/_query',
        {
          from: 'impressions',
          where: {
            product: {
              $or: [
                { tags: { $match: 'milk' } },
                { name: { $match: 'milk' } }
              ]
            },
            'context.user': 'larry'
          },
          get: 'product',
          orderBy: {
            $multiply: [
              '$similarity',
              {
                $p: {
                  $context: {
                    purchase: true
                  }
                }
              }
            ]
          },
          select: ['name', 'id', 'tags', 'price', '$matches'],
          limit: 5
        },
        {
          headers: { 'x-api-key': 'test-api-key' }
        }
      )

      expect(results).toEqual(mockResponse.data.hits)
    })

    test('should search products without user context', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      const results = await getProductSearchResults(null, 'milk')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.aito.app/api/v1/_query',
        expect.objectContaining({
          where: {
            product: {
              $or: [
                { tags: { $match: 'milk' } },
                { name: { $match: 'milk' } }
              ]
            }
            // Should not include 'context.user'
          }
        }),
        expect.any(Object)
      )

      expect(results).toEqual(mockResponse.data.hits)
    })

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error')
      mockedAxios.post.mockRejectedValue(mockError)

      await expect(getProductSearchResults('larry', 'milk'))
        .rejects
        .toThrow('Failed to fetch search results')
    })

    test('should handle empty search query', async () => {
      mockedAxios.post.mockResolvedValue({ data: { hits: [] } })

      const results = await getProductSearchResults('larry', '')

      expect(results).toEqual([])
    })

    test('should validate required headers', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      await getProductSearchResults('larry', 'milk')

      const call = mockedAxios.post.mock.calls[0]
      const headers = call[2].headers

      expect(headers).toHaveProperty('x-api-key', 'test-api-key')
    })

    test('should limit results to 5 items', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      await getProductSearchResults('larry', 'milk')

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.limit).toBe(5)
    })

    test('should include proper select fields', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      await getProductSearchResults('larry', 'milk')

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.select).toEqual(['name', 'id', 'tags', 'price', '$matches'])
    })
  })
})