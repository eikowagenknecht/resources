"""
TTSify: Text-to-Speech Conversion Script

This script converts text files into audio files using TTS models.
It supports multiple TTS engines, preprocesses text, and generates audio in MP3 format.

Usage:
    python ttsify.py <input_file>

Requirements:
    - Python 3.11
    - TTS library
    - NLTK
    - torch
    - ffmpeg (system installation)

Author: Eiko Wagenknecht
Date: 02.10.2024
Web: https://eikowagenknecht.de/posts/creating-free-audiobooks-with-local-tts-models/
"""

import sys
import os
from pathlib import Path
from TTS.api import TTS
import subprocess
import unicodedata
import torch
import nltk
from nltk.tokenize import sent_tokenize

# Configuration
OVERRIDE_FILE = None
"""Set to "input.txt" if you want to use a specific input file"""

MANUAL_SPLIT = True
"""Should not be needed for most texts, but sometimes the TTS model splits
sentences in a way that leaves lines to be longer than the model can handle."""

MAX_LINE_LENGTH = 400
"""Maximum character length for TTS processing when manual split is enabled.
The limits for XTTS2 are:
- 400 characters max
- Less than 250 characters recommended"""

# TTS Model Configurations
MODELS = [
    {
        "name": "XTTS2",
        "model": "tts_models/multilingual/multi-dataset/xtts_v2",
        "speaker": "Baldur Sanjin",  # Wulf Carlevaro, Gracie Wise etc., see list_speakers.py
        # "speaker_wav": "myvoicesample.wav",
        "language": "en",
    },
    # {
    #     "name": "Bark",
    #     "model": "tts_models/multilingual/multi-dataset/bark",
    # },
    # {
    #     "name": "Tortoise",
    #     "model": "tts_models/en/multi-dataset/tortoise-v2",
    # },
]
"""List of TTS models to use for generating audio. One audio file will be
generated for each model."""


def run_command(command):
    """Execute a shell command and print its output."""
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True
    )
    stdout, stderr = process.communicate()
    if process.returncode != 0:
        print(f"Error executing command: {command}")
        print(stderr.decode())
    else:
        print(stdout.decode())


def read_file(file_path):
    """Read and return the contents of a file."""
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()


def ensure_nltk_data():
    """Download required NLTK data if not already present."""
    try:
        nltk.data.find("tokenizers/punkt")
        nltk.data.find("tokenizers/punkt_tab")
    except LookupError:
        print("Downloading required NLTK data...")
        try:
            nltk.download("punkt", quiet=True)
            nltk.download("punkt_tab", quiet=True)
        except Exception as e:
            print(f"Failed to download NLTK data: {e}")
            print(
                "Please manually download the 'punkt' and 'punkt_tab' packages from https://www.nltk.org/data.html and try again."
            )
            raise


def preprocess_text(text):
    """Preprocess the input text for TTS conversion."""
    normalized_text = normalize_characters(text)
    if not MANUAL_SPLIT:
        return [normalized_text]
    sentences = split_sentences(normalized_text)
    return force_split(sentences)


