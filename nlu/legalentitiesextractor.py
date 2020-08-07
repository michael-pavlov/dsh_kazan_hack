# -*- coding: utf-8 -*-
from yargy.tokenizer import MorphTokenizer
from yargy.interpretation import fact
from yargy import rule, Parser, or_, not_, and_
from yargy.predicates import eq, type
from yargy.pipelines import morph_pipeline
from yargy.predicates import gram
import logging
from logging.handlers import RotatingFileHandler
import pymorphy2

VERSION = "1.36"

class LegalEntitiesExtractor:

    def __init__(self, logger = None, env = 'local'):

        self.env = env

        if logger is None:
            self.logger = logging.getLogger("LegalEntitiesExtractor")
            self.logger.setLevel(logging.DEBUG)
            handler = RotatingFileHandler("legal_entities_extractor.log", mode='a', encoding='utf-8', backupCount=5,
                                     maxBytes=1 * 1024 * 1024)
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
        else:
            self.logger = logger

        self.tokenizer = MorphTokenizer()
        self.morph = pymorphy2.MorphAnalyzer()

        self.NOUNS_TO_NORMALIZE = ['общество','объединение','учреждение','предприятие','департамент', 'организация', 'союз', 'центр']
        self.ADJ_TO_NORMALIZE_TO_NEUT = ['акционерный', 'публичный', 'музейный', 'государственный', 'казенный', 'казённый', 'унитарный']

        # LegalName = fact('LegalName', ['shortname', 'fullname'])
        # LegalForm = fact('LegalForm', ['shortform', 'fullform'])
        # LegalEnity = fact('LegalEnity', ['LegalForm','LegalName'])

        LEGAL_FORM_FULL = morph_pipeline([
            'общество с ограниченной ответственностью',
            'акционерное общество',
            'закрытое акционерное общество',
            'открытое акционерное общество',
            'акционерное общество управляющая компания',
            'управляющая компания',
            'публичное акционерное общество',
            'музейное объединение',
            'государственное казенное учреждение',
            'государственное унитарное предприятие',
            'департамент'
        ])

        LEGAL_FORM_SHORT = morph_pipeline([
            'ПАО', 'ЗАО', 'ОАО', 'АО',
            'ООО'
        ])

        LEGAL_FORM = or_(
            LEGAL_FORM_SHORT,
            LEGAL_FORM_FULL
        )

        OPEN_QUOTE = or_(eq('\"'), eq('«'), eq('\''))
        CLOSE_QUOTE = or_(eq('\"'), eq('»'), eq('\''))

        INT = type('INT')
        LATIN = type('LATIN')
        FULL_NAME_SIMBOLS = or_(eq('&'), OPEN_QUOTE)
        SHORT_NAME_SIMBOLS = or_( eq('+'), eq('!'), eq('№'))
        LATIN_NAME_SIMBOLS = or_(eq('.'), eq('&'))

        GEO_TAG = rule(
            gram('NOUN'),
            gram('Geox')
        )

        WORD_IN_NAME = or_(
            gram('NOUN'),
            gram('ADJF'),
            gram('ADJS')
        )

        WORD_NOT_IN_SHORT_NAME = or_(
            eq('ИНН'),
            eq('ОГРН')
        )

        WORD_IN_SHORT_NAME = or_(
            gram('NOUN'),
            gram('ADJF')
        )

        WORD_IN_SHORT_NAME_FINAL = and_(
            WORD_IN_SHORT_NAME,
            not_(WORD_NOT_IN_SHORT_NAME)
        )

        WORD_IN_LATIN_NAME = or_(
            LATIN,
            LATIN_NAME_SIMBOLS
        )

        LATIN_NAME = rule(WORD_IN_LATIN_NAME.repeatable(min=2))

        FULL_LEGAL_ENTITY = rule(LEGAL_FORM, GEO_TAG.optional(), OPEN_QUOTE, WORD_IN_NAME.repeatable(), CLOSE_QUOTE)
        SIMPLE_LEGAL_ENTITY = rule(LEGAL_FORM_SHORT, WORD_IN_SHORT_NAME_FINAL)
        GOV_ENTITY = rule(LEGAL_FORM_FULL, WORD_IN_SHORT_NAME.repeatable(min=1))

        LEGAL_ENTITY = or_(
            FULL_LEGAL_ENTITY,
            SIMPLE_LEGAL_ENTITY,
            GOV_ENTITY
        )

        self.full_legal_parser = Parser(LEGAL_ENTITY)
        self.legal_form_parser= Parser(LEGAL_FORM)
        self.legal_latin_parser = Parser(LATIN_NAME)

    def preprocess(self, line):
        line = line.replace("\n", " ").replace("&quot;", "\"")
        return line

    def postprocess(self, le):
        legal_form_match = self.legal_form_parser.find(le)
        legal_form = le[legal_form_match.span.start:legal_form_match.span.stop]
        legal_name = le[legal_form_match.span.stop:].strip()
        legal_form = self.normalize_legal_form(legal_form)
        le = legal_form + " " + legal_name
        return le

    def is_latin_company(self, match):
        forms = [' ltd',' llc']
        for form in forms:
            if match.lower().find(form) > -1:
                return True
        else:
            return False

    def extract(self, line):
        line = self.preprocess(line)

        matches = list(self.full_legal_parser.findall(line))
        spans = [_.span for _ in matches]

        result = []
        for span in spans:
            match = line[span.start:span.stop]
            norm_le = self.postprocess(match)
            p_result = {}
            p_result["match"] = match
            p_result["norm_match"] = norm_le
            p_result["span_start"] = span.start
            p_result["span_stop"] = span.stop
            p_result["color"] = 'gray'
            result.append(p_result)

        # latin parser
        matches = list(self.legal_latin_parser.findall(line))
        spans = [_.span for _ in matches]

        for span in spans:
            match = line[span.start:span.stop]
            # check for company
            if self.is_latin_company(match):
                p_result = {}
                p_result["match"] = match
                p_result["norm_match"] = ""
                p_result["span_start"] = span.start
                p_result["span_stop"] = span.stop
                p_result["color"] = 'gray'
                result.append(p_result)

        return result

    def show_tokens(self, line):
        line = line.replace("\n", " ").replace("&quot;", "\"")
        return list(self.tokenizer(line))

    def normalize_legal_form(self, lform):
        norm_form = ""
        for word in lform.split():
            p = self.morph.parse(word)[0]
            if 'NOUN' in p.tag:
                if p.normal_form in self.NOUNS_TO_NORMALIZE:
                    norm_form += ' ' + p.normal_form
                    continue
            if 'ADJF' in p.tag or 'ADJS' in p.tag:
                if p.normal_form in self.ADJ_TO_NORMALIZE_TO_NEUT:
                    norm_form += ' ' +  p.inflect({'neut', 'sing', 'nomn'}).word
                    continue
            norm_form += ' ' + word

        return norm_form.strip()


