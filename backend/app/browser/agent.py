from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser


from .utils import format_descriptions, annotate
from .graph.state import GoalVerificationResult, Prediction
from .service.prompt import goal_verification_prompt, agent_prompt, summary_prompt
from app.config.config import get_settings

settings = get_settings()


prompt = agent_prompt
llm = ChatOpenAI(model="gpt-4o", api_key=settings.openai_api_key)

structured_llm = llm.with_structured_output(Prediction)
agent = annotate | RunnablePassthrough.assign(
    prediction=format_descriptions | prompt | structured_llm
)


structured_llm = llm.with_structured_output(GoalVerificationResult)

completion_agent = annotate | RunnablePassthrough.assign(
    goal_verification_result=format_descriptions
    | goal_verification_prompt
    | structured_llm
)


summary_llm = summary_prompt | llm | StrOutputParser()
