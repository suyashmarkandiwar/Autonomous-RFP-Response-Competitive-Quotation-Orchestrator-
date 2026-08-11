from langgraph.graph import StateGraph, START, END
from app.agents.state import GraphState
from app.agents.parser import parse_rfp_node
from app.agents.pricing import pricing_node
from app.agents.drafter import drafter_node

# 1. Initialize the Graph with our State
workflow = StateGraph(GraphState)

# 2. Add the Agent Nodes
workflow.add_node("parser", parse_rfp_node)
workflow.add_node("pricing", pricing_node)
workflow.add_node("drafter", drafter_node)

# 3. Define the Flow (Edges)
workflow.add_edge(START, "parser")
workflow.add_edge("parser", "pricing")
workflow.add_edge("pricing", "drafter")
workflow.add_edge("drafter", END)

# 4. Compile the application
rfp_agent_app = workflow.compile()

# --- TEST BLOCK ---
if __name__ == "__main__":
    test_state = {
        "client_name": "Acme Corp",
        "rfp_text": "We need 50 Enterprise Laptops and 2 Database Servers.",
        "parsed_items": [],
        "pricing_strategy": "",
        "executive_summary": "",
        "pdf_file_path": ""
    }
    
    print("Running Full Multi-Agent Pipeline...")
    final_state = rfp_agent_app.invoke(test_state)
    
    print("\n--- FINAL OUTPUT ---")
    print("\n1. Parsed & Priced Items:")
    for item in final_state["parsed_items"]:
        print(f" - {item['qty']} {item['item_name']} @ ₹{item['quoted_unit_price']} each")
        
    print("\n2. Client Value Points:")
    print(final_state["executive_summary"])