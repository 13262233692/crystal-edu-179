import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const crystalAPI = {
  listCrystals: (search = '') => 
    api.get('/crystals', { params: { search } }).then(res => res.data),
  
  getCrystal: (id) => 
    api.get(`/crystals/${id}`).then(res => res.data),
  
  uploadCrystal: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/crystals', formData).then(res => res.data)
  }
}

export const symmetryAPI = {
  getOperations: () => 
    api.get('/symmetry-operations').then(res => res.data)
}

export const quizAPI = {
  getQuestions: (category = 'all') => 
    api.get('/questions', { params: { category } }).then(res => res.data)
}

export const xrdAPI = {
  calculateXRD: (crystalId, params = {}) => 
    api.get(`/xrd/${crystalId}`, { params }).then(res => res.data),
  
  getWavelengths: () => 
    api.get('/xrd/wavelengths').then(res => res.data)
}

export default api