if __name__ == '__main__':
    lee = LegalEntitiesExtractor()
    # line = ' ООО "ПИРАМИД-А-Б" () ПАО СБЕРБАНКА , ООО "СССР номер-.1" , ПАО "cdo первый", АО Мегафон, \n ооо\n«ЯНДЕКС.карты» (далее — «Яндекс»), предложение Общества с \n ограниченной ответственностью «Дубль-ГИС», ПАО "cdo \n первый",(далее — «Правообладатель») , департамент образования города москвы, ООО "5 ДЖИ ВАЙФАЙ", обществу с ограниченной ответственностью «Издательская группа «важный Знак», юридическое лицо, ПАО "Вымпелком", АО Апельсин, ' \
    #        'Общество с ограниченной ответственностью «Бухгалтерские и банковские технологии» (ООО «ББС» ОГРН 515 774 622 974 6 102 770 013 219 5), далее по тексту — «ББС»'
    # line = 'правила использования компанией «Habr Blockchain Publishing LTD» (далее – «Хабр») компанией Yandex.Go Israel Ltd компании Yandex Europe AG Ваша  услуг Yandex.Go Israel Ltd (регистрационный центра Delivery Club (примен'
    line = '''После получения звонка-сброса Пользователю необходимо ввести код – несколько последних цифр номера, с которого осуществлен звонок-сброс, в соответствующем окне. В зависимости от операционной системы мобильного устройства ввод кода в соответствующем окне может осуществляться автоматически, но исключительно после полученияот Пользователя разрешения на доступ к истории вызовов на мобильном устройстве. Данное разрешение предоставляется посредством нажатия кнопки «Разрешить» или аналогичной. Доступ к истории вызовов на мобильном устройстве Пользователя используется исключительно для цели автоматизации проставления кода при использовании функции проверочного звонка-сброса, а также защиты от спама и массовых регистраций.
7.4. Пользователь вправе получать информацию о том, в какое время и с каких устройств производилась авторизация на его персональную страницу, с помощью ссылки «Показать историю активности» в разделе «Мои Настройки / Безопасность».'''
    print(lee.extract(line))
    # lee.normalize_legal_form("акционерного общества профсоюзной организации государственному казенному объединению центра с ограниченной ответственностью")
    # for token in lee.show_tokens(line):
    #     print(token)