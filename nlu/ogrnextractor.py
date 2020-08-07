from yargy.tokenizer import MorphTokenizer
from yargy.interpretation import fact
from yargy import rule, Parser, or_, not_, and_
from yargy.predicates import eq, type
from yargy.pipelines import morph_pipeline
from yargy.predicates import gram
import logging
from logging.handlers import RotatingFileHandler

class OGRNExtractor:

    def __init__(self, logger = None, env = 'local'):

        self.env = env

        if logger is None:
            self.logger = logging.getLogger("OGRNExtractor")
            self.logger.setLevel(logging.DEBUG)
            handler = RotatingFileHandler("ogrn_extractor.log", mode='a', encoding='utf-8', backupCount=5,
                                     maxBytes=1 * 1024 * 1024)
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
        else:
            self.logger = logger

        self.tokenizer = MorphTokenizer()

        OGRN = morph_pipeline([
            'огрн',
            'основной государственный регистрационный номер',
            'огрнип'
        ])

        INT = type('INT')

        OGRN_NUMBER = rule(
            OGRN,
            INT
        )

        self.full_ogrn_parser = Parser(OGRN_NUMBER)
        self.ogrn_num_parser = Parser(rule(INT))

    def preprocess(self, line):
        line = line.replace("\n", " ").replace("&quot;", "\"")
        return line

    def extract(self, line):
        line = self.preprocess(line)

        matches = list(self.full_ogrn_parser.findall(line))
        spans = [_.span for _ in matches]

        result = []
        for span in spans:
            match = line[span.start:span.stop]
            int_matches = list(self.ogrn_num_parser.findall(match))
            int_spans = [_.span for _ in int_matches]
            for int_span in int_spans:
                int_match = match[int_span.start:int_span.stop]
                result.append(int_match)

        result = list(set(result))
        return result

    def show_tokens(self, line):
        line = line.replace("\n", " ").replace("&quot;", "\"")
        return list(self.tokenizer(line))


if __name__ == '__main__':
    lee = OGRNExtractor()
    line = ''' ОКПО, 00032537, ОГРН 1027700132195 32]. кластер» (ОГРН 1197700007141, адрес: 125009,1,2, основной государственный регистрационный номер 5177746211605.
'''

    print(lee.extract(line))
    # for form in lee.show_tokens(line):
    #     print(form)