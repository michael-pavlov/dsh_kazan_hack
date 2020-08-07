# -*- coding: utf-8 -*-
from flask import Flask, jsonify, abort, make_response, request, render_template_string
import json
import logging
from logging.handlers import RotatingFileHandler
import datetime
from flask_cors import CORS
import validators
import legalentitiesextractor as lee
import config
import legalentitiesvalidator as lev
import ogrnextractor as oex
import mysqltool
import ads_extractor
import thirdparty_extractor
from hashlib import md5
import crawler

VERSION = "1.75"

answer_template = '''
{
	"status": "",
	"version":"",
	"type": "",
	"message": "",
	"brand": "",
	"risk_zone": "low",
	"risk_text": "Сайт пока не анализирует предмет соглашения.",
	"risk_descr": "",
	"legal_entities": [],
	"lines": [],
	"public_id" : ""
}
'''

class LegalService:

    def __init__(self, env = 'local'):
        self.env = env
        self.logger = logging.getLogger("LegalService")
        self.logger.setLevel(logging.INFO)
        fh = RotatingFileHandler("legal_service.log", mode='a', encoding='utf-8', backupCount=5,
                                 maxBytes=16 * 1024 * 1024)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        self.logger.addHandler(fh)

        # Настройка Flask
        self.server = Flask(__name__)
        self.server.config['JSON_AS_ASCII'] = False
        CORS(self.server)
        self.server.add_url_rule('/api/from_text', view_func=self.extract_from_text_request, methods=['POST'])
        self.server.add_url_rule('/api/company/<path:ogrn>', view_func=self.get_company_info, methods=['GET'])
        self.server.add_url_rule('/', view_func=self.get_status, methods=['GET'])
        self.server.register_error_handler(404, self.not_found)

        self.dblocal = mysqltool.mysqlTool(self.logger, config.DB_USER, config.DB_PASSWORD,
                                           config.DB_HOST, config.DB_PORT, config.DB_DATABASE)

        self.lee_extractor = lee.LegalEntitiesExtractor(logger = self.logger, env = self.env)
        self.lev_validator = lev.LegalEntitiesValidator(logger=self.logger, env=self.env)
        self.ogrn_extractor = oex.OGRNExtractor(logger=self.logger, env=self.env)
        self.ads_extractor = ads_extractor.AdsExtractor(logger=self.logger)
        self.thrdparty_extractor = thirdparty_extractor.ThirdPartyExtractor(logger=self.logger)
        self.crawler = crawler.LegalCrawler(logger=self.logger)

    def get_status(self):
        self.logger.info("Request: " + str(request.url))
        return make_response(jsonify({'state': 'ok', 'version': VERSION}), 200)

    def not_found(self, error):
        self.logger.info("Request: " + str(request.url))
        return make_response(jsonify({'error': 'Not found'}), 404)

    def run(self):
        self.logger.info("LegalService() run")
        self.server.run(host=config.LEGAL_SERVICE_HOST, port=config.LEGAL_SERVICE_PORT)

    def get_text_from_url(self, url):
        text = self.crawler.extract(url)
        return text

    def extract_from_text_request(self):
        self.logger.info("Request: " + str(request.url))
        # добавляем метку времени и ссылку
        create_time = datetime.datetime.now()
        # формируем ответ
        data = json.loads(answer_template)
        data["status"] = "error"
        data["version"] = VERSION

        content = request.json

        # проверка на наличие public_id
        if "public_id" in content and len(content["public_id"]) > 0:
            # есть id, идем за результатом в БД
            public_id = content["public_id"]
            self.logger.info("LegalService() Get request with public id:" + str(public_id))
            # инкремент статистики
            self.dblocal.db_execute("update legal_service_request_history set cnt = cnt + 1 where public_id = %s",(public_id,),"Increment stat")
            result = self.load_response(public_id)
            # обработка результата на наличие контента
            return jsonify(result)
            # else:
            #     # если ошибки - основной сценарий
            #     text = content["text"]
        else:
            # Обычный сценарий с текстом
            text = content["text"]

        # проверка текст на ссылку
        if validators.url(text.strip()):
            # обработка ссылки, извелечение текст по ссылке, которая находится в исходном text
            text = self.crawler.extract(text)["text"]
            data["type"] = "url"
        else:
            data["type"] = "text"

        # обрабатываем содержимое
        result = self.extract_from_text(text)

        data["legal_entities"] = result["legal_entities"]
        data["lines"] = result["lines"]
        data["risk_text"] = result["risk_text"]
        data["risk_zone"] = result["risk_zone"]
        data["risk_descr"] = self.get_property_value("risk_desciption_url")
        data["status"] = "ok"

        # сохраняем запрос
        public_id = self.save_response(text, data)
        data["public_id"] = public_id

        return jsonify(data)

    def save_response(self, content, data):
        salt = "fjklshfklsd" + VERSION
        content_for_hash = content + salt
        tmp_id = md5(content_for_hash.encode('utf-8')).hexdigest()[:7]
        data["public_id"] = tmp_id
        # TODO check if exist
        self.dblocal.db_execute("insert into legal_service_request_history (public_id, content, result_json) values (%s,%s,%s)", (tmp_id, content, json.dumps(data,ensure_ascii=False)), "Save response")
        return tmp_id

    def load_response(self, public_id):
        try:
            result = self.dblocal.db_query("select result_json, content from legal_service_request_history where public_id = %s", (public_id,),"Get response")
            data = json.loads(result[0][0])
            data["content"] = result[0][1]
            return data
        except Exception as e:
            data = json.loads(answer_template)
            data["status"] = "error"
            data["version"] = VERSION
            data["message"] = "empty or unknown public id"
            self.logger.warning("LoadResponse() Empty public id" + str(e))
            return data

    def extract_from_text(self, text):
        data = {}
        data["lines"] = []
        # достаем юр.лица и огрн
        raw_legal_entites = self.lee_extractor.extract(text)
        raw_ogrn = self.ogrn_extractor.extract(text)
        # обработка
        for le in raw_legal_entites:
            # валидируем, передаем распознанное значение и лист ОГРНов
            validated_result = self.lev_validator.validate(le["norm_match"], raw_ogrn)
            le["isvalid"] = validated_result["isvalid"]
            if validated_result["isvalid"]:
                le["valid_name"] = validated_result["name"]
                le["ogrn"] = validated_result["ogrn"]
                le["address"] = validated_result["address"]
                le["color"] = 'blue'
                # расширяем список ОГРН для будущих поисков
                raw_ogrn.append(validated_result["ogrn"])
            else:
                le["possible_names"] = validated_result["possible_names"]
                le["message"] = validated_result["message"]
                if len(le["possible_names"]) > 0:
                    le["color"] = 'gray'
                else:
                    le["color"] = 'red'

        entites_count = len(raw_legal_entites)
        ads = self.ads_extractor.extract(text)
        thrd_party = self.thrdparty_extractor.extract(text)

        if len(ads["lines"]) == 0 and len(thrd_party["lines"]) == 0 and entites_count == 0:
            data["risk_text"] = self.get_property_value("no_data_in_text")
            data["risk_zone"] = "middle"

        if (len(ads["lines"]) > 0 or len(thrd_party["lines"]) > 0) and entites_count == 0:
            data["risk_text"] = self.get_property_value("no_company_in_text")
            data["risk_zone"] = "middle"

        if entites_count > 0 and len(ads["lines"]) == 0 and len(thrd_party["lines"]) == 0:
            data["risk_text"] = self.get_property_value("low_risk_text")
            data["risk_zone"] = "low"

        if entites_count > 0 and len(ads["lines"]) > 0 and len(thrd_party["lines"]) == 0:
            data["risk_text"] = self.get_property_value("ads_in_text")
            data["risk_zone"] = "middle"

        if entites_count > 0 and len(thrd_party["lines"]) > 0:
            data["risk_text"] = self.get_property_value("third_party_in_text")
            data["risk_zone"] = "high"

        data["legal_entities"] = raw_legal_entites
        data["lines"].extend(ads["lines"])
        data["lines"].extend(thrd_party["lines"])

        return data

    def get_company_info(self, ogrn):
        if len(ogrn) < 10:
            abort(404)
            return
        try:
            company_details = self.dblocal.db_query("select ogrn, fullname, address, mng_post, mng_name from legal_bot_companies where ogrn = %s",
                                                    (ogrn,), "Get company details")
            if len(company_details) == 0:
                abort(404)
                return
            data = {}
            data["ogrn"] = ogrn
            data["fullname"] = company_details[0][1]
            data["address"] = company_details[0][2]
            data["mng_post"] = company_details[0][3]
            data["mng_name"] = company_details[0][4]
            data["rate"] = ""
            return jsonify(data)
        except:
            abort(404)
        return

    def find_company(self, name):
        if len(name) < 3:
            abort(404)
            return
        try:
            # TODO поправить запрос на поиск по like
            # message.text.replace("«", "\"").replace("»", "\"").replace("\'", "\"").replace("”", "\"")
            company_details = self.dblocal.db_query("select ogrn, fullname, address, mng_post, mng_name from legal_bot_companies where fullname = %s",
                                    (name,), "Get company details")
            if len(company_details) == 0:
                abort(404)
                # TODO запрос в dadata
                return
            data = {}
            data["ogrn"] = company_details[0][0]
            data["fullname"] = company_details[0][1]
            data["address"] = company_details[0][2]
            data["mng_post"] = company_details[0][3]
            data["mng_name"] = company_details[0][4]
            data["rate"] = ""
            return jsonify(data)
        except:
            abort(404)
        return

    def get_property_value(self, name):
        try:
            value = self.dblocal.db_query("select value from legal_service_properties where name = %s", (str(name),),"Get property value")[0][0]
            return value
        except Exception as e:
            self.logger.warning("GetPropertyValue() No value for name " + str(name))
            return ""


