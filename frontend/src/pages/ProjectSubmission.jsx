import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { database } from '../utils/appwrite'
import { ID } from 'appwrite'
import Container from '../components/Container'
import LoadingSpinner from '../components/LoadingSpinner'

function ProjectSubmission({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [formData, setFormData] = useState({
    companyName: '',
    projectName: '',
    projectType: 'substation',
    location: '',
    terrain: 'flat',
    estimatedBudget: '',
    estimatedDuration: '',
    scopeDescription: '',
    riskFactors: '',
    hasHistoricalData: false
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type !== 'text/csv') {
      toast.error('Please upload a CSV file')
      return
    }
    setCsvFile(file)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const processCSV = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        const rows = text.split('\\n').map(row => row.split(','))
        const headers = rows[0]
        const data = rows.slice(1).map(row => {
          const obj = {}
          headers.forEach((header, i) => {
            obj[header.trim()] = row[i]?.trim()
          })
          return obj
        })
        resolve(data)
      }
      reader.readAsText(file)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let historicalData = []
      
      if (csvFile) {
        historicalData = await processCSV(csvFile)
      }

      // Calculate risk score based on historical data or rough estimate
      const riskScore = calculateRiskScore(formData, historicalData)

      // Create project document
      const project = await database.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION,
        ID.unique(),
        {
          userId: user.$id,
          companyName: formData.companyName,
          projectName: formData.projectName,
          projectType: formData.projectType,
          location: formData.location,
          terrain: formData.terrain,
          estimatedBudget: parseFloat(formData.estimatedBudget),
          estimatedDuration: parseInt(formData.estimatedDuration),
          scopeDescription: formData.scopeDescription,
          riskFactors: formData.riskFactors,
          hasHistoricalData: formData.hasHistoricalData,
          riskScore,
          historicalDataSummary: historicalData.length > 0 ? {
            projectCount: historicalData.length,
            averageDuration: calculateAverageDuration(historicalData),
            averageCost: calculateAverageCost(historicalData),
            delayFrequency: calculateDelayFrequency(historicalData)
          } : null
        }
      )

      toast.success('Project submitted successfully!')
      navigate(`/projects/${project.$id}`)
    } catch (error) {
      console.error('Failed to submit project:', error)
      toast.error('Failed to submit project')
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for calculations
  const calculateRiskScore = (formData, historicalData) => {
    if (historicalData.length > 0) {
      // Calculate based on historical data patterns
      const delayFrequency = calculateDelayFrequency(historicalData)
      const costOverruns = calculateCostOverrunFrequency(historicalData)
      return (delayFrequency + costOverruns) / 2
    } else {
      // Rough estimation based on input factors
      let score = 0.5 // Base score
      
      // Adjust based on terrain
      const terrainFactors = {
        flat: 0,
        hilly: 0.1,
        mountainous: 0.2,
        urban: 0.15
      }
      score += terrainFactors[formData.terrain] || 0

      // Adjust based on project type
      const typeFactors = {
        substation: 0.1,
        overhead_line: 0.15,
        underground_cable: 0.2
      }
      score += typeFactors[formData.projectType] || 0

      return Math.min(Math.max(score, 0), 1) // Ensure score is between 0 and 1
    }
  }

  const calculateAverageDuration = (data) => {
    const durations = data.map(item => parseFloat(item.duration)).filter(Boolean)
    return durations.reduce((a, b) => a + b, 0) / durations.length
  }

  const calculateAverageCost = (data) => {
    const costs = data.map(item => parseFloat(item.cost)).filter(Boolean)
    return costs.reduce((a, b) => a + b, 0) / costs.length
  }

  const calculateDelayFrequency = (data) => {
    const delayedProjects = data.filter(item => item.delayed === 'true' || item.delayed === '1').length
    return delayedProjects / data.length
  }

  const calculateCostOverrunFrequency = (data) => {
    const overrunProjects = data.filter(item => {
      const actualCost = parseFloat(item.actualCost)
      const estimatedCost = parseFloat(item.estimatedCost)
      return actualCost > estimatedCost * 1.1 // 10% threshold
    }).length
    return overrunProjects / data.length
  }

  return (
    <Container className="py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-red-100 mb-8">Submit Project Details</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gradient-end mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  className="mt-1 input"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <input
                  id="projectName"
                  name="projectName"
                  type="text"
                  required
                  className="mt-1 input"
                  value={formData.projectName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gradient-end mb-6">Project Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-700">
                  Project Type
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  required
                  className="mt-1 input"
                  value={formData.projectType}
                  onChange={handleChange}
                >
                  <option value="substation">Substation</option>
                  <option value="overhead_line">Overhead Line</option>
                  <option value="underground_cable">Underground Cable</option>
                </select>
              </div>
              <div>
                <label htmlFor="terrain" className="block text-sm font-medium text-gray-700">
                  Terrain Type
                </label>
                <select
                  id="terrain"
                  name="terrain"
                  required
                  className="mt-1 input"
                  value={formData.terrain}
                  onChange={handleChange}
                >
                  <option value="flat">Flat</option>
                  <option value="hilly">Hilly</option>
                  <option value="mountainous">Mountainous</option>
                  <option value="urban">Urban</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  className="mt-1 input"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="estimatedBudget" className="block text-sm font-medium text-gray-700">
                  Estimated Budget ($)
                </label>
                <input
                  id="estimatedBudget"
                  name="estimatedBudget"
                  type="number"
                  min="0"
                  required
                  className="mt-1 input"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700">
                  Estimated Duration (months)
                </label>
                <input
                  id="estimatedDuration"
                  name="estimatedDuration"
                  type="number"
                  min="1"
                  required
                  className="mt-1 input"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gradient-end mb-6">Project Details</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="scopeDescription" className="block text-sm font-medium text-gray-700">
                  Project Scope Description
                </label>
                <textarea
                  id="scopeDescription"
                  name="scopeDescription"
                  rows={4}
                  className="mt-1 input"
                  value={formData.scopeDescription}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="riskFactors" className="block text-sm font-medium text-gray-700">
                  Known Risk Factors
                </label>
                <textarea
                  id="riskFactors"
                  name="riskFactors"
                  rows={3}
                  className="mt-1 input"
                  placeholder="List any known risk factors, separated by commas"
                  value={formData.riskFactors}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gradient-end mb-6">Historical Data</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="hasHistoricalData"
                  name="hasHistoricalData"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.hasHistoricalData}
                  onChange={handleChange}
                />
                <label htmlFor="hasHistoricalData" className="ml-2 block text-sm text-gray-700">
                  We have historical project data to upload
                </label>
              </div>
              
              {formData.hasHistoricalData && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Historical Data (CSV)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".csv"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV file up to 10MB</p>
                      {csvFile && (
                        <p className="text-sm text-blue-600">{csvFile.name}</p>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    CSV should include columns: projectName, duration, cost, delayed, actualCost, estimatedCost
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || (formData.hasHistoricalData && !csvFile)}
            >
              {loading ? (
                <span className="flex items-center">
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Submitting...</span>
                </span>
              ) : (
                'Submit Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </Container>
  )
}

export default ProjectSubmission