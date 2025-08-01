import re
from collections import Counter

class Vocabulary:
    def __init__(self, min_freq=1):
        self.min_freq = min_freq
        self.word_to_id = {}
        self.id_to_word = {}

        # Special tokens
        self.pad_token = "<PAD>"
        self.unk_token = "<UNK>"
        self.bos_token = "<BOS>"  # Beginning of sequence
        self.eos_token = "<EOS>"  # End of sequence

        self.pad_id = 0
        self.unk_id = 1
        self.bos_id = 2
        self.eos_id = 3

    def build_vocab(self, texts):
        """
        Builds vocabulary from a list of text chunks.
        """
        counter = Counter()
        for text in texts:
            tokens = self.tokenize(text)
            counter.update(tokens)

        # Start with special tokens
        self.word_to_id = {
            self.pad_token: self.pad_id,
            self.unk_token: self.unk_id,
            self.bos_token: self.bos_id,
            self.eos_token: self.eos_id
        }

        index = 4
        for word, freq in counter.items():
            if freq >= self.min_freq:
                self.word_to_id[word] = index
                index += 1

        self.id_to_word = {idx: word for word, idx in self.word_to_id.items()}

    def tokenize(self, text):
        """
        Simple whitespace and punctuation tokenizer.
        """
        text = text.lower()
        return re.findall(r"\b\w+\b", text)

    def text_to_sequence(self, text):
        """
        Converts text to list of token IDs, including <BOS> and <EOS>.
        """
        tokens = self.tokenize(text)
        ids = [self.bos_id] + [self.word_to_id.get(token, self.unk_id) for token in tokens] + [self.eos_id]
        return ids

    def sequence_to_text(self, ids):
        """
        Converts list of token IDs back to text.
        """
        tokens = [self.id_to_word.get(i, self.unk_token) for i in ids]
        return " ".join(tokens)

    def __len__(self):
        return len(self.word_to_id)
