from langchain_core.prompts import (
    PromptTemplate,
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
    HumanMessagePromptTemplate,
)
from langchain_core.prompts.image import ImagePromptTemplate

from langchain_core.prompts import (
    PromptTemplate,
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
    HumanMessagePromptTemplate,
)
from langchain_core.prompts.image import ImagePromptTemplate


ux_prompt = ChatPromptTemplate(
    messages=[
        SystemMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template(
                    """You are a UX agent expert. You will be provided a screenshot of a webapp annotated with bounding boxes. You need to extract all possible actions a user can take, these actions can include: click, hover, select text, type, move away, etc as a list. 
Make the list exhaustive for each category. Separately rank the screenshot on information density."""
                ),
                PromptTemplate.from_template("""\n{product_memory}\n"""),
            ]
        ),
        HumanMessagePromptTemplate(
            prompt=[
                ImagePromptTemplate(
                    template={"url": "{img}"},
                    input_variables=["img"],
                    template_format="f-string",
                    additional_content_fields={"image_url": {"url": "{img}"}},
                ),
            ],
        ),
    ],
    input_variables=[
        "img",
        "product_memory",
    ],
)


ux_score = ChatPromptTemplate(
    messages=[
        SystemMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template(
                    """Please analyze the given screenshot as an experienced UX designer with deep knowledge of cognitive psychology and human-computer interaction principles. Evaluate the interface across the following dimensions:
1. Information Density Analysis

Assess the visual hierarchy and spacing between elements
Evaluate content-to-whitespace ratio
Identify areas of potential cognitive overload
Rate the overall information density on a scale of 1-10 (1 being too sparse, 10 being overwhelming)
Provide specific recommendations for optimizing information presentation

2. Mental Model Alignment (Jakob's Law)

Identify interface patterns that align with common web conventions
Note any elements that deviate from established patterns
Evaluate how the design leverages users' existing knowledge
List specific examples where the interface:

Successfully builds on familiar patterns
Misses opportunities to use conventional patterns
Creates unnecessary cognitive load through novel patterns


Rate the mental model alignment on a scale of 1-10

3. Choice Complexity (Hick's Law)

Count the number of interactive elements visible at once
Analyze the decision-making burden on users
Evaluate the organization of choices into logical groups
Assess the clarity of available options
Rate the choice architecture on a scale of 1-10 (1 being confusing, 10 being clear and manageable)

Summary
Provide an executive summary that includes:

Overall UX score (average of the three ratings)
Top 3 strengths
Top 3 areas for improvement
Prioritized list of actionable recommendations

Please support all observations with specific examples from the screenshot and reference relevant UX research or best practices where applicable.
"""
                )
            ]
        ),
        HumanMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template("""The screenshot:\n"""),
                ImagePromptTemplate(
                    template={"url": "{img}"},
                    input_variables=["img"],
                    template_format="f-string",
                    additional_content_fields={"image_url": {"url": "{img}"}},
                ),
            ]
        ),
    ],
    input_variables=["img"],
)


ranking_prompt = ChatPromptTemplate(
    messages=[
        SystemMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template(
                    "You are a human. You are given a webapp screenshot, a list of actions you can possibly take and your goal."
                ),
                PromptTemplate.from_template("""\n{product_memory}\n"""),
                PromptTemplate.from_template(
                    "Based on the information you have, you will rank the top 10 actions you think are the right ones to achieve your goal. Never repeat an action that was already successful in the previous actions available."
                ),
                PromptTemplate.from_template(
                    """- Goal: {goal}
- Available Actions: \n {available_actions}"""
                ),
            ]
        ),
        MessagesPlaceholder(optional=True, variable_name="scratchpad"),
        HumanMessagePromptTemplate(
            prompt=[
                ImagePromptTemplate(
                    template={"url": "{img}"},
                    input_variables=["img"],
                    template_format="f-string",
                    additional_content_fields={"image_url": {"url": "{img}"}},
                ),
            ],
        ),
    ],
    input_variables=[
        "img",
        "goal",
        "product_memory",
        "bbox_descriptions",
        "available_actions",
    ],
    partial_variables={"scratchpad": []},
)


