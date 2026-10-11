import re
from typing import List
from app.core.config import settings


class SourceVersionService:
    @staticmethod
    def detect_amendment_warning(question: str, language: str = "en") -> List[str]:
        """
        Check if question may depend on the 28 August 2026 amendment affecting
        Rule 2(5)(c) and development permissions for plots up to 500 sq. m.
        """
        q_lower = question.lower()
        warnings = []

        # Indicators of Rule 2(5)(c), 500 sq m amendment, or development permission for small plots
        has_amendment_date = bool(re.search(r'2026|august|अगस्त', q_lower))
        has_rule_25c = bool(re.search(r'2\s*\(\s*5\s*\)\s*\(\s*c\s*\)|2\(5\)\(c\)', q_lower))
        has_small_plot_dev_permission = bool(
            re.search(r'(?:development permission|separate development|अलग विकास अनुमति)', q_lower) and
            re.search(r'(?:300|500|small plot|छोटे प्लॉट)', q_lower)
        )
        has_500_sqm_mention = bool(
            re.search(r'(?:500\s*(?:sq|वर्ग|meter|मीटर)|upto 500|up to 500|500 तक)', q_lower) and
            re.search(r'(?:permission|development|अनुमति|विकास)', q_lower)
        )

        if has_amendment_date or has_rule_25c or has_small_plot_dev_permission or has_500_sqm_mention:
            warning_text = (
                settings.AMENDMENT_WARNING_HI
                if language == "hi"
                else settings.AMENDMENT_WARNING_EN
            )
            warnings.append(warning_text)

        return warnings

    @staticmethod
    def get_source_coverage():
        return {
            "source_version": settings.SOURCE_VERSION,
            "documents": [
                {
                    "title": "MP Bhumi Vikas Rules, 2012 (English Consolidated)",
                    "language": "en",
                    "version_date": "2025-03-06",
                    "source_type": "Official Gazette Consolidation (PDF)",
                    "authority": "Directorate of Town and Country Planning, Government of Madhya Pradesh",
                    "description": "Consolidated English rules covering Rules 1 to 105 plus Rule 26-B, current through 6 March 2025."
                },
                {
                    "title": "MP Bhumi Vikas Rules, 2012 (Hindi Consolidated)",
                    "language": "hi",
                    "version_date": "2025-03-06",
                    "source_type": "Official Gazette Consolidation (PDF)",
                    "authority": "Directorate of Town and Country Planning, Government of Madhya Pradesh",
                    "description": "Consolidated Hindi copy current through 6 March 2025."
                }
            ],
            "limitations": [
                "The rulebook data is consolidated strictly up to 6 March 2025.",
                "Amendments published in the MP Rajpatra after 6 March 2025 are not included in this dataset.",
                "This service is an informational assistant for building permission counters and does not constitute a formal legal permit or final administrative order."
            ],
            "unverified_amendments": [
                "Notification dated 28 August 2026 amending Rule 2(5)(c) regarding development permission for plots up to 500 sq. m."
            ]
        }


source_version_service = SourceVersionService()
