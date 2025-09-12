import { getRecommendedProducts } from '../../01-recommend'
import { getAutoComplete } from '../../02-autocomplete'
import { getProductSearchResults } from '../../03-search'
import { getTagSuggestions } from '../../04-get-tag-suggestions'
import { getAutoFill, getProductsByIds } from '../../05-autofill'
import { prompt } from '../../06-prompt'
import { relate } from '../../07-relate'
import { predictInvoice } from '../../08-predict-invoice'
import { getProductDetails, getAllProducts, getProductStats, getProductAnalytics } from '../../09-product'
import { getDistinctValues } from '../../10-get-distinct-values'
import { evaluateModel } from '../../11-evaluate'

export {
  getProductSearchResults,
  getRecommendedProducts,
  getTagSuggestions,
  getAutoComplete,
  getAutoFill,
  getProductsByIds,
  prompt,
  relate,
  predictInvoice,
  evaluateModel,
  getProductDetails,
  getAllProducts,
  getProductStats, 
  getProductAnalytics,
  getDistinctValues
}
