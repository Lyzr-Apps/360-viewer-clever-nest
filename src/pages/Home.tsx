import { useState, useRef, useEffect } from 'react'
import { callAIAgent } from '@/utils/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send,
  Loader2,
  MessageSquare,
  Bot,
  User,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// AGENT IDS - From workflow
// =============================================================================
const COORDINATOR_AGENT_ID = '6973547b1b6268d7b95129f9'

// =============================================================================
// TypeScript Interfaces
// =============================================================================

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// =============================================================================
// Main Component
// =============================================================================

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Customer Intelligence Assistant. I can help you analyze customer data from Slack, Gmail, Google Docs, Meeting Notes, Jira, Google Sheets, and Google Drive. Ask me anything about your customers!',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const result = await callAIAgent(input.trim(), COORDINATOR_AGENT_ID)

      let assistantContent = ''

      if (result.success && result.response) {
        // Try to extract meaningful content from the response
        if (typeof result.response === 'string') {
          assistantContent = result.response
        } else if (result.response.result) {
          // Format the structured response nicely
          assistantContent = formatAgentResponse(result.response.result)
        } else if (result.response.message) {
          assistantContent = result.response.message
        } else {
          assistantContent = JSON.stringify(result.response, null, 2)
        }
      } else {
        assistantContent = result.error || 'I encountered an error processing your request. Please try again.'
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered a network error. Please check your connection and try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatAgentResponse = (data: any): string => {
    if (!data) return 'No data available.'

    let formatted = ''

    // Customer name
    if (data.customer_name) {
      formatted += `**Customer: ${data.customer_name}**\n\n`
    }

    // Health score
    if (data.health_score !== undefined) {
      const healthEmoji = data.health_score >= 80 ? '🟢' : data.health_score >= 60 ? '🟡' : '🔴'
      formatted += `Health Score: ${data.health_score}/100 (${data.health_trend || 'stable'})\n\n`
    }

    // Sentiment
    if (data.overall_sentiment) {
      formatted += `Overall Sentiment: ${data.overall_sentiment.label || 'neutral'} (${data.overall_sentiment.score || 0})\n\n`
    }

    // Data sources status
    if (data.data_sources) {
      formatted += `**Data Sources:**\n`
      Object.entries(data.data_sources).forEach(([source, info]: [string, any]) => {
        const status = info.status === 'available' ? 'Available' : 'Unavailable'
        const sourceName = source === 'googledrive' ? 'Google Drive' : source.charAt(0).toUpperCase() + source.slice(1)
        formatted += `- ${sourceName}: ${status}\n`
      })
      formatted += '\n'
    }

    // Google Drive insights
    if (data.data_sources?.googledrive?.data) {
      const driveData = data.data_sources.googledrive.data
      if (driveData.total_files) {
        formatted += `**Google Drive Files: ${driveData.total_files}**\n`
        if (driveData.file_types) {
          formatted += `- Documents: ${driveData.file_types.documents || 0}\n`
          formatted += `- Spreadsheets: ${driveData.file_types.spreadsheets || 0}\n`
          formatted += `- Presentations: ${driveData.file_types.presentations || 0}\n`
        }
        if (driveData.collaboration_score !== undefined) {
          formatted += `- Collaboration Score: ${driveData.collaboration_score}/100\n`
        }
        formatted += '\n'
      }

      if (Array.isArray(driveData.recent_files) && driveData.recent_files.length > 0) {
        formatted += `**Recent Drive Files:**\n`
        driveData.recent_files.slice(0, 5).forEach((file: any, i: number) => {
          formatted += `${i + 1}. ${file.name || 'File'} (${file.type || 'unknown'})\n`
        })
        formatted += '\n'
      }

      if (Array.isArray(driveData.key_insights) && driveData.key_insights.length > 0) {
        formatted += `**Drive Insights:**\n`
        driveData.key_insights.forEach((insight: string, i: number) => {
          formatted += `- ${insight}\n`
        })
        formatted += '\n'
      }
    }

    // Recent communications
    if (data.recent_communications && data.recent_communications.length > 0) {
      formatted += `**Recent Communications (${data.recent_communications.length}):**\n`
      data.recent_communications.slice(0, 3).forEach((comm: any, i: number) => {
        formatted += `${i + 1}. ${comm.snippet || comm.message || 'Communication'}\n`
      })
      formatted += '\n'
    }

    // Projects
    if (data.project_status && data.project_status.length > 0) {
      formatted += `**Active Projects (${data.project_status.length}):**\n`
      data.project_status.forEach((project: any, i: number) => {
        formatted += `${i + 1}. ${project.name || 'Project'} - ${project.status || 'unknown'} (${project.progress || 0}%)\n`
      })
      formatted += '\n'
    }

    // Open issues
    if (data.open_issues && data.open_issues.length > 0) {
      formatted += `**Open Issues (${data.open_issues.length}):**\n`
      data.open_issues.slice(0, 3).forEach((issue: any, i: number) => {
        formatted += `${i + 1}. ${issue.title || issue.id || 'Issue'} - ${issue.priority || 'normal'} priority\n`
      })
      formatted += '\n'
    }

    // Action items
    if (data.action_items && data.action_items.length > 0) {
      formatted += `**Action Items (${data.action_items.length}):**\n`
      data.action_items.slice(0, 5).forEach((item: any, i: number) => {
        formatted += `${i + 1}. ${item.task || item.title || 'Task'} (${item.owner || 'unassigned'})\n`
      })
      formatted += '\n'
    }

    return formatted.trim() || 'Analysis complete. No specific insights available at this time.'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Customer Intelligence Assistant
              </h1>
              <p className="text-sm text-slate-400">
                Ask me anything about your customers
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex flex-col h-[calc(100vh-88px)]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                )}

                <Card
                  className={cn(
                    'max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-slate-800/50 border-slate-700'
                  )}
                >
                  <CardContent className="p-4">
                    <div
                      className={cn(
                        'text-sm whitespace-pre-wrap',
                        message.role === 'user' ? 'text-white' : 'text-slate-200'
                      )}
                    >
                      {message.content}
                    </div>
                    <div
                      className={cn(
                        'text-xs mt-2',
                        message.role === 'user'
                          ? 'text-blue-200'
                          : 'text-slate-500'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing customer data...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about a customer (e.g., 'Analyze Acme Corp' or 'Show me open issues for TechStart')"
                className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Examples: "Analyze customer Acme Corp" • "What are the open issues?" • "Show Google Drive files" • "List recent communications"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
