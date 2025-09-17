import { NextRequest, NextResponse } from 'next/server'
import { performHealthCheck } from '@/lib/monitoring'

// Health check endpoint for container orchestration
export async function GET(request: NextRequest) {
  try {
    const healthData = await performHealthCheck()

    const response = {
      status: healthData.status,
      timestamp: new Date().toISOString(),
      service: 'personal-guide-web',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: healthData.checks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }

    // Return appropriate HTTP status based on health
    const statusCode = healthData.status === 'healthy' ? 200 :
                      healthData.status === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'personal-guide-web',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}

// Readiness probe - checks if app is ready to receive traffic
export async function HEAD(request: NextRequest) {
  try {
    // Quick readiness check - just verify the app is responding
    return new Response(null, { status: 200 })
  } catch (error) {
    return new Response(null, { status: 503 })
  }
}