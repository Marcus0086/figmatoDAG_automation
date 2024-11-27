from typing import List, Optional, Annotated
from typing_extensions import TypedDict

from langchain_core.messages import BaseMessage
from playwright.async_api import Page


class BBox(TypedDict):
    x: float
    y: float
    text: str
    type: str
    ariaLabel: str


class Prediction(TypedDict):
    action: Annotated[
        str,
        ...,
        "The action to take",
    ]
    rationale: Annotated[str, ..., "The rationale for the action"]
    args: Annotated[Optional[List[str]], ..., "The arguments for the action"]


class Evidence(TypedDict):
    visual_confirmation: str
    state_changes: str
    missing_elements: str


class GoalVerificationResult(TypedDict):
    is_achieved: bool


class AgentState(TypedDict):
    page: Page
    input: str
    img: str
    before_annotated_img: str
    bboxes: List[BBox]
    prediction: Prediction
    scratchpad: List[BaseMessage]
    observation: str
    goal_verification_result: GoalVerificationResult
    title: str
    product_familiarity: float
    patience: float
    tech_savviness: float
