# -*- coding: utf-8 -*-
from flask import Flask, jsonify, abort, make_response, request, send_file
import logging
from logging.handlers import RotatingFileHandler
import datetime
from flask_cors import CORS
import config
import mysqltool
from docxtpl import DocxTemplate
import os

VERSION = "1.00"

class DocService:

    def __init__(self, env = 'local'):
        self.env = env
        self.logger = logging.getLogger("DocService")
        self.logger.setLevel(logging.INFO)
        fh = RotatingFileHandler("doc_service.log", mode='a', encoding='utf-8', backupCount=5,
                                 maxBytes=1 * 1024 * 1024)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        self.logger.addHandler(fh)

        # Настройка Flask
        self.server = Flask(__name__)
        self.server.config['JSON_AS_ASCII'] = False
        CORS(self.server)
        self.server.add_url_rule('/api/doc/recall', view_func=self.get_recall_request, methods=['GET'])
        self.server.add_url_rule('/', view_func=self.get_status, methods=['GET'])
        self.server.register_error_handler(404, self.not_found)

        self.dblocal = mysqltool.mysqlTool(self.logger, config.DB_USER, config.DB_PASSWORD,
                                           config.DB_HOST, config.DB_PORT, config.DB_DATABASE)

    def get_status(self):
        self.logger.info("Request: " + str(request.url))
        return make_response(jsonify({'state': 'ok', 'version': VERSION}), 200)

    def not_found(self, error):
        self.logger.info("Request: " + str(request.url))
        return make_response(jsonify({'error': 'Not found'}), 404)

    def run(self):
        self.logger.info("DocService() run")
        self.server.run(host=config.DOC_SERVICE_HOST, port=config.DOC_SERVICE_PORT)

    def create_personal_data_recall_doc(self, company_short_name, company_full_name, company_address, fio_short, fio_full, address, passport, passport_issued):
        data = {}
        data["isvalid"] = False

        # строим файл с отчетом
        try:
            doc = DocxTemplate(config.PD_RECALL_TEMPLATE_FILE)

            context = {'company_name': company_full_name,
                       'fio_short': fio_short,
                       'fio_full': fio_full,
                       'passport': passport,
                       'passport_issued': passport_issued,
                       'address': address,
                       'company_address': company_address,
                       'date': str((datetime.datetime.now()).strftime("%d.%m.%Y"))}

            doc.render(context)
            # генерируем имя файла
            report_filename = company_short_name.lower().replace("\"", "") + "_pd_recall_" + str((datetime.datetime.now()).strftime("%Y-%m-%d"))
            # оно должно быть уникальным, поэтому првоеряем на наличие пока не найдем свободное
            i = 0
            while True:
                if os.path.exists(config.TMP_PATH + report_filename + ".docx"):
                    i = i + 1
                    if i == 1:
                        report_filename = report_filename + "_" + str(i)
                    else:
                        report_filename = report_filename[:-1] + str(i)
                else:
                    break
            doc.save(config.TMP_PATH + report_filename + ".docx")
            # передаем ссылку на файл обратно для отправки
            data["report_filepath"] = config.TMP_PATH + report_filename + ".docx"
            data["report_filename"] = report_filename + ".docx"
        except Exception as e:
            self.logger.warning("Problem with save docs:" + str(e))
            return data

        # если дошли сюда - значит все хорошо и можно передавать ОК
        data["isvalid"] = True
        return data

    def get_recall_request(self):
        self.logger.info("Request: " + str(request.url))
        # добавляем метку времени
        create_time = datetime.datetime.now()
        # парсим параметры
        ogrn = request.args.get('ogrn', default='', type=str)
        fio_short = request.args.get('fioshort', default='______________', type=str)
        fio_full = request.args.get('fiofull', default='______________', type=str)
        address = request.args.get('address', default='______________', type=str)
        passport = request.args.get('passport', default='______________', type=str)
        issued = request.args.get('issued', default='______________', type=str)

        # вытаскиваем данные компании
        company_details = self.dblocal.db_query("select ogrn, name, fullname, address, mng_post, mng_name from legal_bot_companies where ogrn = %s",(ogrn,), "Get company details")
        if len(company_details) == 0:
            self.logger.warning("GetRecallRequest() Unknown Company for id: " + str(ogrn))
            abort(404)
            return
        # инкремент статистики
        self.dblocal.db_execute("update legal_bot_companies set recall_count = recall_count + 1 where ogrn = %s", (ogrn,), "Increment stat")
        # формируем документ
        doc_data = self.create_personal_data_recall_doc(company_details[0][1],
                                                        company_details[0][2],
                                                        company_details[0][3],
                                                        fio_short,
                                                        fio_full,
                                                        address,
                                                        passport,
                                                        issued)

        if doc_data["isvalid"]:
            self.logger.info("good, path is:" + str(doc_data["report_filepath"]))
            return send_file(doc_data["report_filepath"], as_attachment=True)
        else:
            abort(404)


if __name__ == '__main__':
    service = DocService()
    service.run()