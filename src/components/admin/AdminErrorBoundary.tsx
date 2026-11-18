'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card"
          style={{
            padding: '24px',
            margin: '16px 0',
            border: '1px solid #fecaca',
            background: '#fff5f5',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', margin: 0 }}>
              {this.props.fallbackTitle || 'Component Encountered An Issue'}
            </h3>
          </div>
          <p style={{ fontSize: 13, color: '#7f1d1d', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            {this.state.error?.message || 'A client-side error occurred while rendering this section.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="btn btn-sm btn-outline"
            style={{ borderColor: '#b91c1c', color: '#b91c1c' }}
          >
            ↻ Retry Section
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
