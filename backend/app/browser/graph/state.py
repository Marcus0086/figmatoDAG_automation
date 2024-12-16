from typing import List, Optional, Annotated, Dict, Any
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from playwright.async_api import Page


class GroundTruth(TypedDict):
    img: str
    description: str


class BBox(TypedDict):
    x: float
    y: float
    width: int
    height: int
    text: str
    type: str
    selector: str


class Prediction(TypedDict):
    action: Annotated[
        str,
        ...,
        "The action to take",
    ]
    rationale: Annotated[str, ..., "The rationale for the action"]
    args: Annotated[Optional[List[str]], ..., "The arguments for the action"]


class GoalVerificationResult(TypedDict):
    is_achieved: bool
    current_state: str
    visual_evidence: str
    notes: str


class RankedAction(TypedDict):
    action: str
    goal_alignment: Dict[str, Any]


class ActionRankings(TypedDict):
    rankings: List[RankedAction]
    confidence: str


class Action(TypedDict):
    action: str


class Actions(TypedDict):
    actions: List[Action]


def ovveride(_, new_value):
    return new_value


class AgentState(TypedDict):
    page: Page
    goal: str
    product_knowledge: str
    ground_truth: GroundTruth
    img: Annotated[str, ovveride]
    before_annotated_img: Annotated[str, ovveride]
    bboxes: Annotated[List[BBox], ovveride]
    prediction: Prediction
    scratchpad: List[BaseMessage]
    observation: str
    goal_verification_result: GoalVerificationResult
    title: str
    product_familiarity: str
    patience: float
    tech_savviness: str
    domain_familiarity: str
    industry_expertise: str
    retry_count: Annotated[int, ovveride]
    action_rankings: Annotated[ActionRankings, ovveride]
    actions_to_rank: Annotated[Actions, ovveride]
    selected_action: Annotated[str, ovveride]
    summary: str
    ux_score: Annotated[str, ovveride]
