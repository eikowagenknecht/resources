"""
List Speakers: List available speakers for a TTS model

This script lists the available speakers for a given TTS model.
It has been tested mostly with XTTS2.

Usage:
    python list-speakers.py

Requirements:
    - Python 3.11
    - TTS library

Author: Eiko Wagenknecht
Date: 02.10.2024
Web: https://eikowagenknecht.de/posts/creating-free-audiobooks-with-local-tts-models/
"""

from TTS.api import TTS


def list_speakers(model_name):
    try:
        tts = TTS(model_name=model_name)
        speaker_manager = tts.synthesizer.tts_model.speaker_manager

        if hasattr(speaker_manager, "speakers"):
            # XTTS2 case
            speakers = speaker_manager.speakers.keys()
        elif hasattr(speaker_manager, "speaker_names"):
            # YourTTS case
            speakers = speaker_manager.speaker_names
        else:
            raise AttributeError("Unexpected speaker manager structure")

        print(f"Available speakers for {model_name}:")
        for speaker in speakers:
            print(speaker)
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback

        traceback.print_exc()


# Use the XTTS2 model
model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
list_speakers(model_name)
