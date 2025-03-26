# metrics.py
from collections import defaultdict
import numpy as np
from .flags import get_flag_weight

class ExchangeMetrics:
    def __init__(self, posts: list, flags: list, members: int):
        self.posts = posts
        self.flags = flags
        self.members = members

    def calculate_engagement_score(self) -> float:
        total_reactions = sum(post.get("reactions", 0) for post in self.posts)
        total_comments = sum(post.get("comments", 0) for post in self.posts)
        total_shares = sum(post.get("shares", 0) for post in self.posts)
        engagement_score = (total_reactions + total_comments + total_shares) / max(self.members, 1)
        return round(engagement_score, 2)

    def calculate_flag_severity_score(self) -> float:
        total_weight = sum(get_flag_weight(flag["type"]) for flag in self.flags)
        flag_severity_score = total_weight / max(len(self.posts), 1)
        return round(flag_severity_score, 2)

    def calculate_sentiment_index(self, sentiments: list) -> float:
        return round(np.mean(sentiments) if sentiments else 0, 2)

    def calculate_fact_check_reliability(self) -> float:
        verified_posts = sum(post.get("verified", False) for post in self.posts)
        fact_check_index = verified_posts / max(len(self.posts), 1)
        return round(fact_check_index, 2)

    def calculate_opinion_diversity(self) -> float:
        unique_authors = len(set(post.get("author") for post in self.posts))
        diversity_index = unique_authors / max(self.members, 1)
        return round(diversity_index, 2)

    def calculate_healthy_engagement_index(self) -> float:
        positive_interactions = sum(post.get("positive_interactions", 0) for post in self.posts)
        total_interactions = sum(post.get("total_interactions", 0) for post in self.posts)
        healthy_index = positive_interactions / max(total_interactions, 1)
        return round(healthy_index, 2)

    def calculate_flag_distribution(self) -> dict:
        flag_count = defaultdict(int)
        for flag in self.flags:
            flag_count[flag["type"]] += 1
        return dict(flag_count)

    def summary(self) -> dict:
        return {
            "engagement_score": self.calculate_engagement_score(),
            "flag_severity_score": self.calculate_flag_severity_score(),
            "sentiment_index": self.calculate_sentiment_index([0.5, -0.2]),  # Placeholder sentiments
            "fact_check_reliability": self.calculate_fact_check_reliability(),
            "opinion_diversity": self.calculate_opinion_diversity(),
            "healthy_engagement_index": self.calculate_healthy_engagement_index(),
            "flag_distribution": self.calculate_flag_distribution(),
        }
