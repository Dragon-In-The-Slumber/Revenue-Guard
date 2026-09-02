class VoiceCallerMockClient:
    """Mock voice caller for buildathon demo. Simulates ElevenLabs-style voice calls."""

    def initiate_call(self, to: str, script: str, language: str = "en-IN") -> dict:
        print(f"[VOICE CALL] Calling {to} ({language})")
        print(f"  Script: {script[:120]}...")
        return {
            "status": "call_initiated",
            "channel": "voice",
            "to": to,
            "language": language,
            "duration_estimate_sec": 45
        }

    def recovery_call(self, to: str, customer_name: str, amount: float, merchant_name: str) -> dict:
        script = (
            f"Hello {customer_name}, this is a courtesy call from {merchant_name}. "
            f"We noticed your recent payment of Rupees {amount} was not completed. "
            f"Would you like us to help you complete this payment now?"
        )
        return self.initiate_call(to, script)

voice_client = VoiceCallerMockClient()
