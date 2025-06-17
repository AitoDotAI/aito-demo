/**
 * Tests for recommendations API functionality
 */

import axios from 'axios'
import { getRecommendedProducts } from '../../api/recommendations'

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

describe('Recommendations API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getRecommendedProducts', () => {
    const mockResponse = {
      data: {
        hits: [
          {
            id: 'yogurt-001',
            name: 'Greek Yogurt',
            tags: 'dairy protein healthy',
            price: 2.99,
            $p: 0.89
          },
          {
            id: 'granola-001',
            name: 'Organic Granola',
            tags: 'breakfast organic healthy',
            price: 5.49,
            $p: 0.78
          }
        ]
      }
    }

    const mockCart = [
      { id: 'milk-001', name: 'Organic Milk' },
      { id: 'bread-001', name: 'Whole Grain Bread' }
    ]

    test('should get recommendations excluding cart items', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      const results = await getRecommendedProducts('larry', mockCart, 5)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.aito.app/api/v1/_recommend',
        {
          from: 'impressions',
          where: {
            'context.user': 'larry',
            'product.id': {
              $and: [
                { $not: 'milk-001' },
                { $not: 'bread-001' }
              ]
            }
          },
          recommend: 'product',
          goal: { purchase: true },
          select: ['name', 'id', 'tags', 'price'],
          limit: 5
        },
        {
          headers: {
            'x-api-key': 'test-api-key'
          }
        }
      )

      expect(results).toEqual(mockResponse.data.hits)
    })

    test('should handle empty cart', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      const results = await getRecommendedProducts('larry', [], 3)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.aito.app/api/v1/_recommend',
        {
          from: 'impressions',
          where: {
            'context.user': 'larry'
            // Should not include product.id exclusions
          },
          recommend: 'product',
          goal: { purchase: true },
          select: ['name', 'id', 'tags', 'price'],
          limit: 3
        },
        expect.any(Object)
      )

      expect(results).toEqual(mockResponse.data.hits)
    })

    test('should handle null cart', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      const results = await getRecommendedProducts('larry', null, 3)

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.where).not.toHaveProperty('product.id')
      expect(results).toEqual(mockResponse.data.hits)
    })

    test('should use correct user ID', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      await getRecommendedProducts('veronica', mockCart, 5)

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.where['context.user']).toBe('veronica')
    })

    test('should respect count limit parameter', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      await getRecommendedProducts('larry', mockCart, 10)

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.limit).toBe(10)
    })

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error')
      mockedAxios.post.mockRejectedValue(mockError)

      await expect(getRecommendedProducts('larry', mockCart, 5))
        .rejects
        .toThrow('Failed to fetch recommendations')
    })

    test('should use purchase goal for optimization', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      await getRecommendedProducts('larry', mockCart, 5)

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.goal).toEqual({ purchase: true })
    })

    test('should recommend products not impressions', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      await getRecommendedProducts('larry', mockCart, 5)

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.recommend).toBe('product')
      expect(query.from).toBe('impressions')
    })

    test('should include required product fields', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse)

      await getRecommendedProducts('larry', mockCart, 5)

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.select).toEqual(['name', 'id', 'tags', 'price'])
    })

    test('should handle large cart efficiently', async () => {
      const largeCart = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        name: `Product ${i}`
      }))

      mockedAxios.post.mockResolvedValue(mockResponse)

      await getRecommendedProducts('larry', largeCart, 5)

      const call = mockedAxios.post.mock.calls[0]
      const query = call[1]

      expect(query.where['product.id'].$and).toHaveLength(50)
    })
  })
})