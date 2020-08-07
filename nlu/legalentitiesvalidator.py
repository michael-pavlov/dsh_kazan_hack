# -*- coding: utf-8 -*-
import json
from logging.handlers import RotatingFileHandler
import logging
import mysqltool
import config
from dadata import Dadata

VERSION = "1.05"

class LegalEntitiesValidator:

    def __init__(self, logger = None, env='local'):
        self.env = env
        if logger is None:
            self.logger = logging.getLogger("LegalEntitiesValidator")
            self.logger.setLevel(logging.DEBUG)
            handler = RotatingFileHandler("legal_entities_validator.log", mode='a', encoding='utf-8', backupCount=5,
                                          maxBytes=1 * 1024 * 1024)
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
        else:
            self.logger = logger

        self.dblocal = mysqltool.mysqlTool(self.logger, config.DB_USER, config.DB_PASSWORD,
                                           config.DB_HOST, config.DB_PORT, config.DB_DATABASE)

        self.dadata = Dadata(config.DADATA_TOKEN)

    def search_fns(self, le, status='ACTIVE'):
        result = {}
        result['result'] = False
        result['count'] = 0
        result["companies"] = []
        json_data = self.dadata.suggest(name='party', query=le, count=20, params={'status': status})
        fns_results = self.process_fns_data(json_data)
        # print(json.dumps(json_data,ensure_ascii=False))
        if fns_results["result"]:
            result['result'] = True
            result['count'] = fns_results["count"]
            result["companies"] = fns_results["companies"]
        return result

    def process_fns_data(self, result_json):
        data = {}
        data["result"] = False
        data["count"] = 0
        data["companies"] = []
        any_data_inserted = False
        if len(result_json) == 0:
            return data
        for item in result_json:
            try:
                p_data = {}
                item_data = item["data"]
                p_data["shortname"] = item_data["name"]["short_with_opf"]
                p_data["fullname"] = item_data["name"]["full_with_opf"]
                p_data["address"] = item_data["address"]["unrestricted_value"]
                p_data["ogrn"] = item_data["ogrn"]
                p_data["inn"] = item_data["inn"]
                p_data["status"] = item_data["state"]["status"]
                p_data["bruchtype"] = item_data["branch_type"]
                try:
                    p_data["mng_post"] = item_data["management"]["post"]
                    p_data["mng_name"] = item_data["management"]["name"]
                except:
                    p_data["mng_post"] = ""
                    p_data["mng_name"] = ""
                print(p_data)
                data["companies"].append(p_data)
                if p_data["bruchtype"] != 'BRANCH':
                    self.dblocal.db_execute("insert into legal_bot_companies (inn, ogrn, name, name_t, fullname, fullname_t, address, status, brunch_type, mng_post, mng_name) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                                            (p_data["inn"],p_data["ogrn"],p_data["shortname"],self.search_preprocess(p_data["shortname"]),
                                     p_data["fullname"],self.search_preprocess(p_data["fullname"]),
                                     p_data["address"],p_data["status"],p_data["bruchtype"],p_data["mng_post"],p_data["mng_name"]), "Insert company")
                    any_data_inserted = True
            except Exception as e:
                self.logger.warning("Process fns data:" + str(e) + ";" + str(item))
        if any_data_inserted:
            data["result"] = True
            data["count"] = len(result_json)
        return data

    def short_to_full_preprocess(self, le_name):
        if le_name.upper().startswith('ООО'):
            le_name = le_name.upper().replace('ООО','ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ')
        return le_name

    def search_preprocess(self, le_name):
        SIMBOLS_LIST = ['\"', '«', '»', '\'', '.', '–', '-', '+', '!', '№']
        for simbol in SIMBOLS_LIST:
            le_name = le_name.replace(simbol," ")
            le_name = le_name.replace("  ", " ")
        le_name = le_name.replace("  ", " ")
        return le_name

    def postprocess(self, le_name):
        if le_name.startswith("ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ"):
            le_name = le_name.replace("ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ", "ООО")
        if le_name.startswith("ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО"):
            le_name = le_name.replace("ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", "ПАО")
        return le_name

    def validate(self, le_name, ogrn_list):
        result = {}
        result["possible_names"] = []
        result["message"] = ""

        le_name_without_simbols = self.search_preprocess(le_name)

        # сначала проверяем данные в нашей БД, ищем по полному совпадению без учета символов
        full_match_query = "select fullname, address, ogrn from legal_bot_companies where fullname_t = \'" + le_name_without_simbols + "\'"
        full_match_results = self.dblocal.db_query(full_match_query, (), "Validate() full match query")
        if len(full_match_results) == 1:
            # нашли в нашей БД точное совпадение, сохраняем
            result["isvalid"] = True
            result["name"] = self.postprocess(full_match_results[0][0])
            result["address"] = full_match_results[0][1]
            result["ogrn"] = full_match_results[0][2]
            result["isshort"] = False
            return result
        elif len(full_match_results) > 1:
            # нашли несколько совпадений, сверяем по ОГРН
            for full_match_result in full_match_results:
                if full_match_result[2] in ogrn_list:
                    # найдено совпадение (здесь возможна маловероятная коллиция, так как берем только первое совпадение
                    #   но наличие двух случайных похожих юр.лиц в тексте и в выборке считаем редким)
                    result["isvalid"] = True
                    result["name"] = self.postprocess(full_match_result[0])
                    result["address"] = full_match_result[1]
                    result["ogrn"] = full_match_result[2]
                    result["isshort"] = False
                    return result
            # не нашли совпадений по ОГРН, но есть результаты
            # передаем неподтвержденные данные
            for full_match_result in full_match_results:
                possible_value = {}
                possible_value["name"] = self.postprocess(full_match_result[0])
                possible_value["address"] = full_match_result[1]
                possible_value["ogrn"] = full_match_result[2]
                result["possible_names"].append(possible_value)
            result["isvalid"] = False
            return result

        # проверяем по короткому имени. TODO Валидный результат только при совпадении ОГРН?
        short_match_query = "select fullname, address, ogrn from legal_bot_companies where name_t = \'" + le_name_without_simbols + "\'"
        short_match_results = self.dblocal.db_query(short_match_query, (), "Validate() short match query")
        if len(short_match_results) == 1:
            # нашли в нашей БД точное совпадение, сохраняем
            result["isvalid"] = True
            result["name"] = self.postprocess(short_match_results[0][0])
            result["address"] = short_match_results[0][1]
            result["ogrn"] = short_match_results[0][2]
            result["isshort"] = True
            return result
        elif len(short_match_results) > 1:
            # нашли несколько совпадений, сверяем по ОГРН
            for short_match_result in short_match_results:
                if short_match_result[2] in ogrn_list:
                    # найдено совпадение (здесь возможна маловероятная коллиция, так как берем только первое совпадение
                    #   но наличие двух случайных похожих юр.лиц в тексте и в выборке считаем редким)
                    result["isvalid"] = True
                    result["name"] = self.postprocess(short_match_result[0])
                    result["address"] = short_match_result[1]
                    result["ogrn"] = short_match_result[2]
                    result["isshort"] = True
                    return result
            # не нашли совпадений по ОГРН, но есть результаты
            # передаем неподтвержденные данные
            for short_match_result in short_match_results:
                possible_value = {}
                possible_value["name"] = self.postprocess(short_match_result[0])
                possible_value["address"] = short_match_result[1]
                possible_value["ogrn"] = short_match_result[2]
                result["possible_names"].append(possible_value)
            result["isvalid"] = False
            return result

        # не нашли в нащей БД, идем в ФНС
        search_fns_result = self.search_fns(le_name)
        if search_fns_result['result']:
            # что-то добавили из ФНС, повторяем поиск
            # сначала проверяем данные в нашей БД, ищем по полному совпадению без учета символов
            full_match_query = "select fullname, address, ogrn from legal_bot_companies where fullname_t = \'" + le_name_without_simbols + "\'"
            full_match_results = self.dblocal.db_query(full_match_query, (), "Validate() full match query")
            if len(full_match_results) == 1:
                # нашли в нашей БД точное совпадение, сохраняем
                result["isvalid"] = True
                result["name"] = self.postprocess(full_match_results[0][0])
                result["address"] = full_match_results[0][1]
                result["ogrn"] = full_match_results[0][2]
                result["isshort"] = False
                return result
            elif len(full_match_results) > 1:
                # нашли несколько совпадений, сверяем по ОГРН
                for full_match_result in full_match_results:
                    if full_match_result[2] in ogrn_list:
                        # найдено совпадение (здесь возможна маловероятная коллиция, так как берем только первое совпадение
                        #   но наличие двух случайных похожих юр.лиц в тексте и в выборке считаем редким)
                        result["isvalid"] = True
                        result["name"] = self.postprocess(full_match_result[0])
                        result["address"] = full_match_result[1]
                        result["ogrn"] = full_match_result[2]
                        result["isshort"] = False
                        return result
                # не нашли совпадений по ОГРН, но есть результаты
                # передаем неподтвержденные данные
                for full_match_result in full_match_results:
                    possible_value = {}
                    possible_value["name"] = self.postprocess(full_match_result[0])
                    possible_value["address"] = full_match_result[1]
                    possible_value["ogrn"] = full_match_result[2]
                    result["possible_names"].append(possible_value)
                result["isvalid"] = False
                return result

            # проверяем по короткому имени. TODO Валидный результат только при совпадении ОГРН?
            short_match_query = "select fullname, address, ogrn from legal_bot_companies where name_t = \'" + le_name_without_simbols + "\'"
            short_match_results = self.dblocal.db_query(short_match_query, (), "Validate() short match query")
            if len(short_match_results) == 1:
                # нашли в нашей БД точное совпадение, сохраняем
                result["isvalid"] = True
                result["name"] = self.postprocess(short_match_results[0][0])
                result["address"] = short_match_results[0][1]
                result["ogrn"] = short_match_results[0][2]
                result["isshort"] = True
                return result
            elif len(short_match_results) > 1:
                # нашли несколько совпадений, сверяем по ОГРН
                for short_match_result in short_match_results:
                    if short_match_result[2] in ogrn_list:
                        # найдено совпадение (здесь возможна маловероятная коллиция, так как берем только первое совпадение
                        #   но наличие двух случайных похожих юр.лиц в тексте и в выборке считаем редким)
                        result["isvalid"] = True
                        result["name"] = self.postprocess(short_match_result[0])
                        result["address"] = short_match_result[1]
                        result["ogrn"] = short_match_result[2]
                        result["isshort"] = True
                        return result
                # не нашли совпадений по ОГРН, но есть результаты
                # передаем неподтвержденные данные
                for short_match_result in short_match_results:
                    possible_value = {}
                    possible_value["name"] = self.postprocess(short_match_result[0])
                    possible_value["address"] = short_match_result[1]
                    possible_value["ogrn"] = short_match_result[2]
                    result["possible_names"].append(possible_value)
                result["isvalid"] = False
                return result

            # если дошли сюда, значит после ФНС ничего
            # попробуем хак: обрабатываем кейс когда имя полное, а форма сокращенная
            le_short_to_full_preporcess = self.short_to_full_preprocess(le_name_without_simbols)
            full_match_query = "select fullname, address, ogrn from legal_bot_companies where fullname_t = \'" + le_short_to_full_preporcess + "\'"
            full_match_results = self.dblocal.db_query(full_match_query, (), "Validate() short-to-full match query")
            if len(full_match_results) == 1:
                # нашли в нашей БД точное совпадение, сохраняем
                result["isvalid"] = True
                result["name"] = self.postprocess(full_match_results[0][0])
                result["address"] = full_match_results[0][1]
                result["ogrn"] = full_match_results[0][2]
                result["isshort"] = False
                return result
            elif len(full_match_results) > 1:
                # нашли несколько совпадений, сверяем по ОГРН
                for full_match_result in full_match_results:
                    if full_match_result[2] in ogrn_list:
                        # найдено совпадение (здесь возможна маловероятная коллиция, так как берем только первое совпадение
                        #   но наличие двух случайных похожих юр.лиц в тексте и в выборке считаем редким)
                        result["isvalid"] = True
                        result["name"] = self.postprocess(full_match_result[0])
                        result["address"] = full_match_result[1]
                        result["ogrn"] = full_match_result[2]
                        result["isshort"] = False
                        return result
                # не нашли совпадений по ОГРН, но есть результаты
                # передаем неподтвержденные данные
                for full_match_result in full_match_results:
                    possible_value = {}
                    possible_value["name"] = self.postprocess(full_match_result[0])
                    possible_value["address"] = full_match_result[1]
                    possible_value["ogrn"] = full_match_result[2]
                    result["possible_names"].append(possible_value)
                result["isvalid"] = False
                return result

            # проверим, а нашли ли что-то в ФНС и иесли нашли, выведем это в possible_names
            if search_fns_result["count"] > 0:
                for company in search_fns_result["companies"]:
                    possible_value = {}
                    possible_value["name"] = company["fullname"]
                    possible_value["address"] = company["address"]
                    possible_value["ogrn"] = company["ogrn"]
                    result["possible_names"].append(possible_value)
                result["isvalid"] = False
                return result

            # если дошли сюда, то точно ничего не нашли
            self.logger.warning("Company not found after FNS update:" + le_name)
            result["isvalid"] = False
            result["message"] = "Company not found after FNS update"
            return result

        # в ФНС ничего не смогли найти, скорре всего ошибка распознавания при парсинге
        self.logger.warning("Company not found in FNS:" + le_name)
        result["isvalid"] = False
        result["message"] = "Company not found in FNS"
        return result

if __name__ == '__main__':
    service = LegalEntitiesValidator()
    # service.search_fns("пао Вымпелком")
    print(service.validate("НКО «Деньги.Мэйл.Ру»",[]))
    # '1027723001305'