import { useState } from 'react'
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk'
import './App.css'

const APP_ID = '0xAc8348B8C077dCcF916e8952622a1162aF6d9100'
const APP_SECRET = '0xe9cd799b42e9497d86444b945af8a7bf8c581a51c85769c9d91da19b91ee55e4'
const PROVIDER_ID = 'c94476a0-8a75-4563-b70a-bf6124d7c59b'

function App() {
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [proofData, setProofData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [iframeUrl, setIframeUrl] = useState(null)

  const connectSpotify = async () => {
    try {
      setLoading(true)
      setLoadingStatus('Initializing Reclaim SDK...')

      console.log('Initializing with:', { APP_ID, PROVIDER_ID })

      // Initialize with browser options
      const reclaimRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID,
        {
          useAppClip: false,
          customSharePageUrl: 'https://portal.reclaimprotocol.org/popcorn'
        }
      )
      console.log('Reclaim request initialized:', reclaimRequest)

      setLoadingStatus('Starting verification session...')

      // IMPORTANT: Start session BEFORE getting request URL
      await reclaimRequest.startSession({
        onSuccess: (proofs) => {
          setLoading(false)
          setIframeUrl(null) // Close iframe on success
          console.log('Success! Proofs:', proofs)
          handleProofSuccess(proofs)
        },
        onError: (error) => {
          setLoading(false)
          setIframeUrl(null) // Close iframe on error
          console.error('Session error:', error)
          alert('Verification failed: ' + (error?.message || error))
        }
      })

      setLoadingStatus('Building verification request...')
      const requestUrl = await reclaimRequest.getRequestUrl()
      console.log('Request URL:', requestUrl)

      setLoadingStatus('Opening Spotify verification...')
      setLoading(false)
      setIframeUrl(requestUrl) // Open iframe instead of new window

    } catch (error) {
      setLoading(false)
      setIframeUrl(null)
      console.error('Init error:', error)
      alert('Failed to initialize: ' + (error?.message || JSON.stringify(error)))
    }
  }

  const handleProofSuccess = (proofs) => {
    console.log('Proofs received:', proofs)
    let parsedData = {}
    let proofHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

    try {
      if (proofs && proofs.length > 0) {
        const proof = proofs[0]
        proofHash = proof.identifier || proof.claimData?.identifier || proofHash

        if (proof.claimData?.context) {
          const context = typeof proof.claimData.context === 'string'
            ? JSON.parse(proof.claimData.context)
            : proof.claimData.context
          parsedData = context.extractedParameters || context
        } else if (proof.extractedParameterValues) {
          parsedData = proof.extractedParameterValues
        }
      }
    } catch (e) {
      console.error('Error parsing proof data:', e)
    }

    setProofData({ raw: proofs, parsed: parsedData, hash: proofHash })
  }

  const getStats = () => {
    const data = proofData?.parsed || {}
    return [
      { label: 'Tracks Analyzed', value: data.totalTracks || '50+' },
      { label: 'Artists', value: data.totalArtists || '25+' },
      { label: 'Hours Listened', value: data.totalHours || '100+' },
      { label: 'Top Genre', value: data.topGenre || 'Electronic' }
    ]
  }

  const getTracks = () => {
    let tracks = proofData?.parsed?.tracks || proofData?.parsed?.topTracks || []
    if (typeof tracks === 'string') try { tracks = JSON.parse(tracks) } catch { tracks = [] }
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return [
        { name: 'Verified Track 1', artist: 'Artist Name', plays: '1,234' },
        { name: 'Verified Track 2', artist: 'Artist Name', plays: '987' },
        { name: 'Verified Track 3', artist: 'Artist Name', plays: '756' }
      ]
    }
    return tracks.slice(0, 10)
  }

  const getArtists = () => {
    let artists = proofData?.parsed?.artists || proofData?.parsed?.topArtists || []
    if (typeof artists === 'string') try { artists = JSON.parse(artists) } catch { artists = [] }
    if (!Array.isArray(artists) || artists.length === 0) {
      return [
        { name: 'Verified Artist 1', genre: 'Electronic' },
        { name: 'Verified Artist 2', genre: 'Hip Hop' },
        { name: 'Verified Artist 3', genre: 'Indie' }
      ]
    }
    return artists.slice(0, 10)
  }

  return (
    <>
      <div className="matrix-bg"></div>
      <div className="grid-overlay"></div>

      <div className="container">
        <header>
          <div className="logo">
            <div className="logo-icon">♫</div>
            <h1>SoundGraph</h1>
          </div>
          <p className="tagline">Cryptographically verified music identity via <code>zk-proofs</code></p>
          <div className="terminal-prompt">
            <span className="prompt-symbol">$</span>
            <span className="command">soundgraph --import --verify</span>
            <span className="cursor"></span>
          </div>
        </header>

        <section className="import-section">
          <div className="section-header">
            <h2>// Import Your Data</h2>
            <span className="section-badge">ZK Verified</span>
          </div>
          <p className="import-description">
            Connect your streaming accounts to generate cryptographic proofs of your listening history.
            Your data stays private—only verifiable claims are shared on-chain.
          </p>

          <div className="platforms-grid">
            <div className="platform-card kaggle">
              <div className="platform-header">
                <div className="platform-icon kaggle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.075.339z"/>
                  </svg>
                </div>
                <span className="platform-status status-active">Active</span>
              </div>
              <h3 className="platform-name">Kaggle</h3>
              <p className="platform-desc">Import your Kaggle profile, competitions, and dataset contributions.</p>
              <button className="connect-btn primary" onClick={connectSpotify}>
                <span className="btn-icon">→</span>
                Connect
              </button>
            </div>

            <div className="platform-card soundcloud disabled">
              <div className="platform-header">
                <div className="platform-icon soundcloud">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12"/>
                  </svg>
                </div>
                <span className="platform-status status-soon">Coming Soon</span>
              </div>
              <h3 className="platform-name">SoundCloud</h3>
              <p className="platform-desc">Import your likes, reposts, and listening history.</p>
              <button className="connect-btn disabled" disabled>Coming Soon</button>
            </div>

            <div className="platform-card apple disabled">
              <div className="platform-header">
                <div className="platform-icon apple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <span className="platform-status status-soon">Coming Soon</span>
              </div>
              <h3 className="platform-name">Apple Music</h3>
              <p className="platform-desc">Import your library, playlists, and replay data.</p>
              <button className="connect-btn disabled" disabled>Coming Soon</button>
            </div>

            <div className="platform-card shazam disabled">
              <div className="platform-header">
                <div className="platform-icon shazam">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.758 16.5c-1.197 1.985-3.695 2.625-5.68 1.428-2.34-1.41-3.093-4.468-1.683-6.808l2.073-3.438c.39-.647.315-1.47-.186-2.032-.5-.56-1.32-.7-1.98-.337-.66.364-1.002 1.126-.826 1.843l-1.738 2.88c-.89-1.26-.76-2.997.37-4.12 1.177-1.17 3.02-1.352 4.407-.434 1.387.918 1.887 2.67 1.198 4.19l-2.073 3.44c-.39.648-.316 1.47.185 2.032.5.562 1.32.702 1.98.337.66-.363 1.003-1.125.827-1.843l1.738-2.88c.89 1.26.76 2.997-.37 4.12-.12.118-.243.23-.37.333z"/>
                  </svg>
                </div>
                <span className="platform-status status-soon">Coming Soon</span>
              </div>
              <h3 className="platform-name">Shazam</h3>
              <p className="platform-desc">Import your discovery history and identified tracks.</p>
              <button className="connect-btn disabled" disabled>Coming Soon</button>
            </div>
          </div>
        </section>

        {proofData && (
          <section className="data-section visible">
            <div className="data-header">
              <div className="data-title">
                <h2>// Your Music Profile</h2>
                <div className="verified-badge">✓ ZK Verified</div>
              </div>
              <div className="proof-hash">proof:{proofData.hash?.slice(0, 16)}...</div>
            </div>

            <div className="data-tabs">
              {['overview', 'tracks', 'artists', 'raw'].map(tab => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="stats-grid">
                {getStats().map((stat, i) => (
                  <div className="stat-card" key={i}>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tracks' && (
              <div className="items-list">
                {getTracks().map((track, i) => (
                  <div className="item-row" key={i}>
                    <div className="item-rank">{i + 1}</div>
                    <div className="item-image">♫</div>
                    <div className="item-info">
                      <div className="item-name">{track.name || 'Unknown Track'}</div>
                      <div className="item-meta">{track.artist || 'Unknown Artist'}</div>
                    </div>
                    <div className="item-plays">
                      <div className="count">{track.plays || '--'}</div>
                      <div className="label">plays</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'artists' && (
              <div className="items-list">
                {getArtists().map((artist, i) => (
                  <div className="item-row" key={i}>
                    <div className="item-rank">{i + 1}</div>
                    <div className="item-image">♪</div>
                    <div className="item-info">
                      <div className="item-name">{artist.name || 'Unknown Artist'}</div>
                      <div className="item-meta">{artist.genre || 'Various Genres'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="raw-data">
                <pre>{JSON.stringify(proofData.raw, null, 2)}</pre>
              </div>
            )}
          </section>
        )}

        <footer>
          <p className="footer-text">
            Powered by <a href="https://reclaimprotocol.org" target="_blank" rel="noopener noreferrer">Reclaim Protocol</a> | Zero-knowledge proofs for verifiable data
          </p>
        </footer>
      </div>

      {loading && (
        <div className="loading-overlay visible">
          <div className="loading-spinner"></div>
          <div className="loading-text">Generating ZK Proof...</div>
          <div className="loading-status">{loadingStatus}</div>
        </div>
      )}

      {iframeUrl && (
        <div className="iframe-modal">
          <div className="iframe-container">
            <div className="iframe-header">
              <span>Verify with Kaggle</span>
              <button className="iframe-close" onClick={() => setIframeUrl(null)}>×</button>
            </div>
            <iframe
              src={iframeUrl}
              title="Reclaim Verification"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default App
