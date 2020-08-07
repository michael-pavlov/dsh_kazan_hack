# -*- coding: utf-8 -*-
from yargy.tokenizer import MorphTokenizer
from yargy import rule, Parser, or_, not_, and_
from yargy.predicates import eq, type
from yargy.pipelines import morph_pipeline
import logging
from logging.handlers import RotatingFileHandler
import pymorphy2
import texttools

VERSION = "1.2"

class AdsExtractor:

    def __init__(self, logger = None, env = 'local'):

        self.env = env

        if logger is None:
            self.logger = logging.getLogger("AdsExtractor")
            self.logger.setLevel(logging.DEBUG)
            handler = RotatingFileHandler("ads_extractor.log", mode='a', encoding='utf-8', backupCount=5,
                                     maxBytes=1 * 1024 * 1024)
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
        else:
            self.logger = logger

        self.texttools = texttools.TextTools(self.logger)

        self.tokenizer = MorphTokenizer()
        self.morph = pymorphy2.MorphAnalyzer()

        EXCLUDE = morph_pipeline([
            'без',
            'не',
            'вправе отказаться',
            'может отказаться',
            'услуга'
        ])

        AGREEMENT = morph_pipeline([
            'соглашаться с получением'
        ])

        SUBJECT = morph_pipeline([
            'рассылка',
            'предложение'
        ])

        KIND = morph_pipeline([
            'рекламный'
        ])

        SPECIALS = morph_pipeline([
            'рекламныя цель'
        ])

        ADS = or_(
            rule(KIND, SUBJECT),
            rule(SUBJECT, KIND),
            or_(SPECIALS, AGREEMENT)
        )

        self.ads_parser = Parser(ADS)
        self.exclude_parser = Parser(rule(EXCLUDE))

    def preprocess(self, line):
        line = line.replace("\n", " ").replace("&quot;", "\"").replace(";",".")
        return line

    def postprocess(self, le):
        return le

    def extract(self, text):
        result = {}
        result["lines"] = []

        lines = self.texttools.split(text)

        for line_obj in lines:
            # print(line_obj)
            ads_matches = list(self.ads_parser.findall(line_obj["line"]))
            # spans = [_.span for _ in ads_matches]
            # for span in spans:
            #     match = line_obj["line"][span.start:span.stop]
            #     print("ads", match)
            exclude_matches = list(self.exclude_parser.findall(line_obj["line"]))
            # spans = [_.span for _ in exclude_matches]
            # for span in spans:
            #     match = line_obj["line"][span.start:span.stop]
            #     print("ex", match)
            if len(ads_matches) > 0 and len(exclude_matches) == 0:
                result["lines"].append(line_obj)

        return result

    def show_tokens(self, line):
        line = line.replace("\n", " ").replace("&quot;", "\"")
        return list(self.tokenizer(line))

if __name__ == '__main__':
    lee = AdsExtractor()

    text = '''Пользователей, которые Общество с ограниченной ответственностью «Гоу Практис»ОГРН 1187746796060, ИНН/КПП 7714431301/771401001, адрес регистрации: 125167, г. Москва, Ленинградский проспект, д. 37, этаж 7

Администрация — общество с ограниченной ответственностью «Издательская группа «Закон»юридическое лицо, созданное по законодательству Российской Федерации и зарегистрированное по адресу: 121151, Москва, ул. Студенческая, д. 15, комн. 1,2, основной государственный регистрационный номер 5177746211605 .

Рассылаем вам рекламные сообщения
    '''

    print(lee.extract(text))