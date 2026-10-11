import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class RuleService:
    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or settings.rules_data_path
        self._rules_by_id: Dict[str, dict] = {}
        self._rules_list: List[dict] = []
        self._load_rules()

    def _load_rules(self) -> None:
        if not self.data_path.exists():
            logger.error(f"Rules data file not found at {self.data_path}")
            return

        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    record = json.loads(line)
                    rule_id = str(record.get("rule", "")).strip()
                    if rule_id:
                        self._rules_by_id[rule_id.lower()] = record
                        self._rules_list.append(record)
            logger.info(f"Loaded {len(self._rules_list)} rules from {self.data_path}")
        except Exception as e:
            logger.exception(f"Error loading rules from {self.data_path}: {e}")

    def normalize_rule_id(self, rule_str: str) -> str:
        """Extract clean rule identifier from strings like 'Rule 56', 'नियम 26-B', '56(1)'."""
        s = rule_str.strip()
        # Remove prefixes like 'Rule', 'rule', 'नियम'
        s = re.sub(r'^(?:rule|नियम|section|धारा)\s*', '', s, flags=re.IGNORECASE)
        # Strip sub-clauses like '(1)' if top-level rule lookup
        match = re.match(r'^(\d+(?:-[A-Za-z]+)?)', s)
        if match:
            return match.group(1).upper()
        return s.upper()

    def get_rule(self, rule_identifier: str) -> Optional[dict]:
        clean_id = self.normalize_rule_id(rule_identifier).lower()
        if clean_id in self._rules_by_id:
            return self._rules_by_id[clean_id]

        # Check for sub-rules embedded in parent rules
        embedded_map = {
            "12-a": "12",
            "17-a": "17",
            "25(a)": "25",
            "26-a": "26",
            "42-a": "42",
            "93(a)": "93"
        }
        if clean_id in embedded_map:
            parent_id = embedded_map[clean_id]
            return self._rules_by_id.get(parent_id)

        # Direct search by case-insensitive key
        for k, v in self._rules_by_id.items():
            if k == clean_id or v.get("rule", "").lower() == clean_id:
                return v

        return None

    def list_rules(self) -> List[dict]:
        return list(self._rules_list)

    def count(self) -> int:
        return len(self._rules_list)


# Singleton instance
rule_service = RuleService()
