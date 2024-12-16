from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

from .utils import (
    format_descriptions,
    annotate,
    format_verification_input,
    format_summary_inputs,
)
from .graph.state import GoalVerificationResult, Prediction, Actions, ActionRankings
from .service.prompt import (
    goal_verification_prompt,
    agent_prompt,
    summary_prompt,
    ranking_prompt,
    ux_prompt,
    ux_score,
)
from app.config.config import get_settings
from .graph.utils import (
    format_ranking_inputs,
    format_product_memory,
)

settings = get_settings()

llm = ChatOpenAI(model="gpt-4o", api_key=settings.openai_api_key, temperature=0)

ux_llm = llm.with_structured_output(Actions)
ux_agent = annotate | RunnablePassthrough.assign(
    actions_to_rank=format_product_memory | ux_prompt | ux_llm
)

ux_score_llm = RunnablePassthrough.assign(ux_score=ux_score | llm | StrOutputParser())

ranking_llm = llm.with_structured_output(ActionRankings)
ranking_agent = RunnablePassthrough.assign(
    action_rankings=format_ranking_inputs | ranking_prompt | ranking_llm
)

structured_llm = llm.with_structured_output(Prediction)
agent = RunnablePassthrough.assign(
    prediction=format_descriptions | agent_prompt | structured_llm
)

verification_llm = llm.with_structured_output(GoalVerificationResult)
completion_agent = annotate | RunnablePassthrough.assign(
    goal_verification_result=format_verification_input
    | goal_verification_prompt
    | verification_llm
)

summary_llm = RunnablePassthrough.assign(
    summary=format_summary_inputs | summary_prompt | llm | StrOutputParser()
)
