import { useState } from 'react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Mail,
  FileText,
  Video,
  ListChecks,
  Users,
  BarChart3,
  Calendar,
  Clock,
  ExternalLink,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Table,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// AGENT IDS - From workflow
// =============================================================================
const COORDINATOR_AGENT_ID = '696e5915e1e4c42b224b27c2'
const SHEETS_INTELLIGENCE_AGENT_ID = '696e5f39c3a33af8ef063753'

// =============================================================================
// TypeScript Interfaces - Based on ACTUAL test responses
// =============================================================================

interface SentimentData {
  overall: string
  score: number
}

interface DataSource {
  status: string
  data: Record<string, any>
}

interface MetricItem {
  name: string
  value: number
  unit?: string
}

interface KPIItem {
  name: string
  value: number
  target: number
  status: string
}

interface SheetsData {
  metrics: MetricItem[]
  trends: {
    revenue: 'increasing' | 'stable' | 'decreasing'
    engagement: 'increasing' | 'stable' | 'decreasing'
  }
  kpis: KPIItem[]
  data_summary: {
    total_records: number
    date_range: string
    key_findings: string[]
  }
}

interface CoordinatorResult {
  customer_name: string
  health_score: number
  health_trend: string
  overall_sentiment: {
    score: number
    label: string
  }
  data_sources: {
    slack: DataSource
    email: DataSource
    documents: DataSource
    meetings: DataSource
    jira: DataSource
    sheets: DataSource
  }
  recent_communications: any[]
  project_status: any[]
  open_issues: any[]
  action_items: any[]
}

// =============================================================================
// Sample Data for Initial Display
// =============================================================================

const SAMPLE_CUSTOMERS = [
  {
    id: 'acme-corp',
    name: 'Acme Corp',
    industry: 'Technology',
    health_score: 78,
    trend: 'up',
    last_contact: '2024-01-15',
    sentiment: 'positive',
  },
  {
    id: 'techstart-inc',
    name: 'TechStart Inc',
    industry: 'SaaS',
    health_score: 45,
    trend: 'down',
    last_contact: '2024-01-10',
    sentiment: 'neutral',
  },
  {
    id: 'global-solutions',
    name: 'Global Solutions Ltd',
    industry: 'Enterprise',
    health_score: 92,
    trend: 'stable',
    last_contact: '2024-01-17',
    sentiment: 'positive',
  },
]

const SAMPLE_COMMUNICATIONS = [
  {
    id: 1,
    source: 'slack',
    type: 'message',
    date: '2024-01-15T10:30:00',
    snippet: 'Discussed Q1 roadmap and feature priorities',
    sentiment: 'positive',
  },
  {
    id: 2,
    source: 'email',
    type: 'email',
    date: '2024-01-14T14:20:00',
    snippet: 'Follow-up on implementation timeline concerns',
    sentiment: 'neutral',
  },
  {
    id: 3,
    source: 'meeting',
    type: 'video_call',
    date: '2024-01-12T09:00:00',
    snippet: 'Weekly sync - Product demo and feedback session',
    sentiment: 'positive',
  },
]

const SAMPLE_PROJECTS = [
  {
    id: 1,
    name: 'Phase 2 Integration',
    progress: 75,
    status: 'on_track',
    due_date: '2024-02-15',
  },
  {
    id: 2,
    name: 'Custom Dashboard Development',
    progress: 40,
    status: 'at_risk',
    due_date: '2024-02-28',
  },
]

const SAMPLE_ISSUES = [
  {
    id: 'JIRA-1234',
    title: 'API response time degradation',
    priority: 'high',
    status: 'open',
    sla_status: 'compliant',
  },
  {
    id: 'JIRA-1235',
    title: 'Dashboard loading issue on mobile',
    priority: 'medium',
    status: 'in_progress',
    sla_status: 'at_risk',
  },
]

const SAMPLE_ACTION_ITEMS = [
  {
    id: 1,
    task: 'Schedule Q1 business review meeting',
    owner: 'John Smith',
    due_date: '2024-01-25',
    source: 'email',
  },
  {
    id: 2,
    task: 'Provide updated documentation for API v2',
    owner: 'Sarah Johnson',
    due_date: '2024-01-22',
    source: 'slack',
  },
]

