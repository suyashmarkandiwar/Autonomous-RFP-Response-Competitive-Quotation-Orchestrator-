from app.agents.state import DrafterState
from langgraph.graph import StateGraph, START, END
from app.agents.state import AnalysisState
from app.agents.parser import parse_rfp_node
from app.agents.pricing import pricing_node
from app.agents.drafter import drafter_node


# GRAPH 1: Analysis (Used in /analyze)
# ==========================================
analysis_workflow = StateGraph(AnalysisState)

analysis_workflow.add_node("parser", parse_rfp_node)
analysis_workflow.add_node("pricing", pricing_node)

analysis_workflow.add_edge(START, "parser")
analysis_workflow.add_edge("parser", "pricing")
analysis_workflow.add_edge("pricing", END)

# Compile Graph 1
analysis_app = analysis_workflow.compile()

# ==========================================
# GRAPH 2: Generation (Used in /approve-and-generate)
# ==========================================
generation_workflow = StateGraph(DrafterState)

generation_workflow.add_node("drafter", drafter_node)

generation_workflow.add_edge(START, "drafter")
generation_workflow.add_edge("drafter", END)

# Compile Graph 2
generation_app = generation_workflow.compile()