def normalize_characters(text):
    """Normalize Unicode characters and replace special characters."""
    text = unicodedata.normalize("NFKC", text)

    # Replace quotation marks, dashes, and other special characters
    replacements = {
        "\u201c": '"',
        "\u201d": '"',
        "\u2018": "'",
        "\u2019": "'",
        "\u201a": "'",
        "\u201e": '"',
        "\u2033": '"',
        "\u2032": "'",
        "\u2026": "...",
        "\u2014": "-",
        "\u2013": "-",
        "\u2022": "*",
        "\u00a9": "(c)",
        "\u00ae": "(R)",
        "\u2122": "(TM)",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Remove empty lines and join non-empty lines
    lines = text.split("\n")
    return " ".join(line.strip() for line in lines if line.strip())


def split_sentences(text):
    """Split text into sentences using NLTK."""
    return sent_tokenize(text)


def force_split(sentences, max_length=MAX_LINE_LENGTH):
    """Split sentences that exceed the maximum length."""

    def split_line(line, max_len):
        words = line.split()
        current_line = []
        current_length = 0
        result = []

        for word in words:
            if current_length + len(word) + 1 > max_len and current_line:
                result.append(" ".join(current_line))
                current_line = []
                current_length = 0
            current_line.append(word)
            current_length += len(word) + 1

        if current_line:
            result.append(" ".join(current_line))
        return result

    result = []
    for sentence in sentences:
        if len(sentence) <= max_length:
            result.append(sentence)
        else:
            result.extend(split_line(sentence, max_length))
    return result


def generate_audio(tts, text, output_file, **kwargs):
    """Generate audio file from text using the specified TTS model."""
    print(f"Generating audio for {output_file}...")
    tts.tts_to_file(text=text, file_path=output_file, **kwargs)
    print(f"Generated {output_file}")


def get_unique_filename(file_path):
    """Generate a unique filename by appending a number if the file already exists."""
    original_path = Path(file_path)
    directory, stem, extension = (
        original_path.parent,
        original_path.stem,
        original_path.suffix,
    )
    counter = 1

    while True:
        new_path = (
            original_path
            if counter == 1
            else directory / f"{stem}_{counter}{extension}"
        )
        if not new_path.exists():
            return str(new_path)
        counter += 1


def main(input_file):
    """Main function to process the input file and generate audio."""
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found.")
        sys.exit(1)

    print("Running TTSify...")
    ensure_nltk_data()

    print("Available models:")
    print(TTS().list_models())

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    base_name = Path(input_file).stem
    text = read_file(input_file)

    # Preprocess and save text
    preprocessed_text = preprocess_text(text)
    preprocessed_file = get_unique_filename(f"{base_name}_preprocessed.txt")
    with open(preprocessed_file, "w", encoding="utf-8") as f:
        f.write("\n".join(preprocessed_text))
    print(f"Preprocessed text saved as {preprocessed_file}")

    for model in MODELS:
        try:
            tts = TTS(model_name=model["model"], progress_bar=True).to(device)
            wav_output = get_unique_filename(f"{base_name}_{model['name']}.wav")

            # Generate audio chunks
            temp_wav_files = []
            for i, sentence in enumerate(preprocessed_text):
                chunk_output = f"{base_name}_{model['name']}_chunk_{i+1}.wav"
                temp_wav_files.append(chunk_output)
                params = {
                    k: model[k]
                    for k in ("speaker", "speaker_wav", "language")
                    if k in model
                }
                generate_audio(tts, sentence, chunk_output, **params)

            # Concatenate audio chunks
            with open("temp_file_list.txt", "w") as f:
                f.write("\n".join(f"file '{file}'" for file in temp_wav_files))

            concat_command = (
                f"ffmpeg -f concat -safe 0 -i temp_file_list.txt -c copy {wav_output}"
            )
            print(f"Concatenating audio chunks: {wav_output}")
            run_command(concat_command)

            # Convert to MP3
            mp3_output = get_unique_filename(f"{base_name}_{model['name']}.mp3")
            mp3_command = (
                f"ffmpeg -i {wav_output} -acodec libmp3lame -b:a 192k {mp3_output}"
            )
            print(f"Converting to MP3: {mp3_output}")
            run_command(mp3_command)

            # Clean up temporary files
            for file in temp_wav_files + [wav_output, "temp_file_list.txt"]:
                os.remove(file)

        except Exception as e:
            print(f"An error occurred while processing with {model['name']}: {e}")

    print("Process complete. Your audiobook is ready.")


if __name__ == "__main__":
    if len(sys.argv) != 2 and not OVERRIDE_FILE:
        print("Usage: python ttsify.py <input_file>")
        sys.exit(1)

    input_file = OVERRIDE_FILE if OVERRIDE_FILE else sys.argv[1]
    main(input_file)