// =============================================================================
// Helper Components
// =============================================================================

function CustomerListItem({ customer, isSelected, onClick }: any) {
  const healthColor =
    customer.health_score >= 80
      ? 'text-green-500'
      : customer.health_score >= 60
        ? 'text-amber-500'
        : 'text-red-500'

  const TrendIcon =
    customer.trend === 'up'
      ? TrendingUp
      : customer.trend === 'down'
        ? TrendingDown
        : null

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-colors border',
        isSelected
          ? 'bg-slate-800 border-blue-500'
          : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{customer.name}</h3>
          <Badge variant="outline" className="mt-1 text-xs">
            {customer.industry}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('font-bold text-lg', healthColor)}>
            {customer.health_score}
          </span>
          {TrendIcon && <TrendIcon className={cn('h-4 w-4', healthColor)} />}
        </div>
      </div>
      <div className="text-xs text-slate-400">
        Last contact: {customer.last_contact}
      </div>
    </div>
  )
}

function HealthScoreGauge({ score, trend }: { score: number; trend: string }) {
  const color =
    score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'
  const bgColor =
    score >= 80
      ? 'bg-green-500/20'
      : score >= 60
        ? 'bg-amber-500/20'
        : 'bg-red-500/20'

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div
          className={cn(
            'w-32 h-32 rounded-full flex items-center justify-center',
            bgColor
          )}
        >
          <div className="text-center">
            <div className={cn('text-4xl font-bold', color)}>{score}</div>
            <div className="text-xs text-slate-400 mt-1">Health Score</div>
          </div>
        </div>
        {TrendIcon && (
          <div className="absolute -top-2 -right-2">
            <div className={cn('p-2 rounded-full', bgColor)}>
              <TrendIcon className={cn('h-5 w-5', color)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CommunicationItem({ comm }: any) {
  const sourceIcons = {
    slack: MessageSquare,
    email: Mail,
    document: FileText,
    meeting: Video,
    jira: ListChecks,
  }

  const Icon = sourceIcons[comm.source as keyof typeof sourceIcons] || MessageSquare

  const sentimentColor =
    comm.sentiment === 'positive'
      ? 'text-green-500'
      : comm.sentiment === 'negative'
        ? 'text-red-500'
        : 'text-slate-400'

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
      <div className="pt-1">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{comm.snippet}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(comm.date).toLocaleDateString()}
          </span>
          <span className={sentimentColor}>
            {comm.sentiment}
          </span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function Home() {
  const [selectedCustomer, setSelectedCustomer] = useState(SAMPLE_CUSTOMERS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentResponse, setAgentResponse] = useState<CoordinatorResult | null>(null)
  const [dateRange, setDateRange] = useState('30d')

  // Sample data for display (will be replaced by agent response)
  const displayData = agentResponse || {
    customer_name: selectedCustomer.name,
    health_score: selectedCustomer.health_score,
    health_trend: selectedCustomer.trend,
    overall_sentiment: {
      score: selectedCustomer.sentiment === 'positive' ? 0.8 : 0.5,
      label: selectedCustomer.sentiment,
    },
    data_sources: {
      slack: { status: 'sample', data: {} },
      email: { status: 'sample', data: {} },
      documents: { status: 'sample', data: {} },
      meetings: { status: 'sample', data: {} },
      jira: { status: 'sample', data: {} },
      sheets: {
        status: 'sample',
        data: {
          metrics: [
            { name: 'Monthly Revenue', value: 45000, unit: 'USD' },
            { name: 'Engagement Score', value: 8.2, unit: '/10' },
            { name: 'Active Users', value: 1250, unit: 'users' },
          ],
          trends: { revenue: 'increasing', engagement: 'stable' },
          kpis: [
            { name: 'Revenue Growth', value: 12, target: 10, status: 'on-track' },
            { name: 'User Retention', value: 94, target: 90, status: 'on-track' },
            { name: 'Product Adoption', value: 78, target: 85, status: 'at-risk' },
          ],
          data_summary: {
            total_records: 156,
            date_range: '2024-01-01 to 2024-12-31',
            key_findings: [
              'Revenue increased 12% YoY',
              'Engagement stable at 8.2/10',
              'User base grew by 23% this quarter',
            ],
          },
        },
      },
    },
    recent_communications: SAMPLE_COMMUNICATIONS,
    project_status: SAMPLE_PROJECTS,
    open_issues: SAMPLE_ISSUES,
    action_items: SAMPLE_ACTION_ITEMS,
  }

  const handleAnalyzeCustomer = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await callAIAgent(
        `Analyze complete customer intelligence for ${selectedCustomer.name}. Gather data from all sources: Slack conversations, email threads, documents, meeting notes, and Jira tickets. Provide a comprehensive 360° view including health score, sentiment analysis, recent communications, project status, open issues, and action items.`,
        COORDINATOR_AGENT_ID
      )

      if (result.success && result.response.status === 'success') {
        setAgentResponse(result.response.result as CoordinatorResult)
      } else {
        setError(result.response.message || result.error || 'Analysis failed')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = SAMPLE_CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableSources = Object.entries(displayData.data_sources).filter(
    ([_, source]) => source.status === 'available' || source.status === 'sample'
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Customer Intelligence Dashboard
                </h1>
                <p className="text-sm text-slate-400">360° Customer View</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Left Sidebar - Customer List */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/30 backdrop-blur">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                Quick Filters
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-800"
                >
                  All
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-800 text-green-400 border-green-500/50"
                >
                  Healthy
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-800 text-red-400 border-red-500/50"
                >
                  At Risk
                </Badge>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <CustomerListItem
                    key={customer.id}
                    customer={customer}
                    isSelected={selectedCustomer.id === customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Top Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAnalyzeCustomer}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Analyze Customer
                    </>
                  )}
                </Button>
                <div className="text-sm text-slate-400">
                  {loading && 'Gathering intelligence from 6 sources...'}
                  {agentResponse && `Data sources: ${availableSources}/6 available`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Date Range:</span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-white"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold">Analysis Error</p>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Dashboard Grid - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Header Card */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-2xl">
                        {displayData.customer_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{selectedCustomer.industry}</Badge>
                        <span className="text-slate-400">
                          Last contact: {selectedCustomer.last_contact}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge
                      className={cn(
                        'text-sm',
                        displayData.health_score >= 80
                          ? 'bg-green-500/20 text-green-400 border-green-500/50'
                          : displayData.health_score >= 60
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                            : 'bg-red-500/20 text-red-400 border-red-500/50'
                      )}
                    >
                      {displayData.health_score >= 80
                        ? 'Healthy'
                        : displayData.health_score >= 60
                          ? 'Stable'
                          : 'At Risk'}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Health Score Card */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <HealthScoreGauge
                    score={displayData.health_score}
                    trend={displayData.health_trend}
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Engagement</span>
                      <span className="text-white font-semibold">
                        {displayData.health_score >= 80 ? 'High' : 'Medium'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Sentiment</span>
                      <span className="text-white font-semibold capitalize">
                        {displayData.overall_sentiment.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Trend</span>
                      <span className="text-white font-semibold capitalize">
                        {displayData.health_trend}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sentiment Analysis Panel */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sentiment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Overall Sentiment</span>
                        <span className="text-white font-semibold">
                          {(displayData.overall_sentiment.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={displayData.overall_sentiment.score * 100}
                        className="h-2"
                      />
                    </div>

                    <Separator className="bg-slate-700" />

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-300">
                        By Source
                      </h4>
                      {Object.entries(displayData.data_sources).map(
                        ([source, data]) => (
                          <div key={source}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-400 capitalize flex items-center gap-2">
                                {source === 'slack' && (
                                  <MessageSquare className="h-3 w-3" />
                                )}
                                {source === 'email' && <Mail className="h-3 w-3" />}
                                {source === 'documents' && (
                                  <FileText className="h-3 w-3" />
                                )}
                                {source === 'meetings' && <Video className="h-3 w-3" />}
                                {source === 'jira' && <ListChecks className="h-3 w-3" />}
                                {source === 'sheets' && <Table className="h-3 w-3 text-purple-400" />}
                                {source}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  data.status === 'available' ||
                                    data.status === 'sample'
                                    ? 'text-green-400 border-green-500/50'
                                    : 'text-slate-500 border-slate-600'
                                )}
                              >
                                {data.status === 'sample'
                                  ? 'sample'
                                  : data.status}
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Google Sheets Metrics & KPIs */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Table className="h-5 w-5 text-purple-400" />
                    Google Sheets Metrics
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Key performance indicators and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {displayData.data_sources.sheets?.data && (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">
                          Key Metrics
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          {Array.isArray((displayData.data_sources.sheets.data as SheetsData)?.metrics) &&
                            (displayData.data_sources.sheets.data as SheetsData).metrics.map(
                            (metric, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-slate-900/50 border border-slate-700"
                              >
                                <p className="text-xs text-slate-400 mb-1">
                                  {metric.name}
                                </p>
                                <p className="text-lg font-bold text-white">
                                  {metric.unit === 'USD'
                                    ? `$${metric.value.toLocaleString()}`
                                    : metric.value.toLocaleString()}
                                  {metric.unit && metric.unit !== 'USD' && (
                                    <span className="text-xs text-slate-400 ml-1">
                                      {metric.unit}
                                    </span>
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Trends */}
                      {(displayData.data_sources.sheets.data as SheetsData)?.trends && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">
                          Trends
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                            <span className="text-sm text-slate-400">Revenue</span>
                            <div className="flex items-center gap-1">
                              {(displayData.data_sources.sheets.data as SheetsData)
                                .trends.revenue === 'increasing' && (
                                <ArrowUp className="h-4 w-4 text-green-400" />
                              )}
                              {(displayData.data_sources.sheets.data as SheetsData)
                                .trends.revenue === 'decreasing' && (
                                <ArrowDown className="h-4 w-4 text-red-400" />
                              )}
                              {(displayData.data_sources.sheets.data as SheetsData)
                                .trends.revenue === 'stable' && (
                                <Minus className="h-4 w-4 text-slate-400" />
                              )}
                              <span
                                className={cn(
                                  'text-sm font-semibold capitalize',
                                  (displayData.data_sources.sheets.data as SheetsData)
                                    .trends.revenue === 'increasing' &&
                                    'text-green-400',
                                  (displayData.data_sources.sheets.data as SheetsData)
                                    .trends.revenue === 'decreasing' &&
                                    'text-red-400',
                                  (displayData.data_sources.sheets.data as SheetsData)
                                    .trends.revenue === 'stable' &&
                                    'text-slate-400'
                                )}
                              >
                                {
                                  (displayData.data_sources.sheets.data as SheetsData)
                                    .trends.revenue
                                }
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                            <span className="text-sm text-slate-400">
                              Engagement
                            </span>
                            <div className="flex items-center gap-1">
                              {(displayData.data_sources.sheets.data as SheetsData)
                                .trends.engagement === 'increasing' && (
                                <ArrowUp className="h-4 w-4 text-green-400" />
                              )}
                              {(displayData.data_sources.sheets.data as SheetsData)
                                .trends.engagement === 'decreasing' && (
                                <ArrowDown className="h-4 w-4 text-red-400" />
                              )}
                              {(displayData.data_sources.sheets.data as SheetsData)
                                .trends.engagement === 'stable' && (
                                <Minus className="h-4 w-4 text-slate-400" />
                              )}
                              <span
                                className={cn(
                                  'text-sm font-semibold capitalize',
                                  (displayData.data_sources.sheets.data as SheetsData)
                                    .trends.engagement === 'increasing' &&
                                    'text-green-400',
                                  (displayData.data_sources.sheets.data as SheetsData)
                                    .trends.engagement === 'decreasing' &&
                                    'text-red-400',
                                  (displayData.data_sources.sheets.data as SheetsData)
                                    .trends.engagement === 'stable' &&
                                    'text-slate-400'
                                )}
                              >
                                {
                                  (displayData.data_sources.sheets.data as SheetsData)
                                    .trends.engagement
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      )}

                      {/* KPIs */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">
                          KPIs
                        </h4>
                        <div className="space-y-3">
                          {Array.isArray((displayData.data_sources.sheets.data as SheetsData)?.kpis) &&
                            (displayData.data_sources.sheets.data as SheetsData).kpis.map(
                            (kpi, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-300">{kpi.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold">
                                      {kpi.value}
                                    </span>
                                    <span className="text-slate-500">/</span>
                                    <span className="text-slate-400">
                                      {kpi.target}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={(kpi.value / kpi.target) * 100}
                                    className="h-1.5"
                                  />
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      kpi.status === 'on-track'
                                        ? 'text-green-400 border-green-500/50'
                                        : kpi.status === 'at-risk'
                                          ? 'text-amber-400 border-amber-500/50'
                                          : 'text-red-400 border-red-500/50'
                                    )}
                                  >
                                    {kpi.status === 'on-track'
                                      ? 'On Track'
                                      : kpi.status === 'at-risk'
                                        ? 'At Risk'
                                        : 'Behind'}
                                  </Badge>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Data Summary */}
                      {(displayData.data_sources.sheets.data as SheetsData)
                        .data_summary && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-3">
                            Data Summary
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm p-2 rounded bg-slate-900/50">
                              <span className="text-slate-400">Total Records</span>
                              <span className="text-white font-semibold">
                                {(
                                  displayData.data_sources.sheets
                                    .data as SheetsData
                                ).data_summary.total_records.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm p-2 rounded bg-slate-900/50">
                              <span className="text-slate-400">Date Range</span>
                              <span className="text-white text-xs">
                                {
                                  (
                                    displayData.data_sources.sheets
                                      .data as SheetsData
                                  ).data_summary.date_range
                                }
                              </span>
                            </div>
                            {Array.isArray((displayData.data_sources.sheets.data as SheetsData)
                              ?.data_summary?.key_findings) &&
                              (displayData.data_sources.sheets.data as SheetsData)
                              .data_summary.key_findings.length > 0 && (
                              <div className="p-2 rounded bg-slate-900/50">
                                <p className="text-xs text-slate-400 mb-2">
                                  Key Findings:
                                </p>
                                <ul className="space-y-1">
                                  {(
                                    displayData.data_sources.sheets
                                      .data as SheetsData
                                  ).data_summary.key_findings.map(
                                    (finding, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-slate-300 flex items-start gap-2"
                                      >
                                        <span className="text-purple-400 mt-0.5">
                                          •
                                        </span>
                                        <span>{finding}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Communication Timeline */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Communications
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Last 30 days of interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-3">
                      {displayData.recent_communications.length > 0 ? (
                        displayData.recent_communications.map((comm) => (
                          <CommunicationItem key={comm.id} comm={comm} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No recent communications</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Project & Deliverables Section */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    Projects & Deliverables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayData.project_status.length > 0 ? (
                      displayData.project_status.map((project) => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {project.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                Due: {project.due_date}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                project.status === 'on_track'
                                  ? 'text-green-400 border-green-500/50'
                                  : project.status === 'at_risk'
                                    ? 'text-amber-400 border-amber-500/50'
                                    : 'text-red-400 border-red-500/50'
                              )}
                            >
                              {project.status === 'on_track'
                                ? 'On Track'
                                : project.status === 'at_risk'
                                  ? 'At Risk'
                                  : 'Delayed'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={project.progress} className="h-2" />
                            <span className="text-xs text-slate-400 min-w-[3rem]">
                              {project.progress}%
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No active projects</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Issues & Support Panel */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Issues & Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayData.open_issues.length > 0 ? (
                      displayData.open_issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="p-3 rounded-lg bg-slate-900/50 border border-slate-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">
                                {issue.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {issue.id}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                issue.priority === 'high'
                                  ? 'text-red-400 border-red-500/50'
                                  : issue.priority === 'medium'
                                    ? 'text-amber-400 border-amber-500/50'
                                    : 'text-slate-400 border-slate-600'
                              )}
                            >
                              {issue.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {issue.status}
                            </Badge>
                            {issue.sla_status === 'compliant' ? (
                              <div className="flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                SLA Compliant
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-amber-400">
                                <AlertTriangle className="h-3 w-3" />
                                SLA At Risk
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No open issues</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Items Section - Full Width */}
            <Card className="bg-slate-800/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Action Items
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Aggregated to-dos from all sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayData.action_items.length > 0 ? (
                    displayData.action_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                          />
                          <div>
                            <p className="text-sm text-white">{item.task}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {item.owner}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {item.due_date}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {item.source}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No pending action items</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
