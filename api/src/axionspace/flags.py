# flags.py
from typing import Dict

EXCHANGE_FLAGS = {
    "hate_speech": {"description": "Offensive language targeting groups or individuals", "weight": 5},
    "misinformation": {"description": "False or misleading information", "weight": 4},
    "personal_attacks": {"description": "Harassment or insults directed at individuals", "weight": 3},
    "spam": {"description": "Irrelevant or repetitive posts", "weight": 2},
    "off_topic": {"description": "Posts not aligned with the Exchange's purpose", "weight": 2},
    "bot_activity": {"description": "Automated or bot-like posting behavior", "weight": 5},
    "plagiarism": {"description": "Content copied without proper credit", "weight": 4},
    "low_quality_content": {"description": "Posts with poor grammar, structure, or value", "weight": 1},
    "toxicity": {"description": "General hostile or aggressive behavior", "weight": 5},
    "echo_chamber": {"description": "One-sided or closed-off discussions", "weight": 3},
    "extremism": {"description": "Promotion of radical or harmful ideologies", "weight": 5},
    "privacy_violation": {"description": "Sharing personal data without consent", "weight": 5},
    "explicit_content": {"description": "NSFW or inappropriate material", "weight": 4},
    "fake_profiles": {"description": "Detected use of fake or impersonated accounts", "weight": 5},
    "propaganda": {"description": "Posts with undue bias or promotion", "weight": 3},
    "unverified_sources": {"description": "Information linked to dubious sources", "weight": 3},
    "scams": {"description": "Content designed to defraud users", "weight": 5},
    "low_engagement": {"description": "Content that repeatedly fails to engage members", "weight": 2},
    "over_posting": {"description": "Excessive posting without substance", "weight": 3},
    "reaction_farming": {"description": "Content designed solely for reactions or controversy", "weight": 3},
}

def get_flag_weight(flag_type: str) -> int:
    """ Returns the weight of a given flag type. """
    return EXCHANGE_FLAGS.get(flag_type, {}).get("weight", 0)

def get_flag_description(flag_type: str) -> str:
    """ Returns the description of a given flag type. """
    return EXCHANGE_FLAGS.get(flag_type, {}).get("description", "")
