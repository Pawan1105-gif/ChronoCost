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

  // Available picklists
  const project_types = ['Construction', 'Software', 'Infrastructure', 'IT', 'Engineering']
  const regions = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad']
  const categoriesList = ['Residential', 'Commercial', 'Industrial', 'Web', 'Mobile', 'Road', 'Bridge']

  const [formData, setFormData] = useState({
    companyName: '',
    projectName: '',
    projectType: 'Construction',
    location: '',
    terrain: 'flat',
    estimatedBudget: '',
    estimatedDuration: '',
    scopeDescription: '',
    riskFactors: '',
    hasHistoricalData: false,
    categories: ''
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
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }
      // If project type changed, and it's Software, set terrain to 'na_software'
      if (name === 'projectType') {
        if (value === 'Software') {
          next.terrain = 'na_software'
        } else if (prev.terrain === 'na_software') {
          next.terrain = 'flat'
        }
      }
      return next
    })
  }

  const processCSV = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        const rows = text.split('\n').map(row => row.split(','))
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

      // Calculate risk score
      const riskScore = calculateRiskScore(formData, historicalData)

      // Flatten historical data summary
      const historicalProjectCount = historicalData.length > 0 ? historicalData.length : null
      const historicalAvgDuration = historicalData.length > 0 ? calculateAverageDuration(historicalData) : null
      const historicalAvgCost = historicalData.length > 0 ? calculateAverageCost(historicalData) : null
      const historicalDelayFrequency = historicalData.length > 0 ? calculateDelayFrequency(historicalData) : null

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
          categories: formData.categories,
          estimatedBudget: parseFloat(formData.estimatedBudget),
          estimatedDuration: parseInt(formData.estimatedDuration),
          scopeDescription: formData.scopeDescription,
          riskFactors: formData.riskFactors,
          hasHistoricalData: formData.hasHistoricalData,
          riskScore,
          // ✅ Flattened fields
          historicalProjectCount,
          historicalAvgDuration,
          historicalAvgCost,
          historicalDelayFrequency
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

  // Helper functions
  const calculateRiskScore = (formData, historicalData) => {
    if (historicalData.length > 0) {
      const delayFrequency = calculateDelayFrequency(historicalData)
      const costOverruns = calculateCostOverrunFrequency(historicalData)
      return (delayFrequency + costOverruns) / 2
    } else {
      let score = 0.5
      const terrainFactors = {
        flat: 0,
        hilly: 0.1,
        mountainous: 0.2,
        urban: 0.15,
        na_software: 0
      }
      score += terrainFactors[formData.terrain] || 0
      const typeFactors = {
        Construction: 0.12,
        Software: 0.05,
        Infrastructure: 0.15,
        IT: 0.07,
        Engineering: 0.1
      }
      score += typeFactors[formData.projectType] || 0
      return Math.min(Math.max(score, 0), 1)
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
      return actualCost > estimatedCost * 1.1
    }).length
    return overrunProjects / data.length
  }

  return (
    <Container className="py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-red-100 mb-8">Submit Project Details</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Basic Information --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-700 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-200">Company Name</label>
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
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-200">Project Name</label>
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

          {/* --- Project Specifications --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-800 mb-6">Project Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-200">Project Type</label>
                <select id="projectType" name="projectType" required className="mt-1 input" value={formData.projectType} onChange={handleChange}>
                  {project_types.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="terrain" className="block text-sm font-medium text-gray-200">Terrain Type</label>
                <select id="terrain" name="terrain" required className="mt-1 input" value={formData.terrain} onChange={handleChange}>
                  {formData.projectType === 'Software' ? (
                    <option value="na_software">N/A (software)</option>
                  ) : (
                    <>
                      <option value="flat">Flat</option>
                      <option value="hilly">Hilly</option>
                      <option value="mountainous">Mountainous</option>
                      <option value="urban">Urban</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-200">Location</label>
                <select id="location" name="location" required className="mt-1 input" value={formData.location} onChange={handleChange}>
                  <option value="">Select region</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="estimatedBudget" className="block text-sm font-medium text-gray-200">Estimated Budget ($)</label>
                <input id="estimatedBudget" name="estimatedBudget" type="number" min="0" required className="mt-1 input" value={formData.estimatedBudget} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-200">Estimated Duration (months)</label>
                <input id="estimatedDuration" name="estimatedDuration" type="number" min="1" required className="mt-1 input" value={formData.estimatedDuration} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="categories" className="block text-sm font-medium text-gray-200">Categories</label>
                <select id="categories" name="categories" className="mt-1 input" value={formData.categories} onChange={handleChange}>
                  <option value="">Select category</option>
                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* --- Project Details --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-800 mb-6">Project Details</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="scopeDescription" className="block text-sm font-medium text-gray-200">Project Scope Description</label>
                <textarea id="scopeDescription" name="scopeDescription" rows={4} className="mt-1 input" value={formData.scopeDescription} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="riskFactors" className="block text-sm font-medium text-gray-200">Known Risk Factors</label>
                <textarea id="riskFactors" name="riskFactors" rows={3} className="mt-1 input" value={formData.riskFactors} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* --- Historical Data --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-800 mb-6">Historical Data</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input id="hasHistoricalData" name="hasHistoricalData" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" checked={formData.hasHistoricalData} onChange={handleChange} />
                <label htmlFor="hasHistoricalData" className="ml-2 block text-sm text-gray-200">We have historical project data to upload</label>
              </div>

              {formData.hasHistoricalData && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-200">Upload Historical Data (CSV)</label>
                  <input type="file" accept=".csv" onChange={handleFileChange} className="mt-2 text-gray-200" />
                  {csvFile && <p className="text-sm text-blue-400 mt-2">{csvFile.name}</p>}
                </div>
              )}
            </div>
          </div>

          {/* --- Buttons --- */}
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => navigate('/projects')} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || (formData.hasHistoricalData && !csvFile)}>
              {loading ? <span className="flex items-center"><LoadingSpinner size="small" /><span className="ml-2">Submitting...</span></span> : 'Submit Project'}
            </button>
          </div>
        </form>
      </div>
    </Container>
  )
}

export default ProjectSubmission
