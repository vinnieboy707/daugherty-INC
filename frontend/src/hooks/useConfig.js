import { useState, useEffect } from 'react'
import { configAPI } from '../services/api'

// Cache for config data
let configCache = null
let configPromise = null

export const useConfig = () => {
  const [config, setConfig] = useState(configCache)
  const [loading, setLoading] = useState(!configCache)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchConfig = async () => {
      // If we already have cached data, use it
      if (configCache) {
        setConfig(configCache)
        setLoading(false)
        return
      }

      // If there's already a fetch in progress, wait for it
      if (configPromise) {
        try {
          const data = await configPromise
          setConfig(data)
          setLoading(false)
        } catch (err) {
          setError(err)
          setLoading(false)
        }
        return
      }

      // Start a new fetch
      setLoading(true)
      configPromise = configAPI.getPublic()
        .then(response => {
          const data = response.data.data
          configCache = data
          setConfig(data)
          setLoading(false)
          configPromise = null
          return data
        })
        .catch(err => {
          setError(err)
          setLoading(false)
          configPromise = null
          throw err
        })

      try {
        await configPromise
      } catch (err) {
        // Error already handled above
      }
    }

    fetchConfig()
  }, [])

  return { config, loading, error }
}

// Function to clear cache (useful after admin updates)
export const clearConfigCache = () => {
  configCache = null
  configPromise = null
}
