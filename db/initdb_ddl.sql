create table legal_bot_companies
(
	inn varchar(20) null,
	ogrn varchar(20) not null,
	name varchar(300) null,
	name_t varchar(300) null,
	fullname varchar(300) null,
	fullname_t varchar(300) null,
	idx varchar(20) null,
	address varchar(300) null,
	status varchar(200) null,
	brunch_type varchar(20) default 'MAIN' null,
	mng_post varchar(100) default '' null,
	mng_name varchar(100) default '' null,
	recall_count int default 0 null,
	create_time timestamp default CURRENT_TIMESTAMP not null,
	constraint ocr_bot_companies_orgn_uindex
		unique (ogrn)
);

alter table legal_bot_companies
	add primary key (ogrn);

create table legal_bot_properties
(
	name varchar(60) not null
		primary key,
	value varchar(2000) not null,
	description varchar(100) null
);

create table legal_bot_user_data_tmp
(
	session_id int auto_increment,
	user_id varchar(30) not null,
	tmp_data text null,
	create_time timestamp default CURRENT_TIMESTAMP not null,
	state varchar(20) default '' null,
	constraint ocr_bot_user_data_tmp_session_id_uindex
		unique (session_id)
);

alter table legal_bot_user_data_tmp
	add primary key (session_id);

create table legal_bot_users
(
	id int auto_increment
		primary key,
	web_id int null,
	user_id varchar(30) null,
	email varchar(128) null,
	name varchar(30) null,
	state varchar(100) default '' null,
	tags varchar(2000) default '' null,
	blocked tinyint(1) default 0 not null,
	reason varchar(300) null,
	create_time timestamp default CURRENT_TIMESTAMP not null,
	legal_entities varchar(3000) default '{"les": []}' null,
	fio_full varchar(200) default '______________' null,
	fio_short varchar(200) default '______________' null,
	address varchar(200) default '______________' null,
	passport varchar(20) default '______________' null,
	passport_issued varchar(200) default '______________' null,
	pwd varchar(128) null,
	constraint legal_bot_users_email_uindex
		unique (email),
	constraint legal_bot_users_web_id_uindex
		unique (web_id)
);

create table legal_bot_users_web_id_sequence
(
	i int null
);

create table legal_company_links
(
	id int auto_increment
		primary key,
	source varchar(20) null,
	target varchar(20) null
);

create table legal_service_properties
(
	name varchar(60) not null
		primary key,
	value varchar(2000) not null,
	description varchar(100) null
);

create table legal_service_request_history
(
	id int auto_increment
		primary key,
	public_id varchar(100) not null,
	cnt int default 1 null,
	content text null,
	result_json text not null
);

create table legal_web_one_time_codes
(
	code varchar(40) not null
		primary key,
	created bigint null,
	validFor bigint null,
	used tinyint(1) default 0 null,
	purpose varchar(32) null,
	data text null
);

create table legal_web_pop_jurs
(
	id int auto_increment
		primary key,
	ogrn varchar(20) null,
	public_id varchar(20) null
);

create table legal_web_saved_jurs
(
	id int auto_increment
		primary key,
	ogrn varchar(20) null,
	usr varchar(30) null,
	added bigint null,
	state smallint null
);

create table legal_web_saved_jurs_history
(
	id int auto_increment
		primary key,
	saved_id int null,
	state smallint null,
	changed bigint null
);

