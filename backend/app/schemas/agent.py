from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class AgentQueryRequest(BaseModel):
    query: str
    engine: Optional[str] = "orchestrate" # "orchestrate", "granite", "ensemble"
    asset_id: Optional[str] = None
    park_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = []

class AgentToolExecution(BaseModel):
    tool_name: str
    agent_name: str
    status: str
    parameters: Dict[str, Any]
    result_summary: str

class AgentQueryResponse(BaseModel):
    query_id: str
    timestamp: datetime
    query: str
    intent: str
    engine_used: Optional[str] = "IBM Watson Orchestrate (Live Cloud)"
    agents_consulted: List[str]
    tools_executed: List[AgentToolExecution]
    granite_reasoning: str
    answer: str
    evidence: Dict[str, Any]
    recommended_actions: List[str]
    response_time_ms: float

class DailyExecutiveSummary(BaseModel):
    generated_at: datetime
    title: str
    summary_markdown: str
    key_metrics: Dict[str, Any]
    high_priority_assets: List[str]
    grid_dispatch_summary: str