agent_prompt = ChatPromptTemplate(
    messages=[
        SystemMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template(
                    """You are a web browsing agent. Your job is to perform the user's sub-goal by providing the precise browser action needed. Take a deep breath and calm yourselves, I know you can do it.

IMPORTANT CONTEXT:
Each screenshot you receive has Numerical Labels placed in the TOP LEFT corner of each Web Element.
These labels are your primary means of identifying and interacting with elements.

IMPORTANT RULES:
1. Focus solely on executing the current sub-goal.
2. Handle pop-ups or cookie notices first if they block the main content.
3. Use the minimal number of steps required.
4. Reference elements by their Numerical Labels.
5. If help or documentation elements are available and relevant, prioritize reading them first.

Valid actions are:
- "SelectText": args = [Numerical_Label] # Select the text from the element with the given numerical label
- "ClickAnywhere": args = [] # this would be super helpful for you to close any open dropdown or modals to access elements under them.
- "Click": args = [Numerical_Label]
- "Type": args = [Numerical_Label, "Content/Query"]
- "Scroll": args = [Numerical_Label or "WINDOW", "up" or "down"]
- "Wait": args = []
- "GoBack": args = []
- "Google": args = ["Query"]

RATIONALE GUIDELINES:
1. Always write in first person ("I am...", "I need to...", "I see...")
2. Explain your reasoning process clearly
3. Reference specific elements you're interacting with
4. Connect your action to the overall goal
5. Mention any relevant observations
6. Explain why this action is necessary now
7. Include what you expect to happen next

ACTION GUIDELINES:
- Be concise and focus on the immediate action.
- Do not include unnecessary information.
- Do not mention the user's attributes; they have already been considered.
_ Never repeat a successful previous action.
"""
                ),
                PromptTemplate.from_template("""\n{product_memory}\n"""),
            ],
        ),
        MessagesPlaceholder(optional=True, variable_name="scratchpad"),
        HumanMessagePromptTemplate(
            prompt=[
                ImagePromptTemplate(
                    template={"url": "{img}"},
                    input_variables=["img"],
                    template_format="f-string",
                    additional_content_fields={"image_url": {"url": "{img}"}},
                ),
                PromptTemplate.from_template(
                    """Available Elements (with their Numerical Labels):
{bbox_descriptions}

Main goal: {goal}

Current Goal to Achieve:
{selected_action}"""
                ),
            ],
        ),
    ],
    input_variables=[
        "bbox_descriptions",
        "img",
        "selected_action",
        "goal",
        "product_memory",
    ],
    partial_variables={"scratchpad": []},
)

goal_verification_prompt = ChatPromptTemplate(
    messages=[
        SystemMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template(
                    """You are a UX Expert. You will be provided a screenshot representing the current state of an app and the last user action which has led to the current state. You will also be provided the goal of the user journey
You need to determine if the goal has been achieved. Be as conservative as possible in determining success. Don't guess anything.
You will also be provided an image what goal/success looks like. 
"""
                ),
            ],
        ),
        HumanMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template("How the goal/success looks like\n"),
                PromptTemplate.from_template("""{description}"""),
                ImagePromptTemplate(
                    template={"url": "{ground_truth_image}"},
                    input_variables=[
                        "ground_truth_image",
                    ],
                    template_format="f-string",
                    additional_content_fields={
                        "image_url": {"url": "{ground_truth_image}"}
                    },
                ),
            ],
        ),
        HumanMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template("""Current Goal: {goal}\n"""),
                PromptTemplate.from_template("""{previous_actions}"""),
                PromptTemplate.from_template("Current state:"),
                ImagePromptTemplate(
                    template={"url": "{before_annotated_img}"},
                    input_variables=["before_annotated_img"],
                    template_format="f-string",
                    additional_content_fields={
                        "image_url": {"url": "{before_annotated_img}"}
                    },
                ),
            ],
        ),
    ],
    input_variables=[
        "before_annotated_img",
        "goal",
        "previous_actions",
        "ground_truth_image",
        "description",
    ],
)


summary_prompt = ChatPromptTemplate(
    messages=[
        SystemMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template(
                    """You are a human who used the product and accomplished the goal. 
Compare your experience with similar user journeys in other products. 
Give me a G2 style review of your experience using the product. 
How tough was it to complete the journey? 
How would you improve the experiences? 
The overall review should be less than 500 characters. 
Abstract the user review, dont talk about bounding boxes"""
                )
            ]
        ),
        HumanMessagePromptTemplate(
            prompt=[
                PromptTemplate.from_template(
                    """User Journey Goal: {goal}

**Actions I Took and Their Effectiveness**: \n
{previous_actions}"""
                ),
            ],
        ),
    ],
    input_variables=[
        "goal",
        "previous_actions",
    ],
)