if __name__ == '__main__':
    service = LegalService()
    service.run()
    # print(service.get_requests())
    # text = 'ООО Вымпелком,  Настоящий документ «Лицензионное соглашение на использование программных продуктов и/или онлайн-сервисов 2ГИС» представляет собой предложение Общества с ограниченной ответственностью «ДубльГИС» (далее — «Правообладатель») заключить соглашение на изложенных ниже условиях. 1.1. ООО «ЯНДЕКС» (далее — «Яндекс») предлагает пользователю сети Интернет (далее – Пользователь) - использовать свои сервисы на условиях, изложенных в настоящем Пользовательском соглашении (далее — «Соглашение», «ПС»). Соглашение вступает в силу с момента выражения Пользова'
    text = '''Гражданин Российской Федерации (далее – «Заявитель»), направляющий
посредством информационно-телекоммуникационной сети «Интернет» в
Общество с ограниченной ответственностью «Телеком Интеграция»,
юридический адрес: 117246, г. Москва, проезд Научный, д. 17, пом. IV, эт.
8 (далее – «Оператор») заявку в электронном виде (далее – «Заявка») в
целях участия в конкурсе (далее – «Конкурс»), тем самым понимает,
принимает и подтверждает следующее:
1. Заявитель подтверждает, что все указанные в Заявке персональные
данные принадлежат лично Заявителю. Заявитель дает Оператору свое
согласие на обработку персональных данных (далее – «Согласие»),
указанных в Заявке, в том числе, но не ограничиваясь фамилия, имя,
отчество, адрес, номер телефона Заявителя, включая любые действия,
предусмотренные Федеральным законом от 27 июля 2006 года No 152-
ФЗ «О персональных данных» включая сбор, запись, систематизацию,
накопление, хранение, уточнение (обновление, изменение), извлечение,
использование, передачу (распространение, предоставление, доступ),
обезличивание, блокирование, удаление, уничтожение персональных
данных, с использованием средств автоматизации или без таковых, в
том числе в целях участия в Мероприятии, а также для
информирования Заявителя о результатах рассмотрения Заявки путем
направления соответствующей информации с помощью НКО «Деньги.Мэйл.Ру» '''
#
    # data = service.extract_from_text(text)
    # print(data)
