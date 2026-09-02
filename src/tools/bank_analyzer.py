import json
from datetime import datetime, timedelta
from typing import Optional

# Load historical failure patterns (from bank_failure_patterns.json)
BANK_DOWNTIME_WINDOWS = {
    "HDFC": {"high_risk_hours": [21, 22, 23, 0, 1], "avg_downtime_minutes": 45},
    "ICICI": {"high_risk_hours": [22, 23, 0], "avg_downtime_minutes": 30},
    "SBI": {"high_risk_hours": [20, 21, 22, 23, 0, 1, 2], "avg_downtime_minutes": 90},
    "Axis": {"high_risk_hours": [23, 0, 1], "avg_downtime_minutes": 25},
    "Kotak": {"high_risk_hours": [22, 23], "avg_downtime_minutes": 20},
}

UPI_SWITCH_FAILURE_RATES = {
    "NPCI": {"base_failure_rate": 0.02, "peak_failure_rate": 0.15, "peak_hours": [9, 10, 18, 19]},
}

class BankAnalyzer:
    """Analyzes bank failure patterns to determine if a failure is systemic or isolated."""

    def is_bank_downtime(self, bank: str, failure_hour: int) -> dict:
        """Check if the failure time falls within a known downtime window for this bank."""
        patterns = BANK_DOWNTIME_WINDOWS.get(bank, None)
        if not patterns:
            return {"is_downtime": False, "confidence": 0.3, "reason": f"No historical data for {bank}"}

        if failure_hour in patterns["high_risk_hours"]:
            return {
                "is_downtime": True,
                "confidence": 0.92,
                "reason": f"{bank} has historically high failure rates at {failure_hour}:00. Average downtime: {patterns['avg_downtime_minutes']} minutes.",
                "recommended_retry_after_minutes": patterns["avg_downtime_minutes"]
            }

        return {
            "is_downtime": False,
            "confidence": 0.75,
            "reason": f"{bank} is not in a known downtime window at {failure_hour}:00."
        }

    def get_optimal_retry_time(self, bank: str) -> str:
        """Calculate the optimal time to retry a payment for this bank."""
        patterns = BANK_DOWNTIME_WINDOWS.get(bank, {"high_risk_hours": [], "avg_downtime_minutes": 30})
        
        # Find the first hour NOT in the high-risk window
        safe_hours = [h for h in range(24) if h not in patterns["high_risk_hours"]]
        
        # Prefer morning business hours
        preferred = [h for h in safe_hours if 9 <= h <= 17]
        best_hour = preferred[0] if preferred else safe_hours[0]
        
        retry_time = datetime.now().replace(hour=best_hour, minute=0, second=0, microsecond=0)
        if retry_time <= datetime.now():
            retry_time += timedelta(days=1)
        
        return retry_time.isoformat()

    def analyze_failure_cluster(self, failures: list[dict]) -> dict:
        """Analyze a batch of failures to detect systemic patterns."""
        bank_counts = {}
        method_counts = {}
        error_counts = {}
        
        for f in failures:
            bank = f.get("payment", {}).get("bank", "Unknown")
            method = f.get("payment", {}).get("method", "Unknown")
            error = f.get("payment", {}).get("error_code", "Unknown")
            
            bank_counts[bank] = bank_counts.get(bank, 0) + 1
            method_counts[method] = method_counts.get(method, 0) + 1
            error_counts[error] = error_counts.get(error, 0) + 1
        
        total = len(failures)
        dominant_bank = max(bank_counts, key=bank_counts.get) if bank_counts else "N/A"
        dominant_error = max(error_counts, key=error_counts.get) if error_counts else "N/A"
        
        is_systemic = bank_counts.get(dominant_bank, 0) / total > 0.4 if total > 0 else False
        
        return {
            "total_failures": total,
            "is_systemic": is_systemic,
            "dominant_bank": dominant_bank,
            "dominant_bank_percentage": round(bank_counts.get(dominant_bank, 0) / total * 100, 1) if total > 0 else 0,
            "dominant_error": dominant_error,
            "bank_distribution": bank_counts,
            "method_distribution": method_counts,
            "error_distribution": error_counts,
            "recommendation": f"Systemic failure detected: {dominant_bank} accounts for {bank_counts.get(dominant_bank,0)}/{total} failures. Consider routing around {dominant_bank} temporarily." if is_systemic else "Failures appear isolated. Proceed with individual recovery."
        }

bank_analyzer = BankAnalyzer()
