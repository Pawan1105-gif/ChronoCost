import { Link } from 'react-router-dom'
import Container from '../components/Container'

function Home() {
  return (
    <main>
      <div className="bg-custom-gradient">
        <Container>
          <div className="py-20 relative">
            <div className="text-center relative z-10">
              <div className="w-24 h-24 mx-auto mb-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-gradient-end">CC</span>
              </div>
              <h1 className="text-4xl font-bold text-white sm:text-6xl">
                Smart Cost Prediction for Infrastructure Projects
              </h1>
              <p className="mt-6 text-lg text-gray-200 max-w-3xl mx-auto">
                ChronoCost uses AI to predict project costs, timelines, and delay risks for infrastructure projects. Make data-driven decisions with our intelligent prediction system.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Link to="/signup" className="btn bg-white text-gradient-end hover:bg-gray-100 text-lg px-8 py-3">
                  Try Free Demo
                </Link>
                <Link to="/login" className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-3">
                  Sign In
                </Link>
              </div>
              <div className="mt-16">
                <div className="mx-auto rounded-lg shadow-2xl bg-white/10 p-8 max-w-3xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-white/5 rounded-lg animate-pulse"></div>
                    <div className="h-32 bg-white/5 rounded-lg animate-pulse"></div>
                    <div className="h-32 bg-white/5 rounded-lg animate-pulse"></div>
                    <div className="h-32 bg-white/5 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="card border border-gradient-start/20 hover:border-gradient-start/40 transition-colors">
              <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gradient-end">Smart Estimation</h3>
              <p className="mt-2 text-gray-600">AI-powered cost and timeline predictions based on historical data and project parameters.</p>
            </div>
            <div className="card border border-gradient-mid/20 hover:border-gradient-mid/40 transition-colors">
              <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gradient-end">Dynamic What-If</h3>
              <p className="mt-2 text-gray-600">Simulate different scenarios by adjusting project parameters and see real-time prediction changes.</p>
            </div>
            <div className="card border border-gradient-end/20 hover:border-gradient-end/40 transition-colors">
              <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gradient-end">Trusted Predictions</h3>
              <p className="mt-2 text-gray-600">Explainable AI provides transparent factor breakdowns and confidence scores.</p>
            </div>
          </div>
        </div>
      </Container>
    </main>
  )
}

export default Home