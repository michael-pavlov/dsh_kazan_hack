# -*- coding: utf-8 -*-
# @Author Michael Pavlov

import mysql.connector
from mysql.connector import Error
from mysql.connector import pooling

VERSION = '1.06'

class mysqlTool:

    def __init__(self, logger, user, password, host, port, db, poolsize = 8):
        self.logger = logger
        try:
            self.connection_pool = mysql.connector.pooling.MySQLConnectionPool(pool_name="my_pool",
                                                                          pool_size=poolsize,
                                                                          pool_reset_session=True,
                                                                          host=host, port=port,
                                                                          database=db,
                                                                          user=user,
                                                                          password=password)

            connection_object = self.connection_pool.get_connection()

            if connection_object.is_connected():
                db_Info = connection_object.get_server_info()
                cursor = connection_object.cursor()
                cursor.execute("select database();")
                record = cursor.fetchone()
        except Error as e:
            self.logger.critical("Error while connecting to MySQL using Connection pool ", e)
        finally:
            # closing database connection.
            if (connection_object.is_connected()):
                cursor.close()
                connection_object.close()

    # method for inserts|updates|deletes
    def db_execute(self, query, params, comment=""):
        error_code = 1
        try:
            self.logger.debug("db_execute() " + comment)
            connection_local = self.connection_pool.get_connection()
            if connection_local.is_connected():
                cursor_local = connection_local.cursor()
                result = cursor_local.execute(query, params)
                connection_local.commit()
                error_code = 0
        except mysql.connector.Error as error:
            connection_local.rollback()  # rollback if any exception occured
            self.logger.warning("Failed {}".format(error))
        finally:
            # closing database connection.
            if (connection_local.is_connected()):
                cursor_local.close()
                connection_local.close()
        if error_code == 0:
            return True
        else:
            return False

    # method for selects
    def db_query(self, query, params, comment=""):
        result_set = []
        try:
            # self.logger.debug("db_query() " + comment)
            connection_local = self.connection_pool.get_connection()
            if connection_local.is_connected():
                cursor_local = connection_local.cursor()
                cursor_local.execute(query, params)
                result_set = cursor_local.fetchall()

                self.logger.debug("db_query() " + comment + "; result_set:" + str(result_set))
                if result_set is None or len(result_set) <= 0:
                    result_set = []
                cursor_local.close()
        except mysql.connector.Error as error:
            self.logger.warning("Failed {}".format(error))
            result_set = []
        finally:
            # closing database connect            if (connection_local.is_connected()):
                connection_local.close()
        return result_set

if __name__ == '__main__':
    print("yep